from flask import Blueprint, jsonify, request
from database.mongo import mongo
from services.ai_service import generate_advice
from services.weather_service import get_weather
from utils.helpers import serialize, utc_now
from utils.validators import language_or_default, required_json_fields
from utils.auth import current_user, login_required

advice_bp = Blueprint("advice", __name__)


@advice_bp.post("/advice")
@login_required
def advice():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    missing = required_json_fields(data, ["question"])
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}"}), 400
    language = language_or_default(data.get("language", "en"))
    location = str(data.get("location", "")).strip()
    weather = get_weather(location) if location else {"available": False, "message": "Location was not provided."}
    question = str(data["question"]).strip()
    answer = generate_advice(question, str(data.get("crop", "")).strip(), location, language, weather)
    user = current_user()
    conversation = {"user_id": str(user["_id"]), "question": question, "crop": str(data.get("crop", "")).strip(), "location": location, "language": language, "response": answer, "weather": weather, "sources": answer.get("sources", []) if isinstance(answer, dict) else [], "created_at": utc_now()}
    result = mongo().conversations.insert_one(conversation)
    return jsonify({"success": True, "conversation_id": str(result.inserted_id), "answer": answer, "recommendations": answer.get("what_you_can_do", []) if isinstance(answer, dict) else [], "precautions": answer.get("warning_signs", []) if isinstance(answer, dict) else [], "weather": weather, "sources": conversation["sources"], "language": language})


@advice_bp.get("/history")
@login_required
def history():
    try:
        limit = int(request.args.get("limit", 20))
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "limit must be a whole number."}), 400
    limit = max(1, min(limit, 100))
    query = {"user_id": str(current_user()["_id"])}
    records = list(mongo().conversations.find(query).sort("created_at", -1).limit(limit))
    return jsonify({"success": True, "items": serialize(records)})
