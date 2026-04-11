"""
Stage 2 — Transcription

Primary:  Groq Whisper API  (whisper-large-v3)   — set GROQ_API_KEY
Fallback: Local Whisper     (large-v3)            — slower but still high-quality

Improvements over baseline:
  - Audio normalised to 16 kHz mono WAV via ffmpeg before inference
  - Hallucination filtering: discard segments where no_speech_prob > 0.6
    or avg_logprob < -1.0
  - Beam search (beam_size=5, best_of=5) for local model
  - Detailed medical initial_prompt steers the model vocabulary
"""

import json
import os
import subprocess
import tempfile

from audio_input import validate_audio

# ── Quality thresholds ──────────────────────────────────────────────────────
NO_SPEECH_THRESHOLD = 0.6     # discard segment if P(no speech) > 60 %
LOGPROB_THRESHOLD   = -1.0    # discard segment if avg log-prob < -1.0
COMPRESSION_THRESHOLD = 2.4   # discard overly repetitive / hallucinated segment

# ── Medical context prompt ───────────────────────────────────────────────────
MEDICAL_PROMPT = (
    "Clinical consultation transcript. Patient reports symptoms, medications, "
    "allergies, and medical history to a physician. "
    "Common terms: chest pain, shortness of breath, fever, hypertension, "
    "diabetes mellitus, nausea, vomiting, dizziness, fatigue, palpitations, "
    "metformin, aspirin, paracetamol, ibuprofen, lisinopril, atorvastatin, "
    "amoxicillin, prednisone, omeprazole, salbutamol, insulin. "
    "Patient may state their name and age."
)


# ── Audio pre-processing ─────────────────────────────────────────────────────

def _preprocess_audio(file_path: str) -> tuple[str, bool]:
    """
    Resample to 16 kHz mono WAV and normalise loudness via ffmpeg.
    Returns (path_to_processed_file, should_delete).
    Falls back to original if ffmpeg fails.
    """
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp.close()
    cmd = [
        "ffmpeg", "-y", "-i", file_path,
        "-ar", "16000",          # sample rate Whisper prefers
        "-ac", "1",              # mono
        "-af", "loudnorm",       # EBU R128 loudness normalisation
        tmp.name,
    ]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        os.unlink(tmp.name)
        print("⚠️  ffmpeg preprocessing failed — using original file")
        return file_path, False
    print("✅ Audio preprocessed (16 kHz mono, loudnorm)")
    return tmp.name, True


# ── Hallucination filtering ──────────────────────────────────────────────────

def _filter_hallucinations(segments: list) -> list:
    """
    Remove segments that whisper itself rates as low-confidence.
    Keeps only segments that pass ALL three thresholds.
    """
    good = []
    for seg in segments:
        ns   = seg.get("no_speech_prob", 0.0)
        lp   = seg.get("avg_logprob", 0.0)
        cr   = seg.get("compression_ratio", 1.0)
        if ns > NO_SPEECH_THRESHOLD:
            print(f"  ⚠ Dropped hallucinated segment (no_speech={ns:.2f}): {seg.get('text','')!r}")
            continue
        if lp < LOGPROB_THRESHOLD:
            print(f"  ⚠ Dropped low-confidence segment (logprob={lp:.2f}): {seg.get('text','')!r}")
            continue
        if cr > COMPRESSION_THRESHOLD:
            print(f"  ⚠ Dropped repetitive segment (compression={cr:.2f}): {seg.get('text','')!r}")
            continue
        good.append(seg)
    return good


# ── Groq backend ─────────────────────────────────────────────────────────────

def _transcribe_groq(file_path: str) -> dict:
    """Transcribe via Groq's hosted whisper-large-v3 (very accurate, fast)."""
    from groq import Groq

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    print("🚀 Using Groq whisper-large-v3 API…")

    with open(file_path, "rb") as fh:
        resp = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), fh),
            model="whisper-large-v3",
            prompt=MEDICAL_PROMPT,
            response_format="verbose_json",
            language="en",
            temperature=0.0,
        )

    segments = list(getattr(resp, "segments", None) or [])
    # Groq returns Pydantic objects; convert to plain dicts
    segments = [
        s if isinstance(s, dict) else s.model_dump()
        for s in segments
    ]
    segments = _filter_hallucinations(segments)
    text = " ".join(s["text"].strip() for s in segments) if segments else (resp.text or "").strip()

    return {
        "text": text,
        "segments": segments,
        "language": getattr(resp, "language", "en"),
        "model": "groq/whisper-large-v3",
    }


# ── Local Whisper fallback ────────────────────────────────────────────────────

def _transcribe_local(file_path: str) -> dict:
    """
    Local Whisper large-v3 with full beam search.
    Slower but high-quality when no API key is available.
    """
    import whisper

    print("⏳ Loading local Whisper large-v3 (first run downloads ~3 GB)…")
    model = whisper.load_model("large-v3")
    print("✅ Model loaded.")

    result = model.transcribe(
        file_path,
        language="en",
        initial_prompt=MEDICAL_PROMPT,
        temperature=0.0,
        beam_size=5,
        best_of=5,
        condition_on_previous_text=True,
        no_speech_threshold=NO_SPEECH_THRESHOLD,
        logprob_threshold=LOGPROB_THRESHOLD,
        compression_ratio_threshold=COMPRESSION_THRESHOLD,
        word_timestamps=True,
    )

    segments = _filter_hallucinations(result.get("segments", []))
    text = (
        " ".join(s["text"].strip() for s in segments)
        if segments
        else result["text"].strip()
    )

    return {
        "text": text,
        "segments": segments,
        "language": result.get("language", "en"),
        "model": "local/whisper-large-v3",
    }


# ── Public API ────────────────────────────────────────────────────────────────

def save_transcription(result: dict, output_path: str = "data/transcription_output.json"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"💾 Transcription saved to: {output_path}")


def transcribe_audio(file_path: str) -> dict:
    """
    Validate → preprocess → transcribe (Groq preferred, local fallback).
    Returns dict: {text, segments, language, model}.
    """
    validate_audio(file_path)
    print(f"🎧 Transcribing: {file_path}")

    processed, should_delete = _preprocess_audio(file_path)

    try:
        if os.environ.get("GROQ_API_KEY", "").strip():
            try:
                result = _transcribe_groq(processed)
            except Exception as exc:
                print(f"⚠️  Groq API failed ({exc}) — falling back to local Whisper large-v3")
                result = _transcribe_local(processed)
        else:
            print("⚠️  GROQ_API_KEY not set — falling back to local Whisper large-v3")
            result = _transcribe_local(processed)
    finally:
        if should_delete and os.path.exists(processed):
            os.unlink(processed)

    print(f"✅ Transcription complete — {len(result['text'])} chars via {result['model']}")
    return result


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        audio_path = sys.argv[1]
        print(f"🎤 Using provided audio: {audio_path}")
    else:
        from audio_input import create_sample_audio
        sample_text = (
            "My name is John Smith and I am 45 years old. "
            "I have been experiencing severe chest pain and shortness of breath for two days. "
            "I also have a mild fever. "
            "I am currently taking aspirin 100 milligrams and metformin 500 milligrams daily."
        )
        audio_path = create_sample_audio(sample_text)

    result = transcribe_audio(audio_path)
    print("\n📝 Transcription Output:")
    print(result["text"])
    save_transcription(result)
