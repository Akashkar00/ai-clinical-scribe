"""
Stage 5 — Clinical Summary Generation

Uses Groq (llama-3.3-70b-versatile) to generate a structured clinical note
from the extracted entities produced by Stage 4.

Falls back to a simple template-based summary if GROQ_API_KEY is not set.
"""

import json
import os

_SYSTEM_PROMPT = """You are an expert clinical documentation specialist.
Given structured patient data extracted from a consultation transcript,
produce a concise clinical note in SOAP format:

S (Subjective):  patient's chief complaint and history in their own words
O (Objective):   observable/measurable findings mentioned
A (Assessment):  likely diagnoses or clinical impressions
P (Plan):        suggested next steps, medications, follow-up

Be factual, use medical terminology where appropriate, and do not invent
information not present in the input. Keep the note under 300 words."""


def _template_summary(entities: dict) -> str:
    """Simple template fallback when no API key is available."""
    pi   = entities.get("patient_info", {})
    name = pi.get("name") or "Unknown"
    age  = pi.get("age")
    age_str = f", {age} years old" if age else ""

    symptoms = ", ".join(s["entity"] for s in entities.get("symptoms", [])) or "none reported"
    meds     = ", ".join(entities.get("medications", [])) or "none reported"
    duration = "; ".join(entities.get("duration", [])) or "not specified"
    neg      = "; ".join(entities.get("negative_findings", [])) or "none"
    obs      = "; ".join(entities.get("observations", [])) or "none"

    return (
        f"CLINICAL NOTE\n"
        f"{'─'*40}\n"
        f"Patient: {name}{age_str}\n\n"
        f"S: Patient presents with {symptoms}. Duration: {duration}.\n"
        f"   Observations: {obs}.\n\n"
        f"O: Negative findings: {neg}.\n\n"
        f"A: Symptoms consistent with acute illness. Further evaluation required.\n\n"
        f"P: Continue current medications ({meds}). Follow-up as needed.\n"
    )


def generate_summary(entities: dict) -> str:
    """
    Generate a clinical SOAP note from the entity dict.
    Uses Groq LLM if GROQ_API_KEY is set, otherwise falls back to template.
    """
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    if not groq_key:
        print("⚠️  GROQ_API_KEY not set — using template-based summary")
        return _template_summary(entities)

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)

        print("📝 Generating clinical summary via Groq LLM…")
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Please generate a SOAP clinical note from the following "
                        f"extracted patient data:\n\n{json.dumps(entities, indent=2)}"
                    ),
                },
            ],
            temperature=0.2,
            max_tokens=600,
        )
        summary = resp.choices[0].message.content.strip()
        print("✅ Clinical summary generated.")
        return summary

    except Exception as exc:
        print(f"⚠️  LLM summary failed ({exc}), using template fallback")
        return _template_summary(entities)
