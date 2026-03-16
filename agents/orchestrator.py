#!/usr/bin/env python3
"""
AI Agent Orchestrator - Runs autonomous agents for the Student Productivity App.

Usage:
  python agents/orchestrator.py run <agent_id> [--task <task_file>]
  python agents/orchestrator.py run-all [--phase alpha|beta|launch]
  python agents/orchestrator.py evolve <agent_id>  # Run self-evolution loop
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

AGENTS_DIR = Path(__file__).resolve().parent
DEFINITIONS_DIR = AGENTS_DIR / "definitions"
KNOWLEDGE_DIR = AGENTS_DIR / "knowledge"
FEEDBACK_DIR = AGENTS_DIR / "feedback"
STRATEGIES_DIR = AGENTS_DIR / "strategies"
MEMORY_DIR = AGENTS_DIR / "memory"
TASKS_DIR = AGENTS_DIR / "tasks"


def load_agent_definition(agent_id: str) -> dict:
    """Load YAML definition for an agent. Falls back to JSON if PyYAML not installed."""
    config_path = DEFINITIONS_DIR / f"{agent_id}.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"Agent definition not found: {config_path}")

    try:
        import yaml
        with open(config_path) as f:
            return yaml.safe_load(f)
    except ImportError:
        # Fallback: parse as key-value (simplified)
        with open(config_path) as f:
            content = f.read()
        return _parse_simple_yaml(content)


def _parse_simple_yaml(content: str) -> dict:
    """Minimal YAML-like parser for when PyYAML is not available."""
    result = {}
    current_key = None
    current_list = None
    for line in content.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" in stripped and not line.startswith(" "):
            key, _, val = stripped.partition(":")
            key = key.strip()
            val = val.strip().strip('"\'')
            if val:
                result[key] = val
            else:
                current_key = key
                current_list = []
                result[key] = current_list
        elif current_list is not None and (line.startswith("  -") or line.startswith("-")):
            item = line.split("-", 1)[-1].strip().strip('"\'')
            if item:
                current_list.append(item)
        else:
            current_list = None
            current_key = None
    return result


def load_knowledge() -> str:
    """Load shared knowledge base for agent context."""
    context_parts = []
    for f in KNOWLEDGE_DIR.glob("*.md"):
        context_parts.append(f.read_text())
    return "\n\n---\n\n".join(context_parts)


def get_agent_prompt(agent_def: dict, task: dict | None, phase: str = "alpha") -> str:
    """Build the prompt for an agent run."""
    knowledge = load_knowledge()
    role = agent_def.get("role", agent_def.get("id", "agent"))
    capabilities = agent_def.get("capabilities", [])
    decision_criteria = agent_def.get("decision_criteria", {})
    evolution = agent_def.get("evolution", {})

    prompt_parts = [
        f"# Role: {role}",
        "",
        "## Context (PRD Knowledge Base)",
        knowledge,
        "",
        "## Your Capabilities",
    ]
    for cap in capabilities:
        prompt_parts.append(f"- {cap}")
    prompt_parts.append("")

    if decision_criteria:
        prompt_parts.append("## Decision Criteria")
        for category, criteria in decision_criteria.items():
            if isinstance(criteria, list):
                prompt_parts.append(f"### {category}")
                for c in criteria:
                    prompt_parts.append(f"- {c}")
                prompt_parts.append("")
            elif isinstance(criteria, dict):
                prompt_parts.append(f"### {category}")
                for k, v in criteria.items():
                    prompt_parts.append(f"- {k}: {v}")
                prompt_parts.append("")

    if task:
        prompt_parts.extend([
            "## Current Task",
            json.dumps(task, indent=2),
            "",
        ])

    prompt_parts.extend([
        "## Self-Evolution (Before Acting)",
        evolution.get("reflect_prompt", "Review prior outputs and feedback. What should you adjust?"),
        "",
        "## Instructions",
        "1. Reflect on the context and your evolution prompt.",
        "2. Execute the task (or next priority task if none specified).",
        "3. Produce artifacts in the paths specified in your outputs.",
        "4. Log your actions and outcomes to the feedback store for learning.",
        "",
        f"Phase: {phase}. Be precise and aligned with the PRD.",
    ])

    return "\n".join(prompt_parts)


def run_agent(agent_id: str, task: dict | None = None, phase: str = "alpha") -> dict:
    """Execute an agent run. Returns outcome for feedback."""
    agent_def = load_agent_definition(agent_id)
    prompt = get_agent_prompt(agent_def, task, phase)

    # In a full implementation, this would invoke an LLM (OpenAI, Claude, etc.)
    # For now, we write the prompt to a file for manual or MCP-driven execution
    run_dir = AGENTS_DIR / "runs"
    run_dir.mkdir(exist_ok=True)
    run_file = run_dir / f"{agent_id}_latest.md"
    run_file.write_text(prompt)

    return {
        "agent_id": agent_id,
        "task": task,
        "prompt_file": str(run_file),
        "status": "prompt_generated",
        "message": f"Prompt written to {run_file}. Invoke LLM with this prompt to execute.",
    }


def run_all_agents(phase: str = "alpha") -> list[dict]:
    """Run all agents in dependency order."""
    order = [
        "product-manager",
        "cto-tech-lead",
        "ui-ux-designer",
        "backend-engineer",
        "ai-ml-engineer",
        "mobile-developer",
        "qa-engineer",
        "growth-marketing",
        "customer-success",
    ]
    results = []
    for agent_id in order:
        try:
            result = run_agent(agent_id, task=None, phase=phase)
            results.append(result)
        except Exception as e:
            results.append({"agent_id": agent_id, "status": "error", "error": str(e)})
    return results


def ensure_dirs():
    """Ensure required directories exist."""
    for d in [FEEDBACK_DIR, STRATEGIES_DIR, MEMORY_DIR, TASKS_DIR]:
        d.mkdir(parents=True, exist_ok=True)
    for agent_id in ["product-manager", "cto-tech-lead", "mobile-developer", "backend-engineer",
                     "ui-ux-designer", "ai-ml-engineer", "qa-engineer", "growth-marketing", "customer-success"]:
        (MEMORY_DIR / agent_id).mkdir(exist_ok=True)


def main():
    parser = argparse.ArgumentParser(description="AI Agent Orchestrator")
    sub = parser.add_subparsers(dest="command", required=True)

    run_parser = sub.add_parser("run", help="Run a single agent")
    run_parser.add_argument("agent_id", help="Agent ID (e.g., product-manager)")
    run_parser.add_argument("--task", type=argparse.FileType("r"), help="JSON task file")
    run_parser.add_argument("--phase", default="alpha", choices=["alpha", "beta", "launch"])

    run_all_parser = sub.add_parser("run-all", help="Run all agents")
    run_all_parser.add_argument("--phase", default="alpha", choices=["alpha", "beta", "launch"])

    evolve_parser = sub.add_parser("evolve", help="Run self-evolution for an agent")
    evolve_parser.add_argument("agent_id", help="Agent ID")

    args = parser.parse_args()
    ensure_dirs()

    if args.command == "run":
        task = json.load(args.task) if args.task else None
        result = run_agent(args.agent_id, task, args.phase)
        print(json.dumps(result, indent=2))

    elif args.command == "run-all":
        results = run_all_agents(args.phase)
        print(json.dumps(results, indent=2))

    elif args.command == "evolve":
        agent_def = load_agent_definition(args.agent_id)
        evolution = agent_def.get("evolution", {})
        adapt_prompt = evolution.get("adapt_prompt", "Review outcomes and update strategy.")
        strategy_file = STRATEGIES_DIR / f"{args.agent_id}.json"
        strategies = []
        if strategy_file.exists():
            strategies = json.loads(strategy_file.read_text())
        # Append new reflection for evolution
        strategies.append({"adapt_prompt": adapt_prompt, "timestamp": __import__("datetime").datetime.now().isoformat()})
        strategy_file.write_text(json.dumps(strategies, indent=2))
        print(f"Evolution run for {args.agent_id}. Strategy updated at {strategy_file}")


if __name__ == "__main__":
    main()
