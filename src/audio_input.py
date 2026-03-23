import os
from gtts import gTTS

SUPPORTED_FORMATS = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".mp4"]

def validate_audio(file_path: str) -> bool:
    """Check if file exists and is a supported audio format."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")
    
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported format '{ext}'. Supported: {SUPPORTED_FORMATS}")
    
    print(f"✅ Audio file validated: {file_path}")
    return True


def create_sample_audio(text: str, output_path: str = "data/sample_audio.mp3") -> str:
    """Generate a sample MP3 audio file using gTTS for testing."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    tts = gTTS(text=text, lang="en")
    tts.save(output_path)
    print(f"🎙️ Sample audio created at: {output_path}")
    return output_path

def load_audio(file_path: str) -> str:
    """Load any external audio file after validating it."""
    validate_audio(file_path)
    print(f"📂 Audio loaded from: {file_path}")
    return file_path


if __name__ == "__main__":
    sample_text = (
        "Patient is a 45 year old male presenting with chest pain, "
        "shortness of breath, and mild fever since two days. "
        "Currently on aspirin and metformin."
    )
    path = create_sample_audio(sample_text)
    validate_audio(path)