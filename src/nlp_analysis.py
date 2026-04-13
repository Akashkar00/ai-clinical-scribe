import spacy
import re
from dataclasses import dataclass
from typing import List, Dict

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

@dataclass
class NLPResult:
    doc: object  # spaCy Doc object
    negations: List[str]
    temporal_phrases: List[str]

NEGATION_CUES = ["no", "not", "never", "without", "none", "n't", "denies", "denied"]

TEMPORAL_PATTERNS = [
    r"for\s+\d+\s+(day|week|month|year)s?",
    r"since\s+\w+",
    r"\d+\s+(day|week|month|year)s?\s+ago",
    r"last\s+\w+",
    r"past\s+\d+\s+(day|week|month|year)s?"
]

def detect_negations(text: str) -> List[str]:
    """Detect negation cues and capture surrounding context."""
    doc = nlp(text.lower())
    negations = []
    tokens = [token.text for token in doc]
    
    for i, token in enumerate(tokens):
        if token in NEGATION_CUES:
            # Capture 5-token window after negation
            start = max(0, i - 2)
            end = min(len(tokens), i + 6)
            window = " ".join(tokens[start:end])
            negations.append(window)
    
    return negations

def extract_temporal_phrases(text: str) -> List[str]:
    """Extract temporal expressions using regex patterns."""
    temporal_phrases = []
    for pattern in TEMPORAL_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        temporal_phrases.extend(matches)
    
    return list(set(temporal_phrases))  # Remove duplicates

def analyze_text(text: str) -> NLPResult:
    """Run full NLP analysis on the input text."""
    doc = nlp(text)
    negations = detect_negations(text)
    temporal_phrases = extract_temporal_phrases(text)
    
    return NLPResult(
        doc=doc,
        negations=negations,
        temporal_phrases=temporal_phrases
    )

if __name__ == "__main__":
    sample_text = "Patient has fever for three days but no cough and not vomiting."
    result = analyze_text(sample_text)
    print("Negations:", result.negations)
    print("Temporal phrases:", result.temporal_phrases)