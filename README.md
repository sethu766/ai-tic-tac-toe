# NEURALTAC

NEURALTAC is a browser-based game and AI-search demo. It includes Tic-Tac-Toe and Connect Four, configurable AI agents, and panels for inspecting search decisions.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Production and verification commands:

```sh
npm run build
npm test
npm run lint
```

## Games and agents

- **Tic-Tac-Toe:** Human vs AI and AI vs AI; Easy uses Random, Medium chooses Random or Alpha-Beta with equal probability, and Hard uses Alpha-Beta. Minimax, Alpha-Beta, or Random can also be explicitly selected. Undo removes the last AI/human pair during a match, or the final human move if it ended the game.
- **Connect Four:** 6 rows by 7 columns, gravity-based moves, and depth-limited search with heuristic evaluation. Difficulty selects Alpha-Beta depths 2, 4, and 5 for Easy, Medium, and Hard. Explicit Minimax and Random policies are available. **Undo is not supported in Connect Four; use Reset board to start over.**
- **MasterAgent:** Registers agents, resolves policy, delegates decisions, validates moves, and records telemetry. Random is a legal-move selector; Minimax and Alpha-Beta perform adversarial search. There is no separate GoalBasedAgent class.
- **Analysis:** The predicted principal variation is an optimal-search line, not a promise of human play. The game-tree panel summarizes candidate moves; it does not draw every node searched.

Alpha-Beta telemetry's **pruned siblings** count is the number of immediately remaining sibling moves skipped at cutoffs. It does not count every descendant position that those skipped moves could have produced.

## Project map

| Path | Responsibility |
|---|---|
| `src/agents/` | Base agent contract, concrete agents, and MasterAgent coordination |
| `src/engine/` | Tic-Tac-Toe and Connect Four rules, search algorithms, and analysis |
| `src/components/` | Connect Four UI, monitoring, analysis, and candidate-move views |
| `src/test/` | Agent, engine, analysis, and React UI tests |
| `src/utils/benchmark.js` | Repeated Minimax/Alpha-Beta measurements |
| `benchmark-experiment.mjs` | Generates the benchmark sample and result data |
| `research-graphs/`, `public/research-graphs/` | Benchmark visualizations |

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md), [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), and [EXPERIMENTAL_RESULTS.md](./EXPERIMENTAL_RESULTS.md) for additional detail.
