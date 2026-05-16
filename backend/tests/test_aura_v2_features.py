"""
AURA API V2 Features Tests
Tests for: Graceful Fallbacks, Overwhelm Mode, Weekly Report, Goal Breakdown
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@aura.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


# ─── Health Check ────────────────────────────────────────────────
class TestHealthCheck:
    """Basic health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "AURA API is running"
        print(f"SUCCESS: API is running - {data}")


# ─── V2: Emotional Overwhelm Mode ────────────────────────────────
class TestOverwhelmMode:
    """Tests for the Overwhelm Mode feature"""
    
    def test_overwhelm_endpoint_exists(self, auth_headers):
        """Test that /api/overwhelm endpoint exists and returns 200"""
        response = requests.post(f"{BASE_URL}/api/overwhelm", headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Overwhelm endpoint failed: {response.text}"
        data = response.json()
        print(f"SUCCESS: Overwhelm endpoint returned: {data}")
    
    def test_overwhelm_returns_message(self, auth_headers):
        """Test that overwhelm returns a calming message"""
        response = requests.post(f"{BASE_URL}/api/overwhelm", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert len(data["message"]) > 0, "Message should not be empty"
        print(f"SUCCESS: Overwhelm message: {data['message'][:100]}...")
    
    def test_overwhelm_returns_focus_tasks(self, auth_headers):
        """Test that overwhelm returns focus_tasks array"""
        response = requests.post(f"{BASE_URL}/api/overwhelm", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "focus_tasks" in data, "Response should contain 'focus_tasks'"
        assert isinstance(data["focus_tasks"], list), "focus_tasks should be a list"
        print(f"SUCCESS: Overwhelm returned {len(data['focus_tasks'])} focus tasks")
    
    def test_overwhelm_has_ai_unavailable_flag(self, auth_headers):
        """Test that overwhelm returns ai_unavailable flag"""
        response = requests.post(f"{BASE_URL}/api/overwhelm", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "ai_unavailable" in data, "Response should contain 'ai_unavailable' flag"
        print(f"SUCCESS: ai_unavailable flag = {data['ai_unavailable']}")
    
    def test_overwhelm_requires_auth(self):
        """Test that overwhelm endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/overwhelm")
        assert response.status_code == 401
        print("SUCCESS: Overwhelm endpoint requires authentication")


# ─── V2: Weekly Productivity Report ─────────────────────────────
class TestWeeklyReport:
    """Tests for the Weekly Report feature"""
    
    def test_weekly_report_endpoint_exists(self, auth_headers):
        """Test that /api/analytics/weekly-report endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report", headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Weekly report endpoint failed: {response.text}"
        data = response.json()
        print(f"SUCCESS: Weekly report endpoint returned data")
    
    def test_weekly_report_returns_narrative(self, auth_headers):
        """Test that weekly report returns a narrative"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "narrative" in data, "Response should contain 'narrative'"
        assert len(data["narrative"]) > 0, "Narrative should not be empty"
        print(f"SUCCESS: Weekly report narrative: {data['narrative'][:100]}...")
    
    def test_weekly_report_returns_highlights(self, auth_headers):
        """Test that weekly report returns highlights array"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "highlights" in data, "Response should contain 'highlights'"
        assert isinstance(data["highlights"], list), "highlights should be a list"
        print(f"SUCCESS: Weekly report has {len(data['highlights'])} highlights")
    
    def test_weekly_report_returns_recommendations(self, auth_headers):
        """Test that weekly report returns recommendations array"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "recommendations" in data, "Response should contain 'recommendations'"
        assert isinstance(data["recommendations"], list), "recommendations should be a list"
        print(f"SUCCESS: Weekly report has {len(data['recommendations'])} recommendations")
    
    def test_weekly_report_returns_grade(self, auth_headers):
        """Test that weekly report returns a grade (A/B/C/D)"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "grade" in data, "Response should contain 'grade'"
        assert data["grade"] in ["A", "B", "C", "D"], f"Grade should be A/B/C/D, got {data['grade']}"
        print(f"SUCCESS: Weekly report grade: {data['grade']}")
    
    def test_weekly_report_returns_stats(self, auth_headers):
        """Test that weekly report returns stats object"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data, "Response should contain 'stats'"
        assert "tasks_completed" in data["stats"], "stats should contain tasks_completed"
        assert "total_focus_minutes" in data["stats"], "stats should contain total_focus_minutes"
        print(f"SUCCESS: Weekly report stats: {data['stats']}")
    
    def test_weekly_report_has_ai_unavailable_flag(self, auth_headers):
        """Test that weekly report returns ai_unavailable flag"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "ai_unavailable" in data, "Response should contain 'ai_unavailable' flag"
        print(f"SUCCESS: ai_unavailable flag = {data['ai_unavailable']}")
    
    def test_weekly_report_requires_auth(self):
        """Test that weekly report endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly-report")
        assert response.status_code == 401
        print("SUCCESS: Weekly report endpoint requires authentication")


# ─── V2: Goal Breakdown ─────────────────────────────────────────
class TestGoalBreakdown:
    """Tests for the Goal Breakdown feature"""
    
    @pytest.fixture
    def test_goal(self, auth_headers):
        """Create a test goal for breakdown tests"""
        response = requests.post(f"{BASE_URL}/api/goals", json={
            "title": "TEST_Goal for breakdown testing",
            "deadline": "2026-03-01"
        }, headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Goal creation failed: {response.text}"
        return response.json()
    
    def test_goal_breakdown_endpoint_exists(self, auth_headers, test_goal):
        """Test that /api/goals/{id}/breakdown endpoint exists"""
        goal_id = test_goal["id"]
        response = requests.post(f"{BASE_URL}/api/goals/{goal_id}/breakdown", headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Goal breakdown endpoint failed: {response.text}"
        print(f"SUCCESS: Goal breakdown endpoint returned data")
    
    def test_goal_breakdown_returns_daily_tasks(self, auth_headers, test_goal):
        """Test that goal breakdown returns daily_tasks array"""
        goal_id = test_goal["id"]
        response = requests.post(f"{BASE_URL}/api/goals/{goal_id}/breakdown", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "daily_tasks" in data, "Response should contain 'daily_tasks'"
        assert isinstance(data["daily_tasks"], list), "daily_tasks should be a list"
        print(f"SUCCESS: Goal breakdown returned {len(data['daily_tasks'])} daily tasks")
    
    def test_goal_breakdown_returns_goal_info(self, auth_headers, test_goal):
        """Test that goal breakdown returns goal_id and goal_title"""
        goal_id = test_goal["id"]
        response = requests.post(f"{BASE_URL}/api/goals/{goal_id}/breakdown", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "goal_id" in data, "Response should contain 'goal_id'"
        assert "goal_title" in data, "Response should contain 'goal_title'"
        assert data["goal_id"] == goal_id
        print(f"SUCCESS: Goal breakdown for: {data['goal_title']}")
    
    def test_goal_breakdown_has_ai_unavailable_flag(self, auth_headers, test_goal):
        """Test that goal breakdown returns ai_unavailable flag"""
        goal_id = test_goal["id"]
        response = requests.post(f"{BASE_URL}/api/goals/{goal_id}/breakdown", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "ai_unavailable" in data, "Response should contain 'ai_unavailable' flag"
        print(f"SUCCESS: ai_unavailable flag = {data['ai_unavailable']}")
    
    def test_goal_breakdown_404_for_invalid_goal(self, auth_headers):
        """Test that goal breakdown returns 404 for non-existent goal"""
        response = requests.post(f"{BASE_URL}/api/goals/invalid-goal-id/breakdown", headers=auth_headers, timeout=30)
        assert response.status_code == 404
        print("SUCCESS: Goal breakdown returns 404 for invalid goal")
    
    def test_goal_breakdown_requires_auth(self):
        """Test that goal breakdown endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/goals/some-id/breakdown")
        assert response.status_code == 401
        print("SUCCESS: Goal breakdown endpoint requires authentication")


# ─── V2: Goal Create Tasks ─────────────────────────────────────
class TestGoalCreateTasks:
    """Tests for the Goal Create Tasks feature"""
    
    @pytest.fixture
    def test_goal_for_tasks(self, auth_headers):
        """Create a test goal for create-tasks tests"""
        response = requests.post(f"{BASE_URL}/api/goals", json={
            "title": "TEST_Goal for create-tasks testing",
            "deadline": "2026-04-01"
        }, headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Goal creation failed: {response.text}"
        return response.json()
    
    def test_create_tasks_endpoint_exists(self, auth_headers, test_goal_for_tasks):
        """Test that /api/goals/{id}/create-tasks endpoint exists"""
        goal_id = test_goal_for_tasks["id"]
        response = requests.post(f"{BASE_URL}/api/goals/{goal_id}/create-tasks", headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Create tasks endpoint failed: {response.text}"
        print(f"SUCCESS: Create tasks endpoint returned data")
    
    def test_create_tasks_returns_tasks_array(self, auth_headers, test_goal_for_tasks):
        """Test that create-tasks returns tasks array"""
        goal_id = test_goal_for_tasks["id"]
        response = requests.post(f"{BASE_URL}/api/goals/{goal_id}/create-tasks", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data, "Response should contain 'tasks'"
        assert isinstance(data["tasks"], list), "tasks should be a list"
        assert "count" in data, "Response should contain 'count'"
        print(f"SUCCESS: Create tasks returned {data['count']} tasks")
    
    def test_create_tasks_creates_actual_tasks(self, auth_headers, test_goal_for_tasks):
        """Test that create-tasks actually creates tasks in the database"""
        goal_id = test_goal_for_tasks["id"]
        
        # Get initial task count
        initial_tasks = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers).json()
        initial_count = len(initial_tasks)
        
        # Create tasks from goal
        response = requests.post(f"{BASE_URL}/api/goals/{goal_id}/create-tasks", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        created_count = response.json()["count"]
        
        # Verify tasks were created
        final_tasks = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers).json()
        final_count = len(final_tasks)
        
        assert final_count >= initial_count + created_count, "Tasks should be created in database"
        print(f"SUCCESS: Created {created_count} tasks, total tasks went from {initial_count} to {final_count}")
    
    def test_create_tasks_404_for_invalid_goal(self, auth_headers):
        """Test that create-tasks returns 404 for non-existent goal"""
        response = requests.post(f"{BASE_URL}/api/goals/invalid-goal-id/create-tasks", headers=auth_headers, timeout=30)
        assert response.status_code == 404
        print("SUCCESS: Create tasks returns 404 for invalid goal")
    
    def test_create_tasks_requires_auth(self):
        """Test that create-tasks endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/goals/some-id/create-tasks")
        assert response.status_code == 401
        print("SUCCESS: Create tasks endpoint requires authentication")


# ─── Graceful Fallback Tests ────────────────────────────────────
class TestGracefulFallbacks:
    """Tests for graceful fallback behavior when AI is unavailable"""
    
    def test_brain_dump_returns_200_with_fallback(self, auth_headers):
        """Test that brain-dump returns 200 even if AI fails (uses fallback)"""
        response = requests.post(f"{BASE_URL}/api/tasks/brain-dump", json={
            "text": "Buy groceries, finish report, call mom"
        }, headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Brain dump failed: {response.text}"
        data = response.json()
        assert "tasks" in data, "Response should contain 'tasks'"
        assert "count" in data, "Response should contain 'count'"
        assert "ai_unavailable" in data, "Response should contain 'ai_unavailable' flag"
        assert data["count"] > 0, "Should create at least one task"
        print(f"SUCCESS: Brain dump created {data['count']} tasks, ai_unavailable={data['ai_unavailable']}")
    
    def test_chat_returns_200_with_fallback(self, auth_headers):
        """Test that chat returns 200 even if AI fails (uses fallback message)"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "What should I focus on today?"
        }, headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        assert "response" in data, "Response should contain 'response'"
        assert "ai_unavailable" in data, "Response should contain 'ai_unavailable' flag"
        assert len(data["response"]) > 0, "Response should not be empty"
        print(f"SUCCESS: Chat returned response, ai_unavailable={data['ai_unavailable']}")
    
    def test_planner_generate_returns_200_with_fallback(self, auth_headers):
        """Test that planner/generate returns 200 even if AI fails (uses fallback schedule)"""
        response = requests.post(f"{BASE_URL}/api/planner/generate", headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Planner generate failed: {response.text}"
        data = response.json()
        # May have schedule or message if no tasks
        if "plan" in data:
            assert "ai_unavailable" in data, "Response should contain 'ai_unavailable' flag"
            print(f"SUCCESS: Planner generated schedule, ai_unavailable={data.get('ai_unavailable')}")
        else:
            print(f"SUCCESS: Planner returned message (no tasks): {data.get('message')}")
    
    def test_prioritize_returns_200_with_fallback(self, auth_headers):
        """Test that prioritize returns 200 even if AI fails (uses fallback sorting)"""
        response = requests.post(f"{BASE_URL}/api/tasks/prioritize", headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Prioritize failed: {response.text}"
        data = response.json()
        assert "rankings" in data or "message" in data, "Response should contain 'rankings' or 'message'"
        if "rankings" in data and len(data["rankings"]) > 0:
            assert "ai_unavailable" in data, "Response should contain 'ai_unavailable' flag"
            print(f"SUCCESS: Prioritize returned {len(data['rankings'])} rankings, ai_unavailable={data.get('ai_unavailable')}")
        else:
            print(f"SUCCESS: Prioritize returned message (no tasks): {data.get('message')}")


# ─── Existing Features Regression Tests ─────────────────────────
class TestExistingFeaturesRegression:
    """Quick regression tests for existing features"""
    
    def test_auth_login(self):
        """Test login still works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
        print("SUCCESS: Auth login works")
    
    def test_tasks_crud(self, auth_headers):
        """Test basic task CRUD"""
        # Create
        create_resp = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Regression task"
        }, headers=auth_headers)
        assert create_resp.status_code == 200
        task_id = create_resp.json()["id"]
        
        # Read
        get_resp = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        assert get_resp.status_code == 200
        
        # Update
        update_resp = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={
            "status": "done"
        }, headers=auth_headers)
        assert update_resp.status_code == 200
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
        assert delete_resp.status_code == 200
        
        print("SUCCESS: Task CRUD works")
    
    def test_focus_session(self, auth_headers):
        """Test focus session start/end"""
        # Start
        start_resp = requests.post(f"{BASE_URL}/api/focus/start", json={
            "duration_min": 25
        }, headers=auth_headers)
        assert start_resp.status_code == 200
        session_id = start_resp.json()["id"]
        
        # End
        end_resp = requests.put(f"{BASE_URL}/api/focus/{session_id}/end", json={
            "completed": True
        }, headers=auth_headers)
        assert end_resp.status_code == 200
        
        print("SUCCESS: Focus session works")
    
    def test_analytics_endpoints(self, auth_headers):
        """Test analytics endpoints"""
        weekly = requests.get(f"{BASE_URL}/api/analytics/weekly", headers=auth_headers)
        assert weekly.status_code == 200
        
        burnout = requests.get(f"{BASE_URL}/api/analytics/burnout", headers=auth_headers)
        assert burnout.status_code == 200
        
        print("SUCCESS: Analytics endpoints work")
    
    def test_settings_endpoints(self, auth_headers):
        """Test settings endpoints"""
        get_resp = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert get_resp.status_code == 200
        
        print("SUCCESS: Settings endpoints work")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
