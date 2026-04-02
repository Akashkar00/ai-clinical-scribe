"""
Configuration constants for the NLP pipeline.
"""

# --- Negation cues ---
NEGATION_CUES = [
    "no", "not", "without", "denies", "denied", "never", "cannot",
    "can't", "isn't", "wasn't", "doesn't", "don't", "didn't",
    "none", "neither", "nor", "negative for", "absence of"
]

# Number of tokens after a negation cue to flag as negated
NEGATION_WINDOW = 5

# --- Temporal regex patterns ---
TEMPORAL_PATTERNS = [
    r"\bfor\s+\d+\s+(?:day|days|week|weeks|month|months|year|years)\b",
    r"\bsince\s+(?:yesterday|last\s+\w+|\w+day|\d+\s+\w+)\b",
    r"\b\d+\s+(?:day|days|week|weeks|month|months|year|years)\s+ago\b",
    r"\b(?:two|three|four|five|six|seven|eight|nine|ten)\s+(?:day|days|week|weeks|month|months)\b",
    r"\bthis\s+(?:morning|afternoon|evening|week|month)\b",
    r"\byesterday\b",
    r"\blast\s+(?:night|week|month|year)\b",
]

# --- Symptom keyword list ---
SYMPTOM_KEYWORDS = [
    "fever", "cough", "pain", "breathe", "breathing", "shortness of breath",
    "nausea", "vomiting", "headache", "dizziness", "fatigue", "chills",
    "sweating", "rash", "swelling", "diarrhea", "constipation", "chest pain",
    "sore throat", "runny nose", "congestion", "loss of appetite", "weight loss",
    "weakness", "palpitations", "blurred vision", "numbness", "tingling",
    "abdominal pain", "back pain", "joint pain", "muscle pain", "insomnia",
    "anxiety", "depression", "confusion", "seizure", "fainting", "wheezing",
    "erectile dysfunction", "not feeling well", "feeling unwell",
    "arthritis", "rheumatoid arthritis", "knee pain", "knee pains",
    "elbow pain", "elbow pains", "shoulder pain", "hip pain",
    "stiffness", "inflammation", "swollen joints", "limited mobility",
]

# --- Medication keywords (keyword + regex fallback) ---
MEDICATION_KEYWORDS = [
    "aspirin", "ibuprofen", "paracetamol", "acetaminophen", "metformin",
    "lisinopril", "atorvastatin", "amoxicillin", "azithromycin", "prednisone",
    "omeprazole", "cetirizine", "loratadine", "salbutamol", "insulin",
]

# Regex: catches "Xmg", "X mg", "X tablet", patterns like "500mg aspirin"
MEDICATION_REGEX = r"\b(?:[A-Z][a-z]+(?:in|ol|am|il|ex|one|ate|ide))\b"

# --- Observation trigger phrases ---
OBSERVATION_PATTERNS = [
    r"patient (?:reports?|states?|complains?|mentions?|says?)\s+(.+?)[\.\,]",
    r"(?:I am|I'm|I have been|I've been)\s+(.+?)[\.\,]",
    r"(?:presenting with|presents with)\s+(.+?)[\.\,]",
]

# --- Severity modifiers ---
SEVERITY_KEYWORDS = {
    "severe": "severe",
    "mild": "mild",
    "moderate": "moderate",
    "extreme": "extreme",
    "slight": "slight",
    "chronic": "chronic",
    "acute": "acute",
    "persistent": "persistent",
    "occasional": "occasional",
    "intermittent": "intermittent",
    "worsening": "worsening",
    "improving": "improving",
    "major": "severe",
    "minor": "mild",
    "significant": "severe",
    "terrible": "severe",
    "unbearable": "severe",
}
