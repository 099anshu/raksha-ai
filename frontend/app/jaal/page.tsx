"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Node = { id: string; label: string; type: string; risk_score: number };
type Edge = { source: string; target: string; type: string };

export default function JaalPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [selected, setSelected] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    (async () => {
      const [g, c] = await Promise.all([api.jaalGraph(), api.jaalCommunities()]);
      setNodes(g.data.nodes);
      setEdges(g.data.edges);
      setCommunities(c.data);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!nodes.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = canvas.clientHeight);

    // simple deterministic circular layout (no physics sim needed for a demo graph)
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = Math.min(W, H) * 0.36;
      posRef.current[n.id] = { x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle) };
    });

    ctx.clearRect(0, 0, W, H);
    // edges
    ctx.strokeStyle = "#1F2530";
    ctx.lineWidth = 1;
    edges.forEach((e) => {
      const a = posRef.current[e.source];
      const b = posRef.current[e.target];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    // nodes
    nodes.forEach((n) => {
      const p = posRef.current[n.id];
      const color = n.risk_score > 0.7 ? "#EF4444" : n.risk_score > 0.4 ? "#F5A623" : "#4C7CF3";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 + n.risk_score * 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }, [nodes, edges]);

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let closest: Node | null = null;
    let closestDist = Infinity;
    nodes.forEach((n) => {
      const p = posRef.current[n.id];
      if (!p) return;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < closestDist) {
        closestDist = d;
        closest = n;
      }
    });
    if (closestDist < 20) setSelected(closest);
  }

  return (
    <div>
      <p className="font-mono text-xs text-accent tracking-widest mb-2">JAAL</p>
      <h1 className="font-display text-2xl font-700 mb-1">Fraud Network Graph Intelligence</h1>
      <p className="text-muted text-sm mb-4 max-w-2xl">
        Seeded demonstration graph of phones, accounts, UPI handles, and devices — click a
        node to inspect it. Node size/colour reflects risk score.{" "}
        <span className="text-muted/70">(Demo data — see backend/app/routes/jaal.py docstring for how to wire real Neo4j.)</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-2 h-[420px]">
          {loading ? (
            <p className="text-muted text-sm p-4">Loading graph…</p>
          ) : (
            <canvas ref={canvasRef} onClick={onCanvasClick} className="w-full h-full cursor-pointer" />
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-mono text-xs text-muted tracking-widest mb-3">DETECTED COMMUNITIES</h2>
            <div className="space-y-2">
              {communities.map((c) => (
                <div key={c.id} className="text-sm flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className={`font-mono text-xs ${c.risk === "HIGH" ? "text-danger" : "text-alert"}`}>{c.node_count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 min-h-[140px]">
            <h2 className="font-mono text-xs text-muted tracking-widest mb-3">NODE INSPECTOR</h2>
            {!selected ? (
              <p className="text-muted text-sm">Click a node on the graph to inspect it.</p>
            ) : (
              <div className="space-y-1 text-sm">
                <p><span className="text-muted">ID:</span> {selected.label}</p>
                <p><span className="text-muted">Type:</span> {selected.type}</p>
                <p><span className="text-muted">Risk score:</span> {(selected.risk_score * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
