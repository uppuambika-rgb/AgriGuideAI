from flask import Blueprint, jsonify, request
from database.mongo import mongo
from services.scheme_service import search_schemes
from utils.helpers import serialize, utc_now
from utils.validators import language_or_default
from utils.auth import current_user, login_required

scheme_bp = Blueprint("schemes", __name__)


@scheme_bp.post("/schemes/search")
def search():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    data["language"] = language_or_default(data.get("language", "en"))
    schemes = search_schemes(data)
    mongo().schemes.insert_one({"user_id": str(current_user()["_id"]) if current_user() else None, "filters": data, "results": schemes, "created_at": utc_now()})
    return jsonify({"success": True, "schemes": schemes, "language": data["language"]})


@scheme_bp.get("/schemes")
@login_required
def schemes():
    records = list(mongo().schemes.find({"user_id": str(current_user()["_id"])}).sort("created_at", -1).limit(20))
    return jsonify({"success": True, "items": serialize(records)})
