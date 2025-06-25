from ..models.nlp_models import GrammarCheckRequest, GrammarCheckResponse


class GrammarChecker:
    """Placeholder grammar checker service."""

    def __init__(self, model_manager, redis_client):
        self.model_manager = model_manager
        self.redis_client = redis_client
        self.is_initialized = False

    async def initialize(self) -> None:
        self.is_initialized = True

    async def check_grammar(self, request: GrammarCheckRequest) -> GrammarCheckResponse:
        """Return the input text as corrected text."""
        return GrammarCheckResponse(corrected_text=request.text)
