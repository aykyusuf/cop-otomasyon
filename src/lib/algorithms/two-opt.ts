export function twoOpt(
  initialPath: number[],
  distMatrix: number[][],
  maxIterations: number = 500
): { path: number[]; distance: number } {
  let path = [...initialPath];
  let improved = true;
  let iterations = 0;

  function pathDistance(p: number[]): number {
    let d = 0;
    for (let i = 0; i < p.length - 1; i++) {
      d += distMatrix[p[i]][p[i + 1]];
    }
    return d;
  }

  let bestDistance = pathDistance(path);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Skip first and last (they are the same start point)
    for (let i = 1; i < path.length - 2; i++) {
      for (let k = i + 1; k < path.length - 1; k++) {
        // Reverse segment between i and k
        const newPath = [
          ...path.slice(0, i),
          ...path.slice(i, k + 1).reverse(),
          ...path.slice(k + 1),
        ];

        const newDistance = pathDistance(newPath);
        if (newDistance < bestDistance) {
          path = newPath;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return { path, distance: bestDistance };
}
