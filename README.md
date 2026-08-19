# patlix-world-api

**Patlix World** backend — the source of truth for a persistent open world where a real autonomous AI workforce operates.

## Role

- Owns agent/platform state: agents, companies, properties, projects, tasks, workflows.
- **Aurel** — central orchestration intelligence (decompose goals → assign agents → monitor → recover).
- Real tool execution (`tools/`): OpenCode CLI first, terminal/git later, all permissioned.
- Provider/model-agnostic LLM layer (`models/`) — OpenAI-compatible chain.
- Domain events (persisted outbox) broadcast over the `/world` socket. **The 3D renderer is a consumer, never the source of truth.**

## Architecture (module map — built incrementally)

| module | purpose |
|---|---|
| `auth`, `users` | JWT auth, human inhabitants |
| `companies`, `properties`, `projects` | physical presence in the world |
| `agents`, `tasks`, `workflows` | the workforce + task lifecycle |
| `orchestration` | Aurel (plan → assign → monitor → recover) |
| `models` | provider abstraction (Groq/OpenRouter/NVIDIA/Google/Ollama) |
| `tools` | permissioned real tool execution (OpenCode) |
| `events` | event bus + persisted outbox |
| `world` | spatial state: zones, property plots, spawn points |
| `gateway` | socket.io `/world` namespace (JWT) |

## Run

```bash
# Postgres with user/db `patlixworld` must exist (see docker-compose in the parent workspace)
cp .env.example .env
npm install
npm run start:dev        # http://localhost:3004/api, Swagger at /api/docs
```

Ports are `3004` (api) / `4204` (web) to avoid collisions with patlix (:3000/:4200), arkadion (:3001/:4201), falina (:3002/:4202) and aurel (:3003/:4203).

## Milestones (build order)

- M1 backend core: auth/users, companies/properties/projects, agents/tasks, world zones, event bus + WS
- M2 models + Aurel orchestration (request → plan → assign)
- M3 tools: OpenCode executor → real task with streamed progress
- M4 web shell: WS service, world state store, adapter, UI
- M5 3D world: terrain/water/trees/sky/HQ
- M6 character system: shared rig + animations + GLB
- M7 player controller + third-person camera + physics
- M8 AI behavior controller + minimap/waypoint + interaction
- M9 end-to-end scenario + observability + approvals
- M10 hardening: agent state machine per role, prompt/workspace guardrails, run metrics + outbox cleanup, e2e health spec

See `PATLIX_WORLD_DECISIONS.md` at the workspace root for the full decision log.