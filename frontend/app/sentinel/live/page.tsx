"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

// Web Speech API isn't in TypeScript's default lib — declare a minimal shape.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function LiveGuardPage() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [result, setResult] = useState<any>(null);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const lastAnalysedLengthRef = useRef(0);
  const analyseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += text + " ";
        else interimChunk += text;
      }
      if (finalChunk) {
        transcriptRef.current += finalChunk;
        setTranscript(transcriptRef.current);
      }
      setInterim(interimChunk);
    };

    recognition.onerror = (event: any) => {
      setError(`Mic error: ${event.error}. Try Chrome, and allow microphone access.`);
    };

    recognition.onend = () => {
      // auto-restart if the browser stops it on its own mid-session
      if (listeningRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const listeningRef = useRef(false);
  useEffect(() => { listeningRef.current = listening; }, [listening]);

  async function analyseNow() {
    const text = transcriptRef.current.trim();
    if (!text || text.length === lastAnalysedLengthRef.current) return;
    lastAnalysedLengthRef.current = text.length;
    setAnalysing(true);
    try {
      const res = await api.sentinelAnalyseText(text, "call");
      setResult(res.data);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setAnalysing(false);
    }
  }

  function start() {
    setError("");
    setTranscript("");
    setInterim("");
    setResult(null);
    transcriptRef.current = "";
    lastAnalysedLengthRef.current = 0;
    recognitionRef.current?.start();
    setListening(true);
    // re-analyse the growing transcript every 8 seconds
    analyseTimerRef.current = setInterval(analyseNow, 8000);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
    if (analyseTimerRef.current) clearInterval(analyseTimerRef.current);
    analyseNow(); // one final analysis on whatever was said
  }

  const level = result?.risk_level;
  const levelColor = level === "HIGH" ? "text-danger" : level === "MEDIUM" ? "text-alert" : "text-safe";
  const bgPulse = level === "HIGH" ? "animate-pulse border-danger" : "";

  return (
    <div className="max-w-3xl mx-auto">
      <p className="font-mono text-xs text-alert tracking-widest mb-2">SENTINEL — LIVE MODE</p>
      <h1 className="font-display text-2xl font-700 mb-1">Live Call Guard</h1>
      <p className="text-muted text-sm mb-4 leading-relaxed">
        Put your call on speakerphone near this laptop. Click Start — your laptop mic
        transcribes speech in real time and SENTINEL re-checks it every few seconds as the
        conversation continues. Works best in <span className="text-ink">Google Chrome</span>.
      </p>

      {!supported && (
        <div className="card p-4 border-danger text-sm text-danger">
          Your browser doesn't support live speech recognition. Please use Chrome or Edge on desktop.
        </div>
      )}

      {supported && (
        <>
          <div className="flex gap-3 mb-4">
            {!listening ? (
              <button onClick={start} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-600">
                ● Start listening
              </button>
            ) : (
              <button onClick={stop} className="px-5 py-2.5 rounded-lg bg-danger text-white text-sm font-600">
                ■ Stop
              </button>
            )}
            {listening && <span className="text-xs text-muted self-center font-mono animate-pulse">listening…</span>}
          </div>

          {error && <p className="text-danger text-sm mb-3">{error}</p>}

          <div className={`card p-4 mb-4 min-h-[100px] border ${bgPulse}`}>
            <p className="font-mono text-xs text-muted tracking-widest mb-2">LIVE TRANSCRIPT</p>
            <p className="text-sm leading-relaxed">
              {transcript}
              <span className="text-muted">{interim}</span>
              {!transcript && !interim && <span className="text-muted">Transcript will appear here as you speak…</span>}
            </p>
          </div>

          <div className={`card p-5 border ${bgPulse}`}>
            <p className="font-mono text-xs text-muted tracking-widest mb-3">
              LIVE THREAT ASSESSMENT {analysing && <span className="text-accent">· updating…</span>}
            </p>
            {!result ? (
              <p className="text-muted text-sm">Score updates automatically every 8 seconds while listening.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-display font-700 ${levelColor}`}>{result.threat_score}</div>
                  <div>
                    <div className={`font-mono text-sm ${levelColor}`}>{result.risk_level} RISK</div>
                    <div className="text-xs text-muted">Scam type: {result.scam_type}</div>
                  </div>
                </div>
                {result.red_flags?.length > 0 && (
                  <ul className="space-y-1">
                    {result.red_flags.map((f: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2"><span className="text-alert">▲</span>{f}</li>
                    ))}
                  </ul>
                )}
                {result.risk_level === "HIGH" && (
                  <p className="text-sm font-600 text-danger border-t border-line pt-3">
                    ⚠ {result.recommended_action}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
