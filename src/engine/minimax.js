
import {
  getGameStatus,
  getAvailableMoves,
} from "./gameEngine.js";

export function minimax(
  board,
  currentPlayer,
  aiPlayer = "O",
  depth = 0,
  stats = { nodesSearched: 0 }
) {
  stats.nodesSearched++;

  const status = getGameStatus(board);

  // Evaluate terminal states first.
  if (status.status === "won") {
    if (status.winner === aiPlayer) {
      return { score: 100 - depth, move: null };
    }

    return { score: depth - 100, move: null };
  }

  if (status.status === "draw") {
    return { score: 0, move: null };
  }

  const opponent = aiPlayer === "X" ? "O" : "X";
  const maximizing = currentPlayer === aiPlayer;

  let bestScore = maximizing
    ? -Infinity
    : Infinity;

  let bestMove = null;

  for (const move of getAvailableMoves(board)) {
    const nextBoard = [...board];
    nextBoard[move] = currentPlayer;

    const result = minimax(
      nextBoard,
      currentPlayer === "X" ? "O" : "X",
      aiPlayer,
      depth + 1,
      stats
    );

    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = move;
    }
  }

  return {
    score: bestScore,
    move: bestMove,
  };
}

export function findBestMove(board, aiPlayer = "O") {
  const stats = { nodesSearched: 0 };

  const result = minimax(
    board,
    aiPlayer,
    aiPlayer,
    0,
    stats
  );

  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
  };
}
