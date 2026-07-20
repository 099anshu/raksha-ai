"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };

export default function KavachPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Namaste! I'm KAVACH, your safety assistant. Paste a suspicious message, ask about a phone number, or tell me what happened — I'll help you figure out if it's a scam." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await api.kavachChat(userMsg.content, messages);
      setMessages([...nextMessages, { role: "assistant", content: res.data.reply }]);
    } catch (e: any) {
      console.error("KAVACH chat error:", e);
      setMessages([...nextMessages, { role: "assistant", content: `⚠ Backend error: ${e.message || "unknown error"}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="font-mono text-xs text-alert tracking-widest mb-2">KAVACH</p>
      <h1 className="font-display text-2xl font-700 mb-1">Citizen Fraud Shield</h1>
      <p className="text-muted text-sm mb-4">A multilingual AI assistant — ask it anything about a suspicious call, message, or number.</p>

      <div className="card flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-accent text-white rounded-br-sm" : "bg-white/5 text-ink rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-muted text-xs animate-pulse pl-2">KAVACH is typing…</div>}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-line p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your message…"
            className="flex-1 bg-transparent border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button onClick={send} disabled={loading} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-600 disabled:opacity-40">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
