/**
 * analysisService.js
 *
 * Read-only adversarial reasoning analysis service for NEURALTAC.
 * Accepts the current board and player, clones the board, runs both Minimax and
 * Alpha-Beta search algorithms (via Master Agent's registered concrete agents
 * or engine PV functions), extracts the Principal Variation (PV), constructs a
 * readable candidate search tree with pruning statuses, and returns a structured
 * analysis report.
 *
 * IMPORTANT: This service NEVER modifies game state. It clones every board
 * before any operation and never calls any React state setter.
 *
 * The PV is the predicted optimal move sequence under the configured search
 * depth and evaluation rules. It is a game-theoretic prediction only —
 * NOT a guarantee of what a human opponent will actually play.
 */

import { findBestMoveWithPV } from "./minimax.js";
import { findBestMoveAlphaBetaWithPV, findBestMoveAlphaBeta } from "./alphaBeta.js";

import {
  connectFourAlphaBetaWithPV,
  connectFourMinimaxWithPV,
  connectFourAlphaBeta,
  dropPiece,
  getGameStatus as getC4GameStatus,
  getValidMoves as getC4ValidMoves,
} from "./connectFourEngine.js";

import {
  getGameStatus as getTttGameStatus,
  getAvailableMoves as getTttAvailableMoves,
} from "./gameEngine.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Deep-clones a Tic-Tac-Toe board (1-D array).
 */
function cloneTttBoard(board) {
  return [...board];
}

/**
 * Deep-clones a Connect Four board (2-D array).
 */
function cloneC4Board(board) {
  return board.map((row) => [...row]);
}

/**
 * Formats a principal variation array as a readable sequence string.
 *
 * @param {number[]} pv          Array of move indices/column numbers.
 * @param {string}   aiPlayer    The AI player symbol.
 * @param {string}   firstPlayer The player who moves first in the PV (usually the AI).
 * @param {string}   game        'tic-tac-toe' or 'connect-four'
 * @returns {string[]} Human-readable step labels.
 */
function formatPV(pv, aiPlayer, firstPlayer, game) {
  if (!pv || pv.length === 0) return [];
  const opponent =
    aiPlayer === "O" ? "X"
    : aiPlayer === "X" ? "O"
    : aiPlayer === "R" ? "Y"
    : "R";
  let current = firstPlayer;
  return pv.map((move, i) => {
    const who = current;
    const label =
      game === "connect-four" ? `Col ${move + 1}` : `Cell ${move + 1}`;
    const tag =
      i === 0 ? "(AI recommended)"
      : i === 1 ? "(predicted response)"
      : "(predicted)";
    const step = `${i + 1}. ${who} → ${label} ${tag}`;
    current = current === aiPlayer ? opponent : aiPlayer;
    return step;
  });
}

// ─── Core Analysis ───────────────────────────────────────────────────────────

/**
 * Analyzes the given board position for Tic-Tac-Toe using both Minimax and Alpha-Beta.
 * Returns a structured report without modifying the original board.
 *
 * @param {Array}  board        The current live TTT board (1-D array, length 9).
 * @param {string} player       The player whose turn it is ('X' or 'O').
 * @param {Object} masterAgent  Optional MasterAgent singleton for agent delegation.
 * @returns {Object|null}       Analysis report, or null if the game is already over.
 */
