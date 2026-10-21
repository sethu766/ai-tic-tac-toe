# NEURALTAC
## An Intelligent Tic-Tac-Toe System Using Minimax and Alpha-Beta Pruning

### Abstract

NEURALTAC is a browser-based Tic-Tac-Toe application developed to demonstrate adversarial search and artificial intelligence decision-making. It implements Minimax and Alpha-Beta Pruning to select moves and provides Human vs AI and AI vs AI game modes. The system includes difficulty selection, score tracking, move history, game-tree exploration, and performance analytics.

A benchmark experiment compared both algorithms on 10 selected reachable ongoing board positions. The recorded results showed 100% minimax score agreement and an average node reduction of 58.44% for the tested sample. The project demonstrates how pruning can reduce search effort while preserving the minimax decision value.

### 1. Introduction

Artificial intelligence enables systems to select actions by evaluating possible outcomes. Board games provide a useful environment for studying intelligent decision-making because they have defined rules, states, and actions.

NEURALTAC uses Tic-Tac-Toe to demonstrate adversarial search. It provides an interactive game and a performance laboratory for comparing two search algorithms.

### 2. Problem Statement

The objective is to develop an intelligent Tic-Tac-Toe system that chooses appropriate moves, supports interactive gameplay, and demonstrates the difference between unpruned Minimax search and Alpha-Beta Pruning.

### 3. Objectives

- Implement Minimax for adversarial decision-making.
- Implement Alpha-Beta Pruning to reduce unnecessary search.
- Provide Human vs AI and AI vs AI modes.
- Support Easy, Medium, and Hard difficulty settings.
- Display scores, move history, and game-state information.
- Measure nodes searched and execution time.
- Visualize and document experimental results.

### 4. Technologies Used

- React for the user interface.
- JavaScript for game logic and AI algorithms.
- Vite for development and production builds.
- Vitest for automated testing.
- Python and Matplotlib for benchmark graph generation.
- CSV and JSON for storing benchmark results.

### 5. System Design

The system consists of a React interface, game engine, Minimax algorithm, Alpha-Beta Pruning algorithm, analytics components, and benchmarking utilities.

The game engine manages board states, legal moves, and terminal-state detection. The AI algorithms evaluate possible future states. The interface displays gameplay and analysis, while the benchmark experiment records performance measurements.

Refer to `SYSTEM_ARCHITECTURE.md` for the architecture diagram and component descriptions.

### 6. Algorithms

#### 6.1 Minimax

Minimax explores possible future game states. The maximizing player attempts to maximize the evaluation score, while the minimizing player attempts to minimize it. The selected move is based on the best achievable outcome assuming optimal play.

#### 6.2 Alpha-Beta Pruning

Alpha-Beta Pruning improves Minimax by skipping branches that cannot change the final minimax decision. Alpha represents the best value found for the maximizing player, and beta represents the best value found for the minimizing player. Pruning occurs when alpha is greater than or equal to beta.

#### 6.3 Terminal Evaluation

The implementation uses depth-sensitive terminal scores:
- AI win: 100 minus search depth.
- AI loss: search depth minus 100.
- Draw: 0.

This scoring rewards earlier wins and delays losses.

### 7. Implementation

The application provides:
- Human vs AI gameplay.
- AI vs AI gameplay.
- Easy, Medium, and Hard difficulty settings.
- Restart and Undo controls.
- Scoreboard and move history.
- Current-position analysis.
- Game-tree exploration.
- Search-node and execution-time comparisons.

### 8. Testing

The automated test suite completed with 14 passing tests. The tests cover winning moves, blocking moves, legal-move selection, draw detection, board immutability, occupied-cell validation, and agreement between the two algorithms across reachable game states.

Manual testing also confirmed the main game modes, difficulty levels, restart control, scoreboard, and history. Undo was subsequently connected to the interface and tested manually.

### 9. Experimental Results

The benchmark identified 4,520 reachable ongoing board positions and evaluated 10 selected positions.

| Metric | Result |
|---|---:|
| Positions tested | 10 |
| Minimax score agreement | 100% |
| Average node reduction | 58.44% |
| Empty-board Minimax nodes | 549,946 |
| Empty-board Alpha-Beta nodes | 20,866 |
| Empty-board node reduction | 96.21% |

The empty-board measurements showed a substantial reduction in searched nodes when Alpha-Beta Pruning was used. The degree of reduction varied with the board position.

The graphs are stored in `public/research-graphs/`. The complete benchmark data is stored in `benchmark-results.csv` and `benchmark-results.json`.

### 10. Limitations

The benchmark evaluated 10 selected positions rather than every reachable ongoing position. Consequently, the average node reduction is specific to the tested sample. Execution times can vary with system load and runtime conditions.

The current evaluation is terminal-state based; a separate non-terminal heuristic has not been established in the documented implementation. Further testing and broader sampling would improve the strength of the performance evaluation.

### 11. Future Enhancements

- Benchmark a broader selection of reachable board positions.
- Add repeatable performance tests across separate runs.
- Improve analytics and exportable reports.
- Extend the game-tree visualization.
- Add additional automated tests for UI controls and difficulty settings.

### 12. Conclusion

NEURALTAC demonstrates adversarial search through an interactive Tic-Tac-Toe application. The implementation uses Minimax and Alpha-Beta Pruning, with both algorithms agreeing on minimax scores across the tested sample. The experiment recorded an average reduction of 58.44% in searched nodes for the 10 selected positions.

The project combines an interactive prototype with algorithmic analysis and provides a practical demonstration of search optimization in a deterministic, two-player game.

