export function nearestNeighborTSP(
  distMatrix: number[][],
  startIdx: number = 0
): { path: number[]; distance: number } {
  const n = distMatrix.length;
  const visited = new Array(n).fill(false);
  const path: number[] = [startIdx];
  visited[startIdx] = true;
  let current = startIdx;
  let totalDistance = 0;

  for (let step = 1; step < n; step++) {
    let nearest = -1;
    let minDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (!visited[j] && distMatrix[current][j] < minDist) {
        minDist = distMatrix[current][j];
        nearest = j;
      }
    }

    if (nearest === -1) break;

    visited[nearest] = true;
    path.push(nearest);
    totalDistance += minDist;
    current = nearest;
  }

  // Return to start
  totalDistance += distMatrix[current][startIdx];
  path.push(startIdx);

  return { path, distance: totalDistance };
}
