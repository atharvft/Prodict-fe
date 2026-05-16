# AURA — Autonomous User Reasoning Advisor

## Architecture
- **Frontend**: React + Tailwind CSS + Recharts + Framer Motion + Zustand
- **Backend**: FastAPI (Python) + MongoDB
- **AI**: Google Gemini 2.0 Flash via `google.genai` SDK
- **Auth**: JWT (httpOnly cookies + Bearer token fallback)
- **Theme**: 3-mode system (Light / Moonlight / Dark) via CSS custom properties

## What's Been Implemented

### MVP Features (2026-05-16)
- [x] JWT Auth (register, login, logout, me, refresh)
- [x] AI Brain Dump (Gemini parses free-text into structured tasks)
- [x] Gemini Chat Advisor (conversational AI with history)
- [x] Smart Task CRUD with AI auto-fill priority/type/effort
- [x] Dynamic Daily Planner (Gemini generates schedules)
- [x] Focus Mode (Pomodoro timer with progress ring)
- [x] Anti-Procrastination Engine (postponement tracking + AI analysis)
- [x] Analytics Dashboard (bar chart, donut chart, burnout monitor)
- [x] Goals with AI-generated roadmaps
- [x] Settings (productive hours, nudge preferences, focus duration)

### V2 Features (2026-05-16)
- [x] Graceful error handling with fallbacks for Gemini API
- [x] Emotional Overwhelm Mode (calming 3-task focus)
- [x] Weekly Productivity Report (AI narrative + charts + grade)
- [x] Goal Breakdown (daily tasks from goal roadmap)

### V3 Features (2026-05-16)
- [x] Theme System: Light / Moonlight / Dark with CSS variables
- [x] Quote of the Day (rotating motivational quotes)
- [x] Custom AURA logo (user-provided mind/lotus icon)
- [x] Browser Distraction Monitor (log, track, charts, AI analysis)
- [x] Calendar View (weekly grid with tasks, schedules, focus sessions)
- [x] Voice Assistant (Web Speech API for chat + brain dump + tasks)
- [x] Theme-aware styling for ALL pages

### Testing Results
- Backend: 100% across all iterations (MVP + V2 + V3)
- Frontend: 100% across all iterations

## Prioritized Backlog
### P1
- [ ] Gmail Task Extraction
- [ ] Google Calendar two-way sync (requires OAuth setup)
- [ ] Real-time nudge notifications via WebSockets

### P2
- [ ] WhatsApp Bot integration
- [ ] Chrome extension for distraction auto-tracking
- [ ] Vector memory (Pinecone) for long-term personalization

### P3
- [ ] Mobile responsive optimization
- [ ] Data export option
- [ ] Multi-language support
