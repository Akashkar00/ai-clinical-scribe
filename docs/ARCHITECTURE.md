# Architecture Documentation — AI Clinical Scribe MVP

## Overview

The system implements a sequential 6-stage pipeline that transforms unstructured consultation audio into a structured clinical summary. Each stage is a standalone Python module that can be tested independently and also chains into the next stage.

---

## Data Flow

```
        Audio File (.wav/.mp3)
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 1: audio_input.py            │
│  • Validate file type & size        │
│  • Save uploaded file to temp dir   │
│  Output: file path (Path)           │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 2: transcription.py          │
│  • Load Whisper model ("base")      │
│  • model.transcribe(audio_path)     │
│  Output: transcript string          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 3: nlp_analysis.py           │
│  • spaCy pipeline (tokenize, NER,   │
│    dependency parse)                │
│  • Negation window detection        │
│  • Temporal phrase extraction       │
│  Output: NLPResult dataclass        │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 4: entity_extraction.py      │
│  • Keyword match for symptoms       │
│  • Regex match for medications      │
│  • Duration from temporal phrases   │
│  • Negated findings extraction      │
│  • Observation patterns             │
│  Output: structured dict            │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 5: summary_generator.py      │
│  • Template fill from entity dict   │
│  • Clinical note paragraph builder  │
│  • Optional Groq LLM enhancement    │
│  Output: formatted summary string   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 6: streamlit_app.py          │
│  • File uploader / sample toggle    │
│  • Process button triggers pipeline │
│  • Displays: transcript, entities   │
│    table, summary, temporal/negated │
│    spans                            │
└─────────────────────────────────────┘
```

---

## Module Details

### Stage 1 — Audio Input (`src/audio_input.py`)

Validates the uploaded file against allowed extensions (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`) and a configurable size limit (default 50 MB). Saves Streamlit upload objects to a temp directory for Whisper to read.

### Stage 2 — Speech-to-Text (`src/transcription.py`)

Uses the **openai-whisper** package (fully local, no API key). The default model is `"base"` (74M params, ~1 GB VRAM). Forced to English (`language="en"`) to improve accuracy on medical terms. The module also provides a `SAMPLE_TRANSCRIPT` constant for testing without audio.

**Why Whisper?** Open-source, multilingual, decent medical vocabulary out of the box, runs on CPU (slower) or GPU.

### Stage 3 — NLP Analysis (`src/nlp_analysis.py`)

Runs the spaCy `en_core_web_sm` pipeline for tokenization, POS tagging, dependency parsing, and NER. On top of that, two custom routines:

1. **Negation detection** — scans tokens for negation cues (configurable in `settings.py`) and captures a 5-token window after each cue.
2. **Temporal phrase extraction** — regex patterns matching phrases like "for 3 days", "since Monday", "two weeks ago".

### Stage 4 — Entity Extraction (`src/entity_extraction.py`)

Combines:
- **Keyword matching** against curated lists of symptoms and medications.
- **Regex patterns** for observations ("patient reports …") and negative findings ("no vomiting").
- **Cross-referencing** with negation data from Stage 3 to avoid listing negated symptoms as positive findings.

Output schema:
```json
{
  "symptoms": [{"entity": "Fever", "confidence": 0.95}],
  "duration": "three days",
  "medication": ["Paracetamol"],
  "observations": ["I feel very weak"],
  "negative_findings": ["No vomiting", "No diarrhea"]
}
```

### Stage 5 — Summary Generation (`src/summary_generator.py`)

Primary path is **template-based**: fills a structured clinical note template with extracted entities. A clinical-note paragraph is auto-generated from the data.

Optional path: if `GROQ_API_KEY` is set, calls the Groq API (LLaMA 3 8B) to generate a SOAP-format narrative. Falls back silently on failure.

### Stage 6 — Web Interface (`app/streamlit_app.py`)

Streamlit dashboard with sidebar options, file uploader, and three output sections. Uses `st.session_state` to persist results across reruns.

---

## Design Decisions

| Decision                        | Rationale                                                                                          |
|---------------------------------|----------------------------------------------------------------------------------------------------|
| Whisper "base" model            | Good accuracy-to-speed tradeoff for MVP; "small" or "medium" available if needed.                 |
| spaCy over Transformers NER     | Faster, lighter, runs on CPU. Transformers NER can be added later for better medical entity recognition. |
| Rule-based extraction           | Predictable, debuggable, no training data needed. Sufficient for proving the pipeline concept.     |
| Template summary over pure LLM  | Deterministic output, no API dependency. LLM enhancement is opt-in.                               |
| Streamlit over Flask            | Fastest path to a working dashboard. Flask/FastAPI can replace it in production.                  |

---

## Known Limitations

1. **Fixed keyword lists** — symptoms and medications not in the list are missed.
2. **No speaker diarization** — the system doesn't distinguish who said what.
3. **Negation heuristic** — the 5-token window is simplistic; complex negation scopes can be missed.
4. **No medical ontology mapping** — entities aren't linked to UMLS/SNOMED codes.
5. **Confidence scores** — currently heuristic-based (exact match vs. partial match), not model-derived.

---

## Future Improvements

- Custom spaCy NER model trained on i2b2/n2c2 clinical datasets.
- Speaker diarization via `pyannote-audio`.
- UMLS/SNOMED CT entity linking with `scispaCy`.
- FastAPI backend with REST endpoints for each pipeline stage.
- PDF export of the clinical summary.
- Evaluation metrics: precision/recall on a labelled test set.
