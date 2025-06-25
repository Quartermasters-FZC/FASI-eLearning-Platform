from ..models.translation_models import TranslationResponse


class DomainAdapter:
    """Placeholder domain adaptation service."""

    def __init__(self, model_manager):
        self.model_manager = model_manager
        self.is_initialized = False

    async def initialize(self) -> None:
        self.is_initialized = True

    async def adapt_to_domain(
        self, translation: TranslationResponse, domain: str, language: str
    ) -> TranslationResponse:
        translation.detected_domain = domain
        return translation
