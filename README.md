# Adaptive Productive - Student Productivity App

AI-powered, adaptive productivity app tailored to college students' unique study routines.

## AI Agent System

Before hiring, this project uses **autonomous, self-evolving AI agents** that perform each PRD role:

| Agent | Role | Focus |
|-------|------|-------|
| Product Manager | Roadmap, prioritization | User stories, backlog |
| CTO/Tech Lead | Architecture, standards | ADRs, API contracts |
| Mobile Developer | iOS/Android app | React Native/Flutter |
| Backend Engineer | API, integrations | REST, PostgreSQL |
| UI/UX Designer | Interface, flows | Design system, specs |
| AI/ML Engineer | LLM integration | Prompts, task decomposition |
| QA Engineer | Testing | Test plans, automation |
| Growth/Marketing | GTM, acquisition | Campaigns, content |
| Customer Success | Feedback, support | FAQs, campus pilots |

### Running Agents

```bash
pip install -r requirements.txt
python3 agents/orchestrator.py run product-manager
python3 agents/orchestrator.py run-all --phase alpha
python3 agents/orchestrator.py evolve product-manager
```

See [agents/README.md](agents/README.md) and [docs/AGENT_ARCHITECTURE.md](docs/AGENT_ARCHITECTURE.md) for details.

## Development

```bash
# 1. Backend
cd src/backend && npm install && npm run dev
# API: http://localhost:3000

# 2. Mobile app (new terminal)
cd src/mobile && npm install && npm run web
# Or: npm run android / npm run ios

# 3. Seed demo data (optional)
node scripts/seed-demo.js
```

See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) for the step-by-step build process.

## Desktop Access

For GUI apps (emulators, browser preview, visual testing), the environment is configured for display access. See [docs/DESKTOP_ACCESS.md](docs/DESKTOP_ACCESS.md).