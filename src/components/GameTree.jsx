// SECTION 1: IMPORTS — Import functions needed to check the game and available moves.
import {
  getAvailableMoves,
  getGameStatus,
} from "../engine/gameEngine.js";

// Import the Alpha-Beta algorithm to find the best AI move.
import { findBestMoveAlphaBeta } from "../engine/alphaBeta.js";
// SECTION 2: GAME TREE COMPONENT — Receives the current board and the player whose moves are being evaluated.
export default function GameTree({ board, player }) {
  // Check the current state of the game to determine whether it is still running.
  const status = getGameStatus(board);
  // If the game has ended, display a message instead of the decision tree.
  if (status.status !== "playing") {
    return (
      <section className="tree-panel">
        <p className="muted">
          Start a new round to explore the game tree.
        </p>
      </section>
    );
  }
  // SECTION 3: GENERATE CANDIDATE MOVES — Get all legal moves, identify the opponent, and find the AI's best move.
  const moves = getAvailableMoves(board);
  // Determine the opponent's symbol: X or O.
  const opponent = player === "X" ? "O" : "X";
  // Use the Alpha-Beta algorithm to calculate the best move for the current player.
  const best = findBestMoveAlphaBeta(board, player);
  // SECTION 4: EVALUATE EACH CANDIDATE — Simulate every legal move and calculate its evaluation score.
  const candidates = moves.map((move) => {
    // Create a copy of the current board so the original board is not modified.
    const nextBoard = [...board];
    // Simulate placing the current player's symbol in the candidate cell.
    nextBoard[move] = player;
    // Evaluate the resulting board from the opponent's perspective.
    const result = findBestMoveAlphaBeta(nextBoard, opponent);
    // Return the move index, converted score, and whether it is the selected best move.
    return {
      move,
      // Negate the opponent's score to represent the evaluation from the current player's perspective.
      score: -result.score,
      // Mark this candidate as selected if it matches the best move found earlier.
      selected: move === best.move,
    };
  });
  // SECTION 5: RENDER THE DECISION TREE — Display candidate moves and their evaluation scores.
  return (
    <section className="tree-panel">
      {/* Section label identifying the decision tree module. */}
      <div className="section-kicker">04 / DECISION TREE</div>
      {/* Heading for the list of AI candidate moves. */}
      <h3>AI candidate moves</h3>
      {/* Explain what each branch and its evaluation score represent. */}
      <p className="muted">
        Each branch represents a legal next move. Scores are
        evaluated from {player}'s perspective; higher is better
        for {player}.
      </p>
      {/* SECTION 6: TREE ROOT — Show the current player and the total number of legal moves. */}
      <div className="tree-root">
        {/* Display the symbol of the player being evaluated. */}
        <span className="tree-node-symbol">{player}</span>
        <div>
          {/* Identify the root as the current game position. */}
          <strong>Current position</strong>
          {/* Display how many legal moves are available from this position. */}
          <small>{moves.length} legal moves</small>
        </div>
      </div>
      {/* SECTION 7: TREE BRANCHES — Display the evaluation of every possible next move. */}
      <div className="tree-branches">
        {candidates.map((candidate) => (
          <article
            key={candidate.move}
            // Apply a special CSS class to highlight the selected best move.
            className={`tree-branch ${
              candidate.selected ? "tree-selected" : ""
            }`}
          >
            {/* Display the move number and highlight it if the AI selected it. */}
            <div className="tree-branch-heading">
              {/* Visual connector representing a branch from the root. */}
              <span className="tree-connector">↳</span>
              {/* Display the cell number using a one-based index for readability. */}
              <strong>Cell {candidate.move + 1}</strong>
              {/* Show the BEST MOVE label only for the selected candidate. */}
              {candidate.selected && (
                <span className="tree-best">BEST MOVE</span>
              )}
            </div>
            {/* SECTION 8: MOVE EVALUATION — Display the calculated score for this candidate. */}
            <div className="tree-metrics">
              <span>Move evaluation</span>
              <strong>
                {/* Add a plus sign before positive scores for easier reading. */}
                {candidate.score > 0 ? "+" : ""}
                {candidate.score}
              </strong>
            </div>
          </article>
        ))}
      </div>
      {/* SECTION 9: DECISION SUMMARY — Display the move selected by the search algorithm. */}
      <div className="tree-note">
        <strong>Selected move:</strong>{" "}
        {/* Display None if no move is available; otherwise show the selected cell. */}
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