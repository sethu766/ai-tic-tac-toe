import GameTree from "./components/GameTree.jsx";
import { useMemo, useState } from "react";
import "./App.css";

import {
  createBoard,
  getGameStatus,
  getAvailableMoves,
} from "./engine/gameEngine";

import { findBestMove } from "./engine/minimax";
import { findBestMoveAlphaBeta } from "./engine/alphaBeta";
import { compareAlgorithms } from "./utils/benchmark";

const EMPTY_SCORES = { X: 0, O: 0, draws: 0 };

export default function App() {
  const [board, setBoard] = useState(createBoard);
  const [mode, setMode] = useState("human");
  const [difficulty, setDifficulty] = useState("hard");
  const [human, setHuman] = useState("X");
  const [turn, setTurn] = useState("X");
  const [scores, setScores] = useState(EMPTY_SCORES);
  const [history, setHistory] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTree, setShowTree] = useState(false);

  const status = getGameStatus(board);
  const ai = human === "X" ? "O" : "X";

  
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


  function resetGame() {
    setBoard(createBoard());
    setTurn("X");
    setHistory([]);
    setShowAnalytics(false);
  }
  
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
}


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

  function selectAIMove(position, player, level) {
    const moves = getAvailableMoves(position);
    if (!moves.length) return null;

    if (level === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (level === "medium" && Math.random() < 0.5) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    return findBestMoveAlphaBeta(position, player).move;
  }

  function stepAI() {
    if (status.status !== "playing") return;

    const result =
      difficulty === "easy"
        ? { move: getAvailableMoves(board)[0] }
        : difficulty === "medium"
          ? findBestMove(board, turn)
          : findBestMoveAlphaBeta(board, turn);

    if (result.move === null || result.move === undefined) return;

    const nextBoard = [...board];
    nextBoard[result.move] = turn;
    finishMove(nextBoard, turn, turn === "X" ? "O" : "X");
  }

  function autoPlay() {
    if (status.status !== "playing") return;

    const result = findBestMoveAlphaBeta(board, turn);
    if (result.move === null) return;

    const nextBoard = [...board];
    nextBoard[result.move] = turn;
    finishMove(nextBoard, turn, turn === "X" ? "O" : "X");
  }

  const winning = status.winningCombination || [];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">✳</span>
          <span>NEURAL<span className="brand-light">TAC</span></span>
        </a>
        <span className="topbar-tag">
          <span className="live-dot" /> AI LAB / VERSION 1.0
        </span>
      </header>

      <section className="hero" id="home">
        <div className="eyebrow">ADVERSARIAL SEARCH · GAME THEORY</div>
        <h1>Intelligence in <span>every move.</span></h1>
        <p>
          Explore the strategy behind every decision.
          Challenge the AI or observe its algorithms in action.
        </p>
      </section>

      <section className="workspace">
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

          <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
            {board.map((cell, index) => (
              <button
                key={index}
                className={[
                  "cell",
                  cell === "X" ? "cell-x" : "",
                  cell === "O" ? "cell-o" : "",
                  winning.includes(index) ? "cell-winning" : "",
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
          </div>

          <div className="scoreboard">
            <div><span className="score-x">X</span><strong>{scores.X}</strong><small>WINS</small></div>
            <div><span className="score-o">O</span><strong>{scores.O}</strong><small>WINS</small></div>
            <div><span className="score-draw">=</span><strong>{scores.draws}</strong><small>DRAWS</small></div>
          </div>
        </div>

        <aside className="side-column">
          <section className="panel side-panel">
            <div className="section-kicker">02 / AI CONFIGURATION</div>
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

            {analytics && (
              <div className="analytics-results">
                <h3>Benchmark results</h3>
                
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

{showTree && (
  <GameTree board={board} player={turn} />
)}

          </section>

          <section className="panel side-panel">
            <div className="section-kicker">03 / MOVE HISTORY</div>
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

      <footer className="footer">
        <span>NEURALTAC © 2026</span>
        <span>MINIMAX · ALPHA-BETA PRUNING · ADVERSARIAL SEARCH</span>
      </footer>
    </main>
  );
}
