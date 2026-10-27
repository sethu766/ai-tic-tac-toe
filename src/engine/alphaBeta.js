// SECTION 1: IMPORTS — Import functions that check the game state and return legal moves.
import {
  getGameStatus,
  getAvailableMoves,
} from "./gameEngine.js";
// SECTION 2: ALPHA-BETA ALGORITHM — Recursively searches possible moves to find the best move for the AI.
export function alphaBeta(
  board,
  currentPlayer,
  aiPlayer = "O",
  depth = 0,
  alpha = -Infinity,
  beta = Infinity,
  stats = { nodesSearched: 0, nodesPruned: 0 }
) {
  // Count the current board position as a searched node.
  stats.nodesSearched++;
  // Check whether the current board represents a win, draw, or ongoing game.
  const status = getGameStatus(board);
  // SECTION 3: TERMINAL-STATE EVALUATION — Assign scores when the game reaches a finished state.
  if (status.status === "won") {
    // Give a high positive score if the AI player wins; prefer winning in fewer moves.
    if (status.winner === aiPlayer) {
      return { score: 100 - depth, move: null };
    }
    // Give a negative score if the opponent wins; the score reflects how deep the search reached.
    return { score: depth - 100, move: null };
  }
  // A draw has a neutral score because neither player wins.
  if (status.status === "draw") {
    return { score: 0, move: null };
  }
  // SECTION 4: PLAYER ROLE — Decide whether the current level maximizes or minimizes the score.
  // The AI tries to maximize its score, while the opponent tries to minimize it.
  const maximizing = currentPlayer === aiPlayer;
  // Switch to the other player for the next level of the search.
  const nextPlayer = currentPlayer === "X" ? "O" : "X";
  // Initialize the best score according to whether this level maximizes or minimizes.
  let bestScore = maximizing ? -Infinity : Infinity;
  // Store the move that produces the best score found so far.
  let bestMove = null;
  // SECTION 5: GENERATE LEGAL MOVES — Retrieve all moves available on the current board.
  const moves = getAvailableMoves(board);
  // Examine each legal move one by one.
  for (let i = 0; i < moves.length; i++) {
    // Get the index of the candidate cell to play.
    const move = moves[i];
    // Create a copy of the board so the original board is not modified.
    const nextBoard = [...board];
    // Simulate placing the current player's symbol in the selected cell.
    nextBoard[move] = currentPlayer;
    // SECTION 6: RECURSIVE SEARCH — Explore the position after the candidate move.
    const result = alphaBeta(
      nextBoard,
      nextPlayer,
      aiPlayer,
      depth + 1,
      alpha,
      beta,
      stats
    );
    // Update the best score and move if this candidate improves the result.
    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = move;
    }
    // SECTION 7: UPDATE ALPHA AND BETA — Track score bounds to identify unnecessary branches.
    // Alpha is the best score found for the maximizing player so far.
    if (maximizing) {
      alpha = Math.max(alpha, bestScore);
    } else {
      // Beta is the best (lowest) score found for the minimizing player so far.
      beta = Math.min(beta, bestScore);
    }
    // SECTION 8: ALPHA-BETA PRUNING — Stop exploring sibling moves when they cannot improve the decision.
    if (alpha >= beta) {
      // Count the remaining sibling moves skipped at this level, not all nodes in their subtrees.
      stats.nodesPruned += moves.length - i - 1;
      break;
    }
  }
  // SECTION 9: RETURN SEARCH RESULT — Return the best score and move found for this position.
  return {
    score: bestScore,
    move: bestMove,
  };
}
// SECTION 10: FIND BEST AI MOVE — Public wrapper that starts the search and returns its result and statistics.
export function findBestMoveAlphaBeta(
  board,
  aiPlayer = "O"
) {
  // Initialize counters for searched and pruned nodes for this search.
  const stats = {
    nodesSearched: 0,
    nodesPruned: 0,
  };
  // Start searching from the current board with the AI as the first player being evaluated.
  const result = alphaBeta(
    board,
    aiPlayer,
    aiPlayer,
    0,
    -Infinity,
    Infinity,
    stats
  );
  // Return the selected move, its evaluation score, and the search statistics.
  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
    nodesPruned: stats.nodesPruned,
  };
}