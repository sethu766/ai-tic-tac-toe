# NEURALTAC — Project Documentation

## 1. Problem Definition

NEURALTAC is a browser application for two deterministic, turn-based games. Tic-Tac-Toe uses a 3 × 3 board; Connect Four uses a 6 × 7 gravity-based board. The project demonstrates legal move handling, game-state evaluation, and adversarial decision-making through registered AI agents.

Tic-Tac-Toe uses exhaustive Minimax and Alpha-Beta search with terminal-state scores. Connect Four uses depth-limited Minimax or Alpha-Beta and a heuristic based on center control and four-cell windows. RandomAgent selects a legal action without search. MasterAgent coordinates the agents and validates their returned moves.

## 2. Motivation

The project demonstrates how agents make decisions in competitive environments. Tic-Tac-Toe provides a compact environment for exhaustive search, while Connect Four demonstrates gravity, heuristic evaluation, and depth-limited search.

NEURALTAC also investigates the efficiency of search algorithms by comparing the number of nodes explored and the execution time of Minimax and Alpha-Beta Pruning. This provides a practical demonstration of how pruning can reduce unnecessary search while preserving the optimal minimax score.

## 3. Project Objectives

- Implement Tic-Tac-Toe and Connect Four game environments.
- Apply the Minimax algorithm to adversarial decision-making.
- Implement Alpha-Beta Pruning to reduce unnecessary search.
- Coordinate Random, Minimax, and Alpha-Beta agents through MasterAgent.
- Support Human vs AI and AI vs AI game modes.
- Provide Easy, Medium, and Hard difficulty levels.
- Display game history, scores, and search analytics.
- Compare algorithm performance using measured benchmark data.
- Visualize game-tree information and present experimental findings.

## 4. PEAS Description

PEAS stands for Performance Measure, Environment, Actuators, and Sensors. It describes the task environment of an intelligent agent.

### 4.1 Performance Measure

The AI agent aims to:
- Win the game when a winning strategy is available.
- Prevent the opponent from winning.
- Select moves that maximize the minimax outcome.
- Avoid illegal moves, such as selecting an occupied cell.
- Improve search efficiency when using Alpha-Beta Pruning.

### 4.2 Environment

The primary PEAS example is Tic-Tac-Toe: a 3 × 3 board with X and O, legal empty cells, alternating turns, and win/draw terminal states. The project also supports Connect Four, using a 6 × 7 board, red/yellow pieces, gravity-constrained column actions, and four-in-a-row terminal states.

### 4.3 Actuators

In Tic-Tac-Toe, the AI agent acts by:
- Selecting an empty cell.
- Placing its assigned symbol, X or O, in that cell.
- Updating the game state through the selected move.

The application also displays the board, scores, game history, and analytical information to the user.

### 4.4 Sensors

The agent receives information from:
- The current board configuration.
- The locations of X, O, and empty cells.
- The current player's turn.
- The game status: ongoing, win, loss, or draw.
- The legal moves available in the current state.

This information is used to evaluate possible future states and select a move.

## 5. Scope

NEURALTAC implements two playable games and three agent strategies. Tic-Tac-Toe supports exhaustive search; Connect Four supports depth-limited search (Easy/Medium/Hard map to 2/4/5 plies for Alpha-Beta by default). In Tic-Tac-Toe, Easy selects Random and Medium chooses Random or Alpha-Beta with equal probability. Explicit strategy selection can override either game's default policy.

The benchmark covers 10 selected Tic-Tac-Toe positions out of 4,520 identified reachable ongoing positions. Its reported average performance applies only to this sample. Connect Four Undo is not implemented; use Reset board to restart.
## 6. State-Space Representation

The following representation describes Tic-Tac-Toe. Connect Four uses a 6 × 7 matrix and only permits a move in a non-full column, where the piece drops to the lowest empty row.

### 6.1 Initial State

The initial state is an empty 3 × 3 board:

```text
- - -
- - -
- - -
```

Here, `-` represents an empty cell.

### 6.2 State Representation

