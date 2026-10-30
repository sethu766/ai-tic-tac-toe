// SECTION 1: IMPORTS — Load the decision-tree component, React hooks, styles, game component, engine functions, algorithms, benchmark utility, and Multi-Agent Architecture.
import GameTree from "./components/GameTree.jsx";
import { useMemo, useState } from "react";
import "./App.css";
import ConnectFour from "./components/ConnectFour";
import { masterAgent } from "./agents/MasterAgent.js";
import AgentMonitoringPanel from "./components/AgentMonitoringPanel.jsx";
import AnalysisPanel from "./components/AnalysisPanel.jsx";

import {
  createBoard,
  getGameStatus,
} from "./engine/gameEngine";
import { findBestMove } from "./engine/minimax";
import { findBestMoveAlphaBeta } from "./engine/alphaBeta";
// SECTION 2: INITIAL SCOREBOARD — Start the win counts for X, O, and draws at zero.
const EMPTY_SCORES = { X: 0, O: 0, draws: 0 };
// SECTION 3: MAIN APP COMPONENT — Coordinates the Tic-Tac-Toe game, AI modes, analytics, history, and page interface.
export default function App() {
// SECTION 3A: APPLICATION STATE — Store the board, mode, difficulty, human symbol, turn, scores, history, and panel visibility.
  const [board, setBoard] = useState(createBoard);
  const [mode, setMode] = useState("human");
  const [difficulty, setDifficulty] = useState("hard");
  const [strategy, setStrategy] = useState("auto");
  const [lastAgentDecision, setLastAgentDecision] = useState(null);
  const [human, setHuman] = useState("X");
  const [turn, setTurn] = useState("X");
  const [scores, setScores] = useState(EMPTY_SCORES);
  const [history, setHistory] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [showConnectFour, setShowConnectFour] = useState(false);
  // SECTION 3A-ANALYSIS: State for adversarial reasoning analysis panel.
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
// SECTION 3B: DERIVED GAME INFORMATION — Calculate the current status and identify the AI symbol opposite the human.
  const status = getGameStatus(board);
  const ai = human === "X" ? "O" : "X";
// SECTION 4: ALGORITHM BENCHMARKING — When analytics are visible, run Minimax and Alpha-Beta on copies of the current board and compare results.
  const analytics = useMemo(() => {
    if (!showAnalytics) return null;
    const player = turn === "X" || turn === "O" ? turn : "O";
    try {
      const startMinimax = performance.now();
      const minimaxResult = findBestMove([...board], player);
      const minimaxTime = performance.now() - startMinimax;
      const startAlphaBeta = performance.now();
      const alphaBetaResult = findBestMoveAlphaBeta([...board], player);
      const alphaBetaTime = performance.now() - startAlphaBeta;
      const minimaxNodes = minimaxResult.nodesSearched;
      const alphaBetaNodes = alphaBetaResult.nodesSearched;
      return {
        minimax: {
          ...minimaxResult,
          medianTimeMs: minimaxTime,
        },
        alphaBeta: {
          ...alphaBetaResult,
          medianTimeMs: alphaBetaTime,
        },
        nodeReductionPercent:
          minimaxNodes > 0
            ? ((minimaxNodes - alphaBetaNodes) / minimaxNodes) * 100
            : 0,
        sameOptimalScore: minimaxResult.score === alphaBetaResult.score,
        sameOptimalMove: minimaxResult.move === alphaBetaResult.move,
      };
    } catch (error) {
      console.error("Analysis failed:", error);
      return null;
    }
  }, [board, turn, showAnalytics]);
// SECTION 5: RESET GAME — Create an empty board and reset the turn, move history, analytics visibility, and agent telemetry.
  function resetGame() {
    setBoard(createBoard());
    setTurn("X");
    setHistory([]);
    setShowAnalytics(false);
    setLastAgentDecision(null);
    setAnalysis(null);
    setShowAnalysis(false);
  }
// SECTION 6: UNDO MOVE — Remove the latest move, or both the AI move and preceding human move in Human vs AI mode.
function undoMove() {
  if (history.length === 0) return;
  // In Human vs AI, undo the AI's move and the preceding human move.
  const movesToUndo = mode === "human" ? 2 : 1;
  const remainingHistory = history.slice(
    0,
    Math.max(0, history.length - movesToUndo)
  );
  const previousBoard =
    remainingHistory.length > 0
      ? [...remainingHistory[remainingHistory.length - 1].board]
      : createBoard();
  setHistory(remainingHistory);
  setBoard(previousBoard);
  const xCount = previousBoard.filter((cell) => cell === "X").length;
  const oCount = previousBoard.filter((cell) => cell === "O").length;
  setTurn(xCount === oCount ? "X" : "O");
  setShowAnalytics(false);
  setShowTree(false);
  setLastAgentDecision(null);
  setAnalysis(null);
  setShowAnalysis(false);
}
// SECTION 7: FINISH A MOVE — Save the new board and move history, update scores when the game ends, or pass the turn.
  function finishMove(nextBoard, player, nextTurn) {
    const result = getGameStatus(nextBoard);
    setBoard(nextBoard);
    setHistory((previous) => [
      ...previous,
      { board: [...nextBoard], player, moveNumber: previous.length + 1 },
    ]);
    if (result.status !== "playing") {
      setScores((previous) => ({
        ...previous,
        ...(result.status === "draw"
          ? { draws: previous.draws + 1 }
          : { [result.winner]: previous[result.winner] + 1 }),
      }));
    } else {
      setTurn(nextTurn);
    }
    setShowAnalytics(false);
  }
// SECTION 8: HANDLE A BOARD CLICK — Validate human move, apply it, and request coordinated AI move from Master Agent.
  function playCell(index) {
    if (status.status !== "playing" || board[index] !== null) return;
    if (mode === "ai" || (mode === "human" && turn !== human)) return;
    const nextBoard = [...board];
    nextBoard[index] = turn;
    const nextTurn = turn === "X" ? "O" : "X";
    finishMove(nextBoard, turn, nextTurn);
    if (
      mode === "human" &&
      getGameStatus(nextBoard).status === "playing" &&
      nextTurn === ai
    ) {
      const aiMove = selectAIMove(nextBoard, ai, difficulty);
      if (aiMove !== null) {
        const aiBoard = [...nextBoard];
        aiBoard[aiMove] = ai;
        finishMove(aiBoard, ai, human);
      }
    }
  }
// SECTION 9: SELECT AN AI MOVE — Master Agent selects appropriate agent and returns verified legal move.
  function selectAIMove(position, player, level) {
    const decision = masterAgent.chooseMove(position, {
      game: "tic-tac-toe",
      player,
      difficulty: level,
      strategy: strategy !== "auto" ? strategy : null
    });
    setLastAgentDecision(decision);
    return decision ? decision.move : null;
  }
// SECTION 10: ADVANCE ONE AI MOVE — Coordinates an AI step via Master Agent and applies the move.
  function stepAI() {
    if (status.status !== "playing") return;
    const decision = masterAgent.chooseMove(board, {
      game: "tic-tac-toe",
      player: turn,
      difficulty,
      strategy: strategy !== "auto" ? strategy : null
    });
    setLastAgentDecision(decision);
    if (decision && decision.move !== null && decision.move !== undefined) {
      const nextBoard = [...board];
      nextBoard[decision.move] = turn;
      finishMove(nextBoard, turn, turn === "X" ? "O" : "X");
    }
  }
// SECTION 11: AUTO-PLAY — Delegates to Master Agent to evaluate and execute the next optimal move.
  function autoPlay() {
    if (status.status !== "playing") return;
    const decision = masterAgent.chooseMove(board, {
      game: "tic-tac-toe",
      player: turn,
      difficulty,
      strategy: strategy !== "auto" ? strategy : null
    });
    setLastAgentDecision(decision);
    if (decision && decision.move !== null) {
      const nextBoard = [...board];
      nextBoard[decision.move] = turn;
      finishMove(nextBoard, turn, turn === "X" ? "O" : "X");
    }
  }
// SECTION 12: WINNING-CELL HIGHLIGHTING — Keep the winning indexes available for the board's CSS classes.
  const winning = status.winningCombination || [];
// SECTION 12A: ANALYSIS HIGHLIGHTS — Derive predicted-move cell indices from the latest analysis result.
  // The AI move uses Alpha-Beta (primary algorithm). Null means no active analysis.
  const aiPredictedCell = analysis?.alphaBeta?.move ?? null;
  const oppPredictedCell = analysis?.alphaBeta?.opponentResponse ?? null;
// SECTION 12B: RUN ANALYSIS — Calls masterAgent.analyzePosition() read-only; never modifies game state.
  function runAnalysis() {
    if (status.status !== "playing") return;
    setIsAnalyzing(true);
    // Use a timeout tick so the "Analyzing…" state renders before the synchronous search blocks.
    setTimeout(() => {
      try {
        const result = masterAgent.analyzePosition([...board], turn, "tic-tac-toe");
        setAnalysis(result);
      } catch (err) {
        console.error("Analysis failed:", err);
        setAnalysis(null);
      } finally {
        setIsAnalyzing(false);
        setShowAnalysis(true);
      }
    }, 10);
  }
// SECTION 13: PAGE RENDERING — Show the Connect Four extension when selected; otherwise render the main NEURALTAC interface.
  return showConnectFour ? (
    <ConnectFour onBack={() => setShowConnectFour(false)} />
  ) : (
    <main className="app-shell">
{/* SECTION 13A: TOP NAVIGATION — Display the NEURALTAC brand and AI Lab version label. */}
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">✳</span>
          <span>NEURAL<span className="brand-light">TAC</span></span>
        </a>
        <span className="topbar-tag">
          <span className="live-dot" /> AI LAB / VERSION 1.0
        </span>
      </header>
{/* SECTION 13B: HERO INTRODUCTION — Introduce the project as an adversarial-search and game-theory playground. */}
      <section className="hero" id="home">
        <div className="eyebrow">ADVERSARIAL SEARCH · GAME THEORY</div>
        <h1>Intelligence in <span>every move.</span></h1>
        <p>
          Explore the strategy behind every decision.
          Challenge the AI or observe its algorithms in action.
        </p>
      </section>
{/* SECTION 13C: MAIN WORKSPACE — Arrange the game arena beside the AI configuration, analysis, and history panels. */}
      <section className="workspace">
{/* SECTION 13D: GAME ARENA — Contains mode and difficulty controls, turn status, the board, actions, and score totals. */}
        <div className="game-panel panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">01 / PLAYGROUND</div>
              <h2>Game arena</h2>
            </div>
            <span className="status-pill">
              {status.status === "playing" ? "● LIVE" : "● FINISHED"}
            </span>
          </div>
{/* SECTION 13E: GAME SETTINGS — Let the user select Human vs AI or AI vs AI, and choose the difficulty. */}
          <div className="control-row">
            <label>
              GAME MODE
              <select value={mode} onChange={(e) => {
                setMode(e.target.value);
                resetGame();
              }}>
                <option value="human">Human vs AI</option>
                <option value="ai">AI vs AI</option>
              </select>
            </label>
            <label>
              DIFFICULTY
              <select value={difficulty} onChange={(e) => {
                setDifficulty(e.target.value);
                resetGame();
              }}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard — Optimal</option>
              </select>
            </label>
          </div>
{/* SECTION 13F: TURN BANNER — Display the winning player, draw, current turn, or AI-thinking state. */}
          <div className="turn-banner">
            <span className={`turn-symbol ${turn === "X" ? "symbol-x" : "symbol-o"}`}>
              {status.status === "won" ? status.winner : status.status === "draw" ? "=" : turn}
            </span>
            <div>
              <strong>
                {status.status === "won"
                  ? `${status.winner} wins the game`
                  : status.status === "draw"
                    ? "A perfectly balanced draw"
                    : mode === "ai"
                      ? `${turn} is thinking`
                      : turn === human
                        ? "Your move"
                        : "AI is calculating"}
              </strong>
              <small>
                {status.status === "playing"
                  ? "Choose a cell to make your move"
                  : "Start a new round to play again"}
              </small>
            </div>
          </div>
{/* SECTION 13G: TIC-TAC-TOE BOARD — Render all nine cells and disable moves that are unavailable or not currently allowed. */}
          <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
            {board.map((cell, index) => (
              <button
                key={index}
                className={[
                  "cell",
                  cell === "X" ? "cell-x" : "",
                  cell === "O" ? "cell-o" : "",
                  winning.includes(index) ? "cell-winning" : "",
                  aiPredictedCell === index && !cell ? "cell-ai-predicted" : "",
                  oppPredictedCell === index && !cell ? "cell-opp-predicted" : "",
                ].join(" ")}
                onClick={() => playCell(index)}
                disabled={
                  cell !== null ||
                  status.status !== "playing" ||
                  mode === "ai" ||
                  (mode === "human" && turn !== human)
                }
                aria-label={`Cell ${index + 1}: ${cell || "empty"}`}
                role="gridcell"
              >
                {cell}
              </button>
            ))}
          </div>
{/* SECTION 13H: GAME ACTIONS — Provide new-round, AI-step, auto-play, reset, undo, and Connect Four controls. */}
          <div className="game-actions">
            <button className="button-primary" onClick={mode === "ai" ? stepAI : resetGame}>
              {mode === "ai" ? "Advance AI move →" : "↻ New round"}
            </button>
            {mode === "ai" && (
              <button className="button-secondary" onClick={autoPlay}>
                Auto next move
              </button>
            )}
            <button className="button-secondary" onClick={resetGame}>
              Reset board
            </button>
            <button
              className="button-secondary"
              onClick={undoMove}
              disabled={history.length === 0}
            >
              Undo
            </button>
            <button
              className="button-secondary"
              onClick={() => setShowConnectFour(v => !v)}
            >
              {showConnectFour ? "Back to NEURALTAC" : "Play Connect Four"}
            </button>
            <button
              className="button-secondary"
              onClick={() => {
                if (!showAnalysis) runAnalysis();
                else setShowAnalysis(false);
              }}
              disabled={status.status !== "playing"}
            >
              {showAnalysis ? "Hide analysis" : "⚡ Analyze position"}
            </button>
          </div>
{/* SECTION 13I: SCOREBOARD — Show accumulated wins for X and O and the number of draws. */}
          <div className="scoreboard">
            <div><span className="score-x">X</span><strong>{scores.X}</strong><small>WINS</small></div>
            <div><span className="score-o">O</span><strong>{scores.O}</strong><small>WINS</small></div>
            <div><span className="score-draw">=</span><strong>{scores.draws}</strong><small>DRAWS</small></div>
          </div>
        </div>
{/* SECTION 13J: SIDE PANELS — Present Agent Monitoring Panel, AI configuration, benchmark analytics, the decision tree, and move history. */}
        <aside className="side-column">
          {/* MULTI-AGENT CONTROL & MONITORING PANEL */}
          <AgentMonitoringPanel
            game="tic-tac-toe"
            masterAgent={masterAgent}
            lastDecision={lastAgentDecision}
            selectedStrategy={strategy}
            onStrategyChange={setStrategy}
            difficulty={difficulty}
            currentBoard={board}
            turn={turn}
          />

          {/* SECTION 13-ANALYSIS: ADVERSARIAL REASONING PANEL */}
          {showAnalysis && (
            <AnalysisPanel
              analysis={analysis}
              game="tic-tac-toe"
              onClose={() => setShowAnalysis(false)}
              onRunAnalysis={runAnalysis}
              isAnalyzing={isAnalyzing}
            />
          )}

{/* SECTION 13K: AI CONFIGURATION PANEL — Explain the Minimax baseline and Alpha-Beta optimization, then expose analysis tools. */}
          <section className="panel side-panel">
            <div className="section-kicker">03 / AI CONFIGURATION</div>
            <h2>Decision engine</h2>
            <p className="muted">
              The agent searches possible future states and evaluates
              outcomes to select an optimal move.
            </p>
            <div className="algorithm-card">
              <span className="algorithm-icon">M</span>
              <div><strong>Minimax</strong><small>Exhaustive adversarial search</small></div>
              <span className="algorithm-tag">BASELINE</span>
            </div>
            <div className="algorithm-card">
              <span className="algorithm-icon accent">αβ</span>
              <div><strong>Alpha-Beta</strong><small>Bound-based branch pruning</small></div>
              <span className="algorithm-tag accent-text">OPTIMIZED</span>
            </div>
            <button
              className="button-primary full-width"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? "Hide analysis" : "Analyze current position →"}
            </button>
{/* SECTION 13N: LIVE ANALYTICS DETAILS — Show search counts, timing measurements, pruning counts, node reduction, and score agreement when available. */}
            {analytics && (
              <div className="analytics-results">
                <h3>Benchmark results</h3>
{/* SECTION 13L: STATIC RESEARCH SUMMARY — Display the configured benchmark-summary text and comparison-graph images. */}
<div className="research-benchmark">
  <p className="research-intro">
    Experimental comparison of Minimax and Alpha-Beta Pruning
    across 10 selected board positions.
  </p>
  <div className="research-metrics">
    <div className="research-metric">
      <span>Positions tested</span>
      <strong>10 / 4,520</strong>
    </div>
    <div className="research-metric">
      <span>Score agreement</span>
      <strong>100%</strong>
    </div>
    <div className="research-metric">
      <span>Average node reduction</span>
      <strong>58.44%</strong>
    </div>
  </div>
  <div className="research-graph">
    <h4>Search Node Comparison</h4>
    <img
      src="/research-graphs/01-node-comparison.png"
      alt="Minimax and Alpha-Beta search node comparison"
    />
  </div>
  <div className="research-graph">
    <h4>Execution Time Comparison</h4>
    <img
      src="/research-graphs/02-time-comparison.png"
      alt="Execution time comparison between Minimax and Alpha-Beta"
    />
  </div>
  <div className="research-graph">
    <h4>Search Node Reduction</h4>
    <img
      src="/research-graphs/03-node-reduction.png"
      alt="Percentage reduction in nodes searched"
    />
  </div>
</div>
{/* SECTION 13M: LIVE NODE COMPARISON — Visualize the searched-node counts returned by the current algorithm comparison. */}
<div className="comparison-chart">
  <div className="chart-heading">
    <span>Search effort</span>
    <span>Nodes explored</span>
  </div>
  <div className="chart-row">
    <span className="chart-label">Minimax</span>
    <div className="chart-track">
      <div
        className="chart-bar minimax-bar"
        style={{
          width: `${
            analytics.minimax.nodesSearched > 0
              ? 100
              : 0
          }%`,
        }}
      />
    </div>
    <strong>{analytics.minimax.nodesSearched}</strong>
  </div>
  <div className="chart-row">
    <span className="chart-label">Alpha-Beta</span>
    <div className="chart-track">
      <div
        className="chart-bar alphabeta-bar"
        style={{
          width: `${
            analytics.minimax.nodesSearched > 0
              ? Math.min(
                  100,
                  (analytics.alphaBeta.nodesSearched /
                    analytics.minimax.nodesSearched) * 100
                )
              : 0
          }%`,
        }}
      />
    </div>
    <strong>{analytics.alphaBeta.nodesSearched}</strong>
  </div>
</div>
                <div className="metric-row">
                  <span>Minimax nodes</span>
                  <strong>{analytics.minimax.nodesSearched}</strong>
                </div>
                <div className="metric-row">
                  <span>Alpha-Beta nodes</span>
                  <strong>{analytics.alphaBeta.nodesSearched}</strong>
                </div>
                <div className="metric-row">
                  <span>Pruned siblings</span>
                  <strong>{analytics.alphaBeta.nodesPruned}</strong>
                </div>
                <div className="metric-row">
                  <span>Minimax median</span>
                  <strong>{analytics.minimax.medianTimeMs.toFixed(3)} ms</strong>
                </div>
                <div className="metric-row">
                  <span>Alpha-Beta median</span>
                  <strong>{analytics.alphaBeta.medianTimeMs.toFixed(3)} ms</strong>
                </div>
                <div className="metric-row">
                  <span>Node reduction</span>
                  <strong>{analytics.nodeReductionPercent.toFixed(1)}%</strong>
                </div>
                <div className="metric-row">
                  <span>Score agreement</span>
                  <strong>{analytics.sameOptimalScore ? "Verified" : "Mismatch"}</strong>
                </div>
              </div>
            )}
              <button
              className="button-secondary full-width"
              onClick={() => setShowTree((previous) => !previous)}
              >
              {showTree ? "Hide game tree" : "Explore game tree →"}
              </button>
{/* SECTION 13O: GAME TREE PANEL — Render the candidate-move visualization when the user opens it. */}
{showTree && (
  <GameTree board={board} player={turn} />
)}
          </section>
          <section className="panel side-panel">
            {/* SECTION 13P: MOVE HISTORY — List recorded moves in order, including the player and cell played. */}
<div className="section-kicker">04 / MOVE HISTORY</div>
            <h2>Game timeline</h2>
            {history.length === 0 ? (
              <p className="muted">Your moves will appear here as the game progresses.</p>
            ) : (
              <ol className="history-list">
                {history.map((item) => (
                  <li key={item.moveNumber}>
                    <span>{String(item.moveNumber).padStart(2, "0")}</span>
                    <strong className={item.player === "X" ? "score-x" : "score-o"}>
                      {item.player}
                    </strong>
                    <span>Cell {item.board.findIndex((v, i) =>
                      v === item.player &&
                      !history.slice(0, item.moveNumber - 1).some(
                        (h) => h.board[i] !== null
                      )
                    ) + 1 || "—"}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </section>
{/* SECTION 13Q: FOOTER — Display the project name and the key search algorithms used. */}
      <footer className="footer">
        <span>NEURALTAC © 2026</span>
        <span>MINIMAX · ALPHA-BETA PRUNING · ADVERSARIAL SEARCH</span>
      </footer>
    </main>
  );
}
