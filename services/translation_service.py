SUPPORTED_LANGUAGES = {"en": "English", "te": "Telugu", "hi": "Hindi", "ta": "Tamil", "kn": "Kannada", "ml": "Malayalam", "mr": "Marathi", "bn": "Bengali"}


def translate(text, source_language, target_language):
    if source_language == target_language:
        return text
    return text
