"""
Full pipeline runner: audio → transcription → NLP → entity extraction → summary
Usage:
    python pipeline.py /path/to/audio.m4a
"""

import json
import os
import sys

from transcription import transcribe_audio, save_transcription
from nlp_analysis import run_nlp
from entity_extraction import extract_entities
from summary_generator import generate_summary

NLP_OUTPUT_PATH    = "data/nlp_output.json"
SUMMARY_OUTPUT_PATH = "data/clinical_summary.txt"


def save_entities(entities: dict, path: str = NLP_OUTPUT_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(entities, f, indent=2)
    print(f"💾 Entity output saved to: {path}")


def save_summary(summary: str, path: str = SUMMARY_OUTPUT_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(summary)
    print(f"💾 Clinical summary saved to: {path}")


def run_pipeline(audio_path: str):
    # Stage 1: Transcription
    print("\n── Stage 1: Transcription ──")
    transcription = transcribe_audio(audio_path)
    save_transcription(transcription)
    text = transcription["text"]
    print(f"📝 Text: {text}\n")

    # Stage 2: NLP Analysis
    print("── Stage 2: NLP Analysis ──")
    nlp_result = run_nlp(text)
    print(f"  Sentences  : {nlp_result.sentences}")
    print(f"  NER        : {nlp_result.ner_entities}")
    print(f"  Negations  : {nlp_result.negated_spans}")
    print(f"  Temporal   : {nlp_result.temporal_phrases}\n")

    # Stage 3: Entity Extraction
    print("── Stage 3: Entity Extraction ──")
    entities = extract_entities(nlp_result)
    print(json.dumps(entities, indent=2))
    save_entities(entities)

    # Stage 4: Clinical Summary
    print("\n── Stage 4: Clinical Summary ──")
    summary = generate_summary(entities)
    print(summary)
    save_summary(summary)

    return entities, summary


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pipeline.py /path/to/audio.m4a")
        sys.exit(1)

    run_pipeline(sys.argv[1])
