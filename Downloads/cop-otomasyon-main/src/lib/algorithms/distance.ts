export interface Point {
  latitude: number;
  longitude: number;
}

export function euclideanDistance(a: Point, b: Point): number {
  const dx = a.latitude - b.latitude;
  const dy = a.longitude - b.longitude;
  return Math.sqrt(dx * dx + dy * dy);
}

export function totalRouteDistance(points: Point[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += euclideanDistance(points[i], points[i + 1]);
  }
  return total;
}

export function buildDistanceMatrix(points: Point[]): number[][] {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDistance(points[i], points[j]);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}
