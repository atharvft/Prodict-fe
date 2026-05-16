"""
AURA API Backend Tests
Tests for: Auth, Tasks, Chat, Focus, Analytics, Goals, Settings
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
TEST_USER_EMAIL = f"test_{uuid.uuid4().hex[:8]}@aura.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Test User"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "AURA API is running"
        assert "version" in data
        print(f"SUCCESS: API root returns {data}")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_register_new_user(self):
        """Test user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": TEST_USER_NAME,
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == TEST_USER_EMAIL.lower()
        assert data["name"] == TEST_USER_NAME
        assert "access_token" in data
        print(f"SUCCESS: User registered with id {data['id']}")
    
    def test_register_duplicate_email(self):
        """Test duplicate email registration fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Duplicate User",
            "email": ADMIN_EMAIL,
            "password": "somepassword"
        })
        assert response.status_code == 400
        print("SUCCESS: Duplicate email registration rejected")
    
    def test_login_admin(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["email"] == ADMIN_EMAIL
        print(f"SUCCESS: Admin logged in, token received")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@aura.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Non-existent user login rejected")
    
    def test_me_endpoint_authenticated(self):
        """Test /auth/me with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["access_token"]
        
        # Then get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"SUCCESS: /auth/me returns user data")
    
    def test_me_endpoint_unauthenticated(self):
        """Test /auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("SUCCESS: Unauthenticated /auth/me rejected")
    
    def test_logout(self):
        """Test logout endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Logged out"
        print("SUCCESS: Logout successful")


