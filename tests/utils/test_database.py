class TestDatabase:
    def setup(self):
        pass
    def teardown(self):
        pass
    def get_session(self):
        class Dummy:
            async def __aenter__(self):
                return self
            async def __aexit__(self, exc_type, exc, tb):
                pass
            async def rollback(self):
                pass
        return Dummy()
    def clean_all_tables(self):
        pass
