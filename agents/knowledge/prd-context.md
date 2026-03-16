# PRD Context for AI Agents

## MVP Features (Priority Order)
1. **Class Schedule Import** - Google/Apple Calendar or photo upload; auto-populate within 1 min
2. **Deadline/Task Entry** - Title, due date, estimated effort; show on planner
3. **AI Task Decomposition** - Input assignment → 3-5 steps with durations; user can edit
4. **Adaptive Scheduling** - Suggest study blocks; user accepts/drags; AI adapts next day
5. **Reminders & Notifications** - 10m/1h before sessions; missed tasks → reschedule prompt
6. **Focus Timer (Pomodoro)** - 25m default; optional app-block; log sessions
7. **Progress Dashboard** - % tasks done, study hours; updates after completion

## Personas
- **Sophie (Overwhelmed Undergrad)**: Needs simple setup, basic coaching, sense of control
- **Alex (Balanced Clubs & Classes)**: Needs flexibility, team/shared features, balance
- **Sam (Neurodiverse Achiever)**: Needs focus modes, reminders, short checklists, extra cues

## Success Metrics
- On-time completion >50% improvement
- >20% monthly retention (vs ~4% education norm)
- AI suggestion acceptance >70%
- DAU: 3x/week, >5 min session

## Tech Stack
- Frontend: React Native or Flutter
- Backend: Node.js (Express)
- DB: PostgreSQL (AWS RDS)
- AI: OpenAI GPT-4 API
- Notifications: FCM, APNS
- Auth: OAuth2 (Google, Apple)

## NFRs
- Load <2s; AI <5s
- Offline: view schedule
- FERPA/GDPR compliant
- WCAG 2.1
- 99.9% uptime
