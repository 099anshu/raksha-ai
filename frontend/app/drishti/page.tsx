"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Incident = { id: string; type: string; city: string; lat: number; lng: number; severity: string };
type Hotspot = { city: string; centroid: [number, number]; incident_count: number; trend: string };

const SEVERITY_COLOR: Record<string, string> = { high: "text-danger", medium: "text-alert", low: "text-safe" };

export default function DrishtiPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [i, h] = await Promise.all([api.drishtiIncidents(), api.drishtiHotspots()]);
      setIncidents(i.data);
      setHotspots(h.data);
    })();
  }, []);

  const filtered = cityFilter ? incidents.filter((i) => i.city === cityFilter) : incidents;

  return (
    <div>
      <p className="font-mono text-xs text-danger tracking-widest mb-2">DRISHTI</p>
      <h1 className="font-display text-2xl font-700 mb-1">Geospatial Crime Pattern Intelligence</h1>
      <p className="text-muted text-sm mb-4 max-w-2xl">
        Seeded incident data across three cities, standing in for the live Mapbox heatmap
        described in the plan. Add <code className="font-mono text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to
        render real map tiles instead of this list view.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {hotspots.map((h) => (
          <button
            key={h.city}
            onClick={() => setCityFilter(cityFilter === h.city ? null : h.city)}
            className={`card p-4 text-left transition-colors ${cityFilter === h.city ? "border-accent" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-600">{h.city}</span>
              <span className={`text-xs font-mono ${h.trend === "rising" ? "text-danger" : "text-muted"}`}>{h.trend}</span>
            </div>
            <div className="text-2xl font-display font-700 mt-2">{h.incident_count}</div>
            <div className="text-xs text-muted">incidents (last 30 days)</div>
          </button>
        ))}
      </div>

      <div className="card divide-y divide-line">
        <div className="p-3 grid grid-cols-12 text-xs font-mono text-muted tracking-widest">
          <span className="col-span-4">TYPE</span>
          <span className="col-span-3">CITY</span>
          <span className="col-span-3">COORDINATES</span>
          <span className="col-span-2">SEVERITY</span>
        </div>
        {filtered.slice(0, 25).map((inc) => (
          <div key={inc.id} className="p-3 grid grid-cols-12 text-sm items-center">
            <span className="col-span-4">{inc.type.replaceAll("_", " ")}</span>
            <span className="col-span-3 text-muted">{inc.city}</span>
            <span className="col-span-3 font-mono text-xs text-muted">{inc.lat}, {inc.lng}</span>
            <span className={`col-span-2 font-mono text-xs uppercase ${SEVERITY_COLOR[inc.severity]}`}>{inc.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