function analyzeTicTacToe(board, player, masterAgent = null) {
  // Always work on a clone — never touch the live board.
  const snapshot = cloneTttBoard(board);

  const status = getTttGameStatus(snapshot);
  if (status.status !== "playing") return null;

  const legalMoves = getTttAvailableMoves(snapshot);
  if (!legalMoves.length) return null;

  let mmResult;
  let abResult;
  let mmTime = 0;
  let abTime = 0;

  // Delegate through MasterAgent registered concrete agents when available
  const mmAgent = masterAgent?.getAgent?.("minimax");
  const abAgent = masterAgent?.getAgent?.("alpha-beta");

  if (mmAgent && typeof mmAgent.chooseMove === "function") {
    const t0 = performance.now();
    const d = mmAgent.chooseMove(cloneTttBoard(snapshot), {
      game: "tic-tac-toe",
      player,
      withPV: true
    });
    mmTime = performance.now() - t0;
    mmResult = {
      move: d.move,
      score: d.score,
      nodesSearched: d.nodesSearched,
      pv: d.pv ?? (d.move !== null ? [d.move] : [])
    };
  } else {
    const t0 = performance.now();
    mmResult = findBestMoveWithPV(cloneTttBoard(snapshot), player);
    mmTime = performance.now() - t0;
  }

  if (abAgent && typeof abAgent.chooseMove === "function") {
    const t0 = performance.now();
    const d = abAgent.chooseMove(cloneTttBoard(snapshot), {
      game: "tic-tac-toe",
      player,
      withPV: true
    });
    abTime = performance.now() - t0;
    abResult = {
      move: d.move,
      score: d.score,
      nodesSearched: d.nodesSearched,
      nodesPruned: d.nodesPruned,
      pv: d.pv ?? (d.move !== null ? [d.move] : [])
    };
  } else {
    const t0 = performance.now();
    abResult = findBestMoveAlphaBetaWithPV(cloneTttBoard(snapshot), player);
    abTime = performance.now() - t0;
  }

  // ── Construct Search Tree Candidate Branches ─────────────────────────────
  const opponent = player === "X" ? "O" : "X";
  const treeNodes = legalMoves.map((move) => {
    const nextBoard = cloneTttBoard(snapshot);
    nextBoard[move] = player;
    const branchStatus = getTttGameStatus(nextBoard);
    let branchScore;
    if (branchStatus.status === "won") {
      branchScore = 99; // immediate win
    } else if (branchStatus.status === "draw") {
      branchScore = 0;
    } else {
      // Evaluate outcome from opponent's turn, then invert score to player's perspective
      const oppEval = findBestMoveAlphaBeta(nextBoard, opponent);
      branchScore = -oppEval.score;
    }
    const isBest = move === abResult.move;
    const branchState = isBest ? "OPTIMAL (PV)" : "ALTERNATIVE";

    return {
      move,
      label: `Cell ${move + 1}`,
      player,
      score: branchScore,
      isBest,
      status: branchState
    };
  });

  // ── Comparison ───────────────────────────────────────────────────────────
  const sameMove = mmResult.move === abResult.move;
  const sameScore = mmResult.score === abResult.score;
  const nodeReduction =
    mmResult.nodesSearched > 0
      ? Number(
          (
            ((mmResult.nodesSearched - abResult.nodesSearched) /
              mmResult.nodesSearched) *
            100
          ).toFixed(2)
        )
      : 0;

  return {
    game: "tic-tac-toe",
    player,
    searchDepth: "exhaustive",
    boardSnapshot: cloneTttBoard(snapshot),
    treeNodes,
    minimax: {
      move: mmResult.move,
      opponentResponse: mmResult.pv && mmResult.pv.length >= 2 ? mmResult.pv[1] : null,
      pv: mmResult.pv ?? [],
      pvLabels: formatPV(mmResult.pv ?? [], player, player, "tic-tac-toe"),
      score: mmResult.score,
      nodesSearched: mmResult.nodesSearched,
      nodesPruned: 0,
      executionTimeMs: Number(mmTime.toFixed(3)),
    },
    alphaBeta: {
      move: abResult.move,
      opponentResponse: abResult.pv && abResult.pv.length >= 2 ? abResult.pv[1] : null,
      pv: abResult.pv ?? [],
      pvLabels: formatPV(abResult.pv ?? [], player, player, "tic-tac-toe"),
      score: abResult.score,
      nodesSearched: abResult.nodesSearched,
      nodesPruned: abResult.nodesPruned,
      executionTimeMs: Number(abTime.toFixed(3)),
    },
    comparison: {
      sameMove,
      sameScore,
      nodeReductionPercent: nodeReduction,
      minimaxFaster: mmTime < abTime,
    },
    disclaimer:
      "The principal variation (PV) is the predicted optimal sequence under the current search depth and evaluation rules. It is NOT a guarantee of what a human opponent will actually play.",
  };
}

/**
 * Analyzes the given board position for Connect Four using both Minimax and Alpha-Beta.
 * Returns a structured report without modifying the original board.
 *
 * @param {Array}  board        The current live C4 board (2-D 6×7 array).
 * @param {string} player       The player whose turn it is ('R' or 'Y').
 * @param {Object} options      { depth } — search depth (default 4).
 * @param {Object} masterAgent  Optional MasterAgent singleton for agent delegation.
 * @returns {Object|null}       Analysis report, or null if the game is already over.
 */
