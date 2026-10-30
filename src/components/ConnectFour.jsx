// SECTION 1: IMPORTS — React hooks, styles, Master Agent, Agent Monitoring Panel, and Connect Four engine.
import { useEffect, useState } from "react";
import "./ConnectFour.css";
import { masterAgent } from "../agents/MasterAgent.js";
import AgentMonitoringPanel from "./AgentMonitoringPanel.jsx";
import AnalysisPanel from "./AnalysisPanel.jsx";
import {
  COLS,
  RED,
  YELLOW,
  EMPTY,
  createBoard,
  getValidMoves,
  dropPiece,
  getGameStatus
} from "../engine/connectFourEngine.js";

// SECTION 2: MAIN CONNECT FOUR COMPONENT — Manages game state, coordinates with Master Agent, and renders UI.
export default function ConnectFour({ onBack }) {
  // SECTION 2A: REACT STATE — Tracks the board, match mode, turn, difficulty, strategy, telemetry, result, and pause state.
  const [board, setBoard] = useState(createBoard);
  const [mode, setMode] = useState("human");
  const [turn, setTurn] = useState(RED);
  const [difficulty, setDifficulty] = useState("Medium");
  const [strategy, setStrategy] = useState("auto");
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState(null);
  const [lastAgentDecision, setLastAgentDecision] = useState(null);
  const [thinking, setThinking] = useState(false);
  // SECTION 2A-ANALYSIS: Adversarial reasoning analysis state
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Map the selected difficulty to the search depth ply
  const depth = { Easy: 2, Medium: 4, Hard: 5 }[difficulty];

  // SECTION 2B: RESET GAME — Starts a fresh match and resets state and search telemetry.
  function resetGame(nextMode = mode) {
    setBoard(createBoard());
    setMode(nextMode);
    setTurn(RED);
    setResult(null);
    setPaused(false);
    setStats(null);
    setLastAgentDecision(null);
    setThinking(false);
    setAnalysis(null);
    setShowAnalysis(false);
    setIsAnalyzing(false);
  }

  // SECTION 2C: FINISH TURN — Checks for win or draw, otherwise passes turn.
  function finishTurn(nextBoard, nextPlayer) {
    const status = getGameStatus(nextBoard);
    if (status.status === "won") {
      setResult(status.winner);
      setThinking(false);
      return;
    }
    if (status.status === "draw") {
      setResult("DRAW");
      setThinking(false);
      return;
    }
    setTurn(nextPlayer);
    setThinking(false);
  }

  // SECTION 2D: HUMAN MOVE — Validates selected column, places Red piece, and triggers AI turn.
  function playHuman(col) {
    if (
      mode !== "human" || turn !== RED || result || thinking ||
      board[0][col] !== EMPTY
    ) return;

    const nextBoard = dropPiece(board, col, RED);
    if (!nextBoard) return;
    setBoard(nextBoard);
    setStats(null);
    setLastAgentDecision(null);
    setAnalysis(null);
    setShowAnalysis(false);
    setThinking(true);
    finishTurn(nextBoard, YELLOW);
  }

  // SECTION 2D-ANALYSIS: RUN ANALYSIS — Master Agent coordinates depth-limited analysis without mutating game.
  function runAnalysis() {
    if (result || thinking) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const report = masterAgent.analyzePosition(board, turn, "connect-four", {
          depth: Math.min(depth, 4),
        });
        setAnalysis(report);
      } catch (err) {
        console.error("C4 Analysis failed:", err);
        setAnalysis(null);
      } finally {
        setIsAnalyzing(false);
        setShowAnalysis(true);
      }
    }, 10);
  }

  // SECTION 2E: AI TURN EFFECT — Requests move from Master Agent when AI's turn arrives.
  useEffect(() => {
    if (result || paused) return;
    const aiTurn = mode === "ai" || turn === YELLOW;
    if (!aiTurn) return;

    let cancelled = false;

    // Small delay so thinking status is visible to user
    const timer = setTimeout(() => {
      if (cancelled) return;
      const player = turn;

      // Master Agent coordinates move selection across registered agents
      const decision = masterAgent.chooseMove(board, {
        game: "connect-four",
        player,
        difficulty,
        depth,
        strategy: strategy !== "auto" ? strategy : null
      });

      if (cancelled) return;

      setLastAgentDecision(decision);
      setStats({
        player,
        nodes: decision.nodesSearched,
        pruned: decision.nodesPruned,
        score: decision.score,
        depth: decision.depth || depth,
        agentName: decision.agentName
      });

      if (decision.move === null) {
        setThinking(false);
        if (getValidMoves(board).length === 0) setResult("DRAW");
        return;
      }

      const nextBoard = dropPiece(board, decision.move, player);
      if (!nextBoard) {
        setThinking(false);
        return;
      }

      setBoard(nextBoard);
      setThinking(false);
      finishTurn(nextBoard, player === RED ? YELLOW : RED);
    }, mode === "ai" ? 500 : 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [board, turn, mode, depth, difficulty, strategy, result, paused]);

  // SECTION 2F: STATUS MESSAGE — Status string for turn banner.
  const status = result
    ? result === "DRAW"
      ? "Game ended in a draw"
      : `${result === RED ? "Red" : "Yellow"} wins!`
    : paused
      ? "AI vs AI paused"
      : thinking
        ? `${turn === RED ? "Red" : "Yellow"} AI is thinking…`
        : mode === "ai"
          ? `${turn === RED ? "Red" : "Yellow"} AI to move`
          : turn === RED
            ? "Your turn — Red"
            : "Yellow AI to move";

  // SECTION 2G: RENDER COMPONENT
  return (
    <main className="app-shell connect-four-shell">
      {/* TOP NAVIGATION BAR */}
      <header className="topbar">
        <a className="brand" href="#home" onClick={(e) => e.preventDefault()}>
          <span className="brand-icon">✳</span>
          <span>NEURAL<span className="brand-light">TAC</span></span>
        </a>
        <div className="connect-four-top-actions">
          <span className="topbar-tag"><span className="live-dot">●</span> AI LAB / GAME EXTENSION</span>
          {onBack && (
            <button className="button-secondary" onClick={onBack}>← Back to NEURALTAC</button>
          )}
        </div>
      </header>

      {/* HERO INTRODUCTION */}
      <section className="hero connect-four-hero" id="connect-four">
        <div className="eyebrow">MULTI-AGENT COORDINATION · CONNECT FOUR</div>
        <h1>Think four steps <span>ahead.</span></h1>
        <p>Explore strategic decisions coordinated by the Master Agent across depth-limited search and Alpha-Beta Pruning.</p>
      </section>

      {/* WORKSPACE ARENA & SIDE PANELS */}
      <section className="workspace connect-four-workspace">
        <div className="panel game-panel connect-four-game-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">01 / PLAYGROUND</div>
              <h2>Connect Four arena</h2>
            </div>
            <span className={`status-pill ${result ? "finished" : ""}`}>
              {result ? "● FINISHED" : "● LIVE"}
            </span>
          </div>

          {/* GAME SETTINGS */}
          <div className="control-row connect-four-controls">
            <label>
              GAME MODE
              <select value={mode} onChange={(e) => resetGame(e.target.value)}>
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
                <option value="Easy">Easy · Depth 2</option>
                <option value="Medium">Medium · Depth 4</option>
                <option value="Hard">Hard · Depth 5</option>
              </select>
            </label>
          </div>

          {/* TURN BANNER */}
          <div className="turn-banner">
            <span className={`turn-symbol ${turn === RED ? "connect-symbol-red" : "connect-symbol-yellow"}`}>
              {result === "DRAW" ? "=" : result || turn}
            </span>
            <div>
              <strong>{status}</strong>
              <small>{result ? "Start a new round to play again." : mode === "human" ? "Choose a column to drop your red piece." : "Watch both AI players evaluate the board."}</small>
            </div>
          </div>

          {/* CONNECT FOUR BOARD */}
          <div className="connect-four-board-wrap">
            <div className="connect-four-column-labels" aria-hidden="true">
              {Array.from({ length: COLS }, (_, col) => <span key={col}>{col + 1}</span>)}
            </div>
            {(() => {
              const aiPredictedCol = analysis?.alphaBeta?.move ?? null;
              const oppPredictedCol = analysis?.alphaBeta?.opponentResponse ?? null;

              let aiPredictedRow = -1;
              if (aiPredictedCol !== null) {
                for (let r = 5; r >= 0; r--) {
                  if (board[r] && board[r][aiPredictedCol] === EMPTY) {
                    aiPredictedRow = r;
                    break;
                  }
                }
              }

              let oppPredictedRow = -1;
              if (oppPredictedCol !== null) {
                for (let r = 5; r >= 0; r--) {
                  if (oppPredictedCol === aiPredictedCol && r === aiPredictedRow) {
                    continue;
                  }
                  if (board[r] && board[r][oppPredictedCol] === EMPTY) {
                    oppPredictedRow = r;
                    break;
                  }
                }
              }

              return (
                <div className="connect-four-board" role="grid" aria-label="Connect Four board">
                  {board.map((row, rowIndex) => row.map((cell, colIndex) => {
                    const isAiPred = rowIndex === aiPredictedRow && colIndex === aiPredictedCol && !cell;
                    const isOppPred = rowIndex === oppPredictedRow && colIndex === oppPredictedCol && !cell;
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        className={[
                          "connect-four-cell",
                          cell ? `piece-${cell}` : "",
                          isAiPred ? "c4-cell-ai-predicted" : "",
                          isOppPred ? "c4-cell-opp-predicted" : "",
                        ].filter(Boolean).join(" ")}
                        onClick={() => playHuman(colIndex)}
                        disabled={
                          mode !== "human" || turn !== RED || Boolean(result) ||
                          thinking || cell !== EMPTY || board[0][colIndex] !== EMPTY
                        }
                        aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}${cell ? `, ${cell === RED ? "red" : "yellow"} piece` : ", empty"}`}
                        role="gridcell"
                      />
                    );
                  }))}
                </div>
              );
            })()}
          </div>

          {/* BOARD LEGEND */}
          <div className="connect-four-legend">
            <span><i className="connect-four-piece piece-R" /> Red <small>{mode === "human" ? "You" : "AI 1"}</small></span>
            <span><i className="connect-four-piece piece-Y" /> Yellow <small>AI 2</small></span>
            <span className="connect-four-board-note">7 columns × 6 rows · Connect 4 to win</span>
          </div>

          {/* GAME ACTIONS */}
          <div className="game-actions">
            <button className="button-primary" onClick={() => resetGame()}>↻ New round</button>
            {mode === "ai" && !result && (
              <button className="button-secondary" onClick={() => setPaused((v) => !v)}>
                {paused ? "▶ Resume match" : "Ⅱ Pause match"}
              </button>
            )}
            <button className="button-secondary" onClick={() => resetGame(mode)}>Reset board</button>
            <button
              className="button-secondary"
              onClick={() => {
                if (!showAnalysis) runAnalysis();
                else setShowAnalysis(false);
              }}
              disabled={Boolean(result) || thinking}
            >
              {showAnalysis ? "Hide analysis" : "⚡ Analyze position"}
            </button>
          </div>
        </div>

        {/* SIDE PANELS */}
        <aside className="side-column">
          {/* MULTI-AGENT CONTROL & MONITORING PANEL */}
          <AgentMonitoringPanel
            game="connect-four"
            masterAgent={masterAgent}
            lastDecision={lastAgentDecision}
            selectedStrategy={strategy}
            onStrategyChange={setStrategy}
            difficulty={difficulty}
            depth={depth}
            currentBoard={board}
            turn={turn}
          />

          {/* SECTION 3-ANALYSIS: ADVERSARIAL REASONING PANEL */}
          {showAnalysis && (
            <AnalysisPanel
              analysis={analysis}
              game="connect-four"
              onClose={() => setShowAnalysis(false)}
              onRunAnalysis={runAnalysis}
              isAnalyzing={isAnalyzing}
            />
          )}

          {/* DECISION ENGINE CONFIGURATION */}
          <section className="panel side-panel">
            <div className="section-kicker">03 / AI CONFIGURATION</div>
            <h2>Decision engine</h2>
            <p className="muted">The active agent evaluates threats and scores candidate moves within the selected search depth.</p>
            <div className="algorithm-card">
              <span className="algorithm-icon">αβ</span>
              <div><strong>Alpha-Beta Pruning</strong><small>Prunes non-optimal search subtrees</small></div>
              <span className="algorithm-tag accent-text">ACTIVE</span>
            </div>
            <div className="algorithm-card">
              <span className="algorithm-icon accent">4×</span>
              <div><strong>Heuristic evaluation</strong><small>Scores center control and 4-cell patterns</small></div>
              <span className="algorithm-tag">SEARCH</span>
            </div>
            <div className="connect-four-depth">
              <span>Current search depth</span>
              <strong>{depth} ply</strong>
            </div>
          </section>

          {/* LIVE SEARCH STATISTICS */}
          <section className="panel side-panel">
            <div className="section-kicker">04 / LIVE ANALYSIS</div>
            <h2>AI search statistics</h2>
            {stats ? (
              <>
                <p className="connect-four-stat-intro">
                  Last move evaluated by <strong className={stats.player === RED ? "connect-symbol-red" : "connect-symbol-yellow"}>{stats.player === RED ? "Red AI" : "Yellow AI"}</strong>
                  {stats.agentName ? ` (${stats.agentName})` : ""}
                </p>
                <div className="connect-four-stat-grid">
                  <div className="research-metric"><span>Search depth</span><strong>{stats.depth}</strong></div>
                  <div className="research-metric"><span>Nodes searched</span><strong>{(stats.nodes ?? 0).toLocaleString()}</strong></div>
                  <div className="research-metric"><span>Pruned siblings</span><strong>{(stats.pruned ?? 0).toLocaleString()}</strong></div>
                  <div className="research-metric"><span>Evaluation score</span><strong>{(stats.score ?? 0).toLocaleString()}</strong></div>
                </div>
                <p className="connect-four-footnote">Scores are from moving player perspective. Pruned siblings reflect branches cut where alpha &gt;= beta.</p>
              </>
            ) : (
              <div className="connect-four-empty-state">
                <span className="connect-four-empty-icon">⌁</span>
                <strong>Waiting for first AI move</strong>
                <p>Search depth, explored nodes, pruning and evaluation score will appear here after the AI acts.</p>
              </div>
            )}
          </section>

          {/* STRATEGY OVERVIEW */}
          <section className="panel side-panel">
            <div className="section-kicker">05 / HOW IT WORKS</div>
            <h2>Strategy overview</h2>
            <ul className="connect-four-how-list">
              <li>Master Agent dynamically coordinates agent selection based on policy.</li>
              <li>Searches future candidate moves with depth-limited adversarial search.</li>
              <li>Uses Alpha-Beta Pruning to eliminate branches that cannot affect the decision.</li>
              <li>Heuristically evaluates center-column control and prospective 4-cell windows.</li>
            </ul>
          </section>
        </aside>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span>NEURALTAC © 2026</span>
        <span>MULTI-AGENT ARCHITECTURE · MASTER AGENT · CONNECT FOUR</span>
      </footer>
    </main>
  );
}
