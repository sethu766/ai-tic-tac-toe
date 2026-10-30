import { describe, expect, it } from "vitest";
import { MasterAgent } from "../agents/MasterAgent.js";
import { findBestMove } from "../engine/minimax.js";
import { findBestMoveAlphaBeta } from "../engine/alphaBeta.js";
import {
  RED,
  YELLOW,
  createBoard as createConnectFourBoard,
  dropPiece,
  evaluateBoard,
  getGameStatus as getConnectFourStatus,
  getValidMoves,
  getWinner as getConnectFourWinner,
  connectFourMinimax,
  connectFourAlphaBeta,
} from "../engine/connectFourEngine.js";
import { createBoard as createTicTacToeBoard, getAvailableMoves } from "../engine/gameEngine.js";

describe("controlled search variation", () => {
  it("randomly chooses only equally optimal Tic-Tac-Toe Minimax moves", () => {
    const board = createTicTacToeBoard();
    const first = findBestMove(board, "X", () => 0);
    const last = findBestMove(board, "X", () => 0.99);

    expect(first.move).toBe(0);
    expect(last.move).toBe(8);
    expect(getAvailableMoves(board)).toContain(first.move);
    expect(getAvailableMoves(board)).toContain(last.move);
    expect(first.score).toBe(0);
    expect(last.score).toBe(first.score);
  });

  it("randomly chooses only equally optimal Tic-Tac-Toe Alpha-Beta moves", () => {
    const board = createTicTacToeBoard();
    let randomCalls = 0;
    const first = findBestMoveAlphaBeta(board, "X", () => {
      randomCalls++;
      return 0;
    });
    const last = findBestMoveAlphaBeta(board, "X", () => {
      randomCalls++;
      return 0.99;
    });

    expect(first.move).toBe(0);
    expect(last.move).toBe(8);
    expect(getAvailableMoves(board)).toContain(last.move);
    expect(last.score).toBe(first.score);
    expect(first.nodesPruned).toBeGreaterThan(0);
    expect(randomCalls).toBe(2);
  });

  it("breaks exact Connect Four Minimax and Alpha-Beta ties without losing optimal score", () => {
    const board = createConnectFourBoard();
    for (let row = 0; row < 6; row++) {
      board[row][3] = row % 2 ? YELLOW : RED;
    }

    const minimaxFirst = connectFourMinimax(board, 1, RED, RED, () => 0);
    const minimaxLast = connectFourMinimax(board, 1, RED, RED, () => 0.99);
    const alphaBetaFirst = connectFourAlphaBeta(
      board, 1, -Infinity, Infinity, RED, RED, () => 0
    );
    const alphaBetaLast = connectFourAlphaBeta(
      board, 1, -Infinity, Infinity, RED, RED, () => 0.99
    );

    expect(minimaxFirst.move).toBe(2);
    expect(minimaxLast.move).toBe(4);
    expect(alphaBetaFirst.move).toBe(2);
    expect(alphaBetaLast.move).toBe(4);
    expect(minimaxLast.score).toBe(minimaxFirst.score);
    expect(alphaBetaLast.score).toBe(alphaBetaFirst.score);
    expect(minimaxLast.move).not.toBeNull();
    expect(alphaBetaLast.move).not.toBeNull();
  });

  it("evaluates color-swapped Connect Four positions symmetrically", () => {
    const board = createConnectFourBoard();
    board[5][0] = RED;
    board[5][1] = YELLOW;
    board[5][2] = RED;
    board[4][1] = RED;
    board[4][2] = YELLOW;
    const swapped = board.map((row) =>
      row.map((cell) => cell === RED ? YELLOW : cell === YELLOW ? RED : cell)
    );

    expect(evaluateBoard(board, RED)).toBe(-evaluateBoard(swapped, RED));
    expect(evaluateBoard(board, RED)).toBe(-evaluateBoard(board, YELLOW));
  });

  it("detects horizontal, vertical, and both diagonal Connect Four wins", () => {
    const wins = [
      { player: RED, cells: [[5, 0], [5, 1], [5, 2], [5, 3]] },
      { player: YELLOW, cells: [[2, 0], [3, 0], [4, 0], [5, 0]] },
      { player: RED, cells: [[2, 0], [3, 1], [4, 2], [5, 3]] },
      { player: YELLOW, cells: [[5, 0], [4, 1], [3, 2], [2, 3]] },
    ];

    for (const { player, cells } of wins) {
      const board = createConnectFourBoard();
      for (const [row, col] of cells) board[row][col] = player;
      expect(getConnectFourWinner(board)).toBe(player);
      expect(getConnectFourStatus(board).status).toBe("won");
    }
  });

  it("detects a full Connect Four draw and applies gravity to legal drops", () => {
    const drawBoard = createConnectFourBoard();
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        drawBoard[row][col] = (row + 2 * col) % 4 < 2 ? RED : YELLOW;
      }
    }
    expect(getConnectFourWinner(drawBoard)).toBeNull();
    expect(getConnectFourStatus(drawBoard).status).toBe("draw");
    expect(getValidMoves(drawBoard)).toEqual([]);

    const board = createConnectFourBoard();
    const dropped = dropPiece(board, 4, YELLOW);
    expect(dropped[5][4]).toBe(YELLOW);
    expect(board[5][4]).toBeNull();
  });

  it("keeps agent selection coordinated through MasterAgent for either player", () => {
    const master = new MasterAgent();
    const board = createTicTacToeBoard();
    const minimax = master.chooseMove(board, {
      game: "tic-tac-toe",
      player: "X",
      strategy: "minimax",
      random: () => 0.99,
    });
    const alphaBeta = master.chooseMove(board, {
      game: "tic-tac-toe",
      player: "O",
      strategy: "alpha-beta",
      random: () => 0.99,
    });

    expect(minimax.agentId).toBe("minimax");
    expect(alphaBeta.agentId).toBe("alpha-beta");
    expect(minimax.move).toBe(8);
    expect(alphaBeta.move).toBe(8);
  });

  it("keeps Connect Four move selection legal for either player color", () => {
    const master = new MasterAgent();
    const board = createConnectFourBoard();

    for (const player of [RED, YELLOW]) {
      const decision = master.chooseMove(board, {
        game: "connect-four",
        player,
        difficulty: "hard",
        depth: 2,
        random: () => 0.5,
      });
      expect([0, 1, 2, 3, 4, 5, 6]).toContain(decision.move);
      expect(decision.player).toBe(player);
      expect(decision.agentId).toBe("alpha-beta");
    }
  });

  it("does not mutate the Connect Four board during search", () => {
    const board = createConnectFourBoard();
    const snapshot = board.map((row) => [...row]);

    connectFourMinimax(board, 2, RED, RED, () => 0.5);
    connectFourAlphaBeta(board, 2, -Infinity, Infinity, RED, RED, () => 0.5);

    expect(board).toEqual(snapshot);
  });
});
