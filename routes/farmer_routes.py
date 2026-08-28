from flask import Blueprint, jsonify, request
from bson import ObjectId
from database.mongo import mongo
from utils.helpers import json_document, utc_now
from utils.validators import language_or_default, required_json_fields
from utils.auth import current_user, login_required

farmer_bp = Blueprint("farmers", __name__)


@farmer_bp.post("/farmers")
@login_required
def create_farmer():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    missing = required_json_fields(data, ["name"])
    if missing:
        return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}"}), 400
    farmer = {"user_id": str(current_user()["_id"]), "name": str(data["name"]).strip(), "preferred_language": language_or_default(data.get("preferred_language", "en")), "state": str(data.get("state", "")), "district": str(data.get("district", "")), "village": str(data.get("village", "")), "crop": str(data.get("crop", "")), "land_size": data.get("land_size"), "farmer_type": str(data.get("farmer_type", "")), "preferences": data.get("preferences", {}), "created_at": utc_now()}
    result = mongo().farmers.insert_one(farmer)
    farmer["_id"] = result.inserted_id
    return jsonify({"success": True, "farmer": json_document(farmer)}), 201


@farmer_bp.get("/farmers/<farmer_id>")
@login_required
def get_farmer(farmer_id):
    try:
        farmer = mongo().farmers.find_one({"_id": ObjectId(farmer_id), "user_id": str(current_user()["_id"])})
    except Exception:
        farmer = None
    if not farmer:
        return jsonify({"success": False, "error": "Farmer not found"}), 404
    return jsonify({"success": True, "farmer": json_document(farmer)})
