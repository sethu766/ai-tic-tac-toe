
import { readFileSync, writeFileSync } from "node:fs";

const log = readFileSync(0, "utf8");

// Extract rows from the experiment's console.table output.
const rows = [...log.matchAll(
  /\│\s*(\d+)\s*\│\s*(\d+)\s*\│\s*(\d+)\s*\│\s*(\d+)\s*\│\s*([\d.]+)\s*\│\s*([\d.]+)\s*\│\s*([\d.]+)\s*\│\s*(true|false)\s*\│/g
)].map((match) => ({
  position: Number(match[1]),
  movesPlayed: Number(match[2]),
  minimaxNodes: Number(match[3]),
  alphaBetaNodes: Number(match[4]),
  nodeReductionPercent: Number(match[5]),
  minimaxMs: Number(match[6]),
  alphaBetaMs: Number(match[7]),
  scoresAgree: match[8] === "true",
}));

if (rows.length === 0) {
  console.error("No rows found. Save the experiment output to a text file first.");
  process.exit(1);
}

const agreementCount = rows.filter((row) => row.scoresAgree).length;

const summary = {
  positionsAnalyzed: rows.length,
  scoreAgreementCount: agreementCount,
  scoreAgreementPercent: Number(
    ((agreementCount / rows.length) * 100).toFixed(2)
  ),
  averageNodeReductionPercent: Number(
    (
      rows.reduce((sum, row) => sum + row.nodeReductionPercent, 0) /
      rows.length
    ).toFixed(2)
  ),
  results: rows,
};

writeFileSync(
  "benchmark-results.json",
  JSON.stringify(summary, null, 2)
);

writeFileSync(
  "benchmark-results.csv",
  [
    "position,movesPlayed,minimaxNodes,alphaBetaNodes,nodeReductionPercent,minimaxMs,alphaBetaMs,scoresAgree",
    ...rows.map((row) =>
      [
        row.position,
        row.movesPlayed,
        row.minimaxNodes,
        row.alphaBetaNodes,
        row.nodeReductionPercent,
        row.minimaxMs,
        row.alphaBetaMs,
        row.scoresAgree,
      ].join(",")
    ),
  ].join("\n")
);

console.log("Summary created successfully!");
console.log("Positions analyzed:", rows.length);
console.log("Score agreement:", summary.scoreAgreementPercent + "%");
console.log(
  "Average node reduction:",
  summary.averageNodeReductionPercent + "%"
);
console.log("Files: benchmark-results.json and benchmark-results.csv");
