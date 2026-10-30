/**
 * analysis.test.js
 *
 * Tests for the adversarial reasoning analysis service and MasterAgent.analyzePosition().
 * Verifies PV extraction, opponent response prediction, board isolation, and
 * Minimax vs Alpha-Beta comparison for both Tic-Tac-Toe and Connect Four.
 */

import { describe, it, expect } from "vitest";
import { analyzePosition } from "../engine/analysisService.js";
import { MasterAgent } from "../agents/MasterAgent.js";
import { MinimaxAgent } from "../agents/MinimaxAgent.js";
import { AlphaBetaAgent } from "../agents/AlphaBetaAgent.js";
import { findBestMoveWithPV } from "../engine/minimax.js";
import { findBestMoveAlphaBetaWithPV } from "../engine/alphaBeta.js";
import {
  connectFourAlphaBetaWithPV,
  connectFourMinimaxWithPV,
  createBoard as createC4Board,
  getValidMoves as getC4ValidMoves,
} from "../engine/connectFourEngine.js";
import {
  createBoard as createTttBoard,
  getAvailableMoves as getTttMoves,
} from "../engine/gameEngine.js";

// ─── TTT boards ───────────────────────────────────────────────────────────────

const EMPTY_TTT = createTttBoard();

// O needs index 2 to win (immediate win position)
const FORCED_WIN_TTT = [
  "O", "O", null,
  "X", "X", null,
  null, null, null,
];

// Board where O must block X winning at index 2
const FORCED_BLOCK_TTT = [
  "X", "X", null,
  "O", null, null,
  null, null, null,
];

// Already won board
const WON_TTT = [
  "X", "X", "X",
  "O", "O", null,
  null, null, null,
];

// Position with 1 move left that results in a draw
const DRAW_IN_ONE_TTT = [
  "X", "O", "X",
  "X", "X", "O",
  "O", "X", null,
];

// ─── TTT Analysis Service Tests ───────────────────────────────────────────────

