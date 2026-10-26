
import { useState, useEffect } from "react";

const ROWS = 6;
const COLS = 7;
const RED = "R";
const YELLOW = "Y";
const EMPTY = null;

const createBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));

function getValidMoves(board) {
  // Centre-first ordering improves Alpha-Beta pruning.
  return Array.from({ length: COLS }, (_, col) => col)
    .filter((col) => board[0][col] === EMPTY)
    .sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
}

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

function getWinner(board) {
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal down-right
    [-1, 1],  // Diagonal up-right
  ];

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
            r < 0 ||
            r >= ROWS ||
            c < 0 ||
            c >= COLS ||
            board[r][c] !== player
          ) {
            break;
          }

          count++;
        }

        if (count >= 4) return player;
      }
    }
  }

  return null;
}

function scoreWindow(window, player) {
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

function evaluateBoard(board, player) {
  const winner = getWinner(board);

  if (winner === player) return 100000;
  if (winner) return -100000;

  if (getValidMoves(board).length === 0) return 0;

  let score = 0;

  // Reward centre-column control.
  for (let row = 0; row < ROWS; row++) {
    if (board[row][3] === player) score += 3;
    else if (board[row][3]) score -= 3;
  }

  // Horizontal four-cell windows.
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const window = [0, 1, 2, 3].map(
        (i) => board[row][col + i]
      );
      score += scoreWindow(window, player);
    }
  }

  // Vertical four-cell windows.
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col < COLS; col++) {
      const window = [0, 1, 2, 3].map(
        (i) => board[row + i][col]
      );
      score += scoreWindow(window, player);
    }
  }

  // Both diagonal directions.
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const downRight = [0, 1, 2, 3].map(
        (i) => board[row + i][col + i]
      );

      const upRight = [0, 1, 2, 3].map(
        (i) => board[row + 3 - i][col + i]
      );

      score += scoreWindow(downRight, player);
      score += scoreWindow(upRight, player);
    }
  }

  return score;
}

function alphaBeta(
  board,
  depth,
  alpha,
  beta,
  currentPlayer,
  aiPlayer
) {
  const winner = getWinner(board);
  const moves = getValidMoves(board);

  if (winner || moves.length === 0 || depth === 0) {
    let score;

    if (winner === aiPlayer) {
      score = 100000 + depth;
    } else if (winner) {
      score = -100000 - depth;
    } else if (moves.length === 0) {
      score = 0;
    } else {
      score = evaluateBoard(board, aiPlayer);
    }

    return { score, move: null, nodes: 1, pruned: 0 };
  }

  const maximizing = currentPlayer === aiPlayer;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = moves[0];
  let nodes = 1;
  let pruned = 0;

  for (let i = 0; i < moves.length; i++) {
    const col = moves[i];
    const nextBoard = dropPiece(board, col, currentPlayer);

    const nextPlayer = currentPlayer === RED ? YELLOW : RED;

    const result = alphaBeta(
      nextBoard,
      depth - 1,
      alpha,
      beta,
      nextPlayer,
      aiPlayer
    );

    nodes += result.nodes;
    pruned += result.pruned;

    if (
      (maximizing && result.score > bestScore) ||
      (!maximizing && result.score < bestScore)
    ) {
      bestScore = result.score;
      bestMove = col;
    }

    if (maximizing) {
      alpha = Math.max(alpha, bestScore);
    } else {
      beta = Math.min(beta, bestScore);
    }

    if (alpha >= beta) {
      // Counts skipped sibling moves, not every node below them.
      pruned += moves.length - i - 1;
      break;
    }
  }

  return {
    score: bestScore,
    move: bestMove,
    nodes,
    pruned,
  };
}

