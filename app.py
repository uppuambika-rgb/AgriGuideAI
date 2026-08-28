from flask import Flask, abort, jsonify, render_template, send_from_directory
from werkzeug.exceptions import HTTPException
from pymongo.errors import PyMongoError
from flask_cors import CORS
from config.config import settings
from database.mongo import close_mongo, init_mongo, mongo_ping
from routes.advice_routes import advice_bp
from routes.farmer_routes import farmer_bp
from routes.feedback_routes import feedback_bp
from routes.image_routes import image_bp
from routes.scheme_routes import scheme_bp
from routes.voice_routes import voice_bp
from routes.weather_routes import weather_bp
from routes.auth_routes import auth_bp


def create_app():
    app = Flask(__name__, template_folder="templates", static_folder=None)
    app.config.update(
        SECRET_KEY=settings.secret_key,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=settings.session_cookie_secure,
    )
    app.config["MAX_CONTENT_LENGTH"] = settings.max_upload_bytes
    CORS(app, resources={r"/api/*": {"origins": settings.allowed_origins}}, supports_credentials=True)

    init_mongo(app)
    app.register_blueprint(advice_bp, url_prefix="/api")
    app.register_blueprint(farmer_bp, url_prefix="/api")
    app.register_blueprint(feedback_bp, url_prefix="/api")
    app.register_blueprint(image_bp, url_prefix="/api")
    app.register_blueprint(scheme_bp, url_prefix="/api")
    app.register_blueprint(voice_bp, url_prefix="/api")
    app.register_blueprint(weather_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")

    @app.get("/")
    def home():
        return render_template("index.html")

    @app.get("/<path:asset>")
    def frontend_asset(asset):
        allowed_assets = {"styles.css", "script.js", "sample-crop.svg", "sample-pest.svg", "sample-soil.svg", "sample-tomato.svg"}
        if asset not in allowed_assets:
            abort(404)
        return send_from_directory("templates", asset)

    @app.get("/api/health")
    def health():
        mongo_status = mongo_ping()
        return jsonify({"success": True, "ready": mongo_status == "connected", "service": "AgriGuide AI", "database": mongo_status}), 200

    @app.errorhandler(413)
    def payload_too_large(_error):
        return jsonify({"success": False, "error": "Uploaded file is too large.", "message": "Please choose a smaller file."}), 413

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"success": False, "error": "Route not found."}), 404

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        if isinstance(error, HTTPException):
            return error
        if isinstance(error, PyMongoError):
            app.logger.warning("MongoDB request failure: %s", error)
            return jsonify({"success": False, "error": "Database is temporarily unavailable."}), 503
        app.logger.exception("Unhandled backend error: %s", error)
        return jsonify({"success": False, "error": "The server could not complete that request.", "message": "Please try again later."}), 500

    app.teardown_appcontext(close_mongo)
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host=settings.host, port=settings.port, debug=settings.debug)
