from config.config import settings


def transcribe_audio(file_storage, language):
    if not settings.speech_api_key:
        return {"text": "", "message": "Speech-to-text is not configured. Add SPEECH_API_KEY and provider settings."}
    return {"text": "", "message": "Connect your selected speech provider in services/speech_service.py.", "language": language}


def synthesize_speech(text, language):
    if not settings.speech_api_key:
        return {"audio_url": None, "message": "Text-to-speech is not configured. Add SPEECH_API_KEY and provider settings.", "language": language}
    return {"audio_url": None, "message": "Connect your selected speech provider in services/speech_service.py.", "language": language}