function analyzeConnectFour(board, player, options = {}, masterAgent = null) {
  const snapshot = cloneC4Board(board);

  const status = getC4GameStatus(snapshot);
  if (status.status !== "playing") return null;

  const legalMoves = getC4ValidMoves(snapshot);
  if (!legalMoves.length) return null;

  // Use depth 4 by default; Minimax capped at 4 for responsiveness
  const depth = options.depth ?? 4;

  let mmResult;
  let abResult;
  let mmTime = 0;
  let abTime = 0;

  const mmAgent = masterAgent?.getAgent?.("minimax");
  const abAgent = masterAgent?.getAgent?.("alpha-beta");

  if (mmAgent && typeof mmAgent.chooseMove === "function") {
    const t0 = performance.now();
    const d = mmAgent.chooseMove(cloneC4Board(snapshot), {
      game: "connect-four",
      player,
      depth,
      withPV: true
    });
    mmTime = performance.now() - t0;
    mmResult = {
      move: d.move,
      score: d.score,
      nodes: d.nodesSearched,
      pv: d.pv ?? (d.move !== null ? [d.move] : [])
    };
  } else {
    const t0 = performance.now();
    mmResult = connectFourMinimaxWithPV(cloneC4Board(snapshot), depth, player, player);
    mmTime = performance.now() - t0;
  }

  if (abAgent && typeof abAgent.chooseMove === "function") {
    const t0 = performance.now();
    const d = abAgent.chooseMove(cloneC4Board(snapshot), {
      game: "connect-four",
      player,
      depth,
      withPV: true
    });
    abTime = performance.now() - t0;
    abResult = {
      move: d.move,
      score: d.score,
      nodes: d.nodesSearched,
      pruned: d.nodesPruned,
      pv: d.pv ?? (d.move !== null ? [d.move] : [])
    };
  } else {
    const t0 = performance.now();
    abResult = connectFourAlphaBetaWithPV(cloneC4Board(snapshot), depth, player, player);
    abTime = performance.now() - t0;
  }

  // ── Construct Search Tree Candidate Branches ─────────────────────────────
  const opponent = player === "R" ? "Y" : "R";
  const treeNodes = legalMoves.map((col) => {
    const nextBoard = dropPiece(snapshot, col, player);
    if (!nextBoard) return null;
    const branchStatus = getC4GameStatus(nextBoard);
    let branchScore;
    if (branchStatus.status === "won") {
      branchScore = 100000;
    } else if (branchStatus.status === "draw") {
      branchScore = 0;
    } else {
      const branchEval = connectFourAlphaBeta(
        nextBoard,
        Math.max(1, depth - 1),
        -Infinity,
        Infinity,
        opponent,
        player
      );
      branchScore = branchEval.score;
    }

    const isBest = col === abResult.move;
    const branchState = isBest ? "OPTIMAL (PV)" : "ALTERNATIVE";

    return {
      move: col,
      label: `Col ${col + 1}`,
      player,
      score: branchScore,
      isBest,
      status: branchState
    };
  }).filter(Boolean);

  // ── Comparison ───────────────────────────────────────────────────────────
  const sameMove = mmResult.move === abResult.move;
  const sameScore = mmResult.score === abResult.score;
  const nodeReduction =
    mmResult.nodes > 0
      ? Number(
          (
            ((mmResult.nodes - abResult.nodes) / mmResult.nodes) *
            100
          ).toFixed(2)
        )
      : 0;

  return {
    game: "connect-four",
    player,
    searchDepth: depth,
    boardSnapshot: cloneC4Board(snapshot),
    treeNodes,
    minimax: {
      move: mmResult.move,
      opponentResponse: mmResult.pv && mmResult.pv.length >= 2 ? mmResult.pv[1] : null,
      pv: mmResult.pv ?? [],
      pvLabels: formatPV(mmResult.pv ?? [], player, player, "connect-four"),
      score: mmResult.score,
      nodesSearched: mmResult.nodes,
      nodesPruned: 0,
      executionTimeMs: Number(mmTime.toFixed(3)),
    },
    alphaBeta: {
      move: abResult.move,
      opponentResponse: abResult.pv && abResult.pv.length >= 2 ? abResult.pv[1] : null,
      pv: abResult.pv ?? [],
      pvLabels: formatPV(abResult.pv ?? [], player, player, "connect-four"),
      score: abResult.score,
      nodesSearched: abResult.nodes,
      nodesPruned: abResult.pruned,
      executionTimeMs: Number(abTime.toFixed(3)),
    },
    comparison: {
      sameMove,
      sameScore,
      nodeReductionPercent: nodeReduction,
      minimaxFaster: mmTime < abTime,
    },
    disclaimer:
      "The principal variation (PV) is the predicted optimal sequence under the current search depth and evaluation rules. It is NOT a guarantee of what a human opponent will actually play.",
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyzes the current board position for either Tic-Tac-Toe or Connect Four.
 *
 * This function is the single public entry point for the analysis service.
 * It clones the provided board before any computation and never mutates game state.
 *
 * @param {Array}  board        Current board (1-D for TTT, 2-D for C4).
 * @param {string} player       Player to move ('X'/'O' for TTT; 'R'/'Y' for C4).
 * @param {string} game         'tic-tac-toe' or 'connect-four'.
 * @param {Object} options      { depth } for C4 depth-limited search.
 * @param {Object} masterAgent  Optional MasterAgent instance for agent delegation.
 * @returns {Object|null}       Structured analysis report, or null if game is already over.
 */
export function analyzePosition(board, player, game, options = {}, masterAgent = null) {
  if (!board || !player || !game) return null;
  if (game === "connect-four") {
    return analyzeConnectFour(board, player, options, masterAgent);
  }
  return analyzeTicTacToe(board, player, masterAgent);
}
