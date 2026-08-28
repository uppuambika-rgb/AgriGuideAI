from flask import Blueprint, jsonify, request, session
from pymongo.errors import DuplicateKeyError
from werkzeug.security import check_password_hash, generate_password_hash

from database.mongo import mongo
from utils.auth import current_user, public_user
from utils.helpers import utc_now

auth_bp = Blueprint("auth", __name__)


def _json_object():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


@auth_bp.post("/auth/register")
def register():
    data = _json_object()
    if not data:
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    phone = str(data.get("phone", "")).strip()
    if len(username) < 3 or len(username) > 64 or len(password) < 8 or len(password) > 256 or not phone:
        return jsonify({"success": False, "error": "Use a 3-64 character username, an 8+ character password, and a phone number."}), 400
    try:
        result = mongo().users.insert_one({"username": username, "phone": phone, "password_hash": generate_password_hash(password), "created_at": utc_now()})
    except DuplicateKeyError:
        return jsonify({"success": False, "error": "That username is already in use."}), 409
    user = {"_id": result.inserted_id, "username": username, "phone": phone}
    session.clear()
    session["user_id"] = str(result.inserted_id)
    return jsonify({"success": True, "user": public_user(user)}), 201


@auth_bp.post("/auth/login")
def login():
    data = _json_object()
    if not data:
        return jsonify({"success": False, "error": "A JSON object is required."}), 400
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    user = mongo().users.find_one({"username": username})
    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"success": False, "error": "Invalid username or password."}), 401
    session.clear()
    session["user_id"] = str(user["_id"])
    return jsonify({"success": True, "user": public_user(user)})


@auth_bp.post("/auth/logout")
def logout():
    session.clear()
    return jsonify({"success": True})


@auth_bp.get("/auth/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "Authentication is required."}), 401
    return jsonify({"success": True, "user": public_user(user)})
