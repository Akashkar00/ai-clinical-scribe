import os
from typing import Dict
from groq import Groq

# Template for clinical summary
CLINICAL_TEMPLATE = """
**CLINICAL SUMMARY**

**CHIEF COMPLAINT:**
{symptoms}

**HISTORY OF PRESENT ILLNESS (HPI):**
{patient_info}

**CURRENT MEDICATIONS:**
{medications}

**REVIEW OF SYSTEMS:**
{ros}

**PHYSICAL EXAMINATION:**
{vitals_assessment}

**ASSESSMENT & PLAN:**
{assessment_plan}
"""

def generate_template_summary(entities: Dict, transcript: str = "") -> str:
    """Generate summary using template filling with better formatting."""

    # Extract symptoms with confidence
    symptoms_list = entities.get("symptoms", [])
    if symptoms_list:
        symptoms = ", ".join([f"{s['entity']} (confidence: {int(s['confidence'] * 100)}%)" for s in symptoms_list])
    else:
        symptoms = "Not specified"

    # Build patient information
    observations = entities.get("observations", [])
    duration = entities.get("duration", "").strip()
    patient_info_parts = []

    if observations:
        patient_info_parts.append("; ".join(observations))
    else:
        patient_info_parts.append("Patient reports symptoms consistent with chief complaint")

    if duration and duration != "":
        patient_info_parts.append(f"Duration: {duration}")
    else:
        patient_info_parts.append("Duration not specified")

    patient_info = " ".join(patient_info_parts)

    # Medications
    medications_list = entities.get("medication", [])
    if medications_list:
        medications = "\n".join(f"• {med}" for med in medications_list)
    else:
        medications = "• None reported"

    # Review of systems (negative findings)
    negative_findings = entities.get("negative_findings", [])
    if negative_findings:
        ros = "NEGATIVE:\n" + "\n".join(f"• {finding}" for finding in negative_findings)
    else:
        ros = "No significant negative findings reported"

    # Vitals/Assessment
    vitals_assessment = "Vital signs: Not obtained during this consultation\nGeneral: Patient appears stated age\nHEENT: Normocephalic, atraumatic\nCV: Regular rate and rhythm\nResp: No acute distress\nAbd: Soft, non-tender\nExt: No edema"

    # Assessment and Plan
    assessment_plan = f"""**Assessment:**
Patient presents with {symptoms.lower() if symptoms != 'Not specified' else 'reported symptoms'}. Clinical presentation suggests {'viral illness' if 'fever' in symptoms.lower() or 'cough' in symptoms.lower() else 'acute illness requiring further evaluation'}.

**Plan:**
1. Symptomatic treatment as indicated
2. {'Monitor temperature and hydration status' if 'fever' in symptoms.lower() else 'Supportive care'}
3. Return precautions: {'Worsening symptoms, persistent fever >101.5°F, shortness of breath, chest pain' if 'fever' in symptoms.lower() else 'Worsening or persistent symptoms'}
4. Follow-up in {'2-3 days' if duration and 'days' in duration else '3-5 days'} or sooner if symptoms worsen"""

    return CLINICAL_TEMPLATE.format(
        symptoms=symptoms,
        patient_info=patient_info,
        medications=medications,
        ros=ros,
        vitals_assessment=vitals_assessment,
        assessment_plan=assessment_plan
    ).strip()

def generate_llm_summary(entities: Dict, transcript: str) -> str:
    """Generate enhanced summary using Groq LLM."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return generate_template_summary(entities, transcript)

    try:
        client = Groq(api_key=api_key)

        prompt = f"""
        Based on the following clinical consultation transcript and extracted entities,
        generate a structured SOAP note (Subjective, Objective, Assessment, Plan) in a professional medical format.

        Transcript: {transcript}

        Extracted Entities: {entities}

        Format the output as a complete clinical note with proper medical terminology and structure.
        Include chief complaint, HPI, medications, review of systems, physical exam, assessment, and plan.
        """

        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            max_tokens=800
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"LLM summary failed: {e}")
        return generate_template_summary(entities, transcript)

def generate_summary(entities: Dict, transcript: str = "", use_llm: bool = False) -> str:
    """Main function to generate clinical summary."""
    if use_llm:
        return generate_llm_summary(entities, transcript)
    else:
        return generate_template_summary(entities, transcript)

if __name__ == "__main__":
    sample_entities = {
        "symptoms": [{"entity": "Fever", "confidence": 0.95}],
        "duration": "three days",
        "medication": ["Paracetamol"],
        "observations": ["I feel very weak"],
        "negative_findings": ["No vomiting"]
    }
    
    summary = generate_summary(sample_entities)
    print(summary)