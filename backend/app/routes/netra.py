"""
routes/netra.py — Module owner: whoever is building COUNTERFEIT CURRENCY DETECTION

NETRA takes a photo of a currency note and uses Gemini's vision
capability to inspect it for the security features RBI notes are
supposed to have (Section 7.3 of the plan), instead of a custom-trained
EfficientNet/YOLO pipeline. This is realistic for the hackathon timeline
and still genuinely uses computer-vision-grade image understanding.

To extend this module for the demo:
  - Collect 5-10 real note photos + 5-10 known-counterfeit sample images
    (search "counterfeit note training image RBI awareness") for the demo
  - Tighten SYSTEM_PROMPT with the specific security features for the
    denomination you're demoing (₹500 is the highest-value target)
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ai import ask_json, image_content_block

router = APIRouter(prefix="/api/netra", tags=["netra"])

SYSTEM_PROMPT = """You are NETRA, a currency-authentication vision engine for Indian Rupee
notes, used by an Indian law-enforcement / banking safety platform. You are shown a photo
of a single currency note. Examine it for the security features genuine RBI notes carry:
security thread, Mahatma Gandhi watermark, latent image, micro-lettering ("RBI" / "भारत"),
intaglio (raised) printing, colour-shifting ink on the numeral (₹200/₹500), see-through
register, fluorescent number panel, bleed lines for the visually impaired, and print quality
/ paper texture consistent with genuine currency.

Note: you cannot literally verify a UV watermark or a raised-ink texture from a flat photo —
be explicit about this limitation in your explanation, and base your verdict on what IS
visible: print sharpness, colour accuracy, alignment, watermark visibility, serial number
formatting, and any obvious tell (e.g. "Children's Bank of India" fake note wording,
blurry printing, wrong colour, missing features).

Return JSON with this exact shape:
{
  "denomination_guess": "<e.g. '₹500' or 'unknown'>",
  "verdict": "AUTHENTIC" | "SUSPICIOUS" | "COUNTERFEIT" | "NOT_A_CURRENCY_NOTE",
  "confidence": <integer 0-100>,
  "features_checked": [
    {"feature": "<name>", "observation": "<what you see>", "status": "pass" | "fail" | "cannot_verify_from_photo"}
  ],
  "explanation": <2-3 sentence plain-language summary for a bank teller or citizen>
}"""


@router.post("/scan")
async def scan_note(file: UploadFile = File(...)):
    image_bytes = await file.read()
    content = [
        image_content_block(image_bytes, file.content_type or "image/jpeg"),
        "Analyse this currency note photo.",
    ]
    try:
        result = ask_json(SYSTEM_PROMPT, content, max_tokens=1200)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
    return {"success": True, "data": result}


@router.get("/stats")
def stats():
    # Demo/mock aggregate stats — wire to Supabase netra.scans table for production
    return {
        "success": True,
        "data": {"total_scans": 214, "counterfeit_found": 9, "top_denomination": "₹500"},
    }
