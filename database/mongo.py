from urllib.parse import quote
from datetime import timezone
from flask import current_app
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from config.config import settings


def normalize_mongo_uri(uri):
    """Escape raw credentials while preserving any existing percent escapes."""
    if not uri or "://" not in uri or "@" not in uri:
        return uri
    scheme, remainder = uri.split("://", 1)
    credentials, host = remainder.rsplit("@", 1)
    if ":" not in credentials:
        return uri
    username, password = credentials.split(":", 1)
    return f"{scheme}://{quote(username, safe='%')}:{quote(password, safe='%')}@{host}"


def init_mongo(app):
    if not settings.mongo_uri:
        raise RuntimeError("MONGO_URI is missing from .env")
    client = MongoClient(normalize_mongo_uri(settings.mongo_uri), serverSelectionTimeoutMS=3000, connectTimeoutMS=3000, retryWrites=True, tz_aware=True, tzinfo=timezone.utc)
    database = client[settings.database_name]
    app.extensions["mongo_client"] = client
    app.extensions["mongo"] = database
    try:
        client.admin.command("ping")
        database.users.create_index("username", unique=True)
        database.conversations.create_index([("user_id", 1), ("created_at", -1)])
        database.weather_cache.create_index([("location", 1), ("fetched_at", -1)])
        app.logger.info("Connected to MongoDB database %s", settings.database_name)
    except PyMongoError as error:
        app.logger.warning("MongoDB is not reachable at startup: %s", error)


def close_mongo(_error=None):
    # MongoClient is thread-safe and intended to live for the application lifetime.
    # Closing it per Flask request would make subsequent requests unreliable.
    return None


def mongo():
    return current_app.extensions["mongo"]


def mongo_ping():
    try:
        current_app.extensions["mongo_client"].admin.command("ping")
        return "connected"
    except PyMongoError:
        return "unavailable"
