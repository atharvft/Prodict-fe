from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import json
import uuid
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional
from google import genai

import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gemini setup
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY', ''))

# JWT config
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret')
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Pydantic Models ────────────────────────────────────────────
class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class TaskCreate(BaseModel):
    title: str
    task_type: Optional[str] = None
    priority: Optional[str] = None
    effort: Optional[str] = None
    deadline: Optional[str] = None
    status: str = "pending"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    task_type: Optional[str] = None
    priority: Optional[str] = None
    effort: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

class BrainDumpInput(BaseModel):
    text: str

class ChatInput(BaseModel):
    message: str

class FocusStartInput(BaseModel):
    task_id: Optional[str] = None
    duration_min: int = 25

class FocusEndInput(BaseModel):
    completed: bool = False

class GoalCreate(BaseModel):
    title: str
    deadline: Optional[str] = None

class GoalProgressUpdate(BaseModel):
    progress: int

class SettingsUpdate(BaseModel):
    name: Optional[str] = None
    productive_hours_start: Optional[str] = None
    productive_hours_end: Optional[str] = None
    nudge_enabled: Optional[bool] = None
    focus_duration: Optional[int] = None
    break_duration: Optional[int] = None

# ─── Auth Helpers ────────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

def serialize_user(user: dict) -> dict:
    u = {**user}
    u["id"] = str(u.pop("_id"))
    u.pop("password_hash", None)
    return u

# ─── Gemini Agent Helpers ────────────────────────────────────────
CHAT_SYSTEM_PROMPT = """You are AURA, an autonomous AI productivity and life advisor.
Your role is to help users prioritize tasks, manage their energy, reduce overwhelm,
and make better decisions about their time and career.
Be empathetic, direct, and always actionable. Avoid generic advice.
When a user shares tasks, help them identify the single most important thing to do next.
When a user expresses stress, acknowledge it first, then simplify their situation.
Always respond in 2-4 sentences unless a detailed plan is explicitly requested.
User context will be provided as JSON. Use it to personalize every response."""

TASK_PARSE_PROMPT = """You are a task parsing engine.
Extract all tasks from the user's input and return ONLY a valid JSON array.
No preamble, no explanation, no markdown code blocks.
For each task return:
{ "task": string, "type": "work|personal|health|career|learning|admin",
  "priority": "low|medium|high|critical", "effort": string, "deadline": null }
Estimate effort as a human-readable duration string (e.g. "30m", "2h", "half-day").
If no deadline is mentioned, set deadline to null."""

PLANNER_PROMPT = """You are a daily schedule generator.
Given a list of tasks and the current time, generate a realistic daily schedule.
Return ONLY valid JSON in this format:
{ "date": "YYYY-MM-DD", "blocks": [
  { "start": "HH:MM", "end": "HH:MM", "type": "work|break|admin", "task_id": null, "label": string }
]}
Rules:
- No more than 90 minutes of deep work without a break
- Include at least 2 proper breaks
- Leave 20% buffer time for unexpected tasks
- Prioritize high-priority tasks first
- Start from the current time or next available hour
- Use 24-hour time format"""

PRIORITIZE_PROMPT = """You are a task prioritization engine.
Given a list of tasks with their properties, re-rank them by importance.
Consider: deadlines, effort, priority level, task type, and dependencies.
Return ONLY a valid JSON array of objects with:
{ "task_id": string, "rank": number, "rationale": string }
Rank 1 is the most important. Keep rationale to one sentence."""

PROCRASTINATION_PROMPT = """You are a procrastination detection agent.
Analyze the user's task behavior data and identify procrastination patterns.
Look for: repeatedly postponed tasks, avoided task types, incomplete focus sessions.
Return a JSON object:
{ "risk_level": "low|medium|high", "patterns": [string], "suggestions": [string] }
Be empathetic but honest. Limit to 3 patterns and 3 suggestions."""

async def call_gemini(prompt: str, user_input: str) -> str:
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt + "\n\n" + user_input]
        )
        return response.text
    except Exception as e:
        error_str = str(e)
        logger.error(f"Gemini API error: {error_str}")
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
            return None  # Signal rate limit - let callers use fallback
        return None  # Any Gemini failure returns None for graceful fallback

