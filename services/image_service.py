from services.ai_service import generate_advice
import requests
from config.config import settings


IMAGE_SIGNATURES = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",
}


def caption_image(raw, mime_type):
    """Return a BLIP caption, or None if Hugging Face is not available."""
    if not settings.hf_api_key:
        return None
    endpoint = f"{settings.hf_image_api_url.rstrip('/')}/{settings.hf_image_model}"
    try:
        response = requests.post(endpoint, data=raw, headers={"Authorization": f"Bearer {settings.hf_api_key}", "Content-Type": mime_type}, timeout=45)
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, list) and payload and isinstance(payload[0], dict):
            return str(payload[0].get("generated_text", "")).strip() or None
        if isinstance(payload, dict):
            return str(payload.get("generated_text", "")).strip() or None
    except (requests.RequestException, ValueError):
        return None
    return None


def inspect_image(file_storage, question, crop, location, language):
    raw = file_storage.read()
    image_type = next((name for signature, name in IMAGE_SIGNATURES.items() if raw.startswith(signature)), None)
    if not raw or not image_type or (image_type == "webp" and raw[8:12] != b"WEBP"):
        raise ValueError("Unsupported or invalid image data")
    mime_type = "image/jpeg" if image_type == "jpeg" else f"image/{image_type}"
    caption = caption_image(raw, mime_type)
    image_context = f"Image caption from BLIP: {caption}. " if caption else ""
    advice = generate_advice(f"{image_context}{question or 'What should I check in this crop image?'}", crop, location, language)
    observations = [f"BLIP caption: {caption}"] if caption else ["The image passed file validation, but image captioning is unavailable until HF_API_KEY is configured."]
    return {"observations": observations, "analysis": advice, "warning": "BLIP captions describe visual content; they are not a crop disease diagnosis. Confirm serious issues with a local agriculture expert."}
