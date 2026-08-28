from flask import Blueprint, jsonify, request
from database.mongo import mongo
from utils.helpers import utc_now
from utils.auth import current_user, login_required

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.post("/feedback")
@login_required
def feedback():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    if data.get("helpful") not in (True, False):
        return jsonify({"success": False, "error": "helpful must be true or false"}), 400
    result = mongo().feedback.insert_one({"user_id": str(current_user()["_id"]), "conversation_id": data.get("conversation_id"), "helpful": data["helpful"], "text": str(data.get("text", ""))[:2000], "created_at": utc_now()})
    return jsonify({"success": True, "feedback_id": str(result.inserted_id)}), 201
