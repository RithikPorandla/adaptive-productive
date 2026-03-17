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

**All steps complete.** ✓

---

## Steps 2–8 Complete ✓

**What we built:**

- **Step 2:** DB schema (users, tasks, schedule_items, study_sessions)
- **Step 3:** REST APIs – tasks, schedule, plan, study, AI decompose
- **Step 4:** Today's plan endpoint – combines schedule + tasks by date
- **Step 5:** React Native (Expo) app – 4 tabs, polished UI
- **Step 6:** AI task decomposition – OpenAI API + template fallback
- **Step 7:** Focus timer – 25min Pomodoro, 5min break, logs sessions
- **Step 8:** Progress dashboard – % done, study hours, session history

**Design:** Teal primary, coral accent, warm neutrals. See `docs/design/design-system.md`.

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
