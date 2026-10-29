/*
 * Random Agent
 * Selects one of the legal moves at random.
 */

export function randomAgent(board) {
  const legalMoves = [];

  // Find all empty cells.
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      legalMoves.push(i);
    }
  }

  // Return null if the board is full.
  if (legalMoves.length === 0) {
    return null;
  }

  // Select a random legal move.
  const randomIndex = Math.floor(
    Math.random() * legalMoves.length
  );

  return legalMoves[randomIndex];
}