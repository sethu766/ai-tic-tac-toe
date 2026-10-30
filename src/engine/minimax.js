// SECTION 1: IMPORTS — Import functions for checking the game status and finding legal moves.
import {
  getGameStatus,
  getAvailableMoves,
} from "./gameEngine.js";
import { chooseRandomMove } from "./searchUtils.js";
// SECTION 2: MINIMAX ALGORITHM — Recursively explores possible moves to select the best move for the AI.
export function minimax(
  board,
  currentPlayer,
  aiPlayer = "O",
  depth = 0,
  stats = { nodesSearched: 0 },
  random = Math.random
) {
  // Count each board position visited during the search.
  stats.nodesSearched++;
  // Check whether the current board is a win, draw, or ongoing game.
  const status = getGameStatus(board);
  // SECTION 3: TERMINAL-STATE EVALUATION — Calculate a score when the game reaches a finished state.
  if (status.status === "won") {
    // Give a high positive score if the AI wins; a smaller depth means an earlier win.
    if (status.winner === aiPlayer) {
      return { score: 100 - depth, move: null };
    }
    // Give a negative score if the opponent wins; account for the search depth.
    return { score: depth - 100, move: null };
  }
  // Assign a neutral score when neither player wins and the board is full.
  if (status.status === "draw") {
    return { score: 0, move: null };
  }
  // Determine whether this level should maximize or minimize the score.
  // The AI maximizes its score, while the opponent minimizes the AI's score.
  const maximizing = currentPlayer === aiPlayer;
  // Initialize the best score to negative Infinity for maximizing or positive Infinity for minimizing.
  let bestScore = maximizing
    ? -Infinity
    : Infinity;
  // Store the move that produces the best score found so far.
  let bestMove = null;
  const bestMoves = [];
  // SECTION 4: EXPLORE AVAILABLE MOVES — Try every legal move from the current board position.
  for (const move of getAvailableMoves(board)) {
    // Copy the board so the current board is not modified.
    const nextBoard = [...board];
    // Simulate placing the current player's symbol in the chosen cell.
    nextBoard[move] = currentPlayer;
    // SECTION 5: RECURSIVE SEARCH — Evaluate the board after the simulated move.
    const result = minimax(
      nextBoard,
      currentPlayer === "X" ? "O" : "X",
      aiPlayer,
      depth + 1,
      stats,
      random
    );
    // Update the best score and move if this result improves the current choice.
    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = move;
      if (depth === 0) bestMoves.length = 0;
      if (depth === 0) bestMoves.push(move);
    } else if (depth === 0 && result.score === bestScore) {
      bestMoves.push(move);
    }
  }
  if (depth === 0 && bestMoves.length > 1) {
    bestMove = chooseRandomMove(bestMoves, random);
  }
  // SECTION 6: RETURN THE BEST RESULT — Return the best score and corresponding move for this position.
  return {
    score: bestScore,
    move: bestMove,
  };
}
// SECTION 7: FIND BEST MOVE — Starts the Minimax search for the selected AI player.
export function findBestMove(board, aiPlayer = "O", random = Math.random) {
  // Initialize the counter used to track how many board positions are searched.
  const stats = { nodesSearched: 0 };
  // Start the search from the current board, with the AI player taking the first search turn.
  const result = minimax(
    board,
    aiPlayer,
    aiPlayer,
    0,
    stats,
    random
  );
  // Return the selected move, its evaluation score, and the number of searched nodes.
  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
  };
}
// SECTION 8: EXTRACT PRINCIPAL VARIATION — Walk the game tree following best moves at each ply.
// Returns an ordered array of cell indices representing the predicted optimal line of play.
// This is a game-theoretic prediction based on exhaustive search, NOT a guarantee of human play.
function extractPV(board, currentPlayer, aiPlayer) {
  const status = getGameStatus(board);
  // Stop recursion at a terminal state (win, draw, or no moves).
  if (status.status !== "playing") return [];
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return [];

  const maximizing = currentPlayer === aiPlayer;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = null;

  // Evaluate each legal move with a fresh minimax call to find the best.
  for (const move of moves) {
    const nextBoard = [...board];
    nextBoard[move] = currentPlayer;
    const result = minimax(
      nextBoard,
      currentPlayer === "X" ? "O" : "X",
      aiPlayer,
      1,
      { nodesSearched: 0 }
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
  // Simulate the chosen best move and continue extracting deeper plies.
  const nextBoard = [...board];
  nextBoard[bestMove] = currentPlayer;
  const nextPlayer = currentPlayer === "X" ? "O" : "X";
  return [bestMove, ...extractPV(nextBoard, nextPlayer, aiPlayer)];
}
// SECTION 9: FIND BEST MOVE WITH PRINCIPAL VARIATION — Returns the optimal move along with the full
// predicted move sequence (PV), evaluation score, and node count.
// The PV is the optimal predicted line under exhaustive Minimax; it is NOT a guarantee of human play.
export function findBestMoveWithPV(board, aiPlayer = "O", random = Math.random) {
  const stats = { nodesSearched: 0 };
  const result = minimax(board, aiPlayer, aiPlayer, 0, stats, random);
  const nextBoard = [...board];
  if (result.move !== null) nextBoard[result.move] = aiPlayer;
  const nextPlayer = aiPlayer === "X" ? "O" : "X";
  const pv = result.move === null
    ? []
    : [result.move, ...extractPV(nextBoard, nextPlayer, aiPlayer)];
  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
    pv,
  };
}
