/**
 * AlphaBetaAgent
 *
 * Concrete AI agent implementing Minimax with Alpha-Beta Pruning.
 * Eliminates branches that cannot influence the final decision by maintaining
 * [alpha, beta] cutoff bounds, returning the same optimal move in fewer node evaluations.
 */

import { BaseAgent } from "./BaseAgent.js";
import { findBestMoveAlphaBeta as findBestMoveAlphaBetaTtt, findBestMoveAlphaBetaWithPV } from "../engine/alphaBeta.js";
import { connectFourAlphaBeta, connectFourAlphaBetaWithPV } from "../engine/connectFourEngine.js";

export class AlphaBetaAgent extends BaseAgent {
  constructor() {
    super(
      "alpha-beta",
      "Alpha-Beta Agent",
      "Optimizes minimax search by pruning provably suboptimal branches where alpha >= beta, achieving the same optimal decision in significantly fewer nodes.",
      ["tic-tac-toe", "connect-four"]
    );
  }

  /**
   * Executes Alpha-Beta search on the game state and returns the optimal move with pruning statistics.
   *
   * @param {Array} gameState Current board state
   * @param {Object} context Search context { game, player, difficulty, depth, ... }
   * @returns {Object} Standardized decision object with move and search statistics
   */
  chooseMove(gameState, context = {}) {
    const startTime = performance.now();
    const safeBoard = this.cloneBoard(gameState);
    const game = this.detectGame(safeBoard, context);
    const player = context.player || (game === "connect-four" ? "Y" : "O");

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
      // Resolve search depth from context or difficulty setting
      if (context.depth != null) {
        searchDepth = context.depth;
      } else {
        const diff = (context.difficulty || "medium").toLowerCase();
        if (diff === "easy") searchDepth = 2;
        else if (diff === "hard") searchDepth = 5;
        else searchDepth = 4;
      }

      searchResult = context.withPV
        ? connectFourAlphaBetaWithPV(safeBoard, searchDepth, player, player)
        : connectFourAlphaBeta(
            safeBoard,
            searchDepth,
            -Infinity,
            Infinity,
            player,
            player
          );
    } else {
      // Tic-Tac-Toe full tree alpha-beta search
      searchResult = context.withPV
        ? findBestMoveAlphaBetaWithPV(safeBoard, player)
        : findBestMoveAlphaBetaTtt(safeBoard, player);
      searchDepth = 9;
    }

    const elapsed = performance.now() - startTime;

    return this.formatDecision(searchResult.move, {
      executionTimeMs: elapsed,
      nodesSearched: searchResult.nodesSearched ?? searchResult.nodes ?? 1,
      nodesPruned: searchResult.nodesPruned ?? searchResult.pruned ?? 0,
      score: searchResult.score ?? 0,
      depth: searchDepth,
      strategy: "alpha-beta",
      pv: searchResult.pv ?? (searchResult.move !== null && searchResult.move !== undefined ? [searchResult.move] : []),
      metadata: {
        game,
        player,
        algorithm: "Alpha-Beta Pruning"
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
export const alphaBetaAgentInstance = new AlphaBetaAgent();

/**
 * Legacy wrapper function for backward compatibility.
 */
export function alphaBetaAgent(board, aiPlayer = "O") {
  const result = alphaBetaAgentInstance.chooseMove(board, {
    game: "tic-tac-toe",
    player: aiPlayer
  });
  return result ? result.move : null;
}
