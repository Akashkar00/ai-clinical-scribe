import whisper
import os
import json
from audio_input import validate_audio

# Load the Whisper model once (use "base" for speed, "medium" for accuracy)
MODEL_SIZE = "base"
model = None

def save_transcription(result: dict, output_path: str = "data/transcription_output.json"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"💾 Transcription saved to: {output_path}")

def load_model():
    """Load Whisper model into memory."""
    global model
    if model is None:
        print(f"⏳ Loading Whisper model: {MODEL_SIZE}")
        model = whisper.load_model(MODEL_SIZE)
        print("✅ Whisper model loaded.")
    return model


def transcribe_audio(file_path: str) -> dict:
    """Validate and transcribe an audio file. Returns dict with text + segments."""
    validate_audio(file_path)
    m = load_model()
    print(f"🎧 Transcribing: {file_path}")
    result = m.transcribe(file_path)
    print("✅ Transcription complete.")
    return {
        "text": result["text"].strip(),
        "segments": result.get("segments", []),
        "language": result.get("language", "en")
    }


if __name__ == "__main__":
    import sys

    # If user provides a file path as argument, use that
    # Otherwise fall back to sample audio
    if len(sys.argv) > 1:
        audio_path = sys.argv[1]
        print(f"🎤 Using provided audio: {audio_path}")
    else:
        from audio_input import create_sample_audio
        sample_text = (
            "Patient is a 45 year old male presenting with chest pain, "
            "shortness of breath, and mild fever since two days. "
            "Currently on aspirin and metformin."
        )
        audio_path = create_sample_audio(sample_text)

    result = transcribe_audio(audio_path)
    print("\n📝 Transcription Output:")
    print(result["text"])
    save_transcription(result)

