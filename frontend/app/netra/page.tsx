"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NetraPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }

  async function scan() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.netraScan(file);
      setResult(res.data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const verdictColor =
    result?.verdict === "AUTHENTIC" ? "text-safe" :
    result?.verdict === "COUNTERFEIT" ? "text-danger" : "text-alert";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="font-mono text-xs text-safe tracking-widest mb-2">NETRA</p>
        <h1 className="font-display text-2xl font-700 mb-1">Counterfeit Currency Check</h1>
        <p className="text-muted text-sm mb-4">
          Upload a clear photo of a currency note. NETRA inspects it against the security
          features genuine RBI notes carry.
        </p>
        <label className="card flex flex-col items-center justify-center gap-2 p-8 cursor-pointer hover:border-accent transition-colors">
          {preview ? (
            <img src={preview} alt="note preview" className="max-h-56 rounded-lg object-contain" />
          ) : (
            <span className="text-muted text-sm">Click to upload a note photo (JPG/PNG)</span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </label>
        <button
          onClick={scan}
          disabled={loading || !file}
          className="mt-3 px-4 py-2 rounded-lg bg-accent text-white text-sm font-600 disabled:opacity-40"
        >
          {loading ? "Scanning…" : "Scan note"}
        </button>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </div>

      <div className="card p-5 min-h-[300px]">
        <h2 className="font-mono text-xs text-muted tracking-widest mb-4">SCAN RESULT</h2>
        {!result && !loading && <p className="text-muted text-sm">Upload and scan a note to see the verdict here.</p>}
        {loading && <p className="text-muted text-sm animate-pulse">Checking security features…</p>}
        {result && !result.error && (
          <div className="space-y-4">
            <div>
              <div className={`text-2xl font-display font-700 ${verdictColor}`}>{result.verdict}</div>
              <div className="text-xs text-muted">{result.denomination_guess} · {result.confidence}% confidence</div>
            </div>
            <div className="space-y-2">
              {result.features_checked?.map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={f.status === "pass" ? "text-safe" : f.status === "fail" ? "text-danger" : "text-muted"}>
                    {f.status === "pass" ? "✓" : f.status === "fail" ? "✕" : "–"}
                  </span>
                  <div>
                    <span className="font-600">{f.feature}:</span> <span className="text-muted">{f.observation}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted leading-relaxed border-t border-line pt-3">{result.explanation}</p>
          </div>
        )}
        {result?.error && <p className="text-danger text-sm">The model didn't return valid JSON — try again.</p>}
      </div>
    </div>
  );
}
