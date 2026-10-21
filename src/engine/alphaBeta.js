
import {
  getGameStatus,
  getAvailableMoves,
} from "./gameEngine.js";

export function alphaBeta(
  board,
  currentPlayer,
  aiPlayer = "O",
  depth = 0,
  alpha = -Infinity,
  beta = Infinity,
  stats = { nodesSearched: 0, nodesPruned: 0 }
) {
  stats.nodesSearched++;

  const status = getGameStatus(board);

  // Terminal-state evaluation
  if (status.status === "won") {
    if (status.winner === aiPlayer) {
      return { score: 100 - depth, move: null };
    }

    return { score: depth - 100, move: null };
  }

  if (status.status === "draw") {
    return { score: 0, move: null };
  }

  const maximizing = currentPlayer === aiPlayer;
  const nextPlayer = currentPlayer === "X" ? "O" : "X";

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = null;

  const moves = getAvailableMoves(board);

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const nextBoard = [...board];
    nextBoard[move] = currentPlayer;

    const result = alphaBeta(
      nextBoard,
      nextPlayer,
      aiPlayer,
      depth + 1,
      alpha,
      beta,
      stats
    );

    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = move;
    }

    if (maximizing) {
      alpha = Math.max(alpha, bestScore);
    } else {
      beta = Math.min(beta, bestScore);
    }

    // Prune the remaining sibling moves.
    if (alpha >= beta) {
      stats.nodesPruned += moves.length - i - 1;
      break;
    }
  }

  return {
    score: bestScore,
    move: bestMove,
  };
}

export function findBestMoveAlphaBeta(
  board,
  aiPlayer = "O"
) {
  const stats = {
    nodesSearched: 0,
    nodesPruned: 0,
  };

  const result = alphaBeta(
    board,
    aiPlayer,
    aiPlayer,
    0,
    -Infinity,
    Infinity,
    stats
  );

  return {
    move: result.move,
    score: result.score,
    nodesSearched: stats.nodesSearched,
    nodesPruned: stats.nodesPruned,
  };
}
