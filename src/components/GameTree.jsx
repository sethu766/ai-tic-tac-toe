
import {
  getAvailableMoves,
  getGameStatus,
} from "../engine/gameEngine.js";

import { findBestMoveAlphaBeta } from "../engine/alphaBeta.js";

export default function GameTree({ board, player }) {
  const status = getGameStatus(board);

  if (status.status !== "playing") {
    return (
      <section className="tree-panel">
        <p className="muted">
          Start a new round to explore the game tree.
        </p>
      </section>
    );
  }

  const moves = getAvailableMoves(board);
  const opponent = player === "X" ? "O" : "X";
  const best = findBestMoveAlphaBeta(board, player);

  const candidates = moves.map((move) => {
    const nextBoard = [...board];
    nextBoard[move] = player;

    const result = findBestMoveAlphaBeta(nextBoard, opponent);

    return {
      move,
      score: -result.score,
      selected: move === best.move,
    };
  });

  return (
    <section className="tree-panel">
      <div className="section-kicker">04 / DECISION TREE</div>
      <h3>AI candidate moves</h3>

      <p className="muted">
        Each branch represents a legal next move. Scores are
        evaluated from {player}'s perspective; higher is better
        for {player}.
      </p>

      <div className="tree-root">
        <span className="tree-node-symbol">{player}</span>
        <div>
          <strong>Current position</strong>
          <small>{moves.length} legal moves</small>
        </div>
      </div>

      <div className="tree-branches">
        {candidates.map((candidate) => (
          <article
            key={candidate.move}
            className={`tree-branch ${
              candidate.selected ? "tree-selected" : ""
            }`}
          >
            <div className="tree-branch-heading">
              <span className="tree-connector">↳</span>
              <strong>Cell {candidate.move + 1}</strong>

              {candidate.selected && (
                <span className="tree-best">BEST MOVE</span>
              )}
            </div>

            <div className="tree-metrics">
              <span>Move evaluation</span>
              <strong>
                {candidate.score > 0 ? "+" : ""}
                {candidate.score}
              </strong>
            </div>
          </article>
        ))}
      </div>

      <div className="tree-note">
        <strong>Selected move:</strong>{" "}
        {best.move == null ? "None" : `Cell ${best.move + 1}`}
        <p>
          Candidate scores are calculated using the AI search
          algorithm. These branches summarize candidate moves;
          they do not display every node searched internally.
        </p>
      </div>
    </section>
  );
}