describe("analyzePosition — Tic-Tac-Toe", () => {
  it("returns a valid analysis object for an active board", () => {
    const result = analyzePosition(EMPTY_TTT, "O", "tic-tac-toe");
    expect(result).not.toBeNull();
    expect(result.game).toBe("tic-tac-toe");
    expect(result.player).toBe("O");
    expect(result.minimax).toBeDefined();
    expect(result.alphaBeta).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.disclaimer).toContain("NOT a guarantee");
  });

  it("returns null when the game is already over", () => {
    const result = analyzePosition(WON_TTT, "O", "tic-tac-toe");
    expect(result).toBeNull();
  });

  it("recommended move is a legal move", () => {
    const result = analyzePosition(EMPTY_TTT, "O", "tic-tac-toe");
    const legal = getTttMoves(EMPTY_TTT);
    expect(legal).toContain(result.alphaBeta.move);
    expect(legal).toContain(result.minimax.move);
  });

  it("PV first element equals the recommended move", () => {
    const result = analyzePosition(FORCED_WIN_TTT, "O", "tic-tac-toe");
    expect(result.alphaBeta.pv[0]).toBe(result.alphaBeta.move);
    expect(result.minimax.pv[0]).toBe(result.minimax.move);
  });

  it("PV second element equals the opponent response", () => {
    const result = analyzePosition(EMPTY_TTT, "O", "tic-tac-toe");
    if (result.alphaBeta.pv.length >= 2) {
      expect(result.alphaBeta.opponentResponse).toBe(result.alphaBeta.pv[1]);
    } else {
      expect(result.alphaBeta.opponentResponse).toBeNull();
    }
  });

  it("analysis does NOT modify the original board", () => {
    const board = [...FORCED_WIN_TTT];
    const boardCopy = [...board];
    analyzePosition(board, "O", "tic-tac-toe");
    expect(board).toEqual(boardCopy);
  });

  it("identifies the winning move in a forced-win position (TTT)", () => {
    const result = analyzePosition(FORCED_WIN_TTT, "O", "tic-tac-toe");
    // O must play cell 2 to win immediately
    expect(result.alphaBeta.move).toBe(2);
    expect(result.minimax.move).toBe(2);
  });

  it("identifies the blocking move in a forced-block position (TTT)", () => {
    const result = analyzePosition(FORCED_BLOCK_TTT, "O", "tic-tac-toe");
    // O must block X at cell 2
    expect(result.alphaBeta.move).toBe(2);
    expect(result.minimax.move).toBe(2);
  });

  it("Minimax and Alpha-Beta agree on score for exhaustive TTT search", () => {
    const result = analyzePosition(FORCED_WIN_TTT, "O", "tic-tac-toe");
    expect(result.comparison.sameScore).toBe(true);
  });

  it("Alpha-Beta searches fewer nodes than Minimax on same TTT board", () => {
    const result = analyzePosition(EMPTY_TTT, "O", "tic-tac-toe");
    expect(result.alphaBeta.nodesSearched).toBeLessThan(result.minimax.nodesSearched);
    expect(result.comparison.nodeReductionPercent).toBeGreaterThan(0);
  });

  it("PV for immediate forced-win is length 1 (just the winning move)", () => {
    const result = analyzePosition(FORCED_WIN_TTT, "O", "tic-tac-toe");
    // After O plays at index 2, the game ends — no more moves in PV.
    expect(result.minimax.pv.length).toBe(1);
    expect(result.alphaBeta.pv.length).toBe(1);
  });

  it("boardSnapshot is a deep clone independent of original board", () => {
    const board = [...FORCED_WIN_TTT];
    const result = analyzePosition(board, "O", "tic-tac-toe");
    // Mutating original should not affect snapshot
    board[0] = "MUTATED";
    expect(result.boardSnapshot[0]).toBe("O");
  });

  it("evaluates a forced draw position with score 0", () => {
    const result = analyzePosition(DRAW_IN_ONE_TTT, "O", "tic-tac-toe");
    expect(result.alphaBeta.move).toBe(8);
    expect(result.alphaBeta.score).toBe(0);
    expect(result.minimax.score).toBe(0);
    expect(result.comparison.sameScore).toBe(true);
  });

  it("returns search tree candidate nodes with score and pruning status", () => {
    const result = analyzePosition(FORCED_BLOCK_TTT, "O", "tic-tac-toe");
    expect(result.treeNodes).toBeDefined();
    expect(Array.isArray(result.treeNodes)).toBe(true);
    expect(result.treeNodes.length).toBeGreaterThan(0);

    const bestNode = result.treeNodes.find((n) => n.isBest);
    expect(bestNode).toBeDefined();
    expect(bestNode.move).toBe(2);
    expect(bestNode.status).toBe("OPTIMAL (PV)");
    expect(bestNode.label).toBe("Cell 3");
  });

  it("MinimaxAgent.analyze returns decision object with pv property", () => {
    const agent = new MinimaxAgent();
    const decision = agent.analyze(FORCED_WIN_TTT, { game: "tic-tac-toe", player: "O" });
    expect(decision.move).toBe(2);
    expect(decision.pv).toBeDefined();
    expect(decision.pv[0]).toBe(2);
  });

  it("AlphaBetaAgent.analyze returns decision object with pv and pruning telemetry", () => {
    const agent = new AlphaBetaAgent();
    const decision = agent.analyze(FORCED_WIN_TTT, { game: "tic-tac-toe", player: "O" });
    expect(decision.move).toBe(2);
    expect(decision.pv).toBeDefined();
    expect(decision.pv[0]).toBe(2);
    expect(decision.nodesSearched).toBeGreaterThan(0);
  });
});

// ─── Connect Four Analysis Service Tests ──────────────────────────────────────

