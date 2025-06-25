class TestRedis:
    def setup(self):
        pass
    def teardown(self):
        pass
    async def get_client(self):
        class Dummy:
            async def close(self):
                pass
        return Dummy()
    async def flush_db(self):
        pass
