from flask import Blueprint, jsonify, request
from services.weather_service import get_weather

weather_bp = Blueprint("weather", __name__)


@weather_bp.get("/weather")
def weather():
    location = request.args.get("location", "").strip()
    if not location:
        return jsonify({"success": False, "error": "location is required"}), 400
    result = get_weather(location)
    status = 200 if result.get("available") else 503
    return jsonify({"success": result.get("available", False), "weather": result}), status
