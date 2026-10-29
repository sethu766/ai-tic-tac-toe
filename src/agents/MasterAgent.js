/*
 * Master Agent
 * Coordinates the individual agent modules.
 */

import { randomAgent } from "./RandomAgent.js";
import { minimaxAgent } from "./MinimaxAgent.js";
import { alphaBetaAgent } from "./AlphaBetaAgent.js";

export function masterAgent(
  board,
  difficulty = "hard",
  aiPlayer = "O"
) {
  // Work with a copy so the original board is not changed.
  const safeBoard = [...board];

  // Reject invalid or finished board states.
  if (safeBoard.length !== 9) {
    throw new Error("The board must contain 9 cells.");
  }

  const winner = getWinner(safeBoard);

  if (
    winner !== null ||
    safeBoard.every(cell => cell !== null)
  ) {
    return null;
  }

  switch (difficulty.toLowerCase()) {
    case "easy":
      return randomAgent(safeBoard);

    case "medium":
      // Demonstration policy: random on some turns,
      // Alpha-Beta on others.
      return Math.random() < 0.5
        ? randomAgent(safeBoard)
        : alphaBetaAgent(safeBoard, aiPlayer);

    case "hard":
      return alphaBetaAgent(safeBoard, aiPlayer);

    case "minimax":
      return minimaxAgent(safeBoard, aiPlayer);

    default:
      throw new Error(
        "Choose easy, medium, hard, or minimax."
      );
  }
}

function getWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
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