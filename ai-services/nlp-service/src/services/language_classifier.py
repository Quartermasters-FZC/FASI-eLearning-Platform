from ..models.nlp_models import LanguageClassificationRequest, LanguageClassificationResponse


class LanguageClassifier:
    """Placeholder language classifier service."""

    def __init__(self, model_manager):
        self.model_manager = model_manager
        self.is_initialized = False

    async def initialize(self) -> None:
        self.is_initialized = True

    async def classify_language(self, request: LanguageClassificationRequest) -> LanguageClassificationResponse:
        """Return the first two characters as language code with high confidence."""
        code = request.text[:2].lower() if request.text else ""
        return LanguageClassificationResponse(detected_language=code, confidence_score=1.0)
