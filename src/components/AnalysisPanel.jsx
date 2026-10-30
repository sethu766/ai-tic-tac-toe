/**
 * AnalysisPanel.jsx
 *
 * Displays the adversarial reasoning analysis for NEURALTAC.
 * Shows:
 *   - The AI's recommended move and the predicted opponent response.
 *   - The full principal variation (predicted optimal move sequence).
 *   - Per-algorithm metrics (nodes, pruning, score, time) for Minimax and Alpha-Beta.
 *   - A Minimax vs Alpha-Beta comparison section.
 *   - A clear warning when the two algorithms disagree on the best move.
 *
 * Board highlight classes (cell-ai-predicted, cell-opp-predicted, etc.) are
 * applied by the parent component that renders the actual board.
 *
 * Props:
 *   analysis       {Object|null}  Result from masterAgent.analyzePosition()
 *   game           {string}       'tic-tac-toe' | 'connect-four'
 *   onClose        {Function}     Called when the user dismisses the panel
 *   onRunAnalysis  {Function}     Called when the user clicks "Analyze"
 *   isAnalyzing    {boolean}      True while analysis is being computed
 */

import "./AnalysisPanel.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a move as a readable label. */
function moveLabel(move, game) {
  if (move === null || move === undefined) return "N/A";
  return game === "connect-four" ? `Col ${move + 1}` : `Cell ${move + 1}`;
}

/** Format a numeric value; show 'N/A' if null/undefined. */
function fmt(value, suffix = "") {
  if (value === null || value === undefined) return "N/A";
  return `${value}${suffix}`;
}

/** Format milliseconds. */
function fmtMs(ms) {
  if (ms === null || ms === undefined) return "N/A";
  return `${Number(ms).toFixed(3)} ms`;
}