@pytest.fixture
def auth_token():
    """Get authentication token for admin"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestTasks:
    """Task CRUD endpoint tests"""
    
    def test_create_task(self, auth_headers):
        """Test task creation"""
        response = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Task from pytest",
            "task_type": "work",
            "priority": "high",
            "effort": "2h"
        }, headers=auth_headers)
        assert response.status_code == 200, f"Task creation failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Task from pytest"
        assert data["priority"] == "high"
        print(f"SUCCESS: Task created with id {data['id']}")
        return data["id"]
    
    def test_create_task_with_ai_autofill(self, auth_headers):
        """Test task creation with AI auto-fill (no priority/type specified)"""
        response = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Review quarterly report and prepare presentation"
        }, headers=auth_headers)
        assert response.status_code == 200, f"Task creation failed: {response.text}"
        data = response.json()
        assert "id" in data
        # AI should have filled in type and priority
        assert data["task_type"] is not None
        assert data["priority"] is not None
        print(f"SUCCESS: Task created with AI auto-fill - type: {data['task_type']}, priority: {data['priority']}")
    
    def test_get_tasks(self, auth_headers):
        """Test getting all tasks"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Retrieved {len(data)} tasks")
    
    def test_get_tasks_with_filter(self, auth_headers):
        """Test getting tasks with status filter"""
        response = requests.get(f"{BASE_URL}/api/tasks?status=pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned tasks should be pending
        for task in data:
            assert task["status"] == "pending"
        print(f"SUCCESS: Retrieved {len(data)} pending tasks")
    
    def test_update_task(self, auth_headers):
        """Test task update"""
        # First create a task
        create_resp = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Task to update"
        }, headers=auth_headers)
        task_id = create_resp.json()["id"]
        
        # Update it
        response = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={
            "status": "in_progress",
            "priority": "critical"
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["priority"] == "critical"
        print(f"SUCCESS: Task {task_id} updated")
    
    def test_complete_task(self, auth_headers):
        """Test marking task as done"""
        # Create a task
        create_resp = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Task to complete"
        }, headers=auth_headers)
        task_id = create_resp.json()["id"]
        
        # Mark as done
        response = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={
            "status": "done"
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "done"
        print(f"SUCCESS: Task {task_id} marked as done")
    
    def test_delete_task(self, auth_headers):
        """Test task deletion (soft delete)"""
        # Create a task
        create_resp = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": "TEST_Task to delete"
        }, headers=auth_headers)
        task_id = create_resp.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Task deleted"
        print(f"SUCCESS: Task {task_id} deleted")
    
    def test_brain_dump(self, auth_headers):
        """Test brain dump parsing (AI feature)"""
        response = requests.post(f"{BASE_URL}/api/tasks/brain-dump", json={
            "text": "I need to finish the project report, prepare for tomorrow's meeting, and buy groceries"
        }, headers=auth_headers, timeout=30)  # Longer timeout for AI
        assert response.status_code == 200, f"Brain dump failed: {response.text}"
        data = response.json()
        assert "tasks" in data
        assert "count" in data
        assert data["count"] > 0
        print(f"SUCCESS: Brain dump parsed {data['count']} tasks")
    
    def test_prioritize_tasks(self, auth_headers):
        """Test AI task prioritization"""
        response = requests.post(f"{BASE_URL}/api/tasks/prioritize", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        # May have rankings or message if no tasks
        assert "rankings" in data or "message" in data
        print(f"SUCCESS: Task prioritization returned: {data}")


class TestChat:
    """Chat/AI Advisor endpoint tests"""
    
    def test_send_chat_message(self, auth_headers):
        """Test sending a chat message to AURA"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "What should I focus on today?"
        }, headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        assert "response" in data
        assert "id" in data
        assert len(data["response"]) > 0
        print(f"SUCCESS: Chat response received: {data['response'][:100]}...")
    
    def test_get_chat_history(self, auth_headers):
        """Test getting chat history"""
        response = requests.get(f"{BASE_URL}/api/chat/history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Retrieved {len(data)} chat messages")
    
    def test_clear_chat_history(self, auth_headers):
        """Test clearing chat history"""
        response = requests.delete(f"{BASE_URL}/api/chat/history", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Chat history cleared"
        print("SUCCESS: Chat history cleared")


class TestFocus:
    """Focus/Pomodoro endpoint tests"""
    
    def test_start_focus_session(self, auth_headers):
        """Test starting a focus session"""
        response = requests.post(f"{BASE_URL}/api/focus/start", json={
            "duration_min": 25
        }, headers=auth_headers)
        assert response.status_code == 200, f"Focus start failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["duration_min"] == 25
        assert data["completed"] == False
        print(f"SUCCESS: Focus session started with id {data['id']}")
        return data["id"]
    
    def test_end_focus_session(self, auth_headers):
        """Test ending a focus session"""
        # Start a session first
        start_resp = requests.post(f"{BASE_URL}/api/focus/start", json={
            "duration_min": 15
        }, headers=auth_headers)
        session_id = start_resp.json()["id"]
        
        # End it
        response = requests.put(f"{BASE_URL}/api/focus/{session_id}/end", json={
            "completed": True
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] == True
        assert data["ended_at"] is not None
        print(f"SUCCESS: Focus session {session_id} ended")
    
    def test_get_focus_history(self, auth_headers):
        """Test getting focus session history"""
        response = requests.get(f"{BASE_URL}/api/focus/history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Retrieved {len(data)} focus sessions")


class TestAnalytics:
    """Analytics endpoint tests"""
    
    def test_weekly_analytics(self, auth_headers):
        """Test weekly analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "tasks_completed" in data
        assert "total_focus_minutes" in data
        assert "streak_days" in data
        print(f"SUCCESS: Weekly analytics - tasks: {data['tasks_completed']}, focus: {data['total_focus_minutes']}m")
    
    def test_procrastination_analytics(self, auth_headers):
        """Test procrastination analysis"""
        response = requests.get(f"{BASE_URL}/api/analytics/procrastination", headers=auth_headers, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "procrastination_rate" in data
        assert "analysis" in data
        print(f"SUCCESS: Procrastination rate: {data['procrastination_rate']}%")
    
    def test_burnout_analytics(self, auth_headers):
        """Test burnout monitor"""
        response = requests.get(f"{BASE_URL}/api/analytics/burnout", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "risk_level" in data
        assert "factors" in data
        print(f"SUCCESS: Burnout risk level: {data['risk_level']}")


class TestGoals:
    """Goals endpoint tests"""
    
    def test_create_goal(self, auth_headers):
        """Test goal creation with AI roadmap"""
        response = requests.post(f"{BASE_URL}/api/goals", json={
            "title": "TEST_Learn Python in 30 days",
            "deadline": "2026-03-01"
        }, headers=auth_headers, timeout=30)
        assert response.status_code == 200, f"Goal creation failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Learn Python in 30 days"
        assert "roadmap" in data
        print(f"SUCCESS: Goal created with {len(data.get('roadmap', []))} roadmap phases")
        return data["id"]
    
    def test_get_goals(self, auth_headers):
        """Test getting all goals"""
        response = requests.get(f"{BASE_URL}/api/goals", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Retrieved {len(data)} goals")
    
    def test_update_goal_progress(self, auth_headers):
        """Test updating goal progress"""
        # Create a goal first
        create_resp = requests.post(f"{BASE_URL}/api/goals", json={
            "title": "TEST_Goal for progress update"
        }, headers=auth_headers, timeout=30)
        goal_id = create_resp.json()["id"]
        
        # Update progress
        response = requests.put(f"{BASE_URL}/api/goals/{goal_id}/progress", json={
            "progress": 50
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Progress updated"
        print(f"SUCCESS: Goal {goal_id} progress updated to 50%")


class TestSettings:
    """Settings endpoint tests"""
    
    def test_get_settings(self, auth_headers):
        """Test getting user settings"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "email" in data
        assert "preferences" in data
        print(f"SUCCESS: Settings retrieved for {data['email']}")
    
    def test_update_settings(self, auth_headers):
        """Test updating user settings"""
        response = requests.put(f"{BASE_URL}/api/settings", json={
            "name": "Admin Updated",
            "productive_hours_start": "08:00",
            "productive_hours_end": "18:00",
            "focus_duration": 30,
            "break_duration": 10
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["preferences"]["productive_hours_start"] == "08:00"
        assert data["preferences"]["focus_duration"] == 30
        print(f"SUCCESS: Settings updated")
        
        # Restore original settings
        requests.put(f"{BASE_URL}/api/settings", json={
            "name": "Admin",
            "productive_hours_start": "09:00",
            "productive_hours_end": "17:00",
            "focus_duration": 25,
            "break_duration": 5
        }, headers=auth_headers)


class TestPlanner:
    """Planner endpoint tests"""
    
    def test_generate_plan(self, auth_headers):
        """Test generating daily plan"""
        response = requests.post(f"{BASE_URL}/api/planner/generate", headers=auth_headers, timeout=30)
        # May return 200 with schedule or message if no tasks
        assert response.status_code in [200, 422]
        data = response.json()
        print(f"SUCCESS: Planner response: {data}")
    
    def test_get_today_plan(self, auth_headers):
        """Test getting today's plan"""
        response = requests.get(f"{BASE_URL}/api/planner/today", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # May have schedule or message
        print(f"SUCCESS: Today's plan: {data}")


class TestNudges:
    """Nudge endpoint tests"""
    
    def test_get_pending_nudges(self, auth_headers):
        """Test getting pending nudges"""
        response = requests.get(f"{BASE_URL}/api/nudges/pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Retrieved {len(data)} pending nudges")


class TestProtectedRoutes:
    """Test that all protected routes require authentication"""
    
    def test_tasks_requires_auth(self):
        """Test tasks endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 401
        print("SUCCESS: /api/tasks requires auth")
    
    def test_chat_requires_auth(self):
        """Test chat endpoint requires auth"""
        response = requests.post(f"{BASE_URL}/api/chat", json={"message": "test"})
        assert response.status_code == 401
        print("SUCCESS: /api/chat requires auth")
    
    def test_focus_requires_auth(self):
        """Test focus endpoint requires auth"""
        response = requests.post(f"{BASE_URL}/api/focus/start", json={"duration_min": 25})
        assert response.status_code == 401
        print("SUCCESS: /api/focus/start requires auth")
    
    def test_analytics_requires_auth(self):
        """Test analytics endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/analytics/weekly")
        assert response.status_code == 401
        print("SUCCESS: /api/analytics/weekly requires auth")
    
    def test_goals_requires_auth(self):
        """Test goals endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/goals")
        assert response.status_code == 401
        print("SUCCESS: /api/goals requires auth")
    
    def test_settings_requires_auth(self):
        """Test settings endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 401
        print("SUCCESS: /api/settings requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
