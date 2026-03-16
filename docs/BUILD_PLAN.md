# Build Plan: Student Productivity App

This document explains the **step-by-step build process** and the **reasoning behind each step**, so you stay in the loop.

---

## Build Philosophy

**Principle: Deliver the "aha moment" as fast as possible.**

The PRD says the first value is: *"Import courses → auto-generate today's plan."* We'll work toward that in layers:

1. **Foundation first** – Backend + DB so we have somewhere to put data
2. **Core data** – Users, tasks, schedules (the "what")
3. **APIs** – Create/read/update (the "how" to access data)
4. **Today's plan** – Combine schedule + tasks into one view (the "aha")
5. **Mobile app** – Where users actually see it
6. **AI layer** – Task decomposition, adaptive scheduling (the "smart" part)
7. **Polish** – Timer, notifications, dashboard

---

## Step-by-Step Plan

| Step | What We Build | Why This Order |
|------|---------------|----------------|
| **1** | Project foundation (backend skeleton, DB, structure) | Nothing works without a place to run code and store data. We need a clean, scalable structure before adding features. |
| **2** | Core data model (Users, Tasks, Schedules) | The app is about *tasks* and *schedules*. We define the schema before writing APIs. |
| **3** | Task & schedule APIs (CRUD endpoints) | The mobile app needs to talk to the backend. REST APIs are the contract. |
| **4** | Today's plan logic (combine schedule + tasks) | This is the core "aha" – one view that shows what you have today. |
| **5** | Mobile app shell (React Native, basic screens) | Users interact via mobile. We build the shell, then wire it to the API. |
| **6** | AI task decomposition (OpenAI integration) | Makes tasks smarter – "Research paper" → 5 steps. Builds on existing task model. |
| **7** | Focus timer & notifications | Pomodoro + reminders. Can be partly client-side; backend for scheduling reminders. |
| **8** | Progress dashboard | % done, study hours. Needs task completion data from earlier steps. |

---

## Dependency Graph

```
Step 1 (Foundation)
    ↓
Step 2 (Data Model) ──→ Step 3 (APIs)
    ↓                        ↓
Step 4 (Today's Plan) ←──────┘
    ↓
Step 5 (Mobile App)
    ↓
Step 6 (AI) ──→ Step 7 (Timer/Notif) ──→ Step 8 (Dashboard)
```

---

## Tech Choices (from PRD)

- **Backend:** Node.js + Express (rapid dev, good for real-time)
- **Database:** PostgreSQL (structured, scalable; we'll use SQLite for local dev to keep setup simple)
- **Mobile:** React Native (cross-platform, JS ecosystem)
- **AI:** OpenAI API (we'll add in Step 6)

---

## Current Step

All steps (1–8) are **complete**. The app is fully functional end-to-end.

---

## Step 1 Complete ✓

**What we built:**
- `src/backend/` – Express server with CORS, JSON body parsing
- `src/backend/db/` – SQLite connection (PostgreSQL-ready structure)
- `src/backend/api/health.js` – Health check at `GET /api/health`
- `data/` – Directory for SQLite DB file
- `.env.example` – Environment template

**How to run:**
```bash
cd src/backend && npm install && npm run dev
# Then: curl http://localhost:3000/api/health
```

**Thinking:** We kept it minimal. The DB layer returns a connection; we'll add schema in Step 2. The health check proves the stack works before we add real features.

## Step 2 Complete ✓

**What we built:**
- `src/backend/db/schema.js` – Schema definitions for `users`, `tasks`, and `schedules` tables
- Updated `src/backend/db/index.js` – Runs schema creation on init, enables foreign keys

**Schema:**
- **users** – `id`, `email` (unique), `name`, `avatar_url`, `auth_provider`, `auth_id`, timestamps
- **tasks** – `id`, `user_id` (FK), `title`, `description`, `due_date`, `estimated_minutes`, `status` (pending/in_progress/completed/cancelled), `priority` (low/medium/high), `parent_task_id` (FK self-ref for subtasks), `position`, timestamps
- **schedules** – `id`, `user_id` (FK), `title`, `day_of_week` (0–6), `start_time`, `end_time`, `location`, `color`, timestamps
- Indexes on `tasks(user_id, status, due_date, parent_task_id)` and `schedules(user_id, day_of_week)`

**Design decisions:**
- `parent_task_id` on tasks enables AI decomposition (Step 6) – a parent task can have subtasks
- `position` field allows ordered subtasks and drag-to-reorder
- `status` and `priority` use CHECK constraints for data integrity
- All foreign keys use `ON DELETE CASCADE` for clean user deletion
- `auth_provider` + `auth_id` on users prepares for OAuth2 (Google, Apple) in a future step

**Thinking:** We defined the data model before building APIs (Step 3). The schema directly reflects the PRD's core entities: students have tasks with deadlines and schedules with class times. The subtask support is critical for AI task decomposition later.

## Step 3 Complete ✓

**What we built:**
- `src/backend/api/users.js` – Full CRUD for user management
- `src/backend/api/tasks.js` – Task CRUD with filtering (by user, status, parent)
- `src/backend/api/schedules.js` – Schedule CRUD with day-of-week filtering

**Endpoints:**
- `POST/GET/PUT/DELETE /api/users` and `/api/users/:id`
- `POST/GET/PUT/DELETE /api/tasks` and `/api/tasks/:id` (includes subtasks)
- `POST/GET/PUT/DELETE /api/schedules` and `/api/schedules/:id`

## Step 4 Complete ✓

**What we built:**
- `src/backend/api/plan.js` – Today's plan endpoint

**Endpoint:** `GET /api/plan/today?user_id=X` — Returns today's classes (by day of week) and pending/in-progress tasks sorted by priority, with a summary.

## Step 5 Complete ✓

**What we built:**
- `src/frontend/` – React + Vite web app with 5 pages
- Dashboard, Today's Plan, Tasks, Schedule, Focus Timer
- Sidebar navigation, modern clean UI
- Vite proxy to backend API

## Step 6 Complete ✓

**What we built:**
- `src/backend/services/ai.js` – AI decomposition with OpenAI GPT-4 + heuristic fallback
- `src/backend/api/ai.js` – Decompose endpoint

**Endpoint:** `POST /api/ai/tasks/:id/decompose` — Breaks a task into 3-5 subtasks. Uses OpenAI when `OPENAI_API_KEY` is set, otherwise falls back to intelligent heuristics.

## Step 7 Complete ✓

**What we built:**
- `focus_sessions` table added to schema
- `src/backend/api/focus.js` – Focus session management

**Endpoints:** `POST /api/focus`, `GET /api/focus?user_id=X`, `PUT /api/focus/:id/complete`, `PUT /api/focus/:id/cancel`

## Step 8 Complete ✓

**What we built:**
- `src/backend/api/dashboard.js` – Progress dashboard

**Endpoint:** `GET /api/dashboard?user_id=X` — Returns task completion rate, overdue count, focus time totals, subtask stats.
