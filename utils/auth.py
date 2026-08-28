from functools import wraps

from bson import ObjectId
from flask import g, jsonify, session

from database.mongo import mongo


def current_user():
    if hasattr(g, "current_user"):
        return g.current_user
    user_id = session.get("user_id")
    if not user_id:
        g.current_user = None
        return None
    try:
        g.current_user = mongo().users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        g.current_user = None
    return g.current_user


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user():
            return jsonify({"success": False, "error": "Authentication is required."}), 401
        return view(*args, **kwargs)
    return wrapped


def public_user(user):
    return {"id": str(user["_id"]), "username": user["username"], "phone": user.get("phone", "")}
