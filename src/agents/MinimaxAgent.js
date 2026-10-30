/**
 * MinimaxAgent
 *
 * Concrete AI agent implementing classical exhaustive Minimax adversarial search.
 * Explores all reachable game tree states (or up to configured depth) to guarantee
 * game-theoretically optimal decision making.
 */

import { BaseAgent } from "./BaseAgent.js";
import { findBestMove as findBestMoveTtt, findBestMoveWithPV } from "../engine/minimax.js";
import { connectFourMinimax, connectFourMinimaxWithPV } from "../engine/connectFourEngine.js";

export class MinimaxAgent extends BaseAgent {
  constructor() {
    super(
      "minimax",
      "Minimax Agent",
      "Performs exhaustive adversarial minimax search exploring all candidate branches to identify game-theoretically optimal moves.",
      ["tic-tac-toe", "connect-four"]
    );
  }

  /**
   * Executes Minimax search on the game state and returns the optimal move.
   *
   * @param {Array} gameState Current board state
   * @param {Object} context Search context { game, player, depth, ... }
   * @returns {Object} Standardized decision object with move and search statistics
   */
  chooseMove(gameState, context = {}) {
    const startTime = performance.now();
    const safeBoard = this.cloneBoard(gameState);
    const game = this.detectGame(safeBoard, context);
    const player = context.player || (game === "connect-four" ? "R" : "O");

    // Prevent search if game is already terminal
    if (this.isGameOver(safeBoard, game)) {
      const elapsed = performance.now() - startTime;
      return this.formatDecision(null, {
        executionTimeMs: elapsed,
        nodesSearched: 0,
        nodesPruned: 0,
        score: null,
        metadata: { reason: "Game is already over" }
      });
    }

    const legalMoves = this.getLegalMoves(safeBoard, game);
    if (!legalMoves || legalMoves.length === 0) {
      const elapsed = performance.now() - startTime;
      return this.formatDecision(null, {
        executionTimeMs: elapsed,
        nodesSearched: 0,
        nodesPruned: 0,
        score: null,
        metadata: { reason: "No legal moves remaining" }
      });
    }

    let searchResult;
    let searchDepth = null;

    if (game === "connect-four") {
      // Connect Four uses depth-limited search
      searchDepth = context.depth != null ? context.depth : 4;
      searchResult = context.withPV
        ? connectFourMinimaxWithPV(safeBoard, searchDepth, player, player)
        : connectFourMinimax(safeBoard, searchDepth, player, player);
    } else {
      // Tic-Tac-Toe full tree minimax search
      searchResult = context.withPV
        ? findBestMoveWithPV(safeBoard, player)
        : findBestMoveTtt(safeBoard, player);
      searchDepth = 9; // Max depth of 3x3 game
    }

    const elapsed = performance.now() - startTime;

    return this.formatDecision(searchResult.move, {
      executionTimeMs: elapsed,
      nodesSearched: searchResult.nodesSearched ?? searchResult.nodes ?? 1,
      nodesPruned: 0, // Classical minimax does not perform branch pruning
      score: searchResult.score ?? 0,
      depth: searchDepth,
      strategy: "minimax",
      pv: searchResult.pv ?? (searchResult.move !== null && searchResult.move !== undefined ? [searchResult.move] : []),
      metadata: {
        game,
        player,
        algorithm: "Minimax Exhaustive Search"
      }
    });
  }

  /**
   * Performs read-only adversarial reasoning analysis on the provided board,
   * returning the decision along with the principal variation (PV).
   */
  analyze(gameState, context = {}) {
    return this.chooseMove(gameState, { ...context, withPV: true });
  }
}

// Default singleton instance
export const minimaxAgentInstance = new MinimaxAgent();

/**
 * Legacy wrapper function for backward compatibility.
 */
export function minimaxAgent(board, aiPlayer = "O") {
  const result = minimaxAgentInstance.chooseMove(board, {
    game: "tic-tac-toe",
    player: aiPlayer
  });
  return result ? result.move : null;
}