export default function ConnectFour({ onBack }) {
  const [board, setBoard] = useState(createBoard);
  const [mode, setMode] = useState("human");
  const [turn, setTurn] = useState(RED);
  const [difficulty, setDifficulty] = useState("Medium");
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState(null);
  const [thinking, setThinking] = useState(false);

  const depth = { Easy: 2, Medium: 4, Hard: 5 }[difficulty];

  function resetGame(nextMode = mode) {
    setBoard(createBoard());
    setMode(nextMode);
    setTurn(RED);
    setResult(null);
    setPaused(false);
    setStats(null);
    setThinking(false);
  }

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

  function playHuman(col) {
    if (
      mode !== "human" ||
      turn !== RED ||
      result ||
      thinking ||
      board[0][col] !== EMPTY
    ) {
      return;
    }

    const nextBoard = dropPiece(board, col, RED);
    if (!nextBoard) return;

    setBoard(nextBoard);
    setStats(null);
    setThinking(true);
    finishTurn(nextBoard, YELLOW);
  }

  useEffect(() => {
    if (result || paused) return;

    // Human vs AI: only Yellow is computer-controlled.
    // AI vs AI: both Red and Yellow are computer-controlled.
    const aiTurn = mode === "ai" || turn === YELLOW;
    if (!aiTurn) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;

      const player = turn;

      const search = alphaBeta(
        board,
        depth,
        -Infinity,
        Infinity,
        player,
        player
      );

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

        if (getValidMoves(board).length === 0) {
          setResult("DRAW");
        }

        return;
      }

      const nextBoard = dropPiece(board, search.move, player);

      if (!nextBoard) {
        setThinking(false);
        return;
      }

      setBoard(nextBoard);
      setThinking(false);

      finishTurn(
        nextBoard,
        player === RED ? YELLOW : RED
      );
    }, mode === "ai" ? 500 : 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [board, turn, mode, depth, result, paused]);

  const status = result
    ? result === "DRAW"
      ? "Game ended in a draw"
      : `${result === RED ? "Red" : "Yellow"} wins!`
    : paused
      ? "AI vs AI paused"
      : thinking
        ? `${turn === RED ? "Red" : "Yellow"} is thinking...`
        : mode === "ai"
          ? `${turn === RED ? "Red" : "Yellow"} AI to move`
          : turn === RED
            ? "Your turn — Red"
            : "Yellow AI to move";

  const buttonStyle = {
    padding: "10px 16px",
    border: "1px solid #28515f",
    borderRadius: 9,
    background: "#102c38",
    color: "#e6fbff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };

  const modeButtonStyle = (selected) => ({
    ...buttonStyle,
    background: selected ? "#0f766e" : "#102c38",
    borderColor: selected ? "#5eead4" : "#28515f",
    flex: "1 1 150px",
  });

  return (
    <main style={{
      minHeight: "100%",
      boxSizing: "border-box",
      padding: "clamp(16px, 3vw, 32px)",
      borderRadius: 18,
      background: "#071820",
      color: "#e6fbff",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    }}>
      <div style={{
        maxWidth: 1000,
        margin: "0 auto",
      }}>
        <header style={{
          textAlign: "center",
          marginBottom: 24,
        }}>
          <div style={{
            color: "#5eead4",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}>
            NEURALTAC · AI EXTENSION
          </div>

          <h1 style={{
            fontSize: "clamp(25px, 4vw, 36px)",
            margin: "10px 0",
          }}>
            Connect Four
          </h1>

          <p style={{
            color: "#a9c5cf",
            margin: 0,
            lineHeight: 1.6,
          }}>
            Strategic game search powered by Minimax and Alpha-Beta Pruning
          </p>
        </header>

        <section style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 18,
        }}>
          <button
            style={modeButtonStyle(mode === "human")}
            onClick={() => resetGame("human")}
          >
             Human vs AI
          </button>

          <button
            style={modeButtonStyle(mode === "ai")}
            onClick={() => resetGame("ai")}
          >
             AI vs AI
          </button>
        </section>

        <section style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: 16,
          marginBottom: 20,
          borderRadius: 12,
          border: "1px solid #193c49",
          background: "#0b222c",
        }}>
          <div>
            <div style={{
              color: "#8caeb9",
              fontSize: 12,
              marginBottom: 5,
            }}>
              GAME STATUS
            </div>

            <div style={{
              fontWeight: 700,
              color: result ? "#5eead4" : "#f0f9ff",
            }}>
              {status}
            </div>
          </div>

          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
          }}>
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              style={{
                ...buttonStyle,
                background: "#102c38",
              }}
            >
              <option value="Easy">Easy · Depth 2</option>
              <option value="Medium">Medium · Depth 4</option>
              <option value="Hard">Hard · Depth 5</option>
            </select>
          </label>
        </section>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
          gap: 22,
          alignItems: "start",
        }}>
          <section style={{
            padding: "clamp(10px, 2vw, 18px)",
            background: "#0b2936",
            border: "1px solid #174858",
            borderRadius: 16,
            minWidth: 0,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 14,
              flexWrap: "wrap",
            }}>
              <span style={{ fontWeight: 700 }}>GAME BOARD</span>
              <span style={{ color: "#91b6c3", fontSize: 13 }}>
                7 columns × 6 rows
              </span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: "clamp(3px, 1vw, 8px)",
              padding: "clamp(6px, 1.5vw, 12px)",
              borderRadius: 12,
              background: "#075985",
              boxShadow: "0 10px 30px #0003",
            }}>
              {board.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => playHuman(c)}
                    disabled={
                      mode !== "human" ||
                      turn !== RED ||
                      Boolean(result) ||
                      thinking ||
                      cell !== EMPTY
                    }
                    aria-label={`Row ${r + 1}, column ${c + 1}${cell ? `, ${cell === RED ? "red" : "yellow"}` : ""}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      minWidth: 0,
                      padding: 0,
                      borderRadius: "50%",
                      border: cell
                        ? "2px solid #ffffff22"
                        : "2px solid #064568",
                      background: cell === RED
                        ? "#ef4444"
                        : cell === YELLOW
                          ? "#facc15"
                          : "#082333",
                      boxShadow: cell
                        ? "inset 0 2px 4px #0003, 0 0 8px #0002"
                        : "inset 0 3px 7px #0008",
                      cursor:
                        mode === "human" &&
                        turn === RED &&
                        !result &&
                        !thinking &&
                        cell === EMPTY
                          ? "pointer"
                          : "default",
                    }}
                  />
                ))
              )}
            </div>

            <div style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              marginTop: 14,
              color: "#b5d1d9",
              fontSize: 13,
            }}>
              <span>
                <span style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#ef4444",
                  marginRight: 6,
                }} />
                Red
              </span>

              <span>
                <span style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#facc15",
                  marginRight: 6,
                }} />
                Yellow
              </span>
            </div>
          </section>

          <aside style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}>
            <section style={{
              padding: 18,
              border: "1px solid #193c49",
              borderRadius: 14,
              background: "#0b222c",
            }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>
                Game Controls
              </h3>

              <div style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}>
                <button
                  style={buttonStyle}
                  onClick={() => resetGame()}
                >
                  ↻ New Game
                </button>

                {mode === "ai" && !result && (
                  <button
                    style={buttonStyle}
                    onClick={() => setPaused((value) => !value)}
                  >
                    {paused ? "▶ Resume" : "Ⅱ Pause"}
                  </button>
                )}

                {onBack && (
                  <button
                    style={buttonStyle}
                    onClick={onBack}
                  >
                    ← Back to NEURALTAC
                  </button>
                )}
              </div>

              <p style={{
                color: "#91b0bb",
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 0,
              }}>
                {mode === "human"
                  ? "Choose a column to drop your red piece. The yellow AI responds automatically."
                  : "Watch the red and yellow AI players compete. Pause or resume the match whenever you like."}
              </p>
            </section>

            <section style={{
              padding: 18,
              border: "1px solid #193c49",
              borderRadius: 14,
              background: "#0b222c",
            }}>
              <h3 style={{
                margin: "0 0 14px",
                fontSize: 16,
                color: "#5eead4",
              }}>
                AI Search Statistics
              </h3>

              {stats ? (
                <>
                  <p style={{ margin: "0 0 12px", color: "#a9c5cf" }}>
                    Last AI move:{" "}
                    <strong style={{ color: stats.player === RED ? "#f87171" : "#facc15" }}>
                      {stats.player === RED ? "Red" : "Yellow"}
                    </strong>
                  </p>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                  }}>
                    {[
                      ["Search depth", stats.depth],
                      ["Nodes searched", stats.nodes.toLocaleString()],
                      ["Pruned siblings", stats.pruned.toLocaleString()],
                      ["Evaluation score", stats.score.toLocaleString()],
                    ].map(([label, value]) => (
                      <div key={label} style={{
                        padding: 12,
                        borderRadius: 10,
                        background: "#102f3a",
                        border: "1px solid #1d4653",
                        minWidth: 0,
                      }}>
                        <div style={{
                          color: "#8eafbb",
                          fontSize: 12,
                          marginBottom: 7,
                        }}>
                          {label}
                        </div>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                        }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{
                  margin: 0,
                  color: "#91b0bb",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}>
                  AI search metrics will appear after the first AI move.
                </p>
              )}

              <p style={{
                color: "#91b0bb",
                fontSize: 12,
                lineHeight: 1.7,
                marginBottom: 0,
              }}>
                Scores are evaluated from the moving AI player's perspective.
                Pruned siblings count skipped moves at Alpha-Beta cutoffs;
                they do not count every node inside skipped subtrees.
              </p>
            </section>

            <section style={{
              padding: 18,
              border: "1px solid #193c49",
              borderRadius: 14,
              background: "#0b222c",
            }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>
                How the AI works
              </h3>
              <ul style={{
                paddingLeft: 20,
                margin: 0,
                color: "#a9c5cf",
                fontSize: 13,
                lineHeight: 1.9,
              }}>
                <li>Searches possible future moves using Minimax.</li>
                <li>Uses Alpha-Beta Pruning to skip unnecessary branches.</li>
                <li>Evaluates threats and potential four-piece lines.</li>
                <li>Prefers centre-column control.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
