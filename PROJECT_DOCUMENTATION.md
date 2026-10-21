# NEURALTAC — Project Documentation

## 1. Problem Definition

Tic-Tac-Toe is a two-player, deterministic, turn-based game played on a 3 × 3 grid. The players, X and O, alternate placing their symbols in empty cells. A player wins by placing three symbols in a horizontal row, vertical column, or diagonal. If all nine cells are occupied without a winning combination, the game ends in a draw.

The main problem addressed by NEURALTAC is the implementation and comparison of adversarial search algorithms for selecting optimal moves in Tic-Tac-Toe. The system uses Minimax and Alpha-Beta Pruning to evaluate possible game outcomes and make decisions.

## 2. Motivation

The project demonstrates how artificial intelligence can make decisions in competitive environments. Tic-Tac-Toe provides a simple environment for studying adversarial search because its state space is finite and its rules are clearly defined.

NEURALTAC also investigates the efficiency of search algorithms by comparing the number of nodes explored and the execution time of Minimax and Alpha-Beta Pruning. This provides a practical demonstration of how pruning can reduce unnecessary search while preserving the optimal minimax score.

## 3. Project Objectives

- Implement an AI opponent for Tic-Tac-Toe.
- Apply the Minimax algorithm to adversarial decision-making.
- Implement Alpha-Beta Pruning to reduce unnecessary search.
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

The environment consists of:
- A 3 × 3 Tic-Tac-Toe board.
- Two players, X and O.
- Empty, occupied, and terminal board states.
- The rules for winning, losing, drawing, and alternating turns.
- A browser-based interface through which the game is played.

### 4.3 Actuators

The AI agent acts by:
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

NEURALTAC focuses on adversarial search in the Tic-Tac-Toe environment. Its main algorithms are Minimax and Alpha-Beta Pruning. The performance experiment compares these algorithms on a selected sample of reachable board positions.

The benchmark currently covers 10 selected positions out of 4,520 identified reachable ongoing positions. Therefore, the reported average performance improvement applies to the tested sample and should not be interpreted as a measurement across all positions.
## 6. State-Space Representation

The state space represents all possible configurations of the Tic-Tac-Toe board that can be reached by following the game rules.

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

The evaluation function assigns values to terminal outcomes. The project checklist specifies:

- **+100:** Win for the maximizing player.
- **−100:** Win for the minimizing player.
- **0:** Draw.

The exact terminal scoring and whether the implementation includes an additional heuristic for non-terminal states must match the actual source code.

## 10. Algorithm Comparison

Minimax examines the search tree without pruning. Alpha-Beta Pruning avoids exploring branches that cannot affect the minimax score.

Both algorithms should return the same optimal minimax score for the same valid state and player, while Alpha-Beta Pruning can evaluate fewer nodes depending on move ordering and the current board.

The NEURALTAC experiment measured this behavior on 10 selected reachable ongoing positions. The measured average node reduction was 58.44%, with 100% minimax score agreement across those positions.