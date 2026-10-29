/*
 * Alpha-Beta Agent
 * Minimax search with alpha-beta pruning.
 */

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function getWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (
      board[a] !== null &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      return board[a];
    }
  }

  return null;
}

function alphaBeta(
  board, currentPlayer, aiPlayer, depth, alpha, beta
) {
  const opponent = aiPlayer === "O" ? "X" : "O";
  const winner = getWinner(board);

  if (winner === aiPlayer) return 10 - depth;
  if (winner === opponent) return depth - 10;

  const legalMoves = board
    .map((cell, index) => cell === null ? index : null)
    .filter(index => index !== null);

  if (legalMoves.length === 0) return 0;

  if (currentPlayer === aiPlayer) {
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      board[move] = currentPlayer;

      const score = alphaBeta(
        board, opponent, aiPlayer, depth + 1,
        alpha, beta
      );

      board[move] = null;
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);

      // Prune branches that cannot improve the result.
      if (alpha >= beta) break;
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of legalMoves) {
    board[move] = currentPlayer;

    const score = alphaBeta(
      board, aiPlayer, aiPlayer, depth + 1,
      alpha, beta
    );

    board[move] = null;
    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);

    if (alpha >= beta) break;
  }

  return bestScore;
}

export function alphaBetaAgent(board, aiPlayer = "O") {
  const opponent = aiPlayer === "O" ? "X" : "O";
  let bestMove = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null) continue;

    board[i] = aiPlayer;

    const score = alphaBeta(
      board, opponent, aiPlayer, 1, alpha, beta
    );

    board[i] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }

    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}