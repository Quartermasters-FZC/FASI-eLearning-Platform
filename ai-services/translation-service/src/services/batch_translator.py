from ..models.translation_models import (
    BatchTranslationRequest,
    BatchTranslationResponse,
    TranslationRequest,
    TranslationResponse,
)


class BatchTranslator:
    """Placeholder batch translation service."""

    def __init__(self, neural_translator, redis_client):
        self.neural_translator = neural_translator
        self.redis_client = redis_client
        self.is_initialized = False

    async def initialize(self) -> None:
        self.is_initialized = True

    async def translate_batch(self, request: BatchTranslationRequest) -> BatchTranslationResponse:
        translations = []
        for text in request.texts:
            single = await self.neural_translator.translate(
                TranslationRequest(text=text, source_language=request.source_language, target_language=request.target_language)
            )
            translations.append(single)
        return BatchTranslationResponse(translations=translations, average_confidence=1.0)