def fallback_parse_tasks(text: str) -> list:
    """Simple regex-based task parser when Gemini is unavailable."""
    separators = re.split(r'[,;\n]+|(?:\band\b)', text)
    tasks = []
    for chunk in separators:
        chunk = chunk.strip().strip('.-•')
        if len(chunk) > 2:
            priority = "medium"
            task_type = "work"
            effort = "1h"
            lower = chunk.lower()
            if any(w in lower for w in ['urgent', 'asap', 'deadline', 'important']):
                priority = "high"
            if any(w in lower for w in ['gym', 'run', 'exercise', 'workout', 'health']):
                task_type = "health"
                effort = "1h"
            elif any(w in lower for w in ['buy', 'groceries', 'clean', 'cook', 'laundry']):
                task_type = "personal"
                effort = "30m"
            elif any(w in lower for w in ['study', 'learn', 'read', 'course', 'practice']):
                task_type = "learning"
                effort = "2h"
            elif any(w in lower for w in ['interview', 'resume', 'job', 'career', 'apply']):
                task_type = "career"
                effort = "2h"
            tasks.append({"task": chunk.capitalize(), "type": task_type, "priority": priority, "effort": effort, "deadline": None})
    return tasks if tasks else [{"task": text.strip().capitalize(), "type": "work", "priority": "medium", "effort": "1h", "deadline": None}]

def fallback_prioritize(tasks: list) -> list:
    """Priority-based sorting when Gemini is unavailable."""
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_tasks = sorted(tasks, key=lambda t: order.get(t.get("priority", "medium"), 2))
    return [{"task_id": t["id"], "rank": i + 1, "rationale": f"Ranked by priority level: {t.get('priority', 'medium')}"} for i, t in enumerate(sorted_tasks)]

def fallback_schedule(tasks: list) -> dict:
    """Generate a basic schedule when Gemini is unavailable."""
    now = datetime.now(timezone.utc)
    blocks = []
    hour = max(now.hour + 1, 9)
    for t in tasks[:6]:
        if hour >= 18:
            break
        blocks.append({"start": f"{hour:02d}:00", "end": f"{hour+1:02d}:00", "type": "work", "task_id": t.get("id"), "label": t["title"]})
        hour += 1
        if len(blocks) % 2 == 0:
            blocks.append({"start": f"{hour:02d}:00", "end": f"{hour:02d}:15", "type": "break", "task_id": None, "label": "Break"})
            hour += 1
    return {"date": now.strftime("%Y-%m-%d"), "blocks": blocks}

def parse_json_response(text: str):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = lines[1:] if lines[0].startswith("```") else lines
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find('[')
        end = cleaned.rfind(']')
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start:end+1])
            except json.JSONDecodeError:
                pass
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start:end+1])
            except json.JSONDecodeError:
                pass
        return None

# ─── Auth Routes ─────────────────────────────────────────────────
@api_router.post("/auth/register")
async def register(input_data: RegisterInput, response: Response):
    email = input_data.email.strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "name": input_data.name.strip(),
        "email": email,
        "password_hash": hash_password(input_data.password),
        "preferences": {"productive_hours_start": "09:00", "productive_hours_end": "17:00", "nudge_enabled": True, "focus_duration": 25, "break_duration": 5},
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    access_token = create_access_token(str(result.inserted_id), email)
    refresh_token = create_refresh_token(str(result.inserted_id))
    set_auth_cookies(response, access_token, refresh_token)
    serialized = serialize_user(user_doc)
    serialized["access_token"] = access_token
    return serialized

