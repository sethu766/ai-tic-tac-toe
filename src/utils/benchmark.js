
const clock = globalThis.performance;

import { findBestMove } from "../engine/minimax.js";
import { findBestMoveAlphaBeta } from "../engine/alphaBeta.js";
import { getGameStatus } from "../engine/gameEngine.js";

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}


function measure(fn, board, aiPlayer, repetitions) {
  let result;

  // Warm up the JavaScript engine.
  for (let i = 0; i < 5; i++) {
    result = fn([...board], aiPlayer);
  }

  // Each sample measures 25 searches.
  const batchSize = 25;
  const timesPerSearch = [];

  for (let sample = 0; sample < repetitions; sample++) {
    const start = clock.now();

    for (let i = 0; i < batchSize; i++) {
      result = fn([...board], aiPlayer);
    }

    const elapsed = clock.now() - start;
    timesPerSearch.push(elapsed / batchSize);
  }

  return {
    ...result,
    medianTimeMs: median(timesPerSearch),
    repetitions,
    timingBatchSize: batchSize,
    totalTimedSearches: repetitions * batchSize,
  };
}


export function compareAlgorithms(
  board,
  aiPlayer = "O",
  repetitions = 21
) {
  if (
    !Array.isArray(board) ||
    board.length !== 9 ||
    !board.every(
      (cell) => cell === null || cell === "X" || cell === "O"
    )
  ) {
    throw new Error("Expected a valid nine-cell board.");
  }

  if (aiPlayer !== "X" && aiPlayer !== "O") {
    throw new Error('aiPlayer must be "X" or "O".');
  }

  if (!Number.isInteger(repetitions) || repetitions < 1) {
    throw new Error("Repetitions must be a positive integer.");
  }

  const status = getGameStatus(board);

  if (status.status !== "playing") {
    throw new Error("Benchmark requires a board with an ongoing game.");
  }

  const minimax = measure(findBestMove, board, aiPlayer, repetitions);
  const alphaBeta = measure(
    findBestMoveAlphaBeta,
    board,
    aiPlayer,
    repetitions
  );

  const sameOptimalScore = minimax.score === alphaBeta.score;
  const sameOptimalMove = minimax.move === alphaBeta.move;

  const nodeReductionPercent =
    minimax.nodesSearched > 0
      ? ((minimax.nodesSearched - alphaBeta.nodesSearched) /
          minimax.nodesSearched) * 100
      : 0;

  return {
    minimax,
    alphaBeta,
    sameOptimalScore,
    sameOptimalMove,
    nodeReductionPercent,
    timeImprovementPercent:
      minimax.medianTimeMs > 0
        ? ((minimax.medianTimeMs - alphaBeta.medianTimeMs) /
            minimax.medianTimeMs) * 100
        : 0,
  };
}
