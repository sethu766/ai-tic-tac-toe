/**
 * MasterAgent
 *
 * Central coordinator for NEURALTAC's multi-agent architecture.
 * Implements agent registration, policy-based agent selection, delegation,
 * move validation, error recovery/fallback, decision telemetry, and agent comparison.
 */

import { RandomAgent } from "./RandomAgent.js";
import { MinimaxAgent } from "./MinimaxAgent.js";
import { AlphaBetaAgent } from "./AlphaBetaAgent.js";

import {
  getAvailableMoves as getTttMoves,
  getGameStatus as getTttStatus
} from "../engine/gameEngine.js";

import {
  getValidMoves as getC4Moves,
  getGameStatus as getC4Status
} from "../engine/connectFourEngine.js";

export class MasterAgent {
  /**
   * Initializes the Master Agent with registered agent modules and decision tracking.
   */
  constructor() {
    this.agents = new Map();
    this.decisionHistory = [];
    this.lastDecision = null;
    this.status = "ready";

    // Register standard concrete agents
    this.registerAgent("random", new RandomAgent());
    this.registerAgent("minimax", new MinimaxAgent());
    this.registerAgent("alpha-beta", new AlphaBetaAgent());
  }

  /**
   * Registers an agent instance under a unique identifier.
   * Enforces that the agent adheres to the BaseAgent interface (must provide chooseMove).
   *
   * @param {string} id Unique identifier (e.g. 'random', 'minimax', 'alpha-beta', 'custom')
   * @param {Object} agentInstance Concrete agent instance implementing chooseMove
   */
  registerAgent(id, agentInstance) {
    if (!id || typeof id !== "string") {
      throw new Error("Agent ID must be a non-empty string.");
    }
    if (!agentInstance || typeof agentInstance.chooseMove !== "function") {
      throw new Error(`Agent [${id}] must implement chooseMove(gameState, context).`);
    }
    this.agents.set(id.toLowerCase(), agentInstance);
  }

  /**
   * Unregisters an agent by identifier.
   */
  unregisterAgent(id) {
    return this.agents.delete(id.toLowerCase());
  }

  /**
   * Retrieves a registered agent by identifier.
   */
  getAgent(id) {
    if (!id) return null;
    return this.agents.get(id.toLowerCase()) || null;
  }

