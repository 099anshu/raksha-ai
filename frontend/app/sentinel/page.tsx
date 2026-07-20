"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const SAMPLE = `Caller: This is Inspector Sharma from CBI Mumbai. Your Aadhaar number has been linked to a parcel containing illegal substances, seized at Mumbai airport, addressed in your name. This is a serious case under the Money Laundering Act. You are under digital arrest — do not disconnect this call or contact anyone, or a physical arrest team will be sent immediately. To verify your innocence, you must transfer your savings to a "RBI verification account" for 24 hours, after which it will be returned.`;

export default function SentinelPage() {
  const [text, setText] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function analyse() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.sentinelAnalyseText(text);
      setResult(res.data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const level = result?.risk_level;
  const levelColor = level === "HIGH" ? "text-danger" : level === "MEDIUM" ? "text-alert" : "text-safe";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="font-mono text-xs text-alert tracking-widest mb-2">SENTINEL</p>
        <h1 className="font-display text-2xl font-700 mb-1">Digital Arrest Scam Detection</h1>
        <p className="text-muted text-sm mb-4">
          Paste a call transcript, SMS, or WhatsApp message. SENTINEL flags impersonation,
          urgency tactics, and money-transfer demands typical of digital arrest scams.
        </p>
        <Link href="/sentinel/live" className="inline-block mb-4 text-xs font-mono text-accent border border-accent/40 rounded-lg px-3 py-1.5 hover:bg-accent/10">
          🎙️ Try Live Call Guard — real-time mic transcription →
        </Link>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full card p-4 text-sm font-mono focus:outline-none focus:border-accent"
          placeholder="Paste transcript or message here..."
        />
        <button
          onClick={analyse}
          disabled={loading || !text.trim()}
          className="mt-3 px-4 py-2 rounded-lg bg-accent text-white text-sm font-600 disabled:opacity-40"
        >
          {loading ? "Analysing…" : "Analyse for scam patterns"}
        </button>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </div>

      <div className="card p-5 min-h-[300px]">
        <h2 className="font-mono text-xs text-muted tracking-widest mb-4">ANALYSIS RESULT</h2>
        {!result && !loading && <p className="text-muted text-sm">Run an analysis to see the threat assessment here.</p>}
        {loading && <p className="text-muted text-sm animate-pulse">Reading transcript for scam patterns…</p>}
        {result && !result.error && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-display font-700 ${levelColor}`}>{result.threat_score}</div>
              <div>
                <div className={`font-mono text-sm ${levelColor}`}>{result.risk_level} RISK</div>
                <div className="text-xs text-muted">Scam type: {result.scam_type}</div>
              </div>
            </div>
            {result.impersonated_authority && (
              <p className="text-sm"><span className="text-muted">Impersonating:</span> {result.impersonated_authority}</p>
            )}
            <div>
              <p className="text-xs text-muted mb-1">Red flags detected</p>
              <ul className="space-y-1">
                {result.red_flags?.map((f: string, i: number) => (
                  <li key={i} className="text-sm flex gap-2"><span className="text-alert">▲</span>{f}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted leading-relaxed border-t border-line pt-3">{result.explanation}</p>
            <p className="text-sm font-600">{result.recommended_action}</p>
          </div>
        )}
        {result?.error && <p className="text-danger text-sm">The model didn't return valid JSON — try again.</p>}
      </div>
    </div>
  );
}
