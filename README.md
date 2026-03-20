#  AI Clinical Scribe — MVP

> An AI-powered prototype that converts doctor-patient consultation audio into structured clinical summaries using speech recognition and NLP.

**Built as part of a Health Systems Research Internship at Shalink & Reyx Infinity Research Hub Pvt. Ltd.**

---

## What It Does

Upload (or simulate) a consultation audio file → the system runs a **6-stage pipeline**:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  1. Audio   │───▶│ 2. Speech-to │───▶│  3. NLP     │
│     Input   │    │    -Text     │    │   Analysis  │
│  (.wav/.mp3)│    │  (Whisper)   │    │  (spaCy)    │
└─────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                                              ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  6. Web UI  │◀── │ 5. Clinical  │◀── │ 4. Entity   │
│ (Streamlit) │    │   Summary    │    │ Extraction  │
└─────────────┘    └──────────────┘    └─────────────┘
```

**Input:** Consultation audio (or built-in sample transcript)  
**Output:** Structured entities (symptoms, duration, medication, negations) + formatted clinical note

---

## Tech Stack

| Component          | Technology                        |
|--------------------|-----------------------------------|
| Language           | Python 3.10+                      |
| Speech-to-Text     | OpenAI Whisper (local, open-source) |
| NLP                | spaCy (`en_core_web_sm`)          |
| Entity Extraction  | Rule-based + regex                |
| Summary            | Template-based (+ optional Groq LLM) |
| Web UI             | Streamlit                         |
| Version Control    | Git + GitHub                      |

---

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/<your-username>/ai-clinical-scribe.git
cd ai-clinical-scribe
chmod +x setup.sh
./setup.sh
```

### 2. Run Tests

```bash
source venv/bin/activate
pytest tests/ -v
```

### 3. Launch the App

```bash
streamlit run app/streamlit_app.py
```

The dashboard opens at `http://localhost:8501`. Check **"Use sample transcript"** in the sidebar for a quick demo without needing audio.

### 4. (Optional) Create a Sample Audio File

```bash
python -c "
from gtts import gTTS
text = 'Doctor: What seems to be the problem? Patient: I have had fever for three days and dry cough. I took Paracetamol. No vomiting.'
gTTS(text=text, lang='en').save('data/sample_audio/sample_consultation.mp3')
print('Saved to data/sample_audio/sample_consultation.mp3')
"
```

---

## Project Structure

```
ai-clinical-scribe/
├── README.md                  ← You are here
├── requirements.txt           ← Python dependencies
├── .gitignore
├── setup.sh                   ← One-command setup
├── config/
│   └── settings.py            ← Centralized configuration
├── data/
│   └── sample_audio/
│       └── README.md          ← Instructions for sample audio
├── src/
│   ├── __init__.py
│   ├── audio_input.py         ← Stage 1: Audio loading & validation
│   ├── transcription.py       ← Stage 2: Whisper speech-to-text
│   ├── nlp_analysis.py        ← Stage 3: spaCy NLP processing
│   ├── entity_extraction.py   ← Stage 4: Medical entity extraction
│   ├── summary_generator.py   ← Stage 5: Clinical note generation
│   └── utils.py               ← Shared helpers
├── app/
│   └── streamlit_app.py       ← Stage 6: Streamlit dashboard
├── tests/
│   ├── test_transcription.py
│   ├── test_extraction.py
│   └── test_summary.py
├── docs/
│   └── ARCHITECTURE.md        ← Technical architecture documentation
└── notebooks/
    └── pipeline_demo.ipynb    ← Jupyter notebook walking through the pipeline
```

---

## Google Colab

All modules work on Colab. Add this cell at the top of any notebook:

```python
!pip install openai-whisper spacy streamlit pandas gTTS
!python -m spacy download en_core_web_sm
```

Then clone the repo and import modules:

```python
!git clone https://github.com/<your-username>/ai-clinical-scribe.git
import sys; sys.path.insert(0, 'ai-clinical-scribe')
```

## License

This project is developed for academic/research purposes as part of an internship.
