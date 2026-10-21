
import csv
import matplotlib.pyplot as plt
from pathlib import Path

# Read the actual benchmark results
with open("benchmark-results.csv", newline="", encoding="utf-8-sig") as file:
    rows = list(csv.DictReader(file))

positions = [f"Position {r['position']}" for r in rows]
minimax_nodes = [int(r["minimaxNodes"]) for r in rows]
alpha_beta_nodes = [int(r["alphaBetaNodes"]) for r in rows]
minimax_time = [float(r["minimaxMedianMs"]) for r in rows]
alpha_beta_time = [float(r["alphaBetaMedianMs"]) for r in rows]
node_reduction = [float(r["nodeReductionPercent"]) for r in rows]

output = Path("research-graphs")
output.mkdir(exist_ok=True)

# Graph 1: Nodes searched
plt.figure(figsize=(12, 6))
x = range(len(positions))
width = 0.38
plt.bar([i - width / 2 for i in x], minimax_nodes, width, label="Minimax")
plt.bar([i + width / 2 for i in x], alpha_beta_nodes, width, label="Alpha-Beta")
plt.yscale("log")
plt.xticks(list(x), positions, rotation=35, ha="right")
plt.ylabel("Nodes searched (log scale)")
plt.title("Minimax vs Alpha-Beta: Search Nodes")
plt.legend()
plt.tight_layout()
plt.savefig(output / "01-node-comparison.png", dpi=300)
plt.close()

# Graph 2: Execution time
plt.figure(figsize=(12, 6))
plt.bar([i - width / 2 for i in x], minimax_time, width, label="Minimax")
plt.bar([i + width / 2 for i in x], alpha_beta_time, width, label="Alpha-Beta")
plt.yscale("log")
plt.xticks(list(x), positions, rotation=35, ha="right")
plt.ylabel("Median execution time (milliseconds, log scale)")
plt.title("Minimax vs Alpha-Beta: Execution Time")
plt.legend()
plt.tight_layout()
plt.savefig(output / "02-time-comparison.png", dpi=300)
plt.close()

# Graph 3: Node reduction
plt.figure(figsize=(12, 6))
bars = plt.bar(positions, node_reduction)
plt.axhline(58.44, linestyle="--", label="Reported average: 58.44%")
plt.ylabel("Node reduction (%)")
plt.xlabel("Benchmark position")
plt.title("Alpha-Beta Pruning: Reduction in Search Nodes")
plt.xticks(rotation=35, ha="right")
plt.ylim(0, 105)
plt.legend()
plt.tight_layout()
plt.savefig(output / "03-node-reduction.png", dpi=300)
plt.close()

print("Graphs created successfully!")
print(f"Saved in: {output.resolve()}")
print("Files:")
for path in sorted(output.glob("*.png")):
    print(f" - {path.name}")