describe("analyzePosition — Connect Four", () => {
  it("returns a valid analysis object for an active C4 board", () => {
    const board = createC4Board();
    const result = analyzePosition(board, "R", "connect-four", { depth: 3 });
    expect(result).not.toBeNull();
    expect(result.game).toBe("connect-four");
    expect(result.player).toBe("R");
    expect(result.minimax).toBeDefined();
    expect(result.alphaBeta).toBeDefined();
    expect(result.comparison).toBeDefined();
  });

  it("recommended move is a valid column for C4", () => {
    const board = createC4Board();
    const result = analyzePosition(board, "Y", "connect-four", { depth: 3 });
    const legal = getC4ValidMoves(board);
    expect(legal).toContain(result.alphaBeta.move);
    expect(legal).toContain(result.minimax.move);
  });

  it("C4 PV first element equals recommended move", () => {
    const board = createC4Board();
    const result = analyzePosition(board, "Y", "connect-four", { depth: 3 });
    if (result.alphaBeta.pv.length > 0) {
      expect(result.alphaBeta.pv[0]).toBe(result.alphaBeta.move);
    }
  });

  it("C4 analysis does not modify original board", () => {
    const board = createC4Board();
    const boardSnapshot = board.map(row => [...row]);
    analyzePosition(board, "Y", "connect-four", { depth: 3 });
    expect(board).toEqual(boardSnapshot);
  });

  it("C4 Alpha-Beta searches fewer nodes than Minimax", () => {
    const board = createC4Board();
    const result = analyzePosition(board, "Y", "connect-four", { depth: 3 });
    expect(result.alphaBeta.nodesSearched).toBeLessThan(result.minimax.nodesSearched);
    expect(result.comparison.nodeReductionPercent).toBeGreaterThan(0);
  });
});

// ─── MasterAgent.analyzePosition() Tests ─────────────────────────────────────

describe("MasterAgent.analyzePosition()", () => {
  it("returns a valid analysis through the Master Agent coordinator", () => {
    const master = new MasterAgent();
    const board = createTttBoard();
    const result = master.analyzePosition(board, "O", "tic-tac-toe");
    expect(result).not.toBeNull();
    expect(result.minimax).toBeDefined();
    expect(result.alphaBeta).toBeDefined();
  });

  it("does not modify the board passed to analyzePosition", () => {
    const master = new MasterAgent();
    const board = [...FORCED_WIN_TTT];
    const copy = [...board];
    master.analyzePosition(board, "O", "tic-tac-toe");
    expect(board).toEqual(copy);
  });

  it("returns null for a terminal (won) game state", () => {
    const master = new MasterAgent();
    const result = master.analyzePosition(WON_TTT, "O", "tic-tac-toe");
    expect(result).toBeNull();
  });

  it("analysis result includes disclaimer about PV being a prediction", () => {
    const master = new MasterAgent();
    const result = master.analyzePosition(createTttBoard(), "O", "tic-tac-toe");
    expect(result.disclaimer).toBeDefined();
    expect(result.disclaimer.toLowerCase()).toContain("not a guarantee");
  });
});

// ─── PV Extraction Engine Tests ───────────────────────────────────────────────

describe("findBestMoveWithPV — minimax PV extraction", () => {
  it("returns pv array with first element equal to move", () => {
    const result = findBestMoveWithPV(FORCED_WIN_TTT, "O");
    expect(result.pv).toBeInstanceOf(Array);
    expect(result.pv[0]).toBe(result.move);
  });

  it("returns nodesSearched > 0", () => {
    const result = findBestMoveWithPV(EMPTY_TTT, "O");
    expect(result.nodesSearched).toBeGreaterThan(0);
  });
});

describe("findBestMoveAlphaBetaWithPV — alpha-beta PV extraction", () => {
  it("returns pv array with first element equal to move", () => {
    const result = findBestMoveAlphaBetaWithPV(FORCED_WIN_TTT, "O");
    expect(result.pv).toBeInstanceOf(Array);
    expect(result.pv[0]).toBe(result.move);
  });

  it("returns nodesPruned > 0 on non-trivial position", () => {
    const result = findBestMoveAlphaBetaWithPV(EMPTY_TTT, "O");
    expect(result.nodesPruned).toBeGreaterThan(0);
  });
});

describe("connectFourAlphaBetaWithPV — C4 alpha-beta PV extraction", () => {
  it("returns pv array for a valid C4 board", () => {
    const board = createC4Board();
    const result = connectFourAlphaBetaWithPV(board, 3, "Y", "Y");
    expect(result.pv).toBeInstanceOf(Array);
    if (result.pv.length > 0) {
      expect(getC4ValidMoves(board)).toContain(result.pv[0]);
    }
  });
});

describe("connectFourMinimaxWithPV — C4 minimax PV extraction", () => {
  it("returns pv array for a valid C4 board", () => {
    const board = createC4Board();
    const result = connectFourMinimaxWithPV(board, 2, "Y", "Y");
    expect(result.pv).toBeInstanceOf(Array);
    if (result.pv.length > 0) {
      expect(getC4ValidMoves(board)).toContain(result.pv[0]);
    }
  });
});

