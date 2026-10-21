
import { writeFileSync } from "node:fs";

import {
  createBoard,
  getGameStatus,
  getAvailableMoves,
  makeMove,
} from "./src/engine/gameEngine.js";

import { findBestMove } from "./src/engine/minimax.js";
import { findBestMoveAlphaBeta } from "./src/engine/alphaBeta.js";
import { compareAlgorithms } from "./src/utils/benchmark.js";

// Collect reachable, non-terminal board positions.
const positions = new Map();

function collectPositions(board, player) {
  const key = board.map((cell) => cell ?? "-").join("");

  if (positions.has(key)) return;
  if (getGameStatus(board).status !== "playing") return;

  positions.set(key, { board: [...board], player });

  for (const move of getAvailableMoves(board)) {
    const nextBoard = makeMove(board, move, player);
    collectPositions(nextBoard, player === "X" ? "O" : "X");
  }
}

collectPositions(createBoard(), "X");

const allPositions = [...positions.values()];

// Choose up to four positions from each stage, spread across the list.
const selected = [];

for (const movesPlayed of [0, 2, 4, 6]) {
  const stage = allPositions.filter(
    ({ board }) =>
      board.filter((cell) => cell !== null).length === movesPlayed
  );

  const count = Math.min(3, stage.length);

  for (let i = 0; i < count; i++) {
    const index =
      count === 1
        ? 0
        : Math.round((i * (stage.length - 1)) / (count - 1));

    selected.push(stage[index]);
  }
}

const results = [];

for (let i = 0; i < selected.length; i++) {
  const { board, player } = selected[i];

  const minimax = findBestMove(board, player);
  const alphaBeta = findBestMoveAlphaBeta(board, player);

  // Seven timing samples per algorithm.
  const benchmark = compareAlgorithms(board, player, 7);

  results.push({
    position: i + 1,
    board: board.map((cell) => cell ?? "-").join(""),
    movesPlayed: board.filter((cell) => cell !== null).length,
    minimaxNodes: minimax.nodesSearched,
    alphaBetaNodes: alphaBeta.nodesSearched,
    nodeReductionPercent: Number(
      benchmark.nodeReductionPercent.toFixed(2)
    ),
    minimaxMedianMs: Number(
      benchmark.minimax.medianTimeMs.toFixed(4)
    ),
    alphaBetaMedianMs: Number(
      benchmark.alphaBeta.medianTimeMs.toFixed(4)
    ),
    scoresAgree: benchmark.sameOptimalScore,
  });
}

const agreementCount = results.filter((row) => row.scoresAgree).length;

const summary = {
  positionsAvailable: allPositions.length,
  positionsTested: results.length,
  scoreAgreementCount: agreementCount,
  scoreAgreementPercent: Number(
    ((agreementCount / results.length) * 100).toFixed(2)
  ),
  averageNodeReductionPercent: Number(
    (
      results.reduce((sum, row) => sum + row.nodeReductionPercent, 0) /
      results.length
    ).toFixed(2)
  ),
  results,
};

writeFileSync(
  "benchmark-results.json",
  JSON.stringify(summary, null, 2)
);

const headers = Object.keys(results[0]);

const csv = [
  headers.join(","),
  ...results.map((row) =>
    headers.map((header) => row[header]).join(",")
  ),
].join("\n");

writeFileSync("benchmark-results.csv", csv);

console.log("NEURALTAC benchmark complete!");
console.log("Reachable ongoing positions:", allPositions.length);
console.log("Positions tested:", results.length);
console.log("Score agreement:", summary.scoreAgreementPercent + "%");
console.log(
  "Average node reduction:",
  summary.averageNodeReductionPercent + "%"
);
console.table(results);
console.log("Saved benchmark-results.csv and benchmark-results.json");
