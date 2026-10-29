/**
 * AgentMonitoringPanel
 *
 * Real-time monitoring and control panel for NEURALTAC's Multi-Agent Architecture.
 * Visualizes Master Agent coordination, active agent telemetry, search statistics,
 * decision explanations, and agent comparative analysis.
 */

import { useState } from "react";
import "./AgentMonitoringPanel.css";

export default function AgentMonitoringPanel({
  game = "tic-tac-toe",
  masterAgent,
  lastDecision,
  selectedStrategy = "auto",
  onStrategyChange,
  difficulty = "hard",
  depth = null,
  currentBoard = null,
  turn = "X"
}) {
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Derive active agent display data
  const agentId = lastDecision?.agentId || (selectedStrategy !== "auto" ? selectedStrategy : "alpha-beta");
  const agentName = lastDecision?.agentName || (
    agentId === "minimax"
      ? "Minimax Agent"
      : agentId === "random"
        ? "Random Agent"
        : "Alpha-Beta Agent"
  );

  const strategyLabel = lastDecision?.strategy
    ? lastDecision.strategy.toUpperCase()
    : selectedStrategy !== "auto"
      ? selectedStrategy.toUpperCase()
      : `${difficulty.toUpperCase()} (POLICY)`;

  const roleExplanation = lastDecision?.roleExplanation || (
    agentId === "minimax"
      ? "Performs exhaustive adversarial minimax search exploring all candidate branches to identify game-theoretically optimal moves."
      : agentId === "random"
        ? "Selects uniformly at random among available legal moves without searching future game states."
        : "Optimizes minimax search by pruning provably suboptimal branches where alpha >= beta, achieving the same optimal decision in significantly fewer nodes."
  );

  // Format move display
  let moveLabel = "Waiting for move…";
  if (lastDecision?.move != null) {
    if (game === "connect-four") {
      moveLabel = `Column ${lastDecision.move + 1}`;
    } else {
      const idx = lastDecision.move;
      const row = Math.floor(idx / 3) + 1;
      const col = (idx % 3) + 1;
      moveLabel = `Cell ${idx + 1} (R${row}, C${col})`;
    }
  }

  // Handle agent comparison on current board
  function handleRunComparison() {
    if (!masterAgent || !currentBoard) return;
    setIsComparing(true);
    try {
      const result = masterAgent.compareAgents(["minimax", "alpha-beta"], currentBoard, {
        game,
        player: turn,
        depth: depth || (game === "connect-four" ? 4 : 9)
      });
      setComparisonResult(result);
    } catch (err) {
      console.error("Agent comparison error:", err);
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <section className="panel agent-panel">
      {/* SECTION HEADER */}
      <div className="agent-panel-header">
        <div className="agent-title-wrap">
          <div className="section-kicker">02 / MULTI-AGENT ARCHITECTURE</div>
          <h3>Master Agent Monitor</h3>
        </div>
        <span className="agent-status-badge coordinating">
          ● ACTIVE · COORDINATING
        </span>
      </div>

      {/* STRATEGY & AGENT SELECTOR */}
      {onStrategyChange && (
        <div className="agent-strategy-select-row">
          <label>COORDINATION POLICY:</label>
          <select
            value={selectedStrategy}
            onChange={(e) => onStrategyChange(e.target.value)}
            aria-label="Select AI agent strategy"
          >
            <option value="auto">Auto (Difficulty Policy)</option>
            <option value="alpha-beta">Alpha-Beta Agent (Branch Pruning)</option>
            <option value="minimax">Minimax Agent (Exhaustive)</option>
            <option value="random">Random Agent (Uniform)</option>
          </select>
        </div>
      )}

      {/* ACTIVE AGENT CARD */}
      <div className="agent-active-card">
        <span
          className={`agent-card-icon ${
            agentId === "minimax"
              ? "minimax"
              : agentId === "random"
                ? "random"
                : "alphabeta"
          }`}
        >
          {agentId === "minimax" ? "M" : agentId === "random" ? "R" : "αβ"}
        </span>
        <div className="agent-card-details">
          <div className="agent-card-top">
            <strong>{agentName}</strong>
            <span className="agent-strategy-tag">{strategyLabel}</span>
          </div>
          <p className="agent-role-desc">{roleExplanation}</p>
        </div>
      </div>

      {/* FALLBACK ALERT IF OCCURRED */}
      {lastDecision?.fallbackApplied && (
        <div className="agent-fallback-alert">
          ⚠️ <strong>Master Agent Fallback:</strong> {lastDecision.fallbackReason}
        </div>
      )}

      {/* METRICS TELEMETRY GRID */}
      <div className="agent-metrics-grid">
        <div className="agent-metric-item">
          <span>SELECTED MOVE</span>
          <strong>{moveLabel}</strong>
        </div>
        <div className="agent-metric-item">
          <span>DECISION TIME</span>
          <strong className={lastDecision?.executionTimeMs != null ? "" : "muted-na"}>
            {lastDecision?.executionTimeMs != null ? `${lastDecision.executionTimeMs} ms` : "N/A"}
          </strong>
        </div>
        <div className="agent-metric-item">
          <span>NODES VISITED</span>
          <strong className={lastDecision?.nodesSearched != null ? "" : "muted-na"}>
            {lastDecision?.nodesSearched != null ? lastDecision.nodesSearched.toLocaleString() : "N/A"}
          </strong>
        </div>
        <div className="agent-metric-item">
          <span>PRUNED BRANCHES</span>
          <strong className={lastDecision?.nodesPruned != null ? "lavender" : "muted-na"}>
            {lastDecision?.nodesPruned != null && agentId === "alpha-beta"
              ? lastDecision.nodesPruned.toLocaleString()
              : "N/A"}
          </strong>
        </div>
        <div className="agent-metric-item">
          <span>EVALUATION SCORE</span>
          <strong className={lastDecision?.score != null ? "" : "muted-na"}>
            {lastDecision?.score != null
              ? `${lastDecision.score > 0 ? "+" : ""}${lastDecision.score}`
              : "N/A"}
          </strong>
        </div>
        <div className="agent-metric-item">
          <span>SEARCH DEPTH</span>
          <strong className={lastDecision?.depth != null ? "" : "muted-na"}>
            {lastDecision?.depth != null
              ? `${lastDecision.depth} ply`
              : depth != null
                ? `${depth} ply`
                : "N/A"}
          </strong>
        </div>
      </div>

      {/* COMPARISON FEATURE */}
      <button
        type="button"
        className="button-secondary full-width"
        onClick={handleRunComparison}
        disabled={isComparing || !currentBoard}
      >
        {isComparing ? "Evaluating Agents…" : "Compare Minimax vs Alpha-Beta on Current Board →"}
      </button>

      {comparisonResult && comparisonResult.results && (
        <div className="agent-comparison-box">
          <h4>Agent Comparative Telemetry ({comparisonResult.game})</h4>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Move</th>
                  <th>Nodes</th>
                  <th>Pruned</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Minimax</td>
                  <td>
                    {comparisonResult.results.minimax?.move != null
                      ? game === "connect-four"
                        ? `Col ${comparisonResult.results.minimax.move + 1}`
                        : `Cell ${comparisonResult.results.minimax.move + 1}`
                      : "—"}
                  </td>
                  <td>{comparisonResult.results.minimax?.nodesSearched ?? "N/A"}</td>
                  <td>0</td>
                  <td>{comparisonResult.results.minimax?.score ?? "N/A"}</td>
                  <td>{comparisonResult.results.minimax?.executionTimeMs ?? 0} ms</td>
                </tr>
                <tr>
                  <td>Alpha-Beta</td>
                  <td>
                    {comparisonResult.results["alpha-beta"]?.move != null
                      ? game === "connect-four"
                        ? `Col ${comparisonResult.results["alpha-beta"].move + 1}`
                        : `Cell ${comparisonResult.results["alpha-beta"].move + 1}`
                      : "—"}
                  </td>
                  <td>{comparisonResult.results["alpha-beta"]?.nodesSearched ?? "N/A"}</td>
                  <td>{comparisonResult.results["alpha-beta"]?.nodesPruned ?? 0}</td>
                  <td>{comparisonResult.results["alpha-beta"]?.score ?? "N/A"}</td>
                  <td>{comparisonResult.results["alpha-beta"]?.executionTimeMs ?? 0} ms</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="comparison-note">
            ✓ <strong>Score Agreement:</strong>{" "}
            {comparisonResult.sameOptimalScore ? "100% Identical Optimal Score" : "Score Divergence"}.
            <br />
            ✓ <strong>Node Reduction:</strong> {comparisonResult.nodeReductionPercent}% fewer states visited by Alpha-Beta Pruning.
            <br />
            <em>Alpha-Beta Pruning is mathematically guaranteed to return the exact same optimal minimax evaluation while exploring far fewer states.</em>
          </p>
        </div>
      )}
    </section>
  );
}

