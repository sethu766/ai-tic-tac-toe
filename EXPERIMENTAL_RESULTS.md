# NEURALTAC — Experimental Results and Analysis

## 1. Objective

The experiment evaluates the performance of the Minimax algorithm and Alpha-Beta Pruning algorithm in the NEURALTAC Tic-Tac-Toe system.

The primary objectives are to compare the number of nodes searched, measure execution time, and verify whether both algorithms obtain the same minimax score.

## 2. Experimental Methodology

The benchmark program identified 4,520 reachable ongoing board positions and tested 10 selected positions representing different stages of the game.

The experiment recorded:
- Number of nodes searched by each algorithm.
- Median execution time for each algorithm.
- Percentage reduction in nodes searched with Alpha-Beta Pruning.
- Agreement between the algorithms' minimax scores.

The Alpha-Beta `nodesPruned` telemetry counts the immediately remaining sibling moves skipped at a cutoff. It does not count every descendant position that each skipped move could have generated. In the UI this metric is labelled **Pruned siblings**.

Execution times were measured using seven benchmark samples, with 25 searches per sample. The median time per search was used for comparison.

## 3. Experimental Results

The experiment reported 100% minimax score agreement across the 10 tested positions.

The average reduction in searched nodes was 58.44%.

For the initial empty board:
- Minimax searched 549,946 nodes.
- Alpha-Beta Pruning searched 20,866 nodes.
- The reduction in searched nodes was 96.21%.
- The measured median execution times were 170.6485 ms for Minimax and 12.6831 ms for Alpha-Beta Pruning.

## 4. Analysis

Alpha-Beta Pruning reduces the search space by eliminating branches that cannot affect the final minimax decision. The node-reduction calculation compares positions actually visited by each search; the separate sibling counter is not a count of all omitted descendants. This can substantially reduce the number of evaluated positions while preserving the minimax score.

The initial empty board showed a particularly large reduction in searched nodes. The reduction varied across the tested positions because the effectiveness of pruning depends on the current board state and the opportunities for alpha-beta cutoffs.

The results support the use of Alpha-Beta Pruning to improve search efficiency in NEURALTAC.

## 5. Limitations

The experiment tested 10 selected positions rather than every reachable ongoing position. Therefore, the measured average node reduction should be interpreted as a result for the selected sample, not as a universal performance figure.

Execution times can also vary with system load and runtime conditions. Further repeated experiments and broader position sampling would improve the reliability of the performance evaluation.

## 6. Conclusion

The benchmark demonstrated that Minimax and Alpha-Beta Pruning agreed on the minimax score for all 10 tested positions. Alpha-Beta Pruning reduced the average number of searched nodes by 58.44% in the selected sample and achieved a 96.21% reduction on the initial empty board.

These findings demonstrate the practical benefit of alpha-beta pruning for reducing search effort in the NEURALTAC Tic-Tac-Toe system.