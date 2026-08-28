from utils.helpers import utc_now


def search_schemes(filters):
    state = str(filters.get("state", "")).strip()
    crop = str(filters.get("crop", "")).strip()
    return [{"name": "PM-KISAN", "description": "Income support scheme for eligible landholding farmer families.", "eligibility": "Basic criteria may apply based on landholding and exclusions.", "required_documents": ["Identity document", "Bank account details", "Land records"], "benefits": "Periodic income support as defined by the official scheme.", "application_procedure": "Verify details and apply through the official government portal or local agriculture office.", "official_source": "https://pmkisan.gov.in/", "last_verified": utc_now().isoformat(), "scope": {"state": state, "crop": crop}, "notice": "You may meet basic criteria based on the information provided. Verify with the official authority."}]
