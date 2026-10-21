import { describe, it, expect } from "vitest";

import {
  createBoard,
  getGameStatus,
  getAvailableMoves,
  makeMove,

} from "../engine/gameEngine.js";

import {
  findBestMove,
} from "../engine/minimax.js";

import {
  findBestMoveAlphaBeta,
} from "../engine/alphaBeta.js";

describe("AI Tic-Tac-Toe algorithms", () => {
  it("detects a winning row", () => {
    const board = [
      "X", "X", "X",
      "O", "O", null,
      null, null, null,
    ];

    expect(getGameStatus(board).winner).toBe("X");
  });

  it("finds an immediate winning move", () => {
    const board = [
      "O", "O", null,
      "X", "X", null,
      null, null, null,
    ];

    expect(findBestMove(board, "O").move).toBe(2);
    expect(findBestMoveAlphaBeta(board, "O").move).toBe(2);
  });

  it("blocks an immediate opponent win", () => {
    const board = [
      "X", "X", null,
      "O", null, null,
      null, null, null,
    ];

    expect(findBestMove(board, "O").move).toBe(2);
    expect(findBestMoveAlphaBeta(board, "O").move).toBe(2);
  });

  it("never chooses an occupied cell", () => {
    const board = [
      "X", null, null,
      null, "O", null,
      null, null, null,
    ];

    const move1 = findBestMove(board, "O").move;
    const move2 = findBestMoveAlphaBeta(board, "O").move;

    expect(board[move1]).toBeNull();
    expect(board[move2]).toBeNull();
  });

  it("handles an empty board", () => {
    const board = createBoard();

    expect(findBestMove(board, "X").move).not.toBeNull();
    expect(findBestMoveAlphaBeta(board, "X").move).not.toBeNull();
  });
  
  it("both algorithms return the same optimal score", () => {
    const positions = [
      ["X", "O", "X", "O", "X", null, null, null, null],
      ["X", "X", null, "O", "O", null, null, null, null],
      ["O", null, "X", null, "X", null, null, "O", null],
      [null, null, null, null, "X", null, null, null, null],
    ];

    for (const board of positions) {
      const minimaxResult = findBestMove(board, "O");
      const alphaBetaResult = findBestMoveAlphaBeta(board, "O");

      expect(alphaBetaResult.score).toBe(minimaxResult.score);
    }
  });
  
  it("recognizes a full board as a draw", () => {
    const board = [
      "X", "O", "X",
      "X", "O", "O",
      "O", "X", "X",
    ];

    expect(getGameStatus(board).status).toBe("draw");
  });

  it("returns no legal moves on a full board", () => {
    const board = [
      "X", "O", "X",
      "X", "O", "O",
      "O", "X", "X",
    ];

    expect(getAvailableMoves(board)).toEqual([]);
  });

  it("never selects an occupied cell", () => {
    const board = [
      "X", "O", "X",
      null, "O", null,
      null, null, null,
    ];

    const minimaxMove = findBestMove(board, "O").move;
    const alphaBetaMove = findBestMoveAlphaBeta(board, "O").move;

    expect(board[minimaxMove]).toBeNull();
    expect(board[alphaBetaMove]).toBeNull();
  });
  
it("makeMove returns a new board without changing the original", () => {
  const board = createBoard();

  const nextBoard = makeMove(board, 4, "X");

  expect(board[4]).toBeNull();
  expect(nextBoard[4]).toBe("X");
  expect(nextBoard).not.toBe(board);
});

it("makeMove rejects an occupied cell", () => {
  const board = ["X", null, null, null, "O", null, null, null, null];

  expect(() => makeMove(board, 0, "O")).toThrow();
});

it("both algorithms return legal moves on reachable positions", () => {
  const board = ["X", null, null, null, "O", null, null, null, "X"];

  const minimaxResult = findBestMove(board, "O");
  const alphaBetaResult = findBestMoveAlphaBeta(board, "O");

  expect(getAvailableMoves(board)).toContain(minimaxResult.move);
  expect(getAvailableMoves(board)).toContain(alphaBetaResult.move);
  expect(minimaxResult.score).toBe(alphaBetaResult.score);
});

it("both algorithms agree on the empty board's optimal score", () => {
  const board = createBoard();

  const minimaxResult = findBestMove(board, "X");
  const alphaBetaResult = findBestMoveAlphaBeta(board, "X");

  expect(minimaxResult.score).toBe(alphaBetaResult.score);
});

it("both algorithms agree across reachable game states", () => {
  const visited = new Set();
  const positions = [];

  function explore(board, player) {
    const key = board.map((cell) => cell ?? "-").join("");

    if (visited.has(key)) return;
    visited.add(key);

    const status = getGameStatus(board);

    if (status.status !== "playing") return;

    positions.push({ board, player });

    for (const move of getAvailableMoves(board)) {
      const nextBoard = makeMove(board, move, player);
      explore(nextBoard, player === "X" ? "O" : "X");
    }
  }

  explore(createBoard(), "X");

  for (const { board, player } of positions) {
    const legalMoves = getAvailableMoves(board);

    const minimaxResult = findBestMove(board, player);
    const alphaBetaResult = findBestMoveAlphaBeta(board, player);

    expect(legalMoves).toContain(minimaxResult.move);
    expect(legalMoves).toContain(alphaBetaResult.move);
    expect(alphaBetaResult.score).toBe(minimaxResult.score);
  }

  expect(positions.length).toBeGreaterThan(0);
});


});
