/**
 * RandomAgent
 *
 * Concrete AI agent that selects uniformly at random from available legal moves.
 * Never selects an occupied cell/column or attempts to move in a terminal state.
 */

import { BaseAgent } from "./BaseAgent.js";

export class RandomAgent extends BaseAgent {
  constructor() {
    super(
      "random",
      "Random Agent",
      "Selects uniformly at random among available legal moves without searching future game states.",
      ["tic-tac-toe", "connect-four"]
    );
  }

  /**
   * Chooses a random legal move for the given game state.
   *
   * @param {Array} gameState 1D board for Tic-Tac-Toe, 2D board for Connect Four
   * @param {Object} context Context object containing { game, player, ... }
   * @returns {Object} Standardized decision object with selected move
   */
  chooseMove(gameState, context = {}) {
    const startTime = performance.now();
    const safeBoard = this.cloneBoard(gameState);
    const game = this.detectGame(safeBoard, context);

    // Prevent moves after the game has already ended
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

    // Select randomly from legal moves
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    const selectedMove = legalMoves[randomIndex];
    const elapsed = performance.now() - startTime;

    return this.formatDecision(selectedMove, {
      executionTimeMs: elapsed,
      nodesSearched: 1, // Single sample evaluation
      nodesPruned: 0,
      score: null, // Random agent does not evaluate board states
      depth: 0,
      strategy: "random",
      metadata: { totalLegalMoves: legalMoves.length }
    });
  }
}

// Default singleton instance
export const randomAgentInstance = new RandomAgent();

/**
 * Legacy wrapper function for backward compatibility.
 * Accepts a board and returns the selected move index.
 */
export function randomAgent(board) {
  const result = randomAgentInstance.chooseMove(board, { game: "tic-tac-toe" });
  return result ? result.move : null;
}
