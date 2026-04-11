"""
Stage 4 — Entity Extraction

Two modes (tried in order):
  1. LLM extraction via Groq (llama-3.3-70b-versatile) — structured JSON output
     Requires GROQ_API_KEY environment variable.
  2. Regex / keyword extraction (original approach, always available as fallback)

Output schema:
{
  "patient_info": {"name": str | None, "age": int | None},
  "symptoms":     [{"entity": str, "severity": str | None, "confidence": float}],
  "duration":     [str],
  "medications":  [str],
  "observations": [str],
  "negative_findings": [str],
}
"""

import json
import os
import re

from nlp_analysis import NLPResult
from settings import (
    MEDICATION_KEYWORDS,
    MEDICATION_REGEX,
    OBSERVATION_PATTERNS,
    SEVERITY_KEYWORDS,
    SYMPTOM_KEYWORDS,
)

# ── Age / Name regex ──────────────────────────────────────────────────────────

_AGE_PATTERNS = [
    re.compile(r"\b(\d{1,3})\s*(?:year[s]?\s*old|yr[s]?\s*old|y/?o)\b", re.IGNORECASE),
    re.compile(r"\b(\d{1,3})\s+years?\s+of\s+age\b", re.IGNORECASE),
    re.compile(r"\baged?\s+(\d{1,3})\b", re.IGNORECASE),
    re.compile(r"\bmy\s+age\s+(?:\w+\s+){0,3}is\s+(\d{1,3})\b", re.IGNORECASE),
    re.compile(r"\bi(?:'m| am)\s+(\d{1,3})\s+years?\b", re.IGNORECASE),
    re.compile(r"\bi(?:'m| am)\s+(\d{1,3})\b", re.IGNORECASE),
]

NAME_PATTERN = re.compile(
    r"\bmy\s+name\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b", re.IGNORECASE
)

_TITLE_WORDS = {"doctor", "dr", "nurse", "mr", "mrs", "ms", "sir", "patient"}

# ── LLM extraction ────────────────────────────────────────────────────────────

_LLM_SYSTEM = """You are a clinical NLP expert. Extract structured medical entities from the
patient transcript and return ONLY valid JSON with this exact schema:
{
  "patient_info": {"name": <string or null>, "age": <integer or null>},
  "symptoms": [{"entity": <string>, "severity": <"mild"|"moderate"|"severe"|"chronic"|"acute"|null>, "confidence": <0.0-1.0>}],
  "duration": [<string>],
  "medications": [<string>],
  "observations": [<string>],
  "negative_findings": [<string>]
}
Rules:
- symptoms: only confirmed, non-negated symptoms the patient reports
- negative_findings: things the patient explicitly denies (e.g. "no fever", "denies chest pain")
- duration: time expressions like "for 3 days", "since yesterday", "2 weeks ago"
- medications: drug names with dose if stated
- observations: direct patient quotes or clinical observations
- Return ONLY the JSON object, no markdown, no commentary."""


def _extract_with_llm(text: str) -> dict | None:
    """Call Groq LLM to extract entities. Returns dict or None on failure."""
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not groq_key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)

        print("🤖 Running LLM entity extraction (Groq llama-3.3-70b)…")
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _LLM_SYSTEM},
                {"role": "user",   "content": f"Transcript:\n{text}"},
            ],
            temperature=0.0,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content
        result = json.loads(raw)

        # Normalise / validate the response
        result.setdefault("patient_info", {"name": None, "age": None})
        result.setdefault("symptoms", [])
        result.setdefault("duration", [])
        result.setdefault("medications", [])
        result.setdefault("observations", [])
        result.setdefault("negative_findings", [])
        print("✅ LLM entity extraction succeeded.")
        return result

    except Exception as exc:
        print(f"⚠️  LLM extraction failed ({exc}), falling back to regex…")
        return None


# ── Regex / keyword helpers ───────────────────────────────────────────────────

def _is_negated(term: str, negated_spans: list[str]) -> bool:
    term_lower = term.lower()
    return any(term_lower in span.lower() for span in negated_spans)


def _severity_near(term: str, text: str) -> str | None:
    text_lower = text.lower()
    idx = text_lower.find(term.lower())
    if idx == -1:
        return None
    window = text_lower[max(0, idx - 40): idx + len(term) + 40]
    for kw, label in SEVERITY_KEYWORDS.items():
        if kw in window:
            return label
    return None


# ── Regex extractors (fallback) ───────────────────────────────────────────────

def _regex_patient_info(nlp_result: NLPResult) -> dict:
    name = None
    match = NAME_PATTERN.search(nlp_result.text)
    if match:
        name = match.group(1).strip()
    if not name:
        for ent in nlp_result.ner_entities:
            if ent["label"] == "PERSON" and ent["text"].lower() not in _TITLE_WORDS:
                name = ent["text"]
                break

    age = None
    for pattern in _AGE_PATTERNS:
        m = pattern.search(nlp_result.text)
        if m:
            candidate = int(m.group(1))
            if 1 <= candidate <= 120:
                age = candidate
                break

    return {"name": name, "age": age}


def _regex_symptoms(nlp_result: NLPResult) -> list[dict]:
    text_lower = nlp_result.text.lower()
    found = []
    for symptom in SYMPTOM_KEYWORDS:
        if symptom not in text_lower:
            continue
        if _is_negated(symptom, nlp_result.negated_spans):
            continue
        severity = _severity_near(symptom, nlp_result.text)
        found.append({
            "entity": symptom.title(),
            "severity": severity,
            "confidence": 0.95 if severity else 0.80,
        })
    return found


def _regex_medications(nlp_result: NLPResult) -> list[str]:
    text_lower = nlp_result.text.lower()
    meds = set()
    for med in MEDICATION_KEYWORDS:
        if med in text_lower:
            meds.add(med.title())
    for match in re.finditer(MEDICATION_REGEX, nlp_result.text):
        candidate = match.group(0)
        if candidate.lower() not in {m.lower() for m in meds}:
            meds.add(candidate)
    return sorted(meds)


def _regex_observations(nlp_result: NLPResult) -> list[str]:
    observations = []
    for pattern in OBSERVATION_PATTERNS:
        for match in re.finditer(pattern, nlp_result.text, re.IGNORECASE):
            obs = match.group(1).strip(" .,")
            if obs and obs not in observations:
                observations.append(obs)
    return observations


def _regex_negative_findings(nlp_result: NLPResult) -> list[str]:
    findings = []
    for span in nlp_result.negated_spans:
        clean = span.strip()
        if len(clean) <= 2:
            continue
        if any(kw in clean.lower() for kw in SYMPTOM_KEYWORDS):
            findings.append(f"No {clean}")
    return findings


def _extract_with_regex(nlp_result: NLPResult) -> dict:
    return {
        "patient_info":     _regex_patient_info(nlp_result),
        "symptoms":         _regex_symptoms(nlp_result),
        "duration":         nlp_result.temporal_phrases,
        "medications":      _regex_medications(nlp_result),
        "observations":     _regex_observations(nlp_result),
        "negative_findings": _regex_negative_findings(nlp_result),
    }


# ── Public API ────────────────────────────────────────────────────────────────

def extract_entities(nlp_result: NLPResult) -> dict:
    """
    Try LLM extraction first (requires GROQ_API_KEY), fall back to regex.
    """
    llm_result = _extract_with_llm(nlp_result.text)
    if llm_result is not None:
        return llm_result
    print("📋 Using regex/keyword entity extraction…")
    return _extract_with_regex(nlp_result)
