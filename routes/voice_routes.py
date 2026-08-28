from flask import Blueprint, jsonify, request
from services.speech_service import synthesize_speech, transcribe_audio
from utils.validators import ALLOWED_AUDIO_EXTENSIONS, language_or_default, valid_upload

voice_bp = Blueprint("voice", __name__)


@voice_bp.post("/voice/transcribe")
def transcribe():
    audio = request.files.get("audio")
    if not valid_upload(audio, ALLOWED_AUDIO_EXTENSIONS):
        return jsonify({"success": False, "error": "A supported audio file is required."}), 400
    language = language_or_default(request.form.get("language", "en"))
    result = transcribe_audio(audio, language)
    return jsonify({"success": True, **result, "language": language})


@voice_bp.post("/voice/speak")
def speak():
    data = request.get_json(silent=True) or {}
    if not str(data.get("text", "")).strip():
        return jsonify({"success": False, "error": "text is required"}), 400
    language = language_or_default(data.get("language", "en"))
    return jsonify({"success": True, **synthesize_speech(data["text"], language), "language": language})