### References

1. Russell, S. and Norvig, P., *Artificial Intelligence: A Modern Approach*.
2. Official React documentation: https://react.dev/
3. Official Vite documentation: https://vite.dev/
4. Official Vitest documentation: https://vitest.dev/
## PEAS Description of NEURALTAC

PEAS is a framework used to specify the task environment of an intelligent agent. In NEURALTAC, the AI agent plays Tic-Tac-Toe against an opponent by observing the board, evaluating possible moves, and selecting an action.

### 1. Performance Measure

The performance of the AI agent is measured by:
- Winning the game whenever a winning strategy is available.
- Preventing the opponent from winning.
- Achieving a draw when a win is not possible.
- Selecting an optimal move using Minimax or Alpha-Beta Pruning.
- Reducing search effort through Alpha-Beta Pruning.
- Maintaining agreement between the minimax evaluation scores of both algorithms.

### 2. Environment

The environment consists of:
- A 3 × 3 Tic-Tac-Toe board.
- Two players, X and O.
- Empty cells and occupied cells.
- Legal moves and alternating turns.
- Terminal states: win, loss, or draw.
- Human-versus-AI and AI-versus-AI game modes.

### 3. Actuators

The actuators are the actions through which the agent affects the game:
- Placing X or O in a selected empty cell.
- Updating the board after a move.
- Selecting the AI's next move.
- Updating the displayed game result and score.

### 4. Sensors

The sensors are the inputs through which the agent obtains information about the environment:
- The current board configuration.
- The positions occupied by X and O.
- The set of available legal moves.
- The current player's turn.
- The game status, including wins and draws.

### Conclusion

The PEAS description identifies the task environment and the responsibilities of the NEURALTAC intelligent agent. The agent uses the current board state as input, searches possible future states, and chooses a move intended to maximize its outcome.

## State-Space Representation

NEURALTAC represents Tic-Tac-Toe as a state-space search problem.

**Initial state:** An empty 3 × 3 board.

```text
- | - | -
---------
- | - | -
---------
- | - | -
```

Here, X and O represent the two players, while `-` represents an empty cell.

**State:** A particular arrangement of X, O, and empty cells on the board.

**Initial player:** X makes the first move.

**Actions:** A player places their symbol in any available cell.

**Transition model:** Applying a legal move produces a new board state. Players alternate turns.

**Terminal states:**
- X wins by completing a row, column, or diagonal.
- O wins by completing a row, column, or diagonal.
- The board is full without a winner, resulting in a draw.

**Goal:** Select moves that maximize the AI's outcome while assuming that the opponent also plays optimally.

The search tree contains possible future states. Minimax evaluates these states, while Alpha-Beta Pruning skips branches that cannot affect the final minimax decision.

## Algorithm Explanation

### Minimax Algorithm

Minimax is an adversarial search algorithm for two-player, zero-sum games.

- The maximizing player tries to obtain the highest evaluation score.
- The minimizing player tries to obtain the lowest evaluation score.
- The algorithm recursively evaluates possible future moves.
- The best move is selected based on the resulting minimax score.

### Alpha-Beta Pruning

Alpha-Beta Pruning optimizes Minimax by avoiding unnecessary exploration.

- **Alpha (α):** The best score currently available to the maximizing player.
- **Beta (β):** The best score currently available to the minimizing player.
- **Pruning condition:** When α ≥ β, the remaining sibling moves at that node need not be explored.

Alpha-Beta Pruning preserves the minimax score while potentially reducing the number of nodes searched.

### Evaluation Function

The current implementation uses depth-sensitive terminal scores:

- AI win: `100 − depth`
- AI loss: `depth − 100`
- Draw: `0`

This rewards faster wins and delays losses. The separate strategic-position score of `+10`, listed in the college brief, must be implemented and tested before claiming that every specified evaluation value is satisfied.

## Limitations and Ethical Considerations

### Limitations

1. **Game scope:** The current implementation focuses on Tic-Tac-Toe and does not implement the suggested Connect Four extension.
2. **Benchmark sample:** Performance was measured on 10 selected reachable ongoing board positions out of 4,520 identified positions. The results should not be treated as measurements across every position.
3. **Execution-time variability:** Search times can vary depending on system load, browser/runtime conditions, and measurement overhead.
4. **Terminal-state evaluation:** The current Minimax and Alpha-Beta implementations use terminal-state scores. The additional strategic-position score of +10 specified in the project brief remains to be implemented and tested.
5. **User-interface testing:** Automated tests cover the AI algorithms and game engine, but they do not replace comprehensive automated testing of every interface interaction.

### Ethical Considerations

1. **Transparency:** The application demonstrates its decision-making approach using Minimax and Alpha-Beta Pruning, allowing users to study how the AI evaluates possible moves.
2. **Fairness:** Both players follow the same game rules, and the AI selects moves from the legal actions available in the current board state.
3. **Privacy:** The project does not require personal information to play Tic-Tac-Toe. Avoid collecting or storing unnecessary user data.
4. **Academic integrity:** The algorithms, benchmark methodology, test results, and limitations should be described accurately. Performance claims must be supported by recorded experiments.
5. **Responsible reporting:** The benchmark results apply to the selected test positions and should not be presented as proof of identical performance across every possible board state.

### Future Enhancements

- Implement and validate the specified non-terminal strategic heuristic.
- Expand the benchmark sample and repeat timing measurements.
- Add automated tests for user-interface controls.
- Extend the game-tree visualization and exportable analysis.
- Investigate adapting the search approach to another strategy game as a future extension.