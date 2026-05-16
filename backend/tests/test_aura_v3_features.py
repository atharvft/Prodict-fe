"""
AURA V3 Features Test Suite
Tests for: Theme System, Quote of the Day, New Logo
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestQuoteOfDay:
    """Tests for GET /api/quote endpoint"""
    
    def test_quote_endpoint_exists(self):
        """Quote endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/quote")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Quote endpoint returns 200")
    
    def test_quote_returns_quote_field(self):
        """Quote response should contain 'quote' field"""
        response = requests.get(f"{BASE_URL}/api/quote")
        data = response.json()
        assert "quote" in data, "Response missing 'quote' field"
        assert isinstance(data["quote"], str), "Quote should be a string"
        assert len(data["quote"]) > 0, "Quote should not be empty"
        print(f"PASS: Quote returned: '{data['quote'][:50]}...'")
    
    def test_quote_returns_author_field(self):
        """Quote response should contain 'author' field"""
        response = requests.get(f"{BASE_URL}/api/quote")
        data = response.json()
        assert "author" in data, "Response missing 'author' field"
        assert isinstance(data["author"], str), "Author should be a string"
        assert len(data["author"]) > 0, "Author should not be empty"
        print(f"PASS: Author returned: '{data['author']}'")
    
    def test_quote_no_auth_required(self):
        """Quote endpoint should not require authentication"""
        # Make request without any auth headers
        response = requests.get(f"{BASE_URL}/api/quote", headers={})
        assert response.status_code == 200, "Quote should be accessible without auth"
        print("PASS: Quote endpoint accessible without authentication")


class TestExistingFeaturesRegression:
    """Regression tests for existing features to ensure they still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with admin credentials
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@aura.com",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            data = login_response.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
        yield
    
    def test_login_works(self):
        """Login should work with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@aura.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        data = response.json()
        assert "access_token" in data, "Login should return access_token"
        assert "email" in data, "Login should return user email"
        print("PASS: Login works correctly")
    
    def test_dashboard_stats_endpoint(self):
        """Analytics weekly endpoint should work"""
        response = self.session.get(f"{BASE_URL}/api/analytics/weekly")
        assert response.status_code == 200, f"Analytics failed: {response.status_code}"
        data = response.json()
        assert "tasks_completed" in data, "Should return tasks_completed"
        assert "total_focus_minutes" in data, "Should return total_focus_minutes"
        print("PASS: Dashboard stats (analytics/weekly) working")
    
    def test_tasks_endpoint(self):
        """Tasks endpoint should work"""
        response = self.session.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200, f"Tasks failed: {response.status_code}"
        assert isinstance(response.json(), list), "Tasks should return a list"
        print("PASS: Tasks endpoint working")
    
    def test_chat_endpoint(self):
        """Chat endpoint should work"""
        response = self.session.post(f"{BASE_URL}/api/chat", json={
            "message": "Hello AURA"
        })
        assert response.status_code == 200, f"Chat failed: {response.status_code}"
        data = response.json()
        assert "response" in data, "Chat should return response"
        print("PASS: Chat endpoint working")
    
    def test_focus_history_endpoint(self):
        """Focus history endpoint should work"""
        response = self.session.get(f"{BASE_URL}/api/focus/history")
        assert response.status_code == 200, f"Focus history failed: {response.status_code}"
        assert isinstance(response.json(), list), "Focus history should return a list"
        print("PASS: Focus history endpoint working")
    
    def test_goals_endpoint(self):
        """Goals endpoint should work"""
        response = self.session.get(f"{BASE_URL}/api/goals")
        assert response.status_code == 200, f"Goals failed: {response.status_code}"
        assert isinstance(response.json(), list), "Goals should return a list"
        print("PASS: Goals endpoint working")
    
    def test_settings_get_endpoint(self):
        """Settings GET endpoint should work"""
        response = self.session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200, f"Settings GET failed: {response.status_code}"
        data = response.json()
        assert "name" in data, "Settings should return name"
        assert "preferences" in data, "Settings should return preferences"
        print("PASS: Settings GET endpoint working")
    
    def test_settings_update_endpoint(self):
        """Settings PUT endpoint should work"""
        response = self.session.put(f"{BASE_URL}/api/settings", json={
            "name": "Admin",
            "focus_duration": 25
        })
        assert response.status_code == 200, f"Settings PUT failed: {response.status_code}"
        data = response.json()
        assert "name" in data, "Settings update should return name"
        print("PASS: Settings PUT endpoint working")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """API root should return version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "AURA" in data["message"]
        print("PASS: API root healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
