from werkzeug.utils import secure_filename

SUPPORTED_LANGUAGES = {"en", "te", "hi", "ta", "kn", "ml", "mr", "bn"}
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_AUDIO_EXTENSIONS = {"wav", "mp3", "m4a", "webm", "ogg"}


def language_or_default(language):
    return language if isinstance(language, str) and language in SUPPORTED_LANGUAGES else "en"


def required_json_fields(data, fields):
    missing = [field for field in fields if not str(data.get(field, "")).strip()]
    return missing


def valid_upload(file, allowed_extensions):
    if not file or not file.filename:
        return False
    filename = secure_filename(file.filename)
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return extension in allowed_extensions and bool(filename)