  /**
   * Returns a list of all currently registered agents and their metadata.
   */
  listAgents() {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({
      id,
      name: agent.name,
      description: agent.description,
      supportedGames: agent.supportedGames || ["tic-tac-toe", "connect-four"]
    }));
  }

  /**
   * Determines which game the board represents.
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
   * Returns legal moves for the current board and game.
   */
  getLegalMoves(board, game) {
    if (game === "connect-four") {
      return getC4Moves(board);
    }
    return getTttMoves(board);
  }

  /**
   * Checks whether the game has concluded.
   */
  isGameOver(board, game) {
    if (game === "connect-four") {
      const st = getC4Status(board);
      return st.status !== "playing";
    }
    const st = getTttStatus(board);
    return st.status !== "playing";
  }

  /**
   * Resolves the appropriate agent ID based on game, strategy, and difficulty policy.
   *
   * @param {string} game 'tic-tac-toe' or 'connect-four'
   * @param {string} difficulty 'easy', 'medium', 'hard'
   * @param {string} explicitStrategy Optional explicit agent override ('minimax', 'alpha-beta', 'random')
   * @returns {string} Selected agent identifier
   */
  resolveAgentId(game, difficulty = "hard", explicitStrategy = null) {
    if (explicitStrategy) {
      const normalized = explicitStrategy.toLowerCase();
      if (this.agents.has(normalized)) {
        return normalized;
      }
    }

    const diff = (difficulty || "hard").toLowerCase();

    if (game === "connect-four") {
      if (diff === "easy") {
        // Easy in Connect Four uses depth 2 AlphaBeta
        return "alpha-beta";
      }
      return "alpha-beta";
    }

    // Tic-Tac-Toe policy
    switch (diff) {
      case "easy":
        return "random";

      case "medium":
        // Preserves original demonstration policy: 50% random, 50% alpha-beta
        return Math.random() < 0.5 ? "random" : "alpha-beta";

      case "minimax":
        return "minimax";

      case "hard":
      default:
        return "alpha-beta";
    }
  }

  /**
   * Coordinates the move selection process:
   * 1. Validates board and terminal state.
   * 2. Resolves target agent according to strategy and game policy.
   * 3. Delegates computation to the agent.
   * 4. Validates returned move against legal moves.
   * 5. Handles missing agents or errors with safe fallback.
   * 6. Records decision telemetry and returns comprehensive metadata.
   *
   * @param {Array} gameState Board array (1D for TTT, 2D for C4)
   * @param {Object} context { game, player, difficulty, strategy, depth }
   * @returns {Object} Complete decision result with move and metrics
   */
  chooseMove(gameState, context = {}) {
    this.status = "coordinating";
    const startTime = performance.now();

    // 1. Safe copy of board
    if (!gameState || !Array.isArray(gameState)) {
      this.status = "error";
      throw new Error("Invalid gameState: Expected board array.");
    }

    const safeBoard = Array.isArray(gameState[0])
      ? gameState.map((row) => [...row])
      : [...gameState];

    const game = this.detectGame(safeBoard, context);
    const player = context.player || (game === "connect-four" ? "Y" : "O");
    const difficulty = (context.difficulty || "hard").toLowerCase();
    const explicitStrategy = context.strategy || null;

    // 2. Prevent moves in terminal state
    if (this.isGameOver(safeBoard, game)) {
      this.status = "idle";
      const result = {
        move: null,
        agentId: null,
        agentName: "Master Agent",
        strategy: "none",
        game,
        player,
        difficulty,
        depth: null,
        executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
        nodesSearched: 0,
        nodesPruned: 0,
        score: null,
        roleExplanation: "Master Agent rejected move request because the game has already concluded.",
        fallbackApplied: false,
        legalMoves: [],
        status: "finished",
        timestamp: Date.now()
      };
      this.lastDecision = result;
      return result;
    }

    const legalMoves = this.getLegalMoves(safeBoard, game);
    if (!legalMoves || legalMoves.length === 0) {
      this.status = "idle";
      const result = {
        move: null,
        agentId: null,
        agentName: "Master Agent",
        strategy: "none",
        game,
        player,
        difficulty,
        depth: null,
        executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
        nodesSearched: 0,
        nodesPruned: 0,
        score: null,
        roleExplanation: "Master Agent found no remaining legal moves on the board.",
        fallbackApplied: false,
        legalMoves: [],
        status: "draw",
        timestamp: Date.now()
      };
      this.lastDecision = result;
      return result;
    }

    // 3. Select agent
    let fallbackApplied = false;
    let fallbackReason = null;

    if (explicitStrategy && !this.agents.has(explicitStrategy.toLowerCase())) {
      fallbackApplied = true;
      fallbackReason = `Requested strategy/agent [${explicitStrategy}] not found in registry. Falling back to policy default.`;
    }

    let selectedAgentId = this.resolveAgentId(game, difficulty, explicitStrategy);
    let agent = this.getAgent(selectedAgentId);

    // Fallback if resolved agent is not registered
    if (!agent) {
      fallbackApplied = true;
      fallbackReason = fallbackReason || `Agent [${selectedAgentId}] not found in registry. Falling back to default agent.`;
      selectedAgentId = this.agents.has("alpha-beta") ? "alpha-beta" : this.agents.keys().next().value;
      agent = this.getAgent(selectedAgentId);
    }

    // 4. Delegate to agent
    let rawDecision = null;
    try {
      rawDecision = agent.chooseMove(safeBoard, {
        ...context,
        game,
        player,
        difficulty,
        legalMoves
      });
    } catch (agentError) {
      fallbackApplied = true;
      fallbackReason = `Agent [${selectedAgentId}] encountered error: ${agentError.message}. Fallback engaged.`;
      rawDecision = null;
    }

    // 5. Validate decision
    let chosenMove = rawDecision ? rawDecision.move : null;
    const isMoveLegal = chosenMove !== null && chosenMove !== undefined && legalMoves.includes(chosenMove);

    if (!isMoveLegal) {
      fallbackApplied = true;
      fallbackReason = fallbackReason || `Agent returned illegal move [${chosenMove}]. Fallback engaged.`;
      // Safe fallback to first legal move
      chosenMove = legalMoves[0];
    }

    const totalTime = performance.now() - startTime;
    this.status = "ready";

    const finalDecision = {
      move: chosenMove,
      agentId: agent ? agent.id : selectedAgentId,
      agentName: agent ? agent.name : "Fallback Agent",
      strategy: rawDecision?.strategy || difficulty,
      game,
      player,
      difficulty,
      depth: rawDecision?.depth ?? (game === "connect-four" ? context.depth || 4 : 9),
      executionTimeMs: Number(totalTime.toFixed(3)),
      nodesSearched: rawDecision?.nodesSearched ?? 1,
      nodesPruned: rawDecision?.nodesPruned ?? 0,
      score: rawDecision?.score ?? null,
      roleExplanation: agent ? agent.description : "Coordinated emergency fallback move.",
      fallbackApplied,
      fallbackReason,
      legalMoves,
      timestamp: Date.now()
    };

    this.lastDecision = finalDecision;
    this.decisionHistory.push(finalDecision);
    return finalDecision;
  }

  /**
   * Compares multiple agents on the exact same board state without mutating the board.
   * Useful for demonstrating Minimax vs Alpha-Beta equivalence and efficiency gains.
   *
   * @param {string[]} agentIds List of agent IDs to compare (e.g., ['minimax', 'alpha-beta'])
   * @param {Array} gameState Current board state
   * @param {Object} context Search context { game, player, depth, ... }
   * @returns {Object} Comparative metrics report
   */
  compareAgents(agentIds = ["minimax", "alpha-beta"], gameState, context = {}) {
    const safeBoard = Array.isArray(gameState[0])
      ? gameState.map((row) => [...row])
      : [...gameState];

    const game = this.detectGame(safeBoard, context);
    const player = context.player || (game === "connect-four" ? "Y" : "O");
    const results = {};

    for (const id of agentIds) {
      const agent = this.getAgent(id);
      if (!agent) {
        results[id] = { error: `Agent [${id}] is not registered.` };
        continue;
      }

      // Clone board for each agent to guarantee pure isolation
      const isolatedBoard = Array.isArray(safeBoard[0])
        ? safeBoard.map((row) => [...row])
        : [...safeBoard];

      const decision = agent.chooseMove(isolatedBoard, {
        ...context,
        game,
        player
      });

      results[id] = decision;
    }

    // Analyze agreement and efficiency
    const minimax = results["minimax"];
    const alphaBeta = results["alpha-beta"];

    let sameOptimalMove = false;
    let sameOptimalScore = false;
    let nodeReductionPercent = 0;

    if (minimax && alphaBeta && !minimax.error && !alphaBeta.error) {
      sameOptimalMove = minimax.move === alphaBeta.move;
      sameOptimalScore = minimax.score === alphaBeta.score;
      if (minimax.nodesSearched > 0) {
        nodeReductionPercent = Number(
          (((minimax.nodesSearched - alphaBeta.nodesSearched) / minimax.nodesSearched) * 100).toFixed(2)
        );
      }
    }

    return {
      game,
      player,
      results,
      sameOptimalMove,
      sameOptimalScore,
      nodeReductionPercent,
      summary: sameOptimalScore
        ? "Alpha-Beta Pruning explored fewer nodes while guaranteeing the exact same optimal evaluation."
        : "Evaluation metrics captured across agents."
    };
  }
}

// Default singleton instance
export const masterAgent = new MasterAgent();

/**
 * Backward-compatible function export.
 * Accepts (board, difficulty, aiPlayer) and returns the chosen move index.
 */
export function masterAgentFunction(board, difficulty = "hard", aiPlayer = "O") {
  const decision = masterAgent.chooseMove(board, {
    game: "tic-tac-toe",
    difficulty,
    player: aiPlayer
  });
  return decision ? decision.move : null;
}

// Attach MasterAgent methods directly to callable default export
export default masterAgent;
