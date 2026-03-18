# AI Agents - Student Productivity App

Autonomous, self-evolving AI agents that perform the roles defined in the PRD before human hiring.

## Quick Start

```bash
# Run a single agent (generates prompt for LLM execution)
python3 agents/orchestrator.py run product-manager

# Run all agents in dependency order
python3 agents/orchestrator.py run-all --phase alpha

# Run self-evolution for an agent (updates strategy from outcomes)
python3 agents/orchestrator.py evolve product-manager

# Run with a specific task
python3 agents/orchestrator.py run mobile-developer --task agents/tasks/build-onboarding-screen.json
```

## Agent Definitions

| Agent | Role | Key Outputs |
|-------|------|-------------|
| `product-manager` | Product Manager | Roadmap, backlog, user stories |
| `cto-tech-lead` | CTO/Tech Lead | ADRs, API contracts, tech specs |
| `mobile-developer` | Mobile Developer | React Native/Flutter screens, components |
| `backend-engineer` | Backend Engineer | REST API, services, DB migrations |
| `ui-ux-designer` | UI/UX Designer | Design system, screen specs, flows |
| `ai-ml-engineer` | AI/ML Engineer | Prompts, AI service, fallback logic |
| `qa-engineer` | QA Engineer | Test plans, automated tests, bug reports |
| `growth-marketing` | Growth/Marketing | Campaigns, content, analytics |
| `customer-success` | Customer Success | FAQs, feedback reports, support docs |

## Self-Evolution Loop

Each agent implements **Reflect → Act → Measure → Adapt**:

1. **Reflect**: Review prior outputs, feedback, metrics
2. **Act**: Execute task with refined strategy
3. **Measure**: Log outcome to `agents/feedback/`
4. **Adapt**: Update `agents/strategies/{agent_id}.json`

## Directory Structure

```
agents/
├── definitions/       # YAML configs per agent
├── knowledge/         # Shared PRD context
├── feedback/          # Outcome logs for learning
├── strategies/        # Learned heuristics per agent
├── memory/            # Per-agent task history
├── tasks/             # Task definitions for agents
├── runs/              # Generated prompts (orchestrator output)
├── orchestrator.py    # Run/evolve agents
└── README.md
```

## Integration with Cursor / MCP

To run agents via Cursor or an MCP server:

1. Use the generated prompt in `agents/runs/{agent_id}_latest.md`
2. Invoke your LLM (GPT-4, Claude) with that prompt
3. Direct the model to produce artifacts in the paths specified in the agent definition
4. After execution, run `evolve` to update strategies from outcomes

## Dependencies

- Python 3.10+
- Optional: `pyyaml` for full YAML parsing (`pip install pyyaml`)

Without PyYAML, the orchestrator uses a minimal parser for the agent definitions.
