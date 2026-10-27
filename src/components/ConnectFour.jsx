// SECTION 1: IMPORTS — React hooks for component state and effects.
import { useEffect, useState } from "react";
import "./ConnectFour.css";
// SECTION 2: GAME CONSTANTS — Defines the board dimensions, player tokens, and empty-cell value.
const ROWS = 6;
const COLS = 7;
const RED = "R";
const YELLOW = "Y";
const EMPTY = null;
// SECTION 3: BOARD INITIALIZATION — Builds a 6-by-7 board whose cells are initially empty.
const createBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
// SECTION 4: VALID MOVES — Lists columns that are not full and checks the centre columns first.
function getValidMoves(board) {
  return Array.from({ length: COLS }, (_, col) => col)
    .filter((col) => board[0][col] === EMPTY)
    .sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
}
// SECTION 5: DROP A PIECE — Copies the board and places the piece in the lowest empty row of the chosen column.
function dropPiece(board, col, player) {
  const next = board.map((row) => [...row]);
  for (let row = ROWS - 1; row >= 0; row--) {
    if (next[row][col] === EMPTY) {
      next[row][col] = player;
      return next;
    }
  }
  return null;
}
// SECTION 6: WINNER DETECTION — Looks for four matching pieces horizontally, vertically, or diagonally.
function getWinner(board) {
  // Each pair is a row/column step used to inspect one winning direction.
  const directions = [[0, 1], [1, 0], [1, 1], [-1, 1]];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const player = board[row][col];
      if (!player) continue;
      for (const [dr, dc] of directions) {
        let count = 1;
        for (let step = 1; step < 4; step++) {
          const r = row + dr * step;
          const c = col + dc * step;
          if (
            r < 0 || r >= ROWS || c < 0 || c >= COLS ||
            board[r][c] !== player
          ) break;
          count++;
        }
        if (count >= 4) return player;
      }
    }
  }
  return null;
}
// SECTION 7: HEURISTIC WINDOW SCORING — Assigns scores to groups of four cells according to each player's potential.
function scoreWindow(window, player) {
  // Identify the opposing token so the heuristic can penalize opponent threats.
  const opponent = player === RED ? YELLOW : RED;
  const own = window.filter((cell) => cell === player).length;
  const other = window.filter((cell) => cell === opponent).length;
  const empty = window.filter((cell) => cell === EMPTY).length;
  if (own === 4) return 100;
  if (other === 4) return -100;
  if (own === 3 && empty === 1) return 30;
  if (own === 2 && empty === 2) return 10;
  if (own === 1 && empty === 3) return 1;
  if (other === 3 && empty === 1) return -40;
  if (other === 2 && empty === 2) return -10;
  return 0;
}
// SECTION 8: BOARD EVALUATION — Gives a numerical estimate of how favourable the current position is for a player.
function evaluateBoard(board, player) {
  const winner = getWinner(board);
  if (winner === player) return 100000;
  if (winner) return -100000;
  if (getValidMoves(board).length === 0) return 0;
  // Accumulate positional advantages and promising or dangerous four-cell patterns.
  let score = 0;
  for (let row = 0; row < ROWS; row++) {
    if (board[row][3] === player) score += 3;
    else if (board[row][3]) score -= 3;
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      score += scoreWindow([0, 1, 2, 3].map((i) => board[row][col + i]), player);
    }
  }
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col < COLS; col++) {
      score += scoreWindow([0, 1, 2, 3].map((i) => board[row + i][col]), player);
    }
  }
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const downRight = [0, 1, 2, 3].map((i) => board[row + i][col + i]);
      const upRight = [0, 1, 2, 3].map((i) => board[row + 3 - i][col + i]);
      score += scoreWindow(downRight, player) + scoreWindow(upRight, player);
    }
  }
  return score;
}
// SECTION 9: MINIMAX WITH ALPHA-BETA PRUNING — Searches future moves up to a set depth and skips branches that cannot affect the choice.
function alphaBeta(board, depth, alpha, beta, currentPlayer, aiPlayer) {
  const winner = getWinner(board);
  const moves = getValidMoves(board);
  // Stop recursion at a win, a full board, or the search-depth limit.
  if (winner || moves.length === 0 || depth === 0) {
    let score;
    if (winner === aiPlayer) score = 100000 + depth;
    else if (winner) score = -100000 - depth;
    else if (moves.length === 0) score = 0;
    else score = evaluateBoard(board, aiPlayer);
    return { score, move: null, nodes: 1, pruned: 0 };
  }
  // The AI tries to maximize its score; the opponent tries to minimize that score.
  const maximizing = currentPlayer === aiPlayer;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = moves[0];
  let nodes = 1;
  let pruned = 0;
  // Explore each currently legal column until all moves are checked or pruning stops the search.
  for (let i = 0; i < moves.length; i++) {
    const col = moves[i];
    const nextBoard = dropPiece(board, col, currentPlayer);
    const nextPlayer = currentPlayer === RED ? YELLOW : RED;
    const result = alphaBeta(nextBoard, depth - 1, alpha, beta, nextPlayer, aiPlayer);
    nodes += result.nodes;
    pruned += result.pruned;
    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = col;
    }
    if (maximizing) alpha = Math.max(alpha, bestScore);
    else beta = Math.min(beta, bestScore);
    if (alpha >= beta) {
      // Counts skipped sibling moves, not every node below them.
      pruned += moves.length - i - 1;
      break;
    }
  }
  return { score: bestScore, move: bestMove, nodes, pruned };
}
// SECTION 10: MAIN CONNECT FOUR COMPONENT — Manages game state and renders the game interface.
export default function ConnectFour({ onBack }) {
  // SECTION 10A: REACT STATE — Tracks the board, match mode, current turn, difficulty, result, pause state, statistics, and AI thinking state.
  const [board, setBoard] = useState(createBoard);
  const [mode, setMode] = useState("human");
  const [turn, setTurn] = useState(RED);
  const [difficulty, setDifficulty] = useState("Medium");
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState(null);
  const [thinking, setThinking] = useState(false);
  // Map the selected difficulty to the number of future moves searched by the AI.
  const depth = { Easy: 2, Medium: 4, Hard: 5 }[difficulty];
  // SECTION 10B: RESET GAME — Starts a fresh match and clears previous results and search statistics.
  function resetGame(nextMode = mode) {
    setBoard(createBoard());
    setMode(nextMode);
    setTurn(RED);
    setResult(null);
    setPaused(false);
    setStats(null);
    setThinking(false);
  }
  // SECTION 10C: FINISH TURN — Checks whether the latest move wins or draws the game, otherwise passes the turn.
  function finishTurn(nextBoard, nextPlayer) {
    const winner = getWinner(nextBoard);
    if (winner) {
      setResult(winner);
      setThinking(false);
      return;
    }
    if (getValidMoves(nextBoard).length === 0) {
      setResult("DRAW");
      setThinking(false);
      return;
    }
    setTurn(nextPlayer);
    setThinking(false);
  }
  // SECTION 10D: HUMAN MOVE — Validates the selected column, places Red's piece, and triggers the next turn.
  function playHuman(col) {
    if (
      mode !== "human" || turn !== RED || result || thinking ||
      board[0][col] !== EMPTY
    ) return;
    const nextBoard = dropPiece(board, col, RED);
    if (!nextBoard) return;
    setBoard(nextBoard);
    setStats(null);
    setThinking(true);
    finishTurn(nextBoard, YELLOW);
  }
  // SECTION 10E: AI TURN EFFECT — Schedules the AI search when an AI-controlled player's turn begins.
  useEffect(() => {
    if (result || paused) return;
    const aiTurn = mode === "ai" || turn === YELLOW;
    if (!aiTurn) return;
    let cancelled = false;
    // Delay the AI move slightly so the thinking state is visible in the interface.
    const timer = setTimeout(() => {
      if (cancelled) return;
      const player = turn;
      // Search from the current player's perspective with the selected depth and initial alpha/beta bounds.
      const search = alphaBeta(board, depth, -Infinity, Infinity, player, player);
      if (cancelled) return;
      setStats({
        player,
        nodes: search.nodes,
        pruned: search.pruned,
        score: search.score,
        depth,
      });
      if (search.move === null) {
        setThinking(false);
        if (getValidMoves(board).length === 0) setResult("DRAW");
        return;
      }
      const nextBoard = dropPiece(board, search.move, player);
      if (!nextBoard) {
        setThinking(false);
        return;
      }
      setBoard(nextBoard);
      setThinking(false);
      finishTurn(nextBoard, player === RED ? YELLOW : RED);
    }, mode === "ai" ? 500 : 250);
    // Cleanup prevents a stale scheduled AI move from running after dependencies change.
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [board, turn, mode, depth, result, paused]);
  // SECTION 10F: STATUS MESSAGE — Creates the message displayed for a win, draw, pause, or active turn.
  const status = result
    ? result === "DRAW"
      ? "Game ended in a draw"
      : `${result === RED ? "Red" : "Yellow"} wins!`
    : paused
      ? "AI vs AI paused"
      : thinking
        ? `${turn === RED ? "Red" : "Yellow"} is thinking…`
        : mode === "ai"
          ? `${turn === RED ? "Red" : "Yellow"} AI to move`
          : turn === RED
            ? "Your turn — Red"
            : "Yellow AI to move";
  // SECTION 10G: USER INTERFACE — Renders the header, match controls, board, game actions, and AI information panels.
  return (
    <main className="app-shell connect-four-shell">
      {/* SECTION 11: TOP BAR — Displays the NEURALTAC branding and navigation back to the main game. */}
      <header className="topbar">
        <a className="brand" href="#home" onClick={(event) => event.preventDefault()}>
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
      {/* SECTION 12: INTRODUCTION — Presents Connect Four and describes the AI search approach. */}
      <section className="hero connect-four-hero" id="connect-four">
        <div className="eyebrow">ADVERSARIAL SEARCH · CONNECT FOUR</div>
        <h1>Think four steps <span>ahead.</span></h1>
        <p>Explore strategic decisions with depth-limited search and Alpha-Beta Pruning.</p>
      </section>
      {/* SECTION 13: GAME WORKSPACE — Places the playable board beside the AI configuration and analysis panels. */}
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
          {/* SECTION 13A: GAME SETTINGS — Lets the user switch between Human vs AI and AI vs AI, and select difficulty. */}
          <div className="control-row connect-four-controls">
            <label>
              GAME MODE
              <select value={mode} onChange={(event) => resetGame(event.target.value)}>
                <option value="human">Human vs AI</option>
                <option value="ai">AI vs AI</option>
              </select>
            </label>
            <label>
              DIFFICULTY
              <select value={difficulty} onChange={(event) => {
                setDifficulty(event.target.value);
                resetGame();
              }}>
                <option value="Easy">Easy · Depth 2</option>
                <option value="Medium">Medium · Depth 4</option>
                <option value="Hard">Hard · Depth 5</option>
              </select>
            </label>
          </div>
          {/* SECTION 13B: TURN BANNER — Shows the latest game status and whose turn it is. */}
          <div className="turn-banner">
            <span className={`turn-symbol ${turn === RED ? "connect-symbol-red" : "connect-symbol-yellow"}`}>
              {result === "DRAW" ? "=" : result || turn}
            </span>
            <div>
              <strong>{status}</strong>
              <small>{result ? "Start a new round to play again." : mode === "human" ? "Choose a column to drop your red piece." : "Watch both AI players evaluate the board."}</small>
            </div>
          </div>
          {/* SECTION 13C: CONNECT FOUR BOARD — Renders the column labels and clickable board cells. */}
          <div className="connect-four-board-wrap">
            <div className="connect-four-column-labels" aria-hidden="true">
              {Array.from({ length: COLS }, (_, col) => <span key={col}>{col + 1}</span>)}
            </div>
            <div className="connect-four-board" role="grid" aria-label="Connect Four board">
              {board.map((row, rowIndex) => row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`connect-four-cell ${cell ? `piece-${cell}` : ""}`}
                  onClick={() => playHuman(colIndex)}
                  disabled={
                    mode !== "human" || turn !== RED || Boolean(result) ||
                    thinking || cell !== EMPTY || board[0][colIndex] !== EMPTY
                  }
                  aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}${cell ? `, ${cell === RED ? "red" : "yellow"} piece` : ", empty"}`}
                  role="gridcell"
                />
              )))}
            </div>
          </div>
          {/* SECTION 13D: BOARD LEGEND — Explains the red and yellow tokens and the board dimensions. */}
          <div className="connect-four-legend">
            <span><i className="connect-four-piece piece-R" /> Red <small>{mode === "human" ? "You" : "AI 1"}</small></span>
            <span><i className="connect-four-piece piece-Y" /> Yellow <small>AI 2</small></span>
            <span className="connect-four-board-note">7 columns × 6 rows · Connect 4 to win</span>
          </div>
          {/* SECTION 13E: GAME ACTIONS — Provides controls to start or reset a match and pause AI vs AI play. */}
          <div className="game-actions">
            <button className="button-primary" onClick={() => resetGame()}>↻ New round</button>
            {mode === "ai" && !result && (
              <button className="button-secondary" onClick={() => setPaused((value) => !value)}>
                {paused ? "▶ Resume match" : "Ⅱ Pause match"}
              </button>
            )}
            <button className="button-secondary" onClick={() => resetGame(mode)}>Reset board</button>
          </div>
        </div>
        <aside className="side-column">
          {/* AI CONFIGURATION — Shows the active Alpha-Beta algorithm, heuristic evaluation, and search depth. */}
          <section className="panel side-panel">
            <div className="section-kicker">02 / AI CONFIGURATION</div>
            <h2>Decision engine</h2>
            <p className="muted">The agent searches future board states, evaluates threats, and chooses a move within the selected search depth.</p>
            <div className="algorithm-card">
              <span className="algorithm-icon">αβ</span>
              <div><strong>Alpha-Beta Pruning</strong><small>Skips branches that cannot change the decision</small></div>
              <span className="algorithm-tag accent-text">ACTIVE</span>
            </div>
            <div className="algorithm-card">
              <span className="algorithm-icon accent">4×</span>
              <div><strong>Heuristic evaluation</strong><small>Scores centre control and four-cell patterns</small></div>
              <span className="algorithm-tag">SEARCH</span>
            </div>
            <div className="connect-four-depth">
              <span>Current search depth</span>
              <strong>{depth} ply</strong>
            </div>
          </section>
          {/* LIVE SEARCH STATISTICS — Displays nodes searched, pruned siblings, score, and search depth. */}
          <section className="panel side-panel">
            <div className="section-kicker">03 / LIVE ANALYSIS</div>
            <h2>AI search statistics</h2>
            {stats ? (
              <>
                <p className="connect-four-stat-intro">
                  Last move evaluated by <strong className={stats.player === RED ? "connect-symbol-red" : "connect-symbol-yellow"}>{stats.player === RED ? "Red AI" : "Yellow AI"}</strong>
                </p>
                <div className="connect-four-stat-grid">
                  <div className="research-metric"><span>Search depth</span><strong>{stats.depth}</strong></div>
                  <div className="research-metric"><span>Nodes searched</span><strong>{stats.nodes.toLocaleString()}</strong></div>
                  <div className="research-metric"><span>Pruned siblings</span><strong>{stats.pruned.toLocaleString()}</strong></div>
                  <div className="research-metric"><span>Evaluation score</span><strong>{stats.score.toLocaleString()}</strong></div>
                </div>
                <p className="connect-four-footnote">Scores are from the moving AI's perspective. Pruned siblings count skipped moves at cutoffs, not every node inside skipped subtrees.</p>
              </>
            ) : (
              <div className="connect-four-empty-state">
                <span className="connect-four-empty-icon">⌁</span>
                <strong>Waiting for the first AI move</strong>
                <p>Search depth, explored nodes, pruning and evaluation score will appear here after the AI acts.</p>
              </div>
            )}
          </section>
          {/* STRATEGY OVERVIEW — Summarizes how the search and evaluation choose moves. */}
          <section className="panel side-panel">
            <div className="section-kicker">04 / HOW IT WORKS</div>
            <h2>Strategy overview</h2>
            <ul className="connect-four-how-list">
              <li>Searches possible future moves with depth-limited Minimax.</li>
              <li>Uses Alpha-Beta Pruning to avoid unnecessary branches.</li>
              <li>Rewards centre-column control and promising four-cell patterns.</li>
              <li>Prioritizes winning and blocks immediate threats through evaluation.</li>
            </ul>
          </section>
        </aside>
      </section>
      {/* SECTION 15: FOOTER — Identifies the project and the algorithms demonstrated. */}
      <footer className="footer">
        <span>NEURALTAC © 2026</span>
        <span>MINIMAX · ALPHA-BETA PRUNING · CONNECT FOUR</span>
      </footer>
    </main>
  );
}