/** Format a score nicely. */
function fmtScore(score) {
  if (score === null || score === undefined) return "N/A";
  if (score > 90000) return `+WIN (${score})`;
  if (score < -90000) return `-LOSS (${score})`;
  return String(score);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PVSequence({ pvLabels }) {
  if (!pvLabels || pvLabels.length === 0) {
    return <p style={{ color: "#8fa0bc", fontSize: "0.78rem" }}>No moves predicted (terminal state).</p>;
  }
  return (
    <ol className="pv-sequence">
      {pvLabels.map((label, i) => {
        // First move = AI (cyan), second = opponent (lavender), rest neutral.
        const cls = i === 0 ? "pv-move-ai" : i === 1 ? "pv-move-opp" : "pv-move-other";
        return (
          <li key={i} className={cls}>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function SearchTreeSection({ treeNodes, player }) {
  if (!treeNodes || treeNodes.length === 0) return null;
  return (
    <div className="search-tree-section">
      <div className="pv-heading">
        Search tree candidate branches (Player {player})
      </div>
      <div className="search-tree-list">
        {treeNodes.map((node) => (
          <div
            key={node.move}
            className={`search-tree-node ${node.isBest ? "tree-node-best" : "tree-node-suboptimal"}`}
          >
            <div className="tree-node-main">
              <span className="tree-node-symbol">{node.player}</span>
              <span className="tree-node-arrow">↳</span>
              <strong className="tree-node-label">{node.label}</strong>
              <span className={`tree-node-badge ${node.isBest ? "badge-best" : "badge-pruned"}`}>
                {node.status}
              </span>
            </div>
            <div className="tree-node-score">
              Score: <strong>{node.score > 0 ? `+${node.score}` : node.score}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlgorithmCard({ title, data, game, cssClass }) {
  return (
    <div className="analysis-card">
      <div className={`analysis-card-title ${cssClass}`}>{title}</div>
      <div className="analysis-metric">
        <span>Best move</span>
        <strong className="move-ai">{moveLabel(data.move, game)}</strong>
      </div>
      <div className="analysis-metric">
        <span>Pred. response</span>
        <strong className="move-opp">{moveLabel(data.opponentResponse, game)}</strong>
      </div>
      <div className="analysis-metric">
        <span>Score</span>
        <strong>{fmtScore(data.score)}</strong>
      </div>
      <div className="analysis-metric">
        <span>Nodes</span>
        <strong>{fmt(data.nodesSearched)}</strong>
      </div>
      {data.nodesPruned > 0 && (
        <div className="analysis-metric">
          <span>Pruned</span>
          <strong>{fmt(data.nodesPruned)}</strong>
        </div>
      )}
      <div className="analysis-metric">
        <span>Time</span>
        <strong>{fmtMs(data.executionTimeMs)}</strong>
      </div>
    </div>
  );
}

function ComparisonSection({ comparison, game, minimax, alphaBeta }) {
  const { sameMove, sameScore, nodeReductionPercent } = comparison;
  return (
    <>
      {/* Mismatch warning */}
      {!sameMove && (
        <div className="analysis-mismatch">
          <div className="analysis-mismatch-title">⚠ Move disagreement detected</div>
          <div>
            Minimax recommends <strong>{moveLabel(minimax.move, game)}</strong>
            {" "}(score {fmtScore(minimax.score)}).
          </div>
          <div>
            Alpha-Beta recommends <strong>{moveLabel(alphaBeta.move, game)}</strong>
            {" "}(score {fmtScore(alphaBeta.score)}).
          </div>
          <div style={{ marginTop: "0.3rem", fontSize: "0.75rem", color: "#fca5a5" }}>
            This can occur with equivalent-score ties and different move-ordering. Both moves are optimal under their respective search paths.
          </div>
        </div>
      )}

      <div className="analysis-comparison">
        <div className="analysis-comparison-title">Minimax vs Alpha-Beta comparison</div>
        <div className="analysis-metric">
          <span>Moves agree</span>
          <strong className={sameMove ? "comparison-agree" : "comparison-disagree"}>
            {sameMove ? "✓ Yes" : "✗ No"}
          </strong>
        </div>
        <div className="analysis-metric">
          <span>Scores agree</span>
          <strong className={sameScore ? "comparison-agree" : "comparison-disagree"}>
            {sameScore ? "✓ Yes" : "✗ No"}
          </strong>
        </div>
        <div className="analysis-metric">
          <span>Node reduction</span>
          <strong className="comparison-agree">{nodeReductionPercent.toFixed(1)}%</strong>
        </div>
        <div className="analysis-metric">
          <span>Minimax nodes</span>
          <strong>{fmt(minimax.nodesSearched)}</strong>
        </div>
        <div className="analysis-metric">
          <span>Alpha-Beta nodes</span>
          <strong>{fmt(alphaBeta.nodesSearched)}</strong>
        </div>
        <div className="analysis-metric">
          <span>Pruned branches</span>
          <strong>{fmt(alphaBeta.nodesPruned)}</strong>
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnalysisPanel({ analysis, game, onClose, onRunAnalysis, isAnalyzing }) {
  return (
    <div className="analysis-panel">
      {/* Header */}
      <div className="analysis-panel-header">
        <span className="analysis-panel-title">⚡ Adversarial Reasoning Analysis</span>
        {onClose && (
          <button className="analysis-close-btn" onClick={onClose} aria-label="Close analysis">✕</button>
        )}
      </div>

      {/* Run / re-run button */}
      <button
        className="btn-analyze"
        onClick={onRunAnalysis}
        disabled={isAnalyzing}
        style={{ marginBottom: "0.85rem" }}
      >
        {isAnalyzing ? "Analyzing…" : analysis ? "↻ Re-run analysis" : "Run analysis →"}
      </button>

      {/* Loading state */}
      {isAnalyzing && (
        <div className="analysis-loading">Running adversarial search…</div>
      )}

      {/* Results */}
      {!isAnalyzing && analysis && (
        <>
          {/* Disclaimer */}
          <div className="analysis-disclaimer">
            {analysis.disclaimer}
          </div>

          {/* PV sequence */}
          <div className="pv-section">
            <div className="pv-heading">
              Predicted optimal line (depth: {analysis.searchDepth === "exhaustive" ? "exhaustive" : analysis.searchDepth})
            </div>
            <PVSequence pvLabels={analysis.alphaBeta.pvLabels} />
          </div>

          {/* Search tree candidate branches */}
          <SearchTreeSection treeNodes={analysis.treeNodes} player={analysis.player} />

          {/* Algorithm cards */}
          <div className="analysis-cards">
            <AlgorithmCard
              title="Minimax"
              data={analysis.minimax}
              game={game}
              cssClass="minimax"
            />
            <AlgorithmCard
              title="Alpha-Beta"
              data={analysis.alphaBeta}
              game={game}
              cssClass="alphabeta"
            />
          </div>

          {/* Comparison */}
          <ComparisonSection
            comparison={analysis.comparison}
            game={game}
            minimax={analysis.minimax}
            alphaBeta={analysis.alphaBeta}
          />
        </>
      )}

      {/* No results yet */}
      {!isAnalyzing && !analysis && (
        <p style={{ color: "#8fa0bc", fontSize: "0.82rem" }}>
          Click "Run analysis" to compute adversarial reasoning for the current board position.
        </p>
      )}
    </div>
  );
}

