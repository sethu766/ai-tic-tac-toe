
export const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createBoard() {
  return Array(9).fill(null);
}

export function getWinner(board) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      return {
        winner: board[a],
        combination: [a, b, c],
      };
    }
  }

  return null;
}

export function getGameStatus(board) {
  const result = getWinner(board);

  if (result) {
    return {
      status: "won",
      winner: result.winner,
      winningCombination: result.combination,
    };
  }

  if (board.every((cell) => cell !== null)) {
    return {
      status: "draw",
      winner: null,
      winningCombination: [],
    };
  }

  return {
    status: "playing",
    winner: null,
    winningCombination: [],
  };
}

export function getAvailableMoves(board) {
  return board
    .map((cell, index) => (cell === null ? index : null))
    .filter((index) => index !== null);
}

export function makeMove(board, index, player) {
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    throw new Error("Move must be a board index from 0 to 8.");
  }

  if (player !== "X" && player !== "O") {
    throw new Error("Player must be X or O.");
  }

  if (getGameStatus(board).status !== "playing") {
    throw new Error("Cannot move after the game has ended.");
  }

  if (board[index] !== null) {
    throw new Error("That cell is already occupied.");
  }

  const nextBoard = [...board];
  nextBoard[index] = player;

  return nextBoard;
  
}
