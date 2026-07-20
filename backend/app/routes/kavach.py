"""
routes/kavach.py — Module owner: whoever is building the CITIZEN CHATBOT

KAVACH is the multilingual citizen-facing chatbot (Section 10 of the plan).
This is a real, working Gemini-powered conversational agent — no mocking
needed here, this module works exactly like production would, just
without the Rasa intent-engine (Gemini replaces Rasa + IndicBERT + the
LLM fallback in one call).

To extend this module for the demo:
  - Add a `language` field and pass "Reply in Hindi" / "Reply in Tamil" etc
    into the system prompt for the multilingual demo
  - Wire /sms/alert to a real SMS provider (Authkey.io, Twilio, MSG91) if
    you get an API key — until then it just returns a simulated response
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai import ask_text

router = APIRouter(prefix="/api/kavach", tags=["kavach"])

SYSTEM_PROMPT = """You are KAVACH, a friendly citizen-safety assistant on the RAKSHA AI
platform, part of an Indian digital-public-safety initiative. Citizens come to you to:
check if a call/message/number seems like a scam, learn how to file a cybercrime report,
get safety advice, or just understand what a "digital arrest scam" is.

Be warm, clear, and reassuring — many users are scared or embarrassed. Never claim
certainty you don't have; give a risk assessment, not a legal verdict. For anything urgent
(money already transferred, being actively pressured on a call right now) tell them
clearly: hang up / don't transfer more money, then call the National Cybercrime Helpline
1930 or report at cybercrime.gov.in. Keep responses to 2-4 short sentences unless the user
asks for detail. If asked to switch language, switch and continue in that language."""


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []  # [{"role": "user"|"assistant", "content": "..."}]


@router.post("/chat")
def chat(req: ChatRequest):
    try:
        reply = ask_text(SYSTEM_PROMPT, req.message, history=req.history)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
    return {"success": True, "data": {"reply": reply}}


@router.get("/safety-tips")
def safety_tips():
    return {
        "success": True,
        "data": [
            "No government agency (CBI, ED, Police, RBI) will ever arrest you over video call or demand money to 'verify' your identity.",
            "Never share OTPs, UPI PINs, or bank details over a call — no bank or agency needs them.",
            "If a caller pressures you to stay on video and not hang up, that urgency itself is the red flag.",
            "Verify by calling the organisation back on their official published number — not one the caller gives you.",
        ],
    }
