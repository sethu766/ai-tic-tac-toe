// SECTION 1: WINNING COMBINATIONS — Stores every possible winning line on the 3×3 Tic-Tac-Toe board.
export const WINNING_COMBINATIONS = [
  // Horizontal winning combinations — three rows.
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Vertical winning combinations — three columns.
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonal winning combinations — two diagonals.
  [0, 4, 8],
  [2, 4, 6],
];
// SECTION 2: CREATE BOARD — Creates an empty board containing nine cells.
export function createBoard() {
  // Array(9) creates nine positions, and fill(null) marks every cell as empty.
  return Array(9).fill(null);
}
// SECTION 3: DETECT WINNER — Checks whether X or O has completed a winning combination.
export function getWinner(board) {
  // Loop through each possible winning combination and extract its three cell indexes.
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    // Check that the first cell is occupied and all three cells contain the same player's symbol.
    if (
      board[a] &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      // Return the winning player's symbol and the indexes forming the winning line.
      return {
        winner: board[a],
        combination: [a, b, c],
      };
    }
  }
  // Return null when no winning combination is found.
  return null;
}
// SECTION 4: CHECK GAME STATUS — Determines whether the game is won, drawn, or still in progress.
export function getGameStatus(board) {
  // Call getWinner() to check whether a player has won.
  const result = getWinner(board);
  // If a winner exists, return the win status, winner's symbol, and winning cell indexes.
  if (result) {
    return {
      status: "won",
      winner: result.winner,
      winningCombination: result.combination,
    };
  }
  // If every cell is occupied and no winner exists, the game is a draw.
  if (board.every((cell) => cell !== null)) {
    return {
      status: "draw",
      winner: null,
      winningCombination: [],
    };
  }
  // If there is no winner and at least one empty cell remains, the game is still in progress.
  return {
    status: "playing",
    winner: null,
    winningCombination: [],
  };
}
// SECTION 5: GET AVAILABLE MOVES — Returns the indexes of all empty cells where a player can move.
export function getAvailableMoves(board) {
  // Map occupied cells to null and empty cells to their indexes, then filter out null values.
  return board
    .map((cell, index) => (cell === null ? index : null))
    .filter((index) => index !== null);
}
// SECTION 6: MAKE A MOVE — Validates a move and returns a new board with the player's symbol placed.
export function makeMove(board, index, player) {
  // Validate that the selected index is an integer between 0 and 8.
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    throw new Error("Move must be a board index from 0 to 8.");
  }
  // Ensure that the player symbol is either X or O.
  if (player !== "X" && player !== "O") {
    throw new Error("Player must be X or O.");
  }
  // Prevent moves after the game has already ended.
  if (getGameStatus(board).status !== "playing") {
    throw new Error("Cannot move after the game has ended.");
  }
  // Prevent a player from placing a symbol in an occupied cell.
  if (board[index] !== null) {
    throw new Error("That cell is already occupied.");
  }
  // Create a shallow copy of the board to preserve the original board.
  const nextBoard = [...board];
  // Place the current player's symbol in the selected cell of the copied board.
  nextBoard[index] = player;
  // Return the updated board without modifying the original board.
  return nextBoard;
}