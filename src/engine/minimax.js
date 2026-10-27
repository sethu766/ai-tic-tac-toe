// SECTION 1: IMPORTS — Import functions for checking the game status and finding legal moves.
import {
  getGameStatus,
  getAvailableMoves,
} from "./gameEngine.js";
// SECTION 2: MINIMAX ALGORITHM — Recursively explores possible moves to select the best move for the AI.
export function minimax(
  board,
  currentPlayer,
  aiPlayer = "O",
  depth = 0,
  stats = { nodesSearched: 0 }
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
  // Identify the symbol belonging to the opponent of the AI player.
  const opponent = aiPlayer === "X" ? "O" : "X";
  // Determine whether this level should maximize or minimize the score.
  // The AI maximizes its score, while the opponent minimizes the AI's score.
  const maximizing = currentPlayer === aiPlayer;
  // Initialize the best score to negative Infinity for maximizing or positive Infinity for minimizing.
  let bestScore = maximizing
    ? -Infinity
    : Infinity;
  // Store the move that produces the best score found so far.
  let bestMove = null;
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
      stats
    );
    // Update the best score and move if this result improves the current choice.
    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = move;
    }
  }
  // SECTION 6: RETURN THE BEST RESULT — Return the best score and corresponding move for this position.
  return {
    score: bestScore,
    move: bestMove,
  };
}
// SECTION 7: FIND BEST MOVE — Starts the Minimax search for the selected AI player.
export function findBestMove(board, aiPlayer = "O") {
  // Initialize the counter used to track how many board positions are searched.
  const stats = { nodesSearched: 0 };
  // Start the search from the current board, with the AI player taking the first search turn.
  const result = minimax(
    board,
    aiPlayer,
    aiPlayer,
    0,
    stats
  );
  // Return the selected move, its evaluation score, and the number of searched nodes.
  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
  };
}