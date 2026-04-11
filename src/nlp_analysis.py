"""
Stage 3 — NLP Analysis

Runs spaCy pipeline (tokenize, POS, dependency parse, NER) then applies:
  - Negation window detection
  - Temporal phrase extraction

Output: NLPResult dataclass
"""

import re
from dataclasses import dataclass, field

import spacy

from settings import NEGATION_CUES, NEGATION_WINDOW, TEMPORAL_PATTERNS

_nlp = spacy.load("en_core_web_sm")


@dataclass
class NLPResult:
    text: str
    tokens: list[str]
    sentences: list[str]
    ner_entities: list[dict]           # [{"text": ..., "label": ...}]
    negated_spans: list[str]           # tokens captured in negation windows
    temporal_phrases: list[str]        # matched temporal strings
    pos_tags: list[dict]               # [{"token": ..., "pos": ..., "dep": ...}]


def _detect_negations(doc) -> list[str]:
    """
    Scan for negation cue tokens and collect the next NEGATION_WINDOW tokens.
    Returns list of negated text spans.
    """
    negated = []
    tokens = list(doc)
    cues_lower = [c.lower() for c in NEGATION_CUES]

    i = 0
    while i < len(tokens):
        tok = tokens[i]
        # Handle multi-word cues ("negative for", "absence of")
        matched_cue = None
        for cue in NEGATION_CUES:
            cue_tokens = cue.split()
            window_text = " ".join(
                t.text.lower() for t in tokens[i: i + len(cue_tokens)]
            )
            if window_text == cue:
                matched_cue = cue
                skip = len(cue_tokens)
                break

        if matched_cue:
            start = i + skip
            span_tokens = tokens[start: start + NEGATION_WINDOW]
            span = " ".join(t.text for t in span_tokens).strip()
            if span:
                negated.append(span)
            i += skip
        elif tok.text.lower() in cues_lower:
            span_tokens = tokens[i + 1: i + 1 + NEGATION_WINDOW]
            span = " ".join(t.text for t in span_tokens).strip()
            if span:
                negated.append(span)
        i += 1

    return negated


def _extract_temporal_phrases(text: str) -> list[str]:
    """Apply all temporal regex patterns and return unique matches."""
    found = []
    for pattern in TEMPORAL_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found.extend(matches)
    # deduplicate while preserving order
    seen = set()
    unique = []
    for m in found:
        m_stripped = m.strip()
        if m_stripped.lower() not in seen:
            seen.add(m_stripped.lower())
            unique.append(m_stripped)
    return unique


def run_nlp(text: str) -> NLPResult:
    """
    Run the full spaCy pipeline + custom negation and temporal extraction.
    Returns an NLPResult dataclass.
    """
    doc = _nlp(text)

    tokens = [tok.text for tok in doc]

    sentences = [sent.text.strip() for sent in doc.sents]

    ner_entities = [
        {"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char}
        for ent in doc.ents
    ]

    pos_tags = [
        {"token": tok.text, "pos": tok.pos_, "dep": tok.dep_, "head": tok.head.text}
        for tok in doc
        if tok.pos_ not in ("PUNCT", "SPACE")
    ]

    negated_spans = _detect_negations(doc)
    temporal_phrases = _extract_temporal_phrases(text)

    return NLPResult(
        text=text,
        tokens=tokens,
        sentences=sentences,
        ner_entities=ner_entities,
        negated_spans=negated_spans,
        temporal_phrases=temporal_phrases,
        pos_tags=pos_tags,
    )