Each state is represented by nine cell values, with each cell containing one of:
- `X`: occupied by player X.
- `O`: occupied by player O.
- `-`: empty.

For example:

```text
X O -
- X -
O - -
```

### 6.3 Initial Player

Player X makes the first move. The players alternate turns, and the selected cell must be empty.

### 6.4 Actions

An action consists of placing the current player's symbol in any empty cell. Each legal action produces a new board state.

### 6.5 Transition Model

The transition model applies a legal move to the current board to generate the next state. The original state should remain unchanged when a new state is created.

### 6.6 Terminal States

A state is terminal when:
- X has three symbols in a row, column, or diagonal.
- O has three symbols in a row, column, or diagonal.
- The board is full and neither player has won.

### 6.7 State-Space Search

Minimax explores possible future states to determine the best move under optimal play. Alpha-Beta Pruning uses the same minimax decision principle but skips branches that cannot affect the final decision.

## 7. Minimax Algorithm

### 7.1 Description

Minimax is an adversarial search algorithm used in two-player, zero-sum games. It assumes that both players choose their moves optimally.

The maximizing player attempts to maximize the evaluation score, while the minimizing player attempts to minimize it.

### 7.2 Pseudocode

```text
MINIMAX(state, maximizingPlayer):
    if state is terminal:
        return evaluation(state)

    if maximizingPlayer:
        bestScore = -infinity
        for each legal move:
            child = apply move to state
            score = MINIMAX(child, false)
            bestScore = max(bestScore, score)
        return bestScore

    else:
        bestScore = +infinity
        for each legal move:
            child = apply move to state
            score = MINIMAX(child, true)
            bestScore = min(bestScore, score)
        return bestScore
```

The AI evaluates the legal moves and chooses the move with the best minimax outcome.

## 8. Alpha-Beta Pruning

### 8.1 Description

Alpha-Beta Pruning improves Minimax by avoiding the evaluation of branches that cannot change the final minimax decision.

- **Alpha (α):** The best score found so far for the maximizing player.
- **Beta (β):** The best score found so far for the minimizing player.
- **Pruning condition:** Stop exploring a branch when α ≥ β.

### 8.2 Pseudocode

```text
ALPHA_BETA(state, alpha, beta, maximizingPlayer):
    if state is terminal:
        return evaluation(state)

    if maximizingPlayer:
        bestScore = -infinity

        for each legal move:
            child = apply move to state
            score = ALPHA_BETA(child, alpha, beta, false)
            bestScore = max(bestScore, score)
            alpha = max(alpha, bestScore)

            if alpha >= beta:
                break

        return bestScore

    else:
        bestScore = +infinity

        for each legal move:
            child = apply move to state
            score = ALPHA_BETA(child, alpha, beta, true)
            bestScore = min(bestScore, score)
            beta = min(beta, bestScore)

            if alpha >= beta:
                break

        return bestScore
```

## 9. Evaluation Function

Tic-Tac-Toe evaluates terminal outcomes:

- **+100:** Win for the maximizing player.
- **−100:** Win for the minimizing player.
- **0:** Draw.

The search depth adjusts win/loss scores to prefer quicker wins and delayed losses. Connect Four additionally evaluates non-terminal positions using center-column control and weighted four-cell windows. See `src/engine/connectFourEngine.js` for the heuristic.

## 10. Algorithm Comparison

Minimax examines the search tree without pruning. Alpha-Beta Pruning avoids exploring branches that cannot affect the minimax score.

Both algorithms return the same minimax score when given equivalent search settings. Alpha-Beta may evaluate fewer positions depending on move ordering and the current board.

The NEURALTAC experiment measured this behavior on 10 selected reachable ongoing positions. The measured average node reduction was 58.44%, with 100% minimax score agreement across those positions.

The telemetry field labelled **pruned siblings** counts only the immediate sibling moves skipped at each Alpha-Beta cutoff. It is not the number of all descendant nodes that would have been searched beneath those moves. Minimax reports zero because it does not prune.