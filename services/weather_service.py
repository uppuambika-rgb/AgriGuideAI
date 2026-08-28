from datetime import datetime, timedelta, timezone
import requests
from pymongo.errors import PyMongoError
from config.config import settings
from database.mongo import mongo
from utils.helpers import utc_now, serialize

LOCATION_ALIASES = {
    "vijaywada": "Vijayawada",
    "vijayawada city": "Vijayawada",
}


def get_weather(location):
    requested_location = location.strip()
    lookup_location = LOCATION_ALIASES.get(requested_location.lower(), requested_location)
    try:
        cache = mongo().weather_cache.find_one({"location": lookup_location}, sort=[("fetched_at", -1)])
        fetched_at = cache.get("fetched_at") if cache else None
        # Older MongoDB documents may contain naive UTC datetimes; normalize them
        # before comparing against the timezone-aware values created by utc_now().
        if isinstance(fetched_at, datetime) and fetched_at.tzinfo is None:
            fetched_at = fetched_at.replace(tzinfo=timezone.utc)
        if cache and isinstance(fetched_at, datetime) and utc_now() - fetched_at < timedelta(minutes=15):
            cache.pop("_id", None)
            cache["source"] = "cache"
            return serialize(cache)
    except PyMongoError:
        cache = None
    try:
        place_response = requests.get("https://geocoding-api.open-meteo.com/v1/search", params={"name": lookup_location, "count": 1, "language": "en", "format": "json"}, timeout=8)
        place_response.raise_for_status()
        places = place_response.json().get("results", [])
        if not places:
            return {"available": False, "location": requested_location, "message": "That location could not be found. Try a nearby city or district."}
        place = places[0]
        weather_response = requests.get("https://api.open-meteo.com/v1/forecast", params={"latitude": place["latitude"], "longitude": place["longitude"], "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m", "hourly": "precipitation_probability", "forecast_days": 1, "timezone": "auto"}, timeout=8)
        weather_response.raise_for_status()
        payload = weather_response.json()
        current = payload.get("current", {})
        weather = {"available": True, "location": requested_location, "resolved_location": ", ".join(filter(None, [place.get("name"), place.get("admin1"), place.get("country")])), "temperature_c": current.get("temperature_2m"), "humidity": current.get("relative_humidity_2m"), "rainfall_mm": current.get("rain"), "precipitation_mm": current.get("precipitation"), "precipitation_probability": (payload.get("hourly", {}).get("precipitation_probability") or [None])[0], "wind_speed_kmh": current.get("wind_speed_10m"), "condition": weather_condition(current.get("weather_code")), "fetched_at": utc_now(), "source": "open_meteo"}
        try:
            mongo().weather_cache.insert_one(weather)
        except PyMongoError:
            pass
        return serialize(weather)
    except requests.RequestException as error:
        return {"available": False, "location": requested_location, "message": "Unable to retrieve weather information right now.", "detail": str(error) if settings.debug else None}


def weather_condition(code):
    conditions = {0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 48: "Foggy", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy rain showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail"}
    return conditions.get(code, "Current conditions available")
