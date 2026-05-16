"""
AURA V3 New Features Test Suite
Tests for: Distraction Monitor, Calendar View, Voice Processing
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDistractionMonitor:
    """Tests for Distraction Monitor endpoints"""
    
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
    
    def test_log_distraction_social_media(self):
        """POST /api/distractions - Log a social media distraction"""
        response = self.session.post(f"{BASE_URL}/api/distractions", json={
            "category": "social_media",
            "duration_min": 15,
            "app_name": "Instagram",
            "notes": "Scrolling feed"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain id"
        assert data["category"] == "social_media", "Category should match"
        assert data["duration_min"] == 15, "Duration should match"
        assert data["app_name"] == "Instagram", "App name should match"
        print("PASS: Log distraction (social_media) works")
    
    def test_log_distraction_entertainment(self):
        """POST /api/distractions - Log an entertainment distraction"""
        response = self.session.post(f"{BASE_URL}/api/distractions", json={
            "category": "entertainment",
            "duration_min": 30,
            "app_name": "YouTube",
            "notes": "Watching videos"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["category"] == "entertainment"
        print("PASS: Log distraction (entertainment) works")
    
    def test_log_distraction_news(self):
        """POST /api/distractions - Log a news distraction"""
        response = self.session.post(f"{BASE_URL}/api/distractions", json={
            "category": "news",
            "duration_min": 10
        })
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "news"
        print("PASS: Log distraction (news) works")
    
    def test_log_distraction_shopping(self):
        """POST /api/distractions - Log a shopping distraction"""
        response = self.session.post(f"{BASE_URL}/api/distractions", json={
            "category": "shopping",
            "duration_min": 20,
            "app_name": "Amazon"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "shopping"
        print("PASS: Log distraction (shopping) works")
    
    def test_log_distraction_other(self):
        """POST /api/distractions - Log an 'other' distraction"""
        response = self.session.post(f"{BASE_URL}/api/distractions", json={
            "category": "other",
            "duration_min": 5,
            "notes": "Random browsing"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "other"
        print("PASS: Log distraction (other) works")
    
    def test_get_distractions_returns_logs(self):
        """GET /api/distractions - Returns logs with aggregations"""
        response = self.session.get(f"{BASE_URL}/api/distractions", params={"days": 7})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "logs" in data, "Response should contain logs"
        assert "total_minutes" in data, "Response should contain total_minutes"
        assert "by_category" in data, "Response should contain by_category"
        assert "daily_totals" in data, "Response should contain daily_totals"
        assert isinstance(data["logs"], list), "logs should be a list"
        assert isinstance(data["by_category"], list), "by_category should be a list"
        assert isinstance(data["daily_totals"], list), "daily_totals should be a list"
        print(f"PASS: GET distractions returns {len(data['logs'])} logs, total {data['total_minutes']} minutes")
    
    def test_get_distractions_analysis(self):
        """GET /api/distractions/analysis - Returns AI insights"""
        response = self.session.get(f"{BASE_URL}/api/distractions/analysis")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "analysis" in data, "Response should contain analysis"
        assert "tips" in data, "Response should contain tips"
        assert "total_minutes" in data, "Response should contain total_minutes"
        assert isinstance(data["tips"], list), "tips should be a list"
        print(f"PASS: Distraction analysis returned: '{data['analysis'][:50]}...'")


class TestCalendarView:
    """Tests for Calendar View endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@aura.com",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            data = login_response.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
        yield
    
    def test_calendar_week_returns_7_days(self):
        """GET /api/calendar/week - Returns 7 days of data"""
        response = self.session.get(f"{BASE_URL}/api/calendar/week")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "week_start" in data, "Response should contain week_start"
        assert "days" in data, "Response should contain days"
        assert len(data["days"]) == 7, f"Should return 7 days, got {len(data['days'])}"
        print(f"PASS: Calendar week returns 7 days starting from {data['week_start']}")
    
    def test_calendar_week_with_start_date(self):
        """GET /api/calendar/week - Works with start_date parameter"""
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        response = self.session.get(f"{BASE_URL}/api/calendar/week", params={"start_date": start_date})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert len(data["days"]) == 7
        print(f"PASS: Calendar week with start_date={start_date} works")
    
    def test_calendar_week_day_structure(self):
        """GET /api/calendar/week - Each day has correct structure"""
        response = self.session.get(f"{BASE_URL}/api/calendar/week")
        assert response.status_code == 200
        data = response.json()
        for day in data["days"]:
            assert "date" in day, "Day should have date"
            assert "day_name" in day, "Day should have day_name"
            assert "tasks" in day, "Day should have tasks"
            assert "schedule" in day, "Day should have schedule"
            assert "focus_sessions" in day, "Day should have focus_sessions"
        print("PASS: Calendar week day structure is correct")
    
    def test_calendar_events_returns_tasks_with_deadlines(self):
        """GET /api/calendar/events - Returns tasks with deadlines"""
        # First create a task with deadline
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        self.session.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Calendar_Task",
            "deadline": tomorrow,
            "priority": "high"
        })
        
        response = self.session.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "events" in data, "Response should contain events"
        assert isinstance(data["events"], list), "events should be a list"
        print(f"PASS: Calendar events returns {len(data['events'])} events")
    
    def test_calendar_events_structure(self):
        """GET /api/calendar/events - Events have correct structure"""
        response = self.session.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 200
        data = response.json()
        if data["events"]:
            event = data["events"][0]
            assert "id" in event, "Event should have id"
            assert "title" in event, "Event should have title"
            assert "date" in event, "Event should have date"
            assert "priority" in event, "Event should have priority"
            print("PASS: Calendar event structure is correct")
        else:
            print("PASS: Calendar events endpoint works (no events yet)")


