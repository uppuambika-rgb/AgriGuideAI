import requests
from config.config import settings
from services.agriculture_service import fallback_advice


SYSTEM_PROMPT = """You are AgriGuide AI, a cautious agricultural assistant for Indian farmers.
Return practical, low-risk guidance in the requested language. Do not claim a diagnosis is certain.
Never recommend pesticide dosage or restricted products. Advise a local agriculture expert for severe,
rapidly spreading, or uncertain problems. Return a JSON object with summary, what_may_be_happening,
what_you_can_do (array), water_advice, weather_considerations, warning_signs (array), next_steps (array), and sources (array)."""


def _extract_answer(payload):
    if isinstance(payload.get("answer"), dict):
        return payload["answer"]
    if isinstance(payload.get("result"), dict):
        return payload["result"]
    choices = payload.get("choices") or []
    content = choices[0].get("message", {}).get("content") if choices else None
    if isinstance(content, list):
        content = "".join(part.get("text", "") for part in content if isinstance(part, dict))
    if isinstance(content, str):
        try:
            import json
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                return parsed
        except ValueError:
            return {"summary": content, "what_you_can_do": [], "warning_signs": [], "next_steps": [], "sources": []}
    return None


def generate_advice(question, crop, location, language, weather=None, image_data_url=None):
    if not settings.ai_api_url or not settings.ai_api_key:
        return fallback_advice(question, crop, weather)
    context = {"question": question, "crop": crop, "location": location, "language": language, "weather": weather}
    content = [{"type": "text", "text": f"Farmer context: {context}"}]
    if image_data_url:
        content.append({"type": "image_url", "image_url": {"url": image_data_url}})
    model = settings.ai_vision_model if image_data_url and settings.ai_vision_model else settings.ai_model
    try:
        response = requests.post(
            settings.ai_api_url,
            json={"model": model, "messages": [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": content}], "temperature": 0.2, "response_format": {"type": "json_object"}},
            headers={"Authorization": f"Bearer {settings.ai_api_key}", "Content-Type": "application/json"},
            timeout=30,
        )
        response.raise_for_status()
        return _extract_answer(response.json()) or fallback_advice(question, crop, weather)
    except (requests.RequestException, ValueError):
        return fallback_advice(question, crop, weather)
