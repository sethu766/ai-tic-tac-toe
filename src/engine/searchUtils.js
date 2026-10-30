export function chooseRandomMove(moves, random = Math.random) {
  return moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))];
}
