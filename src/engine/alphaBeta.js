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
  // nodesPruned counts sibling moves skipped at cutoffs, not their descendant nodes.
  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
    nodesPruned: stats.nodesPruned,
  };
}
// SECTION 11: EXTRACT PRINCIPAL VARIATION (Alpha-Beta) — Follows best moves using Alpha-Beta search.
// Returns an ordered array of cell indices for the predicted optimal line of play.
// This PV is a game-theoretic prediction under Alpha-Beta search, NOT a guarantee of human play.
function extractPVAlphaBeta(board, currentPlayer, aiPlayer) {
  const status = getGameStatus(board);
  if (status.status !== "playing") return [];
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return [];

  const maximizing = currentPlayer === aiPlayer;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = null;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const nextBoard = [...board];
    nextBoard[move] = currentPlayer;
    const result = alphaBeta(
      nextBoard,
      currentPlayer === "X" ? "O" : "X",
      aiPlayer,
      1,
      -Infinity,
      Infinity,
      { nodesSearched: 0, nodesPruned: 0 }
    );
    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = move;
    }
  }

  if (bestMove === null) return [];
  const nextBoard = [...board];
  nextBoard[bestMove] = currentPlayer;
  const nextPlayer = currentPlayer === "X" ? "O" : "X";
  return [bestMove, ...extractPVAlphaBeta(nextBoard, nextPlayer, aiPlayer)];
}
// SECTION 12: FIND BEST MOVE WITH PV (Alpha-Beta) — Returns optimal move, score, statistics, and PV.
// The PV is the predicted optimal sequence under Alpha-Beta search; it is NOT a guarantee of human play.
export function findBestMoveAlphaBetaWithPV(board, aiPlayer = "O") {
  const stats = { nodesSearched: 0, nodesPruned: 0 };
  const result = alphaBeta(board, aiPlayer, aiPlayer, 0, -Infinity, Infinity, stats);
  const pv = extractPVAlphaBeta(board, aiPlayer, aiPlayer);
  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
    nodesPruned: stats.nodesPruned,
    pv,
  };
}
