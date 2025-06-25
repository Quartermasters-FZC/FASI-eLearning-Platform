from typing import Any, Dict, Optional

FSI_LANGUAGES: Dict[str, Dict[str, Any]] = {
    "en": {"name": "English", "native_name": "English"},
    "es": {"name": "Spanish", "native_name": "Español"},
}


def get_language_config(code: str) -> Optional[Dict[str, Any]]:
    return FSI_LANGUAGES.get(code)
