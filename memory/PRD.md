# AURA — Autonomous User Reasoning Advisor

## Architecture
- **Frontend**: React + Tailwind CSS + Recharts + Framer Motion + Zustand
- **Backend**: FastAPI (Python) + MongoDB (adapted from PRD's Node.js + PostgreSQL)
- **AI**: Google Gemini 2.0 Flash via `google.genai` SDK
- **Auth**: JWT (httpOnly cookies + Bearer token fallback)

## Core Requirements
- 8 specialized AI agents (Chat Advisor, Task Intelligence, Prioritization, Procrastination Detection, Planner, Burnout Detection, Nudge, Memory)
- JWT Authentication
- AI Brain Dump (free-text → structured tasks)
- Gemini Chat Advisor
- Smart Task CRUD with AI auto-fill
- Dynamic Daily Planner
- Focus Mode (Pomodoro timer)
- Anti-Procrastination Engine
- Analytics Dashboard

## What's Been Implemented (2026-05-16)
### MVP Features - All Complete
- [x] JWT Auth (register, login, logout, me, refresh)
- [x] AI Brain Dump (Gemini parses free-text into structured tasks)
- [x] Gemini Chat Advisor (conversational AI with history)
- [x] Smart Task CRUD with AI auto-fill priority/type/effort
- [x] Dynamic Daily Planner (Gemini generates Pomodoro-style schedules)
- [x] Focus Mode (Pomodoro timer with progress ring, pause/resume)
- [x] Anti-Procrastination Engine (postponement tracking + AI analysis)
- [x] Analytics Dashboard (bar chart, donut chart, burnout monitor)
- [x] Goals with AI-generated roadmaps
- [x] Settings (productive hours, nudge preferences, focus duration)
- [x] Custom AURA logo updated to user-provided mind/lotus icon (2026-05-16)

### Testing Results
- Backend: 90% (37/41 passed, 4 failures due to Gemini API rate limits)
- Frontend: 100% (all pages load and function correctly)

## User Personas
- Overwhelmed professionals needing AI-guided task prioritization
- Students managing academic workload with procrastination tendencies
- Remote workers needing structure and focus sessions

## Prioritized Backlog
### P0 (Critical)
- [ ] Gemini API error handling with graceful fallbacks
- [ ] Retry logic for AI calls

### P1 (High)
- [ ] Emotional Overwhelm Mode (simplified 3-task view)
- [ ] Weekly Productivity Report (auto-generated narrative + charts)
- [ ] Real-time nudge notifications

### P2 (Medium)
- [ ] Goal Breakdown with daily task suggestions
- [ ] Personalized recommendations from Memory Agent
- [ ] Socket.io integration for live updates
- [ ] Vector memory (Pinecone) for long-term personalization

### P3 (Low/V3)
- [ ] Browser Distraction Monitor
- [ ] Gmail Task Extraction
- [ ] Google Calendar Sync
- [ ] Voice Assistant
