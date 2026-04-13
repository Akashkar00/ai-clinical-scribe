from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our pipeline modules
from src.audio_input import validate_audio, create_sample_audio
from src.transcription import transcribe_audio
from src.nlp_analysis import analyze_text
from src.entity_extraction import extract_entities
from src.summary_generator import generate_summary

app = FastAPI(title="AI Clinical Scribe API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessingRequest(BaseModel):
    use_sample: bool = False
    use_llm: bool = False
    sample_text: Optional[str] = None

class ProcessingResponse(BaseModel):
    transcript: str
    entities: Dict
    summary: str
    negations: List[str]
    temporal_phrases: List[str]

@app.post("/process", response_model=ProcessingResponse)
async def process_audio(
    use_sample: bool = Form(False),
    use_llm: bool = Form(False),
    sample_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Process audio file or use sample data."""
    
    try:
        if use_sample:
            # Use sample audio
            if sample_text:
                audio_path = create_sample_audio(sample_text)
            else:
                # Default sample
                sample_text = (
                    "Doctor: What seems to be the problem? "
                    "Patient: I have had fever for three days and dry cough. "
                    "I took Paracetamol. No vomiting."
                )
                audio_path = create_sample_audio(sample_text)
        else:
            # Process uploaded file
            if not file:
                raise HTTPException(status_code=400, detail="No file uploaded")
            
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
                shutil.copyfileobj(file.file, temp_file)
                audio_path = temp_file.name
        
        # Run the pipeline
        transcription_result = transcribe_audio(audio_path)
        transcript = transcription_result["text"]
        
        nlp_result = analyze_text(transcript)
        entities = extract_entities(transcript, nlp_result)
        summary = generate_summary(entities, transcript, use_llm)
        
        # Clean up temp file if created
        if not use_sample and file:
            os.unlink(audio_path)
        
        return ProcessingResponse(
            transcript=transcript,
            entities=entities,
            summary=summary,
            negations=nlp_result.negations,
            temporal_phrases=nlp_result.temporal_phrases
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)