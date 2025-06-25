from ..models.nlp_models import TextAnalysisRequest, TextAnalysisResponse


class TextAnalyzer:
    """Placeholder text analyzer service."""

    def __init__(self, model_manager, redis_client):
        self.model_manager = model_manager
        self.redis_client = redis_client
        self.is_initialized = False

    async def initialize(self) -> None:
        self.is_initialized = True

    async def analyze_text(self, request: TextAnalysisRequest) -> TextAnalysisResponse:
        """Return dummy analysis scores."""
        return TextAnalysisResponse(complexity_score=0.0, sentiment_score=0.0)
