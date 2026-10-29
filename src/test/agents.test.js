import { describe, it, expect, beforeEach } from "vitest";
import { BaseAgent } from "../agents/BaseAgent.js";
import { RandomAgent } from "../agents/RandomAgent.js";
import { MinimaxAgent } from "../agents/MinimaxAgent.js";
import { AlphaBetaAgent } from "../agents/AlphaBetaAgent.js";
import { MasterAgent } from "../agents/MasterAgent.js";

import {
  createBoard as createTttBoard,
  getAvailableMoves as getTttMoves
} from "../engine/gameEngine.js";

import {
  createBoard as createC4Board,
  getValidMoves as getC4Moves
} from "../engine/connectFourEngine.js";

describe("Multi-Agent Architecture & Master Agent", () => {
  let master;
  let randomAgent;
  let minimaxAgent;
  let alphaBetaAgent;

  beforeEach(() => {
    master = new MasterAgent();
    randomAgent = new RandomAgent();
    minimaxAgent = new MinimaxAgent();
    alphaBetaAgent = new AlphaBetaAgent();
  });

  describe("BaseAgent contract", () => {
    it("throws when instantiated directly", () => {
      expect(() => new BaseAgent("test", "Test", "Desc")).toThrow(TypeError);
    });

    it("requires chooseMove implementation in subclasses", () => {
      class IncompleteAgent extends BaseAgent {
        constructor() {
          super("incomplete", "Incomplete", "Test agent");
        }
      }
      const agent = new IncompleteAgent();
      expect(() => agent.chooseMove([])).toThrow(/must implement chooseMove/);
    });
  });

  describe("RandomAgent", () => {
    it("returns only legal moves on Tic-Tac-Toe", () => {
      const board = [
        "X", "O", "X",
        null, "O", null,
        null, null, "X"
      ];
      const legal = getTttMoves(board);

      for (let i = 0; i < 20; i++) {
        const decision = randomAgent.chooseMove(board, { game: "tic-tac-toe" });
        expect(legal).toContain(decision.move);
        expect(board[decision.move]).toBeNull();
      }
    });

    it("returns only legal column moves on Connect Four", () => {
      const board = createC4Board();
      // Fill column 0 completely without 4 in a row (alternate R and Y)
      const pattern = ["R", "Y", "R", "Y", "R", "Y"];
      for (let r = 0; r < 6; r++) {
        board[r][0] = pattern[r];
      }
      const legal = getC4Moves(board);
      expect(legal).not.toContain(0);

      for (let i = 0; i < 20; i++) {
        const decision = randomAgent.chooseMove(board, { game: "connect-four" });
        expect(legal).toContain(decision.move);
        expect(decision.move).not.toBe(0);
      }
    });

    it("does not select moves when the game has ended", () => {
      const wonBoard = [
        "X", "X", "X",
        "O", "O", null,
        null, null, null
      ];
      const decision = randomAgent.chooseMove(wonBoard, { game: "tic-tac-toe" });
      expect(decision.move).toBeNull();
    });

    it("does not mutate the original board", () => {
      const board = createTttBoard();
      const originalCopy = [...board];
      randomAgent.chooseMove(board, { game: "tic-tac-toe" });
      expect(board).toEqual(originalCopy);
    });
  });

  describe("MinimaxAgent", () => {
    it("finds immediate winning move in Tic-Tac-Toe", () => {
      const board = [
        "O", "O", null,
        "X", "X", null,
        null, null, null
      ];
      const decision = minimaxAgent.chooseMove(board, {
        game: "tic-tac-toe",
        player: "O"
      });
      expect(decision.move).toBe(2);
      expect(decision.agentId).toBe("minimax");
      expect(decision.nodesSearched).toBeGreaterThan(0);
      expect(decision.nodesPruned).toBe(0);
    });

    it("blocks immediate opponent win in Tic-Tac-Toe", () => {
      const board = [
        "X", "X", null,
        "O", null, null,
        null, null, null
      ];
      const decision = minimaxAgent.chooseMove(board, {
        game: "tic-tac-toe",
        player: "O"
      });
      expect(decision.move).toBe(2);
    });

    it("works on Connect Four with depth-limited minimax", () => {
      const board = createC4Board();
      const decision = minimaxAgent.chooseMove(board, {
        game: "connect-four",
        player: "Y",
        depth: 2
      });
      expect(getC4Moves(board)).toContain(decision.move);
      expect(decision.nodesSearched).toBeGreaterThan(1);
      expect(decision.nodesPruned).toBe(0);
    });

    it("returns null move on terminal game states", () => {
      const wonBoard = [
        "X", "X", "X",
        "O", "O", null,
        null, null, null
      ];
      const decision = minimaxAgent.chooseMove(wonBoard, {
        game: "tic-tac-toe",
        player: "O"
      });
      expect(decision.move).toBeNull();
    });
  });

  describe("AlphaBetaAgent", () => {
    it("finds immediate winning move with pruning in Tic-Tac-Toe", () => {
      const board = [
        "O", "O", null,
        "X", "X", null,
        null, null, null
      ];
      const decision = alphaBetaAgent.chooseMove(board, {
        game: "tic-tac-toe",
        player: "O"
      });
      expect(decision.move).toBe(2);
      expect(decision.agentId).toBe("alpha-beta");
      expect(decision.nodesSearched).toBeGreaterThan(0);
    });

    it("searches fewer nodes than MinimaxAgent while selecting equivalent optimal score", () => {
      const board = [
        "X", null, null,
        null, "O", null,
        null, null, null
      ];
      const minimaxDecision = minimaxAgent.chooseMove(board, {
        game: "tic-tac-toe",
        player: "O"
      });
      const alphaBetaDecision = alphaBetaAgent.chooseMove(board, {
        game: "tic-tac-toe",
        player: "O"
      });

      expect(alphaBetaDecision.score).toBe(minimaxDecision.score);
      expect(alphaBetaDecision.nodesSearched).toBeLessThan(minimaxDecision.nodesSearched);
      expect(alphaBetaDecision.nodesPruned).toBeGreaterThan(0);
    });

    it("respects search depth in Connect Four", () => {
      const board = createC4Board();
      const shallow = alphaBetaAgent.chooseMove(board, {
        game: "connect-four",
        player: "Y",
        depth: 2
      });
      const deep = alphaBetaAgent.chooseMove(board, {
        game: "connect-four",
        player: "Y",
        depth: 4
      });

      expect(deep.nodesSearched).toBeGreaterThan(shallow.nodesSearched);
      expect(getC4Moves(board)).toContain(shallow.move);
      expect(getC4Moves(board)).toContain(deep.move);
    });
  });

  describe("MasterAgent coordination & responsibilities", () => {
    it("registers and manages available agents via dependency injection", () => {
      expect(master.getAgent("random")).toBeInstanceOf(RandomAgent);
      expect(master.getAgent("minimax")).toBeInstanceOf(MinimaxAgent);
      expect(master.getAgent("alpha-beta")).toBeInstanceOf(AlphaBetaAgent);

      const agentList = master.listAgents();
      expect(agentList.length).toBe(3);
      expect(agentList.map(a => a.id)).toContain("minimax");

      // Register a custom mock agent
      class CustomHeuristicAgent extends BaseAgent {
        constructor() {
          super("custom", "Custom Agent", "Custom agent test");
        }
        chooseMove(board) {
          const moves = this.getLegalMoves(board, "tic-tac-toe");
          return this.formatDecision(moves[moves.length - 1]);
        }
      }

      master.registerAgent("custom", new CustomHeuristicAgent());
      expect(master.getAgent("custom")).toBeDefined();
      expect(master.listAgents().length).toBe(4);
    });

    it("rejects invalid agent registration", () => {
      expect(() => master.registerAgent("bad", {})).toThrow(/must implement chooseMove/);
      expect(() => master.registerAgent("", new RandomAgent())).toThrow(/non-empty string/);
    });

    it("selects agent based on difficulty and game policy", () => {
      const board = createTttBoard();

      // Easy -> Random
      const easyDecision = master.chooseMove(board, {
        game: "tic-tac-toe",
        difficulty: "easy"
      });
      expect(easyDecision.agentId).toBe("random");

      // Hard -> Alpha-Beta
      const hardDecision = master.chooseMove(board, {
        game: "tic-tac-toe",
        difficulty: "hard"
      });
      expect(hardDecision.agentId).toBe("alpha-beta");

      // Explicit strategy override
      const minimaxDecision = master.chooseMove(board, {
        game: "tic-tac-toe",
        strategy: "minimax"
      });
      expect(minimaxDecision.agentId).toBe("minimax");
    });

    it("delegates to the selected agent and validates legal moves", () => {
      const board = [
        "X", "O", "X",
        "X", "O", "O",
        null, "X", null
      ];
      const legalMoves = getTttMoves(board); // indices 6, 8

      const decision = master.chooseMove(board, {
        game: "tic-tac-toe",
        difficulty: "hard",
        player: "O"
      });

      expect(legalMoves).toContain(decision.move);
      expect(decision.fallbackApplied).toBe(false);
      expect(board[decision.move]).toBeNull();
    });

    it("safely handles missing agent registrations by falling back to default agent", () => {
      const board = createTttBoard();
      const decision = master.chooseMove(board, {
        game: "tic-tac-toe",
        strategy: "non-existent-agent-id"
      });

      expect(decision.fallbackApplied).toBe(true);
      expect(decision.move).not.toBeNull();
      expect(getTttMoves(board)).toContain(decision.move);
    });

    it("safely handles agent errors by falling back to a legal move", () => {
      class CrashingAgent extends BaseAgent {
        constructor() {
          super("crashing", "Crashing Agent", "Throws error intentionally");
        }
        chooseMove() {
          throw new Error("Search calculation failed unexpectedly!");
        }
      }

      master.registerAgent("crashing", new CrashingAgent());
      const board = createTttBoard();
      const decision = master.chooseMove(board, {
        game: "tic-tac-toe",
        strategy: "crashing"
      });

      expect(decision.fallbackApplied).toBe(true);
      expect(decision.fallbackReason).toContain("Search calculation failed");
      expect(getTttMoves(board)).toContain(decision.move);
    });

    it("safely rejects and corrects illegal moves returned by a rogue agent", () => {
      class IllegalMoveAgent extends BaseAgent {
        constructor() {
          super("illegal", "Illegal Agent", "Returns occupied cell");
        }
        chooseMove() {
          // Cell 0 is occupied by X below
          return this.formatDecision(0);
        }
      }

      master.registerAgent("illegal", new IllegalMoveAgent());
      const board = [
        "X", null, null,
        null, "O", null,
        null, null, null
      ];

      const decision = master.chooseMove(board, {
        game: "tic-tac-toe",
        strategy: "illegal"
      });

      expect(decision.fallbackApplied).toBe(true);
      expect(decision.move).not.toBe(0);
      expect(getTttMoves(board)).toContain(decision.move);
    });

    it("prevents moves after the game has ended (terminal states)", () => {
      const wonBoard = [
        "X", "X", "X",
        "O", "O", null,
        null, null, null
      ];

      const decision = master.chooseMove(wonBoard, {
        game: "tic-tac-toe",
        difficulty: "hard",
        player: "O"
      });

      expect(decision.move).toBeNull();
      expect(decision.status).toBe("finished");
    });

    it("coordinates Connect Four moves smoothly", () => {
      const board = createC4Board();
      const decision = master.chooseMove(board, {
        game: "connect-four",
        difficulty: "medium",
        player: "Y"
      });

      expect(decision.game).toBe("connect-four");
      expect(getC4Moves(board)).toContain(decision.move);
      expect(decision.nodesSearched).toBeGreaterThan(0);
    });

    it("tracks decision telemetry in history and lastDecision", () => {
      const board = createTttBoard();
      expect(master.lastDecision).toBeNull();
      expect(master.decisionHistory.length).toBe(0);

      const decision = master.chooseMove(board, {
        game: "tic-tac-toe",
        difficulty: "hard",
        player: "X"
      });

      expect(master.lastDecision).toEqual(decision);
      expect(master.decisionHistory.length).toBe(1);
      expect(master.decisionHistory[0].agentId).toBe("alpha-beta");
    });

    it("compares Minimax and Alpha-Beta agents on the exact same board without mutation", () => {
      const board = [
        "X", null, null,
        null, "O", null,
        null, null, null
      ];
      const boardCopy = [...board];

      const comparison = master.compareAgents(["minimax", "alpha-beta"], board, {
        game: "tic-tac-toe",
        player: "X"
      });

      expect(board).toEqual(boardCopy);
      expect(comparison.sameOptimalScore).toBe(true);
      expect(comparison.nodeReductionPercent).toBeGreaterThan(0);
      expect(comparison.results["minimax"].nodesSearched).toBeGreaterThan(
        comparison.results["alpha-beta"].nodesSearched
      );
    });
  });
});
