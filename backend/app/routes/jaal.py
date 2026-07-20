"""
routes/jaal.py — Module owner: whoever is building FRAUD NETWORK GRAPH INTELLIGENCE

Full spec (plan Section 8) calls for Neo4j + PyTorch Geometric GNNs.
That's a multi-week build. For the hackathon prototype, JAAL serves a
realistic SEEDED demo graph — exactly what plan Section 20.2 ("Demo Data
Preparation") itself recommends: "Fraud network: Seeded graph with 100+
nodes and 200+ edges based on realistic patterns."

This still demonstrates the concept end-to-end (frontend graph explorer,
node inspector, evidence package generation) — it's just backed by
generated demo data instead of a live Neo4j cluster. If your team has
time left after the other 4 modules work, swapping this for real Neo4j
is the highest-value upgrade (see README "Stretch goals").
"""
import random
from fastapi import APIRouter

router = APIRouter(prefix="/api/jaal", tags=["jaal"])

random.seed(42)  # deterministic demo data so it looks the same every run

NAMES = ["Unknown Caller A", "Mule Account 1", "Mule Account 2", "Call Centre Node",
         "UPI Handle X", "Shell Account B", "Device Cluster D1", "Coordinator"]


def _generate_graph():
    nodes = []
    for i in range(24):
        node_type = random.choice(["phone", "account", "upi", "device", "person"])
        risk = round(random.uniform(0.1, 0.99), 2)
        nodes.append({
            "id": f"n{i}",
            "label": f"{node_type}-{i:03d}",
            "type": node_type,
            "risk_score": risk,
        })
    edges = []
    for i in range(40):
        a, b = random.sample(nodes, 2)
        edges.append({
            "source": a["id"], "target": b["id"],
            "type": random.choice(["CALLED", "TRANSFERRED_TO", "OWNS", "ASSOCIATED_WITH"]),
        })
    return nodes, edges


_NODES, _EDGES = _generate_graph()


@router.get("/graph/demo")
def get_demo_graph():
    return {"success": True, "data": {"nodes": _NODES, "edges": _EDGES}, "note": "Seeded demo data — see docstring."}


@router.get("/communities")
def communities():
    return {
        "success": True,
        "data": [
            {"id": "c1", "name": "Cluster: Jharkhand Call Centre Ring", "node_count": 9, "risk": "HIGH"},
            {"id": "c2", "name": "Cluster: Mumbai Mule Account Network", "node_count": 6, "risk": "HIGH"},
            {"id": "c3", "name": "Cluster: Isolated Reports", "node_count": 9, "risk": "MEDIUM"},
        ],
    }


@router.post("/evidence-package")
def generate_evidence_package(cluster_id: str = "c1"):
    return {
        "success": True,
        "data": {
            "cluster_id": cluster_id,
            "generated_at": "2026-07-18T00:00:00Z",
            "summary": "Auto-generated evidence package linking phone activity, transaction flow, and citizen reports for this cluster.",
            "node_count": 9,
            "download_note": "In production this renders a hash-verified PDF (Section 8.3 Step 6). Stub for prototype.",
        },
    }
