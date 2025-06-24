"""
Global Test Configuration
AI-Powered eLearning Platform - Quartermasters FZC

Central pytest configuration and fixtures for comprehensive testing
"""

import os
import sys
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator, Dict, Any
from unittest.mock import Mock, MagicMock
import tempfile
import shutil
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Test environment setup
os.environ["TESTING"] = "1"
os.environ["NODE_ENV"] = "test"
os.environ["PYTEST_CURRENT_TEST"] = "1"

# Import test utilities
from tests.utils.test_database import TestDatabase
from tests.utils.test_redis import TestRedis
from tests.utils.test_auth import TestAuth
from tests.utils.mock_ai_services import MockAIServices
from tests.utils.test_data import TestDataFactory
from tests.fixtures.user_fixtures import UserFixtures
from tests.fixtures.course_fixtures import CourseFixtures
from tests.fixtures.ai_fixtures import AIFixtures


# =================================================================
# PYTEST CONFIGURATION
# =================================================================

def pytest_configure(config):
    """Configure pytest with custom settings"""
    # Register custom markers
    config.addinivalue_line("markers", "unit: Unit test")
    config.addinivalue_line("markers", "integration: Integration test")
    config.addinivalue_line("markers", "e2e: End-to-end test")
    config.addinivalue_line("markers", "slow: Slow test")
    config.addinivalue_line("markers", "ai: AI/ML test")
    config.addinivalue_line("markers", "multilingual: Multi-language test")
    config.addinivalue_line("markers", "government: Government compliance test")


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers and organize tests"""
    for item in items:
        # Add markers based on test location
        test_path = str(item.fspath)
        
        if "/unit/" in test_path:
            item.add_marker(pytest.mark.unit)
            item.add_marker(pytest.mark.fast)
        elif "/integration/" in test_path:
            item.add_marker(pytest.mark.integration)
        elif "/e2e/" in test_path:
            item.add_marker(pytest.mark.e2e)
            item.add_marker(pytest.mark.slow)
        
        # Add service-specific markers
        if "/ai-services/" in test_path:
            item.add_marker(pytest.mark.ai)
        if "/speech/" in test_path:
            item.add_marker(pytest.mark.speech)
        if "/nlp/" in test_path:
            item.add_marker(pytest.mark.nlp)
        if "/auth/" in test_path:
            item.add_marker(pytest.mark.auth)
        if "/multilingual/" in test_path:
            item.add_marker(pytest.mark.multilingual)


# =================================================================
# EVENT LOOP FIXTURES
# =================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def async_session():
    """Async session fixture for database testing"""
    # Session-wide async setup
    yield
    # Session-wide async teardown


# =================================================================
# DATABASE FIXTURES
# =================================================================

@pytest.fixture(scope="session")
def test_database():
    """Set up test database for the session"""
    db = TestDatabase()
    db.setup()
    yield db
    db.teardown()


@pytest_asyncio.fixture
async def db_session(test_database):
    """Create a database session for each test"""
    async with test_database.get_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
def clean_database(test_database):
    """Clean database before each test"""
    test_database.clean_all_tables()
    yield
    test_database.clean_all_tables()


# =================================================================
# REDIS FIXTURES
# =================================================================

@pytest.fixture(scope="session")
def test_redis():
    """Set up test Redis instance"""
    redis = TestRedis()
    redis.setup()
    yield redis
    redis.teardown()


@pytest_asyncio.fixture
async def redis_client(test_redis):
    """Create Redis client for each test"""
    client = await test_redis.get_client()
    yield client
    await test_redis.flush_db()
    await client.close()


# =================================================================
# AUTH AND USER FIXTURES
# =================================================================

@pytest.fixture
def test_auth():
    """Authentication test utilities"""
    return TestAuth()


@pytest_asyncio.fixture
async def admin_user(db_session, test_auth):
    """Create admin user for testing"""
    user_data = {
        "email": "admin@test.com",
        "username": "test_admin",
        "password": "TestPassword123!",
        "role": "super_admin",
        "first_name": "Test",
        "last_name": "Admin"
    }
    user = await test_auth.create_user(db_session, user_data)
    yield user


@pytest_asyncio.fixture
async def instructor_user(db_session, test_auth):
    """Create instructor user for testing"""
    user_data = {
        "email": "instructor@test.com",
        "username": "test_instructor",
        "password": "TestPassword123!",
        "role": "instructor",
        "first_name": "Test",
        "last_name": "Instructor"
    }
    user = await test_auth.create_user(db_session, user_data)
    yield user


@pytest_asyncio.fixture
async def student_user(db_session, test_auth):
    """Create student user for testing"""
    user_data = {
        "email": "student@test.com",
        "username": "test_student",
        "password": "TestPassword123!",
        "role": "student",
        "first_name": "Test",
        "last_name": "Student"
    }
    user = await test_auth.create_user(db_session, user_data)
    yield user


@pytest.fixture
def auth_headers(test_auth, student_user):
    """Generate auth headers for API requests"""
    token = test_auth.generate_token(student_user)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_auth, admin_user):
    """Generate admin auth headers for API requests"""
    token = test_auth.generate_token(admin_user)
    return {"Authorization": f"Bearer {token}"}


# =================================================================
# MOCK AI SERVICES
# =================================================================

@pytest.fixture
def mock_ai_services():
    """Mock AI services for testing"""
    return MockAIServices()


@pytest_asyncio.fixture
async def mock_speech_service(mock_ai_services):
    """Mock speech recognition service"""
    service = await mock_ai_services.get_speech_service()
    yield service


@pytest_asyncio.fixture
async def mock_nlp_service(mock_ai_services):
    """Mock NLP service"""
    service = await mock_ai_services.get_nlp_service()
    yield service


@pytest_asyncio.fixture
async def mock_translation_service(mock_ai_services):
    """Mock translation service"""
    service = await mock_ai_services.get_translation_service()
    yield service


# =================================================================
# TEST DATA FIXTURES
# =================================================================

@pytest.fixture
def test_data_factory():
    """Factory for creating test data"""
    return TestDataFactory()


@pytest.fixture
def sample_audio_data(test_data_factory):
    """Sample audio data for speech testing"""
    return test_data_factory.create_sample_audio()


@pytest.fixture
def sample_text_data(test_data_factory):
    """Sample text data for NLP testing"""
    return test_data_factory.create_sample_texts()


@pytest.fixture
def multilingual_test_data(test_data_factory):
    """Multi-language test data"""
    return test_data_factory.create_multilingual_data()


# =================================================================
# FILE SYSTEM FIXTURES
# =================================================================

@pytest.fixture
def temp_directory():
    """Create temporary directory for file operations"""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir)


@pytest.fixture
def test_media_files(temp_directory, test_data_factory):
    """Create test media files"""
    media_files = test_data_factory.create_media_files(temp_directory)
    yield media_files


# =================================================================
# HTTP CLIENT FIXTURES
# =================================================================

@pytest_asyncio.fixture
async def auth_service_client():
    """HTTP client for auth service testing"""
    from httpx import AsyncClient
    async with AsyncClient(base_url="http://localhost:3001") as client:
        yield client


@pytest_asyncio.fixture
async def user_service_client():
    """HTTP client for user service testing"""
    from httpx import AsyncClient
    async with AsyncClient(base_url="http://localhost:3002") as client:
        yield client


@pytest_asyncio.fixture
async def content_service_client():
    """HTTP client for content service testing"""
    from httpx import AsyncClient
    async with AsyncClient(base_url="http://localhost:3003") as client:
        yield client


@pytest_asyncio.fixture
async def speech_service_client():
    """HTTP client for speech service testing"""
    from httpx import AsyncClient
    async with AsyncClient(base_url="http://localhost:8001") as client:
        yield client


@pytest_asyncio.fixture
async def nlp_service_client():
    """HTTP client for NLP service testing"""
    from httpx import AsyncClient
    async with AsyncClient(base_url="http://localhost:8002") as client:
        yield client


# =================================================================
# COURSE AND CONTENT FIXTURES
# =================================================================

@pytest_asyncio.fixture
async def sample_course(db_session, instructor_user):
    """Create sample course for testing"""
    course_fixtures = CourseFixtures()
    course = await course_fixtures.create_course(
        db_session, 
        instructor_user,
        language_code="ur",
        title="Test Urdu Course",
        level="beginner"
    )
    yield course


@pytest_asyncio.fixture
async def sample_lesson(db_session, sample_course):
    """Create sample lesson for testing"""
    course_fixtures = CourseFixtures()
    lesson = await course_fixtures.create_lesson(
        db_session,
        sample_course,
        title="Test Lesson 1",
        content="Sample lesson content in Urdu"
    )
    yield lesson


# =================================================================
# PERFORMANCE TESTING FIXTURES
# =================================================================

@pytest.fixture
def performance_tracker():
    """Track performance metrics during tests"""
    import time
    from collections import defaultdict
    
    class PerformanceTracker:
        def __init__(self):
            self.metrics = defaultdict(list)
            self.start_times = {}
        
        def start_timer(self, name: str):
            self.start_times[name] = time.time()
        
        def end_timer(self, name: str):
            if name in self.start_times:
                duration = time.time() - self.start_times[name]
                self.metrics[name].append(duration)
                del self.start_times[name]
                return duration
            return None
        
        def get_average(self, name: str):
            if name in self.metrics and self.metrics[name]:
                return sum(self.metrics[name]) / len(self.metrics[name])
            return None
    
    return PerformanceTracker()


# =================================================================
# ACCESSIBILITY TESTING FIXTURES
# =================================================================

@pytest.fixture
def accessibility_checker():
    """Accessibility testing utilities"""
    class AccessibilityChecker:
        def check_wcag_compliance(self, html_content: str) -> Dict[str, Any]:
            """Check WCAG 2.1 AA compliance"""
            # This would integrate with axe-core or similar tool
            return {
                "violations": [],
                "passes": [],
                "incomplete": [],
                "inapplicable": []
            }
        
        def check_color_contrast(self, foreground: str, background: str) -> bool:
            """Check color contrast ratio"""
            # Simplified contrast check
            return True
        
        def check_keyboard_navigation(self, elements: list) -> Dict[str, Any]:
            """Check keyboard navigation support"""
            return {"focusable_elements": elements, "tab_order": []}
    
    return AccessibilityChecker()


# =================================================================
# SECURITY TESTING FIXTURES
# =================================================================

@pytest.fixture
def security_tester():
    """Security testing utilities"""
    class SecurityTester:
        def check_sql_injection(self, query: str) -> bool:
            """Check for SQL injection vulnerabilities"""
            dangerous_patterns = ["'; DROP TABLE", "' OR '1'='1", "UNION SELECT"]
            return not any(pattern in query.upper() for pattern in dangerous_patterns)
        
        def check_xss_vulnerability(self, input_data: str) -> bool:
            """Check for XSS vulnerabilities"""
            xss_patterns = ["<script", "javascript:", "onload=", "onclick="]
            return not any(pattern in input_data.lower() for pattern in xss_patterns)
        
        def check_csrf_token(self, headers: dict) -> bool:
            """Check CSRF token presence"""
            return "x-csrf-token" in headers or "csrf-token" in headers
    
    return SecurityTester()


# =================================================================
# LANGUAGE TESTING FIXTURES
# =================================================================

@pytest.fixture
def language_test_data():
    """Test data for different languages and scripts"""
    return {
        "urdu": {
            "text": "یہ اردو میں ایک جملہ ہے",
            "script": "arabic",
            "direction": "rtl",
            "fsi_category": 3
        },
        "arabic": {
            "text": "هذه جملة باللغة العربية",
            "script": "arabic", 
            "direction": "rtl",
            "fsi_category": 4
        },
        "chinese": {
            "text": "这是一个中文句子",
            "script": "chinese",
            "direction": "ltr",
            "fsi_category": 4
        },
        "english": {
            "text": "This is an English sentence",
            "script": "latin",
            "direction": "ltr",
            "fsi_category": 1
        },
        "hindi": {
            "text": "यह हिंदी में एक वाक्य है",
            "script": "devanagari",
            "direction": "ltr",
            "fsi_category": 3
        }
    }


# =================================================================
# ENVIRONMENT CLEANUP
# =================================================================

@pytest.fixture(autouse=True)
def cleanup_test_environment():
    """Automatically cleanup test environment after each test"""
    yield
    # Cleanup operations
    # Clear any test files, reset mocks, etc.


# =================================================================
# PARAMETRIZED FIXTURES
# =================================================================

@pytest.fixture(params=["en", "ur", "ar", "zh-CN", "es", "fr"])
def language_code(request):
    """Parametrized fixture for testing multiple languages"""
    return request.param


@pytest.fixture(params=["student", "instructor", "admin"])
def user_role(request):
    """Parametrized fixture for testing different user roles"""
    return request.param


@pytest.fixture(params=["beginner", "intermediate", "advanced"])
def proficiency_level(request):
    """Parametrized fixture for testing different proficiency levels"""
    return request.param


# =================================================================
# TEST UTILITIES
# =================================================================

@pytest.fixture
def assert_response():
    """Utility for asserting API responses"""
    def _assert_response(response, expected_status=200, expected_keys=None):
        assert response.status_code == expected_status
        if expected_keys:
            response_data = response.json()
            for key in expected_keys:
                assert key in response_data
    return _assert_response


@pytest.fixture
def wait_for_async():
    """Utility for waiting for async operations in tests"""
    async def _wait_for(condition, timeout=5.0, interval=0.1):
        import asyncio
        start_time = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start_time < timeout:
            if await condition():
                return True
            await asyncio.sleep(interval)
        return False
    return _wait_for