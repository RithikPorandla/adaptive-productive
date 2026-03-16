# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Student Productivity App ("Adaptive Productive") — early-stage Node.js/Express backend with embedded SQLite. An optional Python AI agent orchestrator lives under `agents/`.

### Services

| Service | How to run | Port | Notes |
|---------|-----------|------|-------|
| Backend API (Express) | `cd src/backend && npm run dev` | 3000 | Uses `node --watch` for hot reload. Health check at `/api/health`. |

### Non-obvious caveats

- The SQLite database file is created automatically at `data/app.db` (relative to repo root) on first server start. The `data/` directory must exist.
- No ESLint, Prettier, or test framework is configured yet. There are no lint or test commands to run.
- The project uses ES Modules (`"type": "module"` in `package.json`); use `import`/`export` syntax, not `require`.
- The Python agent orchestrator (`agents/orchestrator.py`) is optional and not required for the main app. Run it with `python3 agents/orchestrator.py run <agent-name>`.

### Quick commands

See `README.md` for the canonical development commands. Key ones:

- **Start backend dev server:** `cd src/backend && npm run dev`
- **Health check:** `curl http://localhost:3000/api/health`
