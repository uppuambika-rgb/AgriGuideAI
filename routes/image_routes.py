from flask import Blueprint, jsonify, request
from database.mongo import mongo
from services.image_service import inspect_image
from utils.helpers import serialize, utc_now
from utils.validators import ALLOWED_IMAGE_EXTENSIONS, language_or_default, valid_upload
from utils.auth import current_user, login_required

image_bp = Blueprint("image", __name__)


@image_bp.post("/image/analyze")
@login_required
def analyze_image():
    image = request.files.get("image")
    if not valid_upload(image, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({"success": False, "error": "A JPG, PNG, or WEBP image is required."}), 400
    language = language_or_default(request.form.get("language", "en"))
    try:
        result = inspect_image(image, request.form.get("question", ""), request.form.get("crop", ""), request.form.get("location", ""), language)
    except Exception:
        return jsonify({"success": False, "error": "The image could not be processed.", "message": "Please use a clear JPG, PNG, or WEBP image."}), 400
    metadata = {"user_id": str(current_user()["_id"]), "crop": request.form.get("crop", ""), "location": request.form.get("location", ""), "language": language, "question": request.form.get("question", ""), "result": result, "created_at": utc_now()}
    saved = mongo().image_analysis.insert_one(metadata)
    return jsonify({"success": True, "analysis_id": str(saved.inserted_id), **serialize(result), "language": language})
