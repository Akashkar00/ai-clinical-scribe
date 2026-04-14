#  AI Clinical Scribe

> An AI-powered platform that converts doctor-patient consultation audio into structured clinical documentation using speech recognition, NLP, and optional LLM summarisation.

**Built as part of a Health Systems Research Internship at Shalink & Reyx Infinity Research Hub Pvt. Ltd.**

---

## What It Does

Upload (or simulate) a consultation audio file — the system runs a **6-stage pipeline**:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  1. Audio   │───▶│ 2. Speech-to │───▶│  3. NLP     │
│     Input   │    │    -Text     │    │   Analysis  │
│  (.wav/.mp3)│    │  (Whisper)   │    │  (spaCy)    │
└─────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                                              ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  6. React   │◀── │ 5. Clinical  │◀── │ 4. Entity   │
│     UI      │    │   Summary    │    │ Extraction  │
└─────────────┘    └──────────────┘    └─────────────┘
```

**Input:** Consultation audio file or a typed sample transcript  
**Output:** Full transcript · extracted entities (symptoms, medications, duration, negations) · confidence scores · SOAP clinical summary

---

## Tech Stack

| Component          | Technology                                      |
|--------------------|-------------------------------------------------|
| Backend Language   | Python 3.9+                                     |
| API Framework      | FastAPI + Uvicorn                               |
| Speech-to-Text     | OpenAI Whisper (Groq cloud — `whisper-large-v3`)|
| NLP                | spaCy (`en_core_web_sm`)                        |
| Entity Extraction  | Rule-based + regex                              |
| Summary            | Template-based (+ optional Groq LLM)            |
| Frontend           | React 18 + TypeScript + Material UI v5          |
| UI Theme           | Health-themed teal + emerald palette            |
| Version Control    | Git + GitHub                                    |

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/ai-clinical-scribe.git
cd ai-clinical-scribe
```

### 2. Backend setup

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Optional — enable LLM-enhanced summaries:

```bash
export GROQ_API_KEY=your_api_key_here
```

### 3. Frontend setup

```bash
cd frontend
npm install
cd ..
```

### 4. Run tests

```bash
source venv/bin/activate
pytest tests/ -v
```

---

## Running the App

> Both the backend and frontend must be running at the same time. Open **two terminal windows**.

### Terminal 1 — Start the Backend (FastAPI)

```bash
# From the project root
source venv/bin/activate          # Windows: venv\Scripts\activate
python backend/main.py
```

Expected output:
```
INFO:     Started server process [...]
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

- API base URL: `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Terminal 2 — Start the Frontend (React)

```bash
# From the project root
cd frontend
npm start
```

Expected output:
```
Compiled successfully!
Local:  http://localhost:3000
```

Open `http://localhost:3000` in your browser.

### Using the App

1. Open `http://localhost:3000`
2. **Option A — Upload audio:** Click the upload zone and select an MP3, WAV, M4A, OGG, or FLAC file
3. **Option B — Sample transcript:** Toggle "Use sample transcript" and type or paste consultation text
4. *(Optional)* Toggle **LLM-Enhanced Summary** if `GROQ_API_KEY` is set
5. Click **Process Audio** — watch the 6-stage pipeline progress bar
6. View the results: transcript, entity overview, symptom confidence chart, and SOAP clinical summary

### Stopping the servers

Press `Ctrl+C` in each terminal to stop the backend and frontend.

---

## API Endpoints

| Method | Endpoint    | Description                              |
|--------|-------------|------------------------------------------|
| GET    | `/health`   | Health check — returns `{"status":"healthy"}` |
| POST   | `/process`  | Process audio file or sample text        |

`POST /process` accepts `multipart/form-data`:

| Field         | Type    | Description                                  |
|---------------|---------|----------------------------------------------|
| `file`        | File    | Audio file (MP3, WAV, M4A, OGG, FLAC)       |
| `use_sample`  | bool    | Use built-in sample transcript               |
| `sample_text` | string  | Custom transcript text (when `use_sample=true`) |
| `use_llm`     | bool    | Use Groq LLM for enhanced summary            |

---

## Project Structure

```
ai-clinical-scribe/
├── README.md                      ← You are here
├── requirements.txt               ← Python dependencies
├── .gitignore
├── backend/
│   └── main.py                    ← FastAPI app + all API endpoints
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx                ← Theme (teal/emerald) + layout
│       ├── index.css              ← Global styles + Inter font
│       ├── index.tsx
│       └── components/
│           └── ClinicalScribe.tsx ← Main UI component
├── src/
│   ├── __init__.py
│   ├── audio_input.py             ← Stage 1: Audio loading & validation
│   ├── transcription.py           ← Stage 2: Whisper speech-to-text
│   ├── nlp_analysis.py            ← Stage 3: spaCy NLP processing
│   ├── entity_extraction.py       ← Stage 4: Medical entity extraction
│   ├── summary_generator.py       ← Stage 5: Clinical note generation
│   ├── pipeline.py                ← CLI pipeline runner
│   └── utils.py                   ← Shared helpers
├── config/
│   └── settings.py                ← Centralised configuration
├── data/
│   └── sample_audio/
├── tests/
│   ├── test_transcription.py
│   ├── test_extraction.py
│   └── test_summary.py
└── docs/
    └── ARCHITECTURE.md
```

---

## CLI Pipeline (no UI)

Run the full pipeline directly from the terminal against an audio file:

```bash
source venv/bin/activate
cd src
python pipeline.py /path/to/consultation.m4a
```

Outputs are saved to `data/nlp_output.json` and `data/clinical_summary.txt`.

---

## Google Colab

All `src/` modules work in Colab. Add this cell at the top:

```python
!pip install openai-whisper spacy fastapi uvicorn pandas groq
!python -m spacy download en_core_web_sm
!git clone https://github.com/<your-username>/ai-clinical-scribe.git
import sys; sys.path.insert(0, 'ai-clinical-scribe')
```

---

## License

Developed for academic and research purposes as part of a Health Systems Research Internship.
