/**
 * BaseAgent
 *
 * Abstract base class that defines the contract for all AI agents in NEURALTAC.
 * Every concrete agent must implement `chooseMove(gameState, context)` without
 * mutating the incoming board state.
 */

import {
  getAvailableMoves as getTttMoves,
  getGameStatus as getTttStatus
} from "../engine/gameEngine.js";

import {
  getValidMoves as getC4Moves,
  getGameStatus as getC4Status
} from "../engine/connectFourEngine.js";

export class BaseAgent {
  /**
   * @param {string} id Unique identifier for the agent (e.g., 'random', 'minimax', 'alpha-beta')
   * @param {string} name Human-readable display name
   * @param {string} description Concise explanation of the agent's algorithmic strategy
   * @param {string[]} supportedGames Array of supported game identifiers
   */
  constructor(id, name, description, supportedGames = ["tic-tac-toe", "connect-four"]) {
    if (new.target === BaseAgent) {
      throw new TypeError("Cannot construct BaseAgent instances directly. Subclass must implement chooseMove.");
    }

    this.id = id;
    this.name = name;
    this.description = description;
    this.supportedGames = supportedGames;
    this.lastStats = null;
  }

  /**
   * Abstract method that must be implemented by concrete agents.
   *
   * @param {Array} _gameState The board representation (1D array for TTT, 2D array for Connect 4)
   * @param {Object} _context Metadata including { game, player, difficulty, depth, ... }
   * @returns {Object} Standardized decision object: { move, agentId, agentName, ... }
   */
  chooseMove(_gameState, _context = {}) {
    throw new Error(`Agent [${this.name}] must implement chooseMove(gameState, context)`);
  }

  /**
   * Deep-clones the board array so the search never mutates the original game state.
   */
  cloneBoard(board) {
    if (!board || !Array.isArray(board)) return board;
    if (Array.isArray(board[0])) {
      return board.map((row) => [...row]);
    }
    return [...board];
  }

  /**
   * Determines whether the current board is Tic-Tac-Toe or Connect Four.
   */
  detectGame(board, context = {}) {
    if (context && context.game) {
      return context.game.toLowerCase();
    }
    if (Array.isArray(board) && Array.isArray(board[0])) {
      return "connect-four";
    }
    return "tic-tac-toe";
  }

  /**
   * Retrieves legal moves for the detected or specified game.
   */
  getLegalMoves(board, game) {
    if (game === "connect-four") {
      return getC4Moves(board);
    }
    return getTttMoves(board);
  }

  /**
   * Checks whether the game has ended (win or draw).
   */
  isGameOver(board, game) {
    if (game === "connect-four") {
      const status = getC4Status(board);
      return status.status !== "playing";
    }
    const status = getTttStatus(board);
    return status.status !== "playing";
  }

  /**
   * Packages decision metrics into a standardized object.
   */
  formatDecision(move, stats = {}) {
    const decision = {
      move: move ?? null,
      agentId: this.id,
      agentName: this.name,
      roleExplanation: this.description,
      executionTimeMs: stats.executionTimeMs != null ? Number(stats.executionTimeMs.toFixed(3)) : 0,
      nodesSearched: stats.nodesSearched ?? null,
      nodesPruned: stats.nodesPruned ?? null,
      score: stats.score ?? null,
      depth: stats.depth ?? null,
      strategy: stats.strategy || this.id,
      pv: stats.pv ?? null,
      metadata: stats.metadata || {}
    };

    this.lastStats = decision;
    return decision;
  }
}
