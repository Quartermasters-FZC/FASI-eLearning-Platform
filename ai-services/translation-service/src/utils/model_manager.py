class TranslationModelManager:
    """Minimal translation model manager."""

    def __init__(self):
        self.is_initialized = False

    async def initialize(self) -> None:
        self.is_initialized = True

    async def cleanup(self) -> None:
        pass
