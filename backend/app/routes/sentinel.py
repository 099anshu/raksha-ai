"""
routes/sentinel.py  — Module owner: whoever is building SCAM DETECTION

SENTINEL analyses a call transcript / SMS / WhatsApp text and returns a
threat score + explanation, exactly like the "digital arrest scam"
detector described in the implementation plan (Section 6), minus the
custom-trained Whisper/wav2vec pipeline — Gemini reads the transcript
directly.

To extend this module for the demo:
  - Add more scam scenario transcripts to frontend/public/scenarios/
  - Improve SYSTEM_PROMPT with more real scam script patterns
  - Wire /analyse/audio to a speech-to-text service if you get time
    (Whisper via HuggingFace Inference API is free-tier friendly)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai import ask_json

router = APIRouter(prefix="/api/sentinel", tags=["sentinel"])

SYSTEM_PROMPT = """You are SENTINEL, a digital-arrest-scam detection engine used by an
Indian law-enforcement safety platform. You are given a transcript of a phone call,
video call, SMS, or WhatsApp message. Digital arrest scams impersonate CBI, ED, Customs,
RBI, or Police, invent a fake legal case (money laundering, parcel with drugs, Aadhaar
misuse), create urgency, isolate the victim, and demand money transfer or that the
victim stay on video 'under digital arrest'.

Analyse the text and return JSON with this exact shape:
{
  "threat_score": <integer 0-100>,
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "scam_type": "digital_arrest" | "kyc_update" | "lottery" | "investment" | "none" | "other",
  "red_flags": [<short strings, each one specific phrase or tactic detected>],
  "impersonated_authority": <string or null>,
  "recommended_action": <one short sentence of advice for the citizen>,
  "explanation": <2-3 sentence plain-language summary>
}
threat_score > 70 is HIGH, 40-70 is MEDIUM, below 40 is LOW."""


class AnalyseTextRequest(BaseModel):
    text: str
    channel: str = "call"  # call | sms | whatsapp | video


class ReportRequest(BaseModel):
    phone_number: str
    description: str


@router.post("/analyse/text")
def analyse_text(req: AnalyseTextRequest):
    try:
        result = ask_json(
            SYSTEM_PROMPT,
            f"Channel: {req.channel}\n\nTranscript / message:\n{req.text}",
        )
    except Exception as e:
        # Without this, an unhandled exception here loses its CORS headers
        # and shows up in the browser as an opaque "Failed to fetch" instead
        # of a readable error. Raising HTTPException keeps CORS intact.
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
    return {"success": True, "data": result}


@router.get("/number/{phone}")
def check_number(phone: str):
    """
    Demo/mock number-reputation lookup. In production this would query
    Supabase's scam_numbers table (Section 6.4 of the plan) built from
    citizen reports. For the prototype we simulate a plausible response.
    """
    # simple deterministic mock so the same number always gives the same result
    risky = sum(ord(c) for c in phone) % 5 == 0
    return {
        "success": True,
        "data": {
            "phone_number": phone,
            "risk_level": "HIGH" if risky else "LOW",
            "report_count": 47 if risky else 0,
            "note": "Simulated lookup — wire to Supabase scam_numbers table for production.",
        },
    }


@router.post("/report")
def report_scam(req: ReportRequest):
    # In production: insert into Supabase `sentinel.scam_numbers` / `sentinel.sessions`
    return {"success": True, "data": {"message": "Report received", "phone_number": req.phone_number}}