@api_router.post("/auth/login")
async def login(input_data: LoginInput, response: Response):
    email = input_data.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(input_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(str(user["_id"]), email)
    refresh_token = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access_token, refresh_token)
    serialized = serialize_user(user)
    serialized["access_token"] = access_token
    return serialized

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        new_access = create_access_token(str(user["_id"]), user["email"])
        set_auth_cookies(response, new_access, token)
        return {"access_token": new_access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ─── Task Routes ─────────────────────────────────────────────────
@api_router.get("/tasks")
async def get_tasks(status: Optional[str] = None, priority: Optional[str] = None, task_type: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"user_id": user["_id"], "status": {"$ne": "deleted"}}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if task_type:
        query["task_type"] = task_type
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return tasks

@api_router.post("/tasks")
async def create_task(task: TaskCreate, user: dict = Depends(get_current_user)):
    task_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "title": task.title,
        "task_type": task.task_type or "work",
        "priority": task.priority or "medium",
        "effort": task.effort or "1h",
        "deadline": task.deadline,
        "status": task.status,
        "postpone_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if not task.priority or not task.task_type or not task.effort:
        try:
            ai_prompt = f"Analyze this task and return JSON with fields: type (work|personal|health|career|learning|admin), priority (low|medium|high|critical), effort (e.g. '30m', '2h'). Task: {task.title}. Return ONLY valid JSON object."
            ai_response = await call_gemini(ai_prompt, task.title)
            parsed = parse_json_response(ai_response)
            if parsed and isinstance(parsed, dict):
                if not task.task_type and "type" in parsed:
                    task_doc["task_type"] = parsed["type"]
                if not task.priority and "priority" in parsed:
                    task_doc["priority"] = parsed["priority"]
                if not task.effort and "effort" in parsed:
                    task_doc["effort"] = parsed["effort"]
        except Exception as e:
            logger.warning(f"AI auto-fill failed: {e}")
    await db.tasks.insert_one({**task_doc, "_id": ObjectId()})
    return task_doc

@api_router.post("/tasks/brain-dump")
async def brain_dump(input_data: BrainDumpInput, user: dict = Depends(get_current_user)):
    ai_response = await call_gemini(TASK_PARSE_PROMPT, input_data.text)
    parsed = parse_json_response(ai_response) if ai_response else None
    ai_unavailable = False
    if not parsed or not isinstance(parsed, list):
        parsed = fallback_parse_tasks(input_data.text)
        ai_unavailable = True
    created_tasks = []
    for item in parsed:
        task_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["_id"],
            "title": item.get("task", "Untitled"),
            "task_type": item.get("type", "work"),
            "priority": item.get("priority", "medium"),
            "effort": item.get("effort", "1h"),
            "deadline": item.get("deadline"),
            "status": "pending",
            "postpone_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tasks.insert_one({**task_doc, "_id": ObjectId()})
        created_tasks.append(task_doc)
    await db.behavior_logs.insert_one({"_id": ObjectId(), "user_id": user["_id"], "action": "brain_dump", "metadata": {"task_count": len(created_tasks)}, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"tasks": created_tasks, "count": len(created_tasks), "ai_unavailable": ai_unavailable}

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task_update: TaskUpdate, user: dict = Depends(get_current_user)):
    existing = await db.tasks.find_one({"id": task_id, "user_id": user["_id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if task_update.status == "deferred" and existing.get("status") != "deferred":
        update_data["postpone_count"] = existing.get("postpone_count", 0) + 1
        await db.behavior_logs.insert_one({"_id": ObjectId(), "user_id": user["_id"], "action": "task_postponed", "metadata": {"task_id": task_id, "postpone_count": update_data["postpone_count"]}, "created_at": datetime.now(timezone.utc).isoformat()})
    if task_update.status == "done":
        await db.behavior_logs.insert_one({"_id": ObjectId(), "user_id": user["_id"], "action": "task_completed", "metadata": {"task_id": task_id}, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return updated

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    result = await db.tasks.update_one({"id": task_id, "user_id": user["_id"]}, {"$set": {"status": "deleted", "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

@api_router.post("/tasks/prioritize")
async def prioritize_tasks(user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": user["_id"], "status": {"$in": ["pending", "in_progress"]}}, {"_id": 0}).to_list(50)
    if not tasks:
        return {"rankings": [], "message": "No tasks to prioritize"}
    tasks_json = json.dumps([{"id": t["id"], "title": t["title"], "priority": t["priority"], "effort": t["effort"], "deadline": t.get("deadline"), "type": t["task_type"]} for t in tasks])
    ai_response = await call_gemini(PRIORITIZE_PROMPT, tasks_json)
    parsed = parse_json_response(ai_response) if ai_response else None
    if not parsed:
        parsed = fallback_prioritize(tasks)
        return {"rankings": parsed, "ai_unavailable": True}
    return {"rankings": parsed, "ai_unavailable": False}

# ─── Chat Routes ─────────────────────────────────────────────────
@api_router.post("/chat")
async def send_chat(input_data: ChatInput, user: dict = Depends(get_current_user)):
    recent = await db.conversations.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(10)
    history_text = ""
    for conv in reversed(recent):
        history_text += f"User: {conv['message']}\nAURA: {conv['response']}\n"
    tasks = await db.tasks.find({"user_id": user["_id"], "status": {"$in": ["pending", "in_progress"]}}, {"_id": 0, "user_id": 0}).to_list(10)
    context = f"""Previous conversation:
{history_text}
User's current tasks: {json.dumps(tasks, default=str)}
User name: {user.get('name', 'User')}"""
    full_prompt = CHAT_SYSTEM_PROMPT + "\n\nContext:\n" + context
    ai_response = await call_gemini(full_prompt, input_data.message)
    if not ai_response:
        ai_response = f"I'm taking a brief pause to recharge my AI capabilities. In the meantime, here's what I can see: you have {len(tasks)} active tasks. Focus on the highest priority one first, and take it one step at a time. I'll be back to full capacity shortly!"
        ai_unavailable = True
    else:
        ai_unavailable = False
    conv_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "message": input_data.message,
        "response": ai_response,
        "agent": "chat_advisor",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.conversations.insert_one({**conv_doc, "_id": ObjectId()})
    return {"response": ai_response, "id": conv_doc["id"], "ai_unavailable": ai_unavailable}

@api_router.get("/chat/history")
async def get_chat_history(limit: int = 50, user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    conversations.reverse()
    return conversations

@api_router.delete("/chat/history")
async def clear_chat_history(user: dict = Depends(get_current_user)):
    await db.conversations.delete_many({"user_id": user["_id"]})
    return {"message": "Chat history cleared"}

# ─── Planner Routes ─────────────────────────────────────────────
@api_router.post("/planner/generate")
async def generate_plan(user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": user["_id"], "status": {"$in": ["pending", "in_progress"]}}, {"_id": 0}).to_list(20)
    if not tasks:
        return {"message": "No tasks to plan", "schedule": None}
    now = datetime.now(timezone.utc)
    tasks_json = json.dumps([{"id": t["id"], "title": t["title"], "priority": t["priority"], "effort": t["effort"], "type": t["task_type"]} for t in tasks])
    input_text = f"Current time: {now.strftime('%H:%M')}. Tasks: {tasks_json}"
    ai_response = await call_gemini(PLANNER_PROMPT, input_text)
    parsed = parse_json_response(ai_response) if ai_response else None
    ai_unavailable = False
    if not parsed:
        parsed = fallback_schedule(tasks)
        ai_unavailable = True
    today = now.strftime("%Y-%m-%d")
    schedule_doc = {"id": str(uuid.uuid4()), "user_id": user["_id"], "date": today, "plan": parsed, "generated_at": datetime.now(timezone.utc).isoformat(), "ai_unavailable": ai_unavailable}
    await db.schedules.update_one({"user_id": user["_id"], "date": today}, {"$set": schedule_doc}, upsert=True)
    return schedule_doc

@api_router.get("/planner/today")
async def get_today_plan(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    schedule = await db.schedules.find_one({"user_id": user["_id"], "date": today}, {"_id": 0})
    if not schedule:
        return {"message": "No schedule for today", "schedule": None}
    return schedule

# ─── Focus Routes ────────────────────────────────────────────────
@api_router.post("/focus/start")
async def start_focus(input_data: FocusStartInput, user: dict = Depends(get_current_user)):
    session_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "task_id": input_data.task_id,
        "duration_min": input_data.duration_min,
        "actual_min": 0,
        "completed": False,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None
    }
    await db.focus_sessions.insert_one({**session_doc, "_id": ObjectId()})
    await db.behavior_logs.insert_one({"_id": ObjectId(), "user_id": user["_id"], "action": "focus_started", "metadata": {"session_id": session_doc["id"], "task_id": input_data.task_id}, "created_at": datetime.now(timezone.utc).isoformat()})
    return session_doc

@api_router.put("/focus/{session_id}/end")
async def end_focus(session_id: str, input_data: FocusEndInput, user: dict = Depends(get_current_user)):
    session = await db.focus_sessions.find_one({"id": session_id, "user_id": user["_id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    started = datetime.fromisoformat(session["started_at"])
    now = datetime.now(timezone.utc)
    actual_min = int((now - started).total_seconds() / 60)
    update = {"ended_at": now.isoformat(), "actual_min": actual_min, "completed": input_data.completed}
    await db.focus_sessions.update_one({"id": session_id}, {"$set": update})
    action = "focus_completed" if input_data.completed else "focus_abandoned"
    await db.behavior_logs.insert_one({"_id": ObjectId(), "user_id": user["_id"], "action": action, "metadata": {"session_id": session_id, "actual_min": actual_min}, "created_at": datetime.now(timezone.utc).isoformat()})
    return {**session, **update, "_id": None}

@api_router.get("/focus/history")
async def get_focus_history(user: dict = Depends(get_current_user)):
    sessions = await db.focus_sessions.find({"user_id": user["_id"]}, {"_id": 0}).sort("started_at", -1).to_list(50)
    return sessions

# ─── Analytics Routes ────────────────────────────────────────────
@api_router.get("/analytics/weekly")
async def weekly_analytics(user: dict = Depends(get_current_user)):
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    tasks_done = await db.tasks.find({"user_id": user["_id"], "status": "done", "updated_at": {"$gte": week_ago}}, {"_id": 0}).to_list(200)
    focus_sessions = await db.focus_sessions.find({"user_id": user["_id"], "started_at": {"$gte": week_ago}}, {"_id": 0}).to_list(200)
    all_tasks = await db.tasks.find({"user_id": user["_id"], "status": {"$ne": "deleted"}}, {"_id": 0}).to_list(200)
    total_focus_min = sum(s.get("actual_min", 0) for s in focus_sessions)
    completed_sessions = len([s for s in focus_sessions if s.get("completed")])
    daily_data = {}
    for t in tasks_done:
        day = t.get("updated_at", "")[:10]
        if day:
            daily_data[day] = daily_data.get(day, 0) + 1
    type_breakdown = {}
    for t in all_tasks:
        tt = t.get("task_type", "other")
        type_breakdown[tt] = type_breakdown.get(tt, 0) + 1
    streak = 0
    for i in range(7):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        if daily_data.get(day, 0) > 0:
            streak += 1
        else:
            break
    return {
        "tasks_completed": len(tasks_done),
        "total_focus_minutes": total_focus_min,
        "completed_sessions": completed_sessions,
        "total_sessions": len(focus_sessions),
        "streak_days": streak,
        "daily_completions": [{"date": k, "count": v} for k, v in sorted(daily_data.items())],
        "task_type_breakdown": [{"type": k, "count": v} for k, v in type_breakdown.items()],
        "total_tasks": len(all_tasks)
    }

@api_router.get("/analytics/procrastination")
async def procrastination_analytics(user: dict = Depends(get_current_user)):
    postponed = await db.tasks.find({"user_id": user["_id"], "postpone_count": {"$gt": 0}, "status": {"$ne": "deleted"}}, {"_id": 0}).to_list(50)
    all_tasks = await db.tasks.count_documents({"user_id": user["_id"], "status": {"$ne": "deleted"}})
    rate = len(postponed) / max(all_tasks, 1) * 100
    if postponed:
        behavior_data = json.dumps([{"title": t["title"], "postpone_count": t["postpone_count"], "type": t["task_type"]} for t in postponed[:10]])
        try:
            ai_response = await call_gemini(PROCRASTINATION_PROMPT, behavior_data)
            analysis = parse_json_response(ai_response)
        except Exception:
            analysis = {"risk_level": "low", "patterns": [], "suggestions": []}
    else:
        analysis = {"risk_level": "low", "patterns": ["No procrastination patterns detected"], "suggestions": ["Keep up the great work!"]}
    return {"procrastination_rate": round(rate, 1), "postponed_tasks": postponed, "analysis": analysis}

@api_router.get("/analytics/burnout")
async def burnout_analytics(user: dict = Depends(get_current_user)):
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    focus_sessions = await db.focus_sessions.find({"user_id": user["_id"], "started_at": {"$gte": week_ago}}, {"_id": 0}).to_list(100)
    tasks = await db.tasks.find({"user_id": user["_id"], "status": {"$ne": "deleted"}, "created_at": {"$gte": week_ago}}, {"_id": 0}).to_list(100)
    total_focus = sum(s.get("actual_min", 0) for s in focus_sessions)
    high_effort = len([t for t in tasks if t.get("priority") in ["high", "critical"]])
    completed = len([t for t in tasks if t.get("status") == "done"])
    completion_rate = completed / max(len(tasks), 1) * 100
    risk = "low"
    factors = []
    if total_focus > 300:
        risk = "medium"
        factors.append("High focus time this week (over 5 hours)")
    if high_effort > 5:
        risk = "medium" if risk == "low" else "high"
        factors.append(f"{high_effort} high-priority tasks this week")
    if completion_rate < 30 and len(tasks) > 3:
        risk = "medium" if risk == "low" else "high"
        factors.append(f"Low completion rate ({completion_rate:.0f}%)")
    if not factors:
        factors.append("Workload appears balanced")
    return {"risk_level": risk, "factors": factors, "total_focus_minutes": total_focus, "completion_rate": round(completion_rate, 1)}

# ─── Goal Routes ─────────────────────────────────────────────────
@api_router.post("/goals")
async def create_goal(goal: GoalCreate, user: dict = Depends(get_current_user)):
    roadmap_prompt = f"Create a phased roadmap for this goal. Return ONLY a valid JSON array of phases: [{{\"phase\": number, \"title\": string, \"tasks\": [string], \"duration\": string}}]. Goal: {goal.title}. Deadline: {goal.deadline or 'No specific deadline'}."
    try:
        ai_response = await call_gemini(roadmap_prompt, goal.title)
        roadmap = parse_json_response(ai_response)
    except Exception:
        roadmap = []
    goal_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "title": goal.title,
        "deadline": goal.deadline,
        "roadmap": roadmap or [],
        "progress": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.goals.insert_one({**goal_doc, "_id": ObjectId()})
    return goal_doc

@api_router.get("/goals")
async def get_goals(user: dict = Depends(get_current_user)):
    goals = await db.goals.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return goals

@api_router.put("/goals/{goal_id}/progress")
async def update_goal_progress(goal_id: str, input_data: GoalProgressUpdate, user: dict = Depends(get_current_user)):
    result = await db.goals.update_one({"id": goal_id, "user_id": user["_id"]}, {"$set": {"progress": min(max(input_data.progress, 0), 100)}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Progress updated"}

# ─── Settings Routes ─────────────────────────────────────────────
@api_router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    return {"name": user.get("name", ""), "email": user.get("email", ""), "preferences": user.get("preferences", {})}

@api_router.put("/settings")
async def update_settings(settings: SettingsUpdate, user: dict = Depends(get_current_user)):
    update = {}
    if settings.name:
        update["name"] = settings.name
    prefs = {}
    if settings.productive_hours_start:
        prefs["productive_hours_start"] = settings.productive_hours_start
    if settings.productive_hours_end:
        prefs["productive_hours_end"] = settings.productive_hours_end
    if settings.nudge_enabled is not None:
        prefs["nudge_enabled"] = settings.nudge_enabled
    if settings.focus_duration:
        prefs["focus_duration"] = settings.focus_duration
    if settings.break_duration:
        prefs["break_duration"] = settings.break_duration
    if prefs:
        for k, v in prefs.items():
            update[f"preferences.{k}"] = v
    if update:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {"name": updated_user.get("name", ""), "email": updated_user.get("email", ""), "preferences": updated_user.get("preferences", {})}

# ─── Nudge Routes ────────────────────────────────────────────────
@api_router.get("/nudges/pending")
async def get_pending_nudges(user: dict = Depends(get_current_user)):
    nudges = await db.nudges.find({"user_id": user["_id"], "delivered": False}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return nudges

@api_router.put("/nudges/{nudge_id}/delivered")
async def mark_nudge_delivered(nudge_id: str, user: dict = Depends(get_current_user)):
    await db.nudges.update_one({"id": nudge_id, "user_id": user["_id"]}, {"$set": {"delivered": True, "delivered_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Nudge marked as delivered"}

# ─── V2: Emotional Overwhelm Mode ────────────────────────────────
OVERWHELM_PROMPT = """You are AURA in calm mode. The user is feeling overwhelmed.
Given their task list, pick ONLY the 3 most important tasks for today.
Return valid JSON: { "message": string (2-3 calming sentences), "focus_tasks": [{"title": string, "why": string}] }
Be warm, empathetic, and reassuring. Simplify everything."""

@api_router.post("/overwhelm")
async def overwhelm_mode(user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": user["_id"], "status": {"$in": ["pending", "in_progress"]}}, {"_id": 0}).to_list(20)
    await db.behavior_logs.insert_one({"_id": ObjectId(), "user_id": user["_id"], "action": "overwhelm_triggered", "metadata": {}, "created_at": datetime.now(timezone.utc).isoformat()})
    if not tasks:
        return {"message": "You have a clean slate today. Take a deep breath. There's nothing urgent. Use this space to rest or start something small that brings you joy.", "focus_tasks": [], "ai_unavailable": False}
    tasks_json = json.dumps([{"title": t["title"], "priority": t["priority"], "effort": t["effort"], "type": t["task_type"]} for t in tasks[:10]])
    ai_response = await call_gemini(OVERWHELM_PROMPT, f"User name: {user.get('name', 'friend')}. Tasks: {tasks_json}")
    parsed = parse_json_response(ai_response) if ai_response else None
    if parsed and isinstance(parsed, dict):
        return {**parsed, "ai_unavailable": False}
    # Fallback: pick top 3 by priority
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_tasks = sorted(tasks, key=lambda t: priority_order.get(t.get("priority", "medium"), 2))[:3]
    return {
        "message": f"Hey {user.get('name', 'there').split(' ')[0]}, take a breath. You don't need to do everything today. Here are just 3 things to focus on. Everything else can wait.",
        "focus_tasks": [{"title": t["title"], "why": f"This is your {t.get('priority', 'medium')} priority {t.get('task_type', 'work')} task"} for t in sorted_tasks],
        "ai_unavailable": True
    }

# ─── V2: Weekly Productivity Report ─────────────────────────────
WEEKLY_REPORT_PROMPT = """You are AURA generating a weekly productivity report.
Given the user's weekly data (tasks completed, focus time, procrastination patterns, streaks),
write a personalized 3-4 paragraph narrative report. Be encouraging, specific, and give 2-3 actionable recommendations.
Return valid JSON: { "narrative": string, "highlights": [string], "recommendations": [string], "grade": "A|B|C|D" }"""

@api_router.get("/analytics/weekly-report")
async def weekly_report(user: dict = Depends(get_current_user)):
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    tasks_done = await db.tasks.find({"user_id": user["_id"], "status": "done", "updated_at": {"$gte": week_ago}}, {"_id": 0}).to_list(200)
    all_tasks = await db.tasks.find({"user_id": user["_id"], "status": {"$ne": "deleted"}}, {"_id": 0}).to_list(200)
    focus_sessions = await db.focus_sessions.find({"user_id": user["_id"], "started_at": {"$gte": week_ago}}, {"_id": 0}).to_list(200)
    postponed = await db.tasks.find({"user_id": user["_id"], "postpone_count": {"$gt": 0}, "status": {"$ne": "deleted"}}, {"_id": 0}).to_list(50)
    total_focus = sum(s.get("actual_min", 0) for s in focus_sessions)
    completed_sessions = len([s for s in focus_sessions if s.get("completed")])
    completion_rate = len(tasks_done) / max(len(all_tasks), 1) * 100
    # Daily breakdown
    daily_data = {}
    for i in range(7):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_data[day] = 0
    for t in tasks_done:
        day = t.get("updated_at", "")[:10]
        if day in daily_data:
            daily_data[day] += 1
    # Focus time per day
    daily_focus = {}
    for s in focus_sessions:
        day = s.get("started_at", "")[:10]
        daily_focus[day] = daily_focus.get(day, 0) + s.get("actual_min", 0)
    stats = {
        "tasks_completed": len(tasks_done), "total_tasks": len(all_tasks),
        "total_focus_minutes": total_focus, "completed_sessions": completed_sessions,
        "total_sessions": len(focus_sessions), "postponed_count": len(postponed),
        "completion_rate": round(completion_rate, 1), "user_name": user.get("name", "User")
    }
    ai_response = await call_gemini(WEEKLY_REPORT_PROMPT, json.dumps(stats))
    parsed = parse_json_response(ai_response) if ai_response else None
    if not parsed or not isinstance(parsed, dict):
        # Fallback narrative
        grade = "A" if completion_rate > 70 else "B" if completion_rate > 50 else "C" if completion_rate > 30 else "D"
        parsed = {
            "narrative": f"This week you completed {len(tasks_done)} tasks with {total_focus} minutes of focused work across {len(focus_sessions)} sessions. Your completion rate is {completion_rate:.0f}%. {'Great momentum! Keep it up.' if completion_rate > 50 else 'There is room to improve. Try breaking tasks into smaller pieces.'}",
            "highlights": [f"{len(tasks_done)} tasks completed", f"{total_focus} minutes of focus time", f"{completed_sessions}/{len(focus_sessions)} focus sessions completed"],
            "recommendations": ["Start each day by reviewing your top 3 priorities", "Use the Pomodoro timer for deep work blocks", "Break large tasks into smaller subtasks"],
            "grade": grade
        }
        ai_unavailable = True
    else:
        ai_unavailable = False
    return {
        **parsed, "stats": stats, "ai_unavailable": ai_unavailable,
        "daily_completions": [{"date": k, "count": v} for k, v in sorted(daily_data.items())],
        "daily_focus": [{"date": k, "minutes": v} for k, v in sorted(daily_focus.items())]
    }

# ─── V2: Goal Breakdown (daily tasks from goal) ─────────────────
GOAL_BREAKDOWN_PROMPT = """You are AURA, a goal breakdown specialist.
Given a goal with its roadmap, generate 3-5 specific actionable tasks the user should do TODAY to make progress.
Return ONLY valid JSON array: [{"title": string, "effort": string, "priority": string}]
Make tasks concrete, small (under 2 hours each), and immediately actionable."""

@api_router.post("/goals/{goal_id}/breakdown")
async def goal_breakdown(goal_id: str, user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": user["_id"]}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    input_text = f"Goal: {goal['title']}. Progress: {goal.get('progress', 0)}%. Roadmap: {json.dumps(goal.get('roadmap', []))}"
    ai_response = await call_gemini(GOAL_BREAKDOWN_PROMPT, input_text)
    parsed = parse_json_response(ai_response) if ai_response else None
    ai_unavailable = False
    if not parsed or not isinstance(parsed, list):
        # Fallback: extract tasks from roadmap phases
        roadmap = goal.get("roadmap", [])
        suggested = []
        for phase in roadmap:
            for task_title in phase.get("tasks", [])[:2]:
                suggested.append({"title": task_title, "effort": "1h", "priority": "medium"})
                if len(suggested) >= 3:
                    break
            if len(suggested) >= 3:
                break
        if not suggested:
            suggested = [{"title": f"Work on: {goal['title']}", "effort": "1h", "priority": "medium"}]
        parsed = suggested
        ai_unavailable = True
    return {"goal_id": goal_id, "goal_title": goal["title"], "daily_tasks": parsed, "ai_unavailable": ai_unavailable}

@api_router.post("/goals/{goal_id}/create-tasks")
async def create_goal_tasks(goal_id: str, user: dict = Depends(get_current_user)):
    """Create actual tasks from a goal breakdown."""
    goal = await db.goals.find_one({"id": goal_id, "user_id": user["_id"]}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    breakdown_result = await goal_breakdown(goal_id, user)
    created = []
    for item in breakdown_result.get("daily_tasks", []):
        task_doc = {
            "id": str(uuid.uuid4()), "user_id": user["_id"],
            "title": item.get("title", "Goal task"),
            "task_type": "learning", "priority": item.get("priority", "medium"),
            "effort": item.get("effort", "1h"), "deadline": None,
            "status": "pending", "postpone_count": 0,
            "goal_id": goal_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tasks.insert_one({**task_doc, "_id": ObjectId()})
        created.append(task_doc)
    return {"tasks": created, "count": len(created)}

# ─── Health Check ────────────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"message": "AURA API is running", "version": "1.0.0"}

# ─── App Setup ───────────────────────────────────────────────────
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.tasks.create_index([("user_id", 1), ("status", 1)])
    await db.conversations.create_index([("user_id", 1), ("created_at", -1)])
    await db.focus_sessions.create_index([("user_id", 1), ("started_at", -1)])
    await db.behavior_logs.create_index([("user_id", 1), ("created_at", -1)])
    await db.schedules.create_index([("user_id", 1), ("date", 1)])
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@aura.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "name": "Admin",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "preferences": {"productive_hours_start": "09:00", "productive_hours_end": "17:00", "nudge_enabled": True, "focus_duration": 25, "break_duration": 5},
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    logger.info("AURA backend started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
