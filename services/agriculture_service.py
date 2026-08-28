import re

INTENT_PATTERNS = {
    "weather": r"rain|weather|temperature|forecast|humidity|बारिश|मौसम",
    "disease": r"disease|spot|yellow|wilt|rot|fungus|leaf|रोग|पत्ती",
    "pest": r"pest|insect|bug|aphid|worm|कीट|कीड़ा",
    "irrigation": r"water|irrigat|drain|moisture|पानी|सिंचाई",
    "government_scheme": r"scheme|subsidy|government|benefit|योजना|सब्सिडी",
    "market": r"market|price|sell|mandi|बाजार|कीमत",
    "crop_planning": r"plant|seed|sow|crop|season|grow|फसल|बीज|बोना",
    "resources": r"seed|fertilizer|expert|shop|resource|बीज|खाद",
}


def classify_intent(question):
    text = question.lower()
    for intent, pattern in INTENT_PATTERNS.items():
        if re.search(pattern, text):
            return intent
    return "general"


def fallback_advice(question, crop=None, weather=None):
    intent = classify_intent(question)
    weather_note = ""
    if weather and weather.get("condition"):
        weather_note = f" Current weather context: {weather['condition']}, {weather.get('temperature_c', 'unknown')}°C."
    return {
        "summary": "This is a preliminary farming suggestion, not a guaranteed diagnosis.",
        "what_may_be_happening": f"Your question appears related to {intent.replace('_', ' ')}.{weather_note}",
        "what_you_can_do": [
            "Share the crop age, recent weather, and what you observed for more specific guidance.",
            "Start with a small area and observe the result before applying a change across the field.",
        ],
        "water_advice": "Check soil moisture near the root zone before irrigating.",
        "weather_considerations": "Use the retrieved forecast to time irrigation and field work.",
        "warning_signs": ["Rapid spread, severe wilting, or crop loss should be checked by a local agriculture expert."],
        "next_steps": ["Take a clear photo if the issue is visual.", "Record the crop, location, and timing of the symptom."],
        "intent": intent,
        "crop": crop,
    }