class TestVoiceProcessing:
    """Tests for Voice Processing endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@aura.com",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            data = login_response.json()
            if "access_token" in data:
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
        yield
    
    def test_voice_process_creates_task(self):
        """POST /api/voice/process with context=task creates a task"""
        response = self.session.post(f"{BASE_URL}/api/voice/process", json={
            "text": "TEST_Voice_Task: Review the quarterly report",
            "context": "task"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain task id"
        assert "title" in data, "Response should contain title"
        assert "TEST_Voice_Task" in data["title"], "Task title should contain voice input"
        print(f"PASS: Voice process (task) created task: {data['title']}")
    
    def test_voice_process_sends_to_chat(self):
        """POST /api/voice/process with context=chat sends to AI advisor"""
        response = self.session.post(f"{BASE_URL}/api/voice/process", json={
            "text": "What should I focus on today?",
            "context": "chat"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "response" in data, "Response should contain AI response"
        assert "id" in data, "Response should contain conversation id"
        print(f"PASS: Voice process (chat) got AI response: '{data['response'][:50]}...'")
    
    def test_voice_process_brain_dump(self):
        """POST /api/voice/process with context=brain_dump parses tasks"""
        response = self.session.post(f"{BASE_URL}/api/voice/process", json={
            "text": "TEST_Voice_BrainDump: I need to finish the report, call mom, and go to gym",
            "context": "brain_dump"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "tasks" in data, "Response should contain tasks"
        assert "count" in data, "Response should contain count"
        assert data["count"] >= 1, "Should create at least 1 task"
        print(f"PASS: Voice process (brain_dump) created {data['count']} tasks")
    
    def test_voice_process_default_context(self):
        """POST /api/voice/process defaults to task context"""
        response = self.session.post(f"{BASE_URL}/api/voice/process", json={
            "text": "TEST_Voice_Default: Send email to client"
        })
        assert response.status_code == 200
        data = response.json()
        # Default context is 'task', so should create a task
        assert "id" in data, "Should create a task by default"
        assert "title" in data, "Should have task title"
        print("PASS: Voice process defaults to task context")


class TestRegressionExistingFeatures:
    """Regression tests for existing features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
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
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print("PASS: Login works")
    
    def test_tasks_crud(self):
        """Tasks CRUD operations work"""
        # Create
        create_resp = self.session.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Regression_Task",
            "priority": "high"
        })
        assert create_resp.status_code == 200
        task_id = create_resp.json()["id"]
        
        # Read
        get_resp = self.session.get(f"{BASE_URL}/api/tasks")
        assert get_resp.status_code == 200
        
        # Update
        update_resp = self.session.put(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "done"})
        assert update_resp.status_code == 200
        
        # Delete
        delete_resp = self.session.delete(f"{BASE_URL}/api/tasks/{task_id}")
        assert delete_resp.status_code == 200
        print("PASS: Tasks CRUD works")
    
    def test_chat_works(self):
        """Chat endpoint works"""
        response = self.session.post(f"{BASE_URL}/api/chat", json={"message": "Hello"})
        assert response.status_code == 200
        assert "response" in response.json()
        print("PASS: Chat works")
    
    def test_focus_history_works(self):
        """Focus history endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/focus/history")
        assert response.status_code == 200
        print("PASS: Focus history works")
    
    def test_analytics_weekly_works(self):
        """Analytics weekly endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/analytics/weekly")
        assert response.status_code == 200
        print("PASS: Analytics weekly works")
    
    def test_goals_works(self):
        """Goals endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/goals")
        assert response.status_code == 200
        print("PASS: Goals works")
    
    def test_settings_works(self):
        """Settings endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        print("PASS: Settings works")
    
    def test_quote_works(self):
        """Quote endpoint works"""
        response = requests.get(f"{BASE_URL}/api/quote")
        assert response.status_code == 200
        data = response.json()
        assert "quote" in data
        assert "author" in data
        print("PASS: Quote works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
