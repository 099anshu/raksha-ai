"""
scripts/list_models.py

Google renames and retires Gemini model IDs every few months — the model
name that worked when this project was built may 404 for you later. Run
this script any time you get a "404 NOT_FOUND ... model X is no longer
available" error, to see exactly which models your key can actually use.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/list_models.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from google import genai
from app.config import settings

if not settings.gemini_api_key:
    print("GEMINI_API_KEY is not set in backend/.env — add it first.")
    sys.exit(1)

client = genai.Client(api_key=settings.gemini_api_key)

print(f"Currently configured model (backend/.env GEMINI_MODEL): {settings.gemini_model}\n")
print("Models your key can actually use for generateContent:\n")

for m in client.models.list():
    actions = getattr(m, "supported_actions", None) or []
    if "generateContent" in actions or not actions:
        print(f"  {m.name}")

print(
    "\nIf backend/.env's GEMINI_MODEL isn't in this list, copy one of the "
    "names above (without the 'models/' prefix) into GEMINI_MODEL= in "
    "backend/.env, then restart uvicorn."
)
