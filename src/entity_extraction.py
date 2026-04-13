import re
from typing import Dict, List
from .nlp_analysis import NLPResult

# Curated lists for keyword matching
SYMPTOMS = [
    "fever", "cough", "headache", "pain", "nausea", "vomiting", "diarrhea",
    "fatigue", "weakness", "dizziness", "shortness of breath", "chest pain",
    "sore throat", "runny nose", "congestion", "rash", "itching"
]

MEDICATIONS = [
    "paracetamol", "aspirin", "ibuprofen", "metformin", "amoxicillin",
    "azithromycin", "prednisone", "omeprazole", "lisinopril", "atorvastatin"
]

def extract_symptoms(text: str, negations: List[str]) -> List[Dict]:
    """Extract symptoms using keyword matching, avoiding negated ones."""
    found_symptoms = []
    text_lower = text.lower()
    
    for symptom in SYMPTOMS:
        if symptom in text_lower:
            # Check if this symptom is in a negation window
            is_negated = any(symptom in neg.lower() for neg in negations)
            if not is_negated:
                found_symptoms.append({
                    "entity": symptom.title(),
                    "confidence": 0.9  # Placeholder confidence
                })
    
    return found_symptoms

def extract_medications(text: str) -> List[str]:
    """Extract medications using keyword matching."""
    found_meds = []
    text_lower = text.lower()
    
    for med in MEDICATIONS:
        if med in text_lower:
            found_meds.append(med.title())
    
    return found_meds

def extract_duration(temporal_phrases: List[str]) -> str:
    """Extract duration from temporal phrases."""
    for phrase in temporal_phrases:
        if "for" in phrase.lower():
            return phrase
        elif "since" in phrase.lower():
            return phrase
    return ""

def extract_observations(text: str) -> List[str]:
    """Extract patient observations using regex patterns."""
    patterns = [
        r"patient reports?\s+(.*?)(?:\.|$)",
        r"I (?:have|feel|am experiencing)\s+(.*?)(?:\.|$)"
    ]
    
    observations = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        observations.extend(matches)
    
    return observations

def extract_negative_findings(text: str, negations: List[str]) -> List[str]:
    """Extract negative findings from negation contexts."""
    negative_findings = []
    for neg in negations:
        # Extract symptoms or findings after negation cues
        words = neg.split()
        for i, word in enumerate(words):
            if word in ["no", "not", "never", "without", "none", "n't"]:
                # Take next few words as the negated finding
                finding = " ".join(words[i:i+4])
                if len(finding) > 3:  # Avoid single words
                    negative_findings.append(finding.title())
                break
    
    return negative_findings

def extract_entities(text: str, nlp_result: NLPResult) -> Dict:
    """Main function to extract all entities from text and NLP analysis."""
    symptoms = extract_symptoms(text, nlp_result.negations)
    medications = extract_medications(text)
    duration = extract_duration(nlp_result.temporal_phrases)
    observations = extract_observations(text)
    negative_findings = extract_negative_findings(text, nlp_result.negations)
    
    return {
        "symptoms": symptoms,
        "duration": duration,
        "medication": medications,
        "observations": observations,
        "negative_findings": negative_findings
    }

if __name__ == "__main__":
    from nlp_analysis import analyze_text
    
    sample_text = "Patient has fever for three days but no cough and not vomiting. Taking paracetamol."
    nlp_result = analyze_text(sample_text)
    entities = extract_entities(sample_text, nlp_result)
    print(entities)