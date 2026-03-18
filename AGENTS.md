# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Student Productivity App ("Adaptive Productive") — early-stage Node.js/Express backend with embedded SQLite. An optional Python AI agent orchestrator lives under `agents/`.

### Services

| Service | How to run | Port | Notes |
|---------|-----------|------|-------|
| Backend API (Express) | `cd src/backend && npm run dev` | 3000 | Uses `node --watch` for hot reload. Health check at `/api/health`. |
| Frontend (React + Vite) | `cd src/frontend && npm run dev` | 5173 | Proxies `/api` to backend on port 3000. Start backend first. |

### Non-obvious caveats

- **Start order matters:** Backend must be running before the frontend, since Vite proxies `/api` requests to `localhost:3000`.
- The SQLite database file is created automatically at `data/app.db` (relative to repo root) on first server start. The `data/` directory must exist.
- No ESLint, Prettier, or test framework is configured for the backend yet. The frontend has Vite's built-in ESLint config.
- The project uses ES Modules (`"type": "module"` in `package.json`); use `import`/`export` syntax, not `require`.
- AI task decomposition works without an `OPENAI_API_KEY` — it falls back to intelligent heuristics. Set the env var to enable GPT-4.
- The Python agent orchestrator (`agents/orchestrator.py`) is optional and not required for the main app.

### Quick commands

See `README.md` for the canonical development commands. Key ones:

- **Start backend:** `cd src/backend && npm run dev`
- **Start frontend:** `cd src/frontend && npm run dev`
- **Health check:** `curl http://localhost:3000/api/health`
