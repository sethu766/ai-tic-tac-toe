/**
 * Connect Four Engine & Adversarial Search Algorithms
 *
 * Implements board representations, move validation, winning detection,
 * heuristic window evaluation, depth-limited Minimax, and Alpha-Beta Pruning.
 */

export const ROWS = 6;
export const COLS = 7;
export const RED = "R";
export const YELLOW = "Y";
export const EMPTY = null;

/**
 * Creates an empty 6x7 Connect Four grid.
 */
export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

/**
 * Returns available column indices that are not completely filled.
 * Center columns are explored first for optimal move ordering in search.
 */
export function getValidMoves(board) {
  if (!board || !Array.isArray(board) || board.length !== ROWS) {
    return [];
  }
  return Array.from({ length: COLS }, (_, col) => col)
    .filter((col) => board[0] && board[0][col] === EMPTY)
    .sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
}

/**
 * Drops a piece into the chosen column at the lowest empty row.
 * Returns a new cloned board without mutating the original board.
 */
export function dropPiece(board, col, player) {
  if (col < 0 || col >= COLS) return null;
  if (!board || !board[0] || board[0][col] !== EMPTY) return null;

  const next = board.map((row) => [...row]);
  for (let row = ROWS - 1; row >= 0; row--) {
    if (next[row][col] === EMPTY) {
      next[row][col] = player;
      return next;
    }
  }
  return null;
}

/**
 * Checks for four consecutive tokens horizontally, vertically, or diagonally.
 */
export function getWinner(board) {
  if (!board || !Array.isArray(board)) return null;

  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal Down-Right
    [-1, 1],  // Diagonal Up-Right
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const player = board[row][col];
      if (!player) continue;

      for (const [dr, dc] of directions) {
        let count = 1;
        for (let step = 1; step < 4; step++) {
          const r = row + dr * step;
          const c = col + dc * step;
          if (
            r < 0 || r >= ROWS || c < 0 || c >= COLS ||
            board[r][c] !== player
          ) {
            break;
          }
          count++;
        }
        if (count >= 4) return player;
      }
    }
  }
  return null;
}

/**
 * Returns overall game status: "won", "draw", or "playing".
 */
export function getGameStatus(board) {
  const winner = getWinner(board);
  if (winner) {
    return { status: "won", winner };
  }
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) {
    return { status: "draw", winner: null };
  }
  return { status: "playing", winner: null };
}

/**
 * Evaluates a 4-cell window heuristic.
 */
export function scoreWindow(window, player) {
  const opponent = player === RED ? YELLOW : RED;
  const own = window.filter((cell) => cell === player).length;
  const other = window.filter((cell) => cell === opponent).length;
  const empty = window.filter((cell) => cell === EMPTY).length;

  if (own === 4) return 100;
  if (other === 4) return -100;
  if (own === 3 && empty === 1) return 30;
  if (own === 2 && empty === 2) return 10;
  if (own === 1 && empty === 3) return 1;
  if (other === 3 && empty === 1) return -40;
  if (other === 2 && empty === 2) return -10;
  return 0;
}

/**
 * Evaluates board position for a given player based on center control and windows.
 */
export function evaluateBoard(board, player) {
  const winner = getWinner(board);
  if (winner === player) return 100000;
  if (winner) return -100000;
  if (getValidMoves(board).length === 0) return 0;

  let score = 0;

  // Center column control bonus
  for (let row = 0; row < ROWS; row++) {
    if (board[row][3] === player) score += 3;
    else if (board[row][3]) score -= 3;
  }

  // Horizontal windows
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      score += scoreWindow([0, 1, 2, 3].map((i) => board[row][col + i]), player);
    }
  }

  // Vertical windows
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col < COLS; col++) {
      score += scoreWindow([0, 1, 2, 3].map((i) => board[row + i][col]), player);
    }
  }

  // Diagonal windows
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const downRight = [0, 1, 2, 3].map((i) => board[row + i][col + i]);
      const upRight = [0, 1, 2, 3].map((i) => board[row + 3 - i][col + i]);
      score += scoreWindow(downRight, player) + scoreWindow(upRight, player);
    }
  }

  return score;
}

/**
 * Connect Four Alpha-Beta Pruning search algorithm.
 * Skips branches that cannot alter the optimal minimax decision.
 */
export function connectFourAlphaBeta(
  board,
  depth,
  alpha = -Infinity,
  beta = Infinity,
  currentPlayer,
  aiPlayer
) {
  const winner = getWinner(board);
  const moves = getValidMoves(board);

  // Terminal conditions
  if (winner || moves.length === 0 || depth === 0) {
    let score;
    if (winner === aiPlayer) score = 100000 + depth;
    else if (winner) score = -100000 - depth;
    else if (moves.length === 0) score = 0;
    else score = evaluateBoard(board, aiPlayer);
    return { score, move: null, nodes: 1, pruned: 0 };
  }

  const maximizing = currentPlayer === aiPlayer;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = moves[0];
  let nodes = 1;
  let pruned = 0;

  for (let i = 0; i < moves.length; i++) {
    const col = moves[i];
    const nextBoard = dropPiece(board, col, currentPlayer);
    const nextPlayer = currentPlayer === RED ? YELLOW : RED;

    const result = connectFourAlphaBeta(
      nextBoard,
      depth - 1,
      alpha,
      beta,
      nextPlayer,
      aiPlayer
    );

    nodes += result.nodes;
    pruned += result.pruned;

    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = col;
    }

    if (maximizing) {
      alpha = Math.max(alpha, bestScore);
    } else {
      beta = Math.min(beta, bestScore);
    }

    if (alpha >= beta) {
      pruned += moves.length - i - 1;
      break;
    }
  }

  return { score: bestScore, move: bestMove, nodes, pruned };
}

/**
 * Connect Four Minimax algorithm without pruning (exhaustive search up to depth).
 * Explores all branches at the specified depth to provide an academic baseline.
 */
export function connectFourMinimax(
  board,
  depth,
  currentPlayer,
  aiPlayer
) {
  const winner = getWinner(board);
  const moves = getValidMoves(board);

  if (winner || moves.length === 0 || depth === 0) {
    let score;
    if (winner === aiPlayer) score = 100000 + depth;
    else if (winner) score = -100000 - depth;
    else if (moves.length === 0) score = 0;
    else score = evaluateBoard(board, aiPlayer);
    return { score, move: null, nodes: 1, pruned: 0 };
  }

  const maximizing = currentPlayer === aiPlayer;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = moves[0];
  let nodes = 1;

  for (let i = 0; i < moves.length; i++) {
    const col = moves[i];
    const nextBoard = dropPiece(board, col, currentPlayer);
    const nextPlayer = currentPlayer === RED ? YELLOW : RED;

    const result = connectFourMinimax(
      nextBoard,
      depth - 1,
      nextPlayer,
      aiPlayer
    );

    nodes += result.nodes;

    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = col;
    }
  }

  return { score: bestScore, move: bestMove, nodes, pruned: 0 };
}

