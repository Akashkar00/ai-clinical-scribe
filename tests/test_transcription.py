import pytest
import os
from src.audio_input import validate_audio, create_sample_audio
from src.transcription import transcribe_audio

def test_sample_audio_created():
    path = create_sample_audio("Test audio for unit testing.", "data/test_sample.mp3")
    assert os.path.exists(path)

def test_validate_audio_valid():
    path = create_sample_audio("Valid audio test.", "data/valid_test.mp3")
    assert validate_audio(path) == True

def test_validate_audio_missing_file():
    with pytest.raises(FileNotFoundError):
        validate_audio("nonexistent_file.mp3")

def test_validate_audio_bad_format():
    # Create a fake .xyz file
    with open("data/fake.xyz", "w") as f:
        f.write("not audio")
    with pytest.raises(ValueError):
        validate_audio("data/fake.xyz")

def test_transcription_returns_text():
    path = create_sample_audio("Patient has a fever and headache.", "data/transcribe_test.mp3")
    result = transcribe_audio(path)
    assert "text" in result
    assert len(result["text"]) > 0