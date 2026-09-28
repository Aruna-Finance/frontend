export interface ChartPoint {
  x: number;
  y: number;
}

const round2 = (value: number) => Number(value.toFixed(2));

export function parsePoints(points: string): ChartPoint[] {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    })
    .filter((point) => !Number.isNaN(point.x) && !Number.isNaN(point.y));
}

function linearPath(points: ChartPoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${round2(point.x)},${round2(point.y)}`).join(" ");
}

// Monotone cubic (Fritsch–Carlson): a smooth curve through every point that
// never overshoots the data, so peaks stay at their real height instead of
// being pushed past it the way a plain Catmull-Rom spline would.
export function smoothLinePath(points: string): string {
  const p = parsePoints(points);
  if (p.length < 3) return linearPath(p);

  const n = p.length;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1].x - p[i].x;
    slope[i] = dx[i] === 0 ? 0 : (p[i + 1].y - p[i].y) / dx[i];
  }

  const tangent: number[] = new Array(n);
  tangent[0] = slope[0];
  tangent[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }

  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const magnitude = a * a + b * b;
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude);
      tangent[i] = scale * a * slope[i];
      tangent[i + 1] = scale * b * slope[i];
    }
  }

  let d = `M ${round2(p[0].x)},${round2(p[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C ${round2(p[i].x + h)},${round2(p[i].y + tangent[i] * h)} ${round2(p[i + 1].x - h)},${round2(
      p[i + 1].y - tangent[i + 1] * h,
    )} ${round2(p[i + 1].x)},${round2(p[i + 1].y)}`;
  }
  return d;
}

// For piecewise-linear shapes that must keep their real geometry (e.g. a
// flat → ramp → cap payout curve): straight segments, with each corner
// rounded by a small quadratic instead of a sharp point.
export function roundedCornerPath(points: string, radius: number): string {
  const p = parsePoints(points);
  if (p.length < 3) return linearPath(p);

  let d = `M ${round2(p[0].x)},${round2(p[0].y)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const prev = p[i - 1];
    const cur = p[i];
    const next = p[i + 1];
    const lenIn = Math.hypot(prev.x - cur.x, prev.y - cur.y);
    const lenOut = Math.hypot(next.x - cur.x, next.y - cur.y);
    if (lenIn === 0 || lenOut === 0) continue;
    const r = Math.min(radius, lenIn / 2, lenOut / 2);
    const ax = cur.x + ((prev.x - cur.x) / lenIn) * r;
    const ay = cur.y + ((prev.y - cur.y) / lenIn) * r;
    const bx = cur.x + ((next.x - cur.x) / lenOut) * r;
    const by = cur.y + ((next.y - cur.y) / lenOut) * r;
    d += ` L ${round2(ax)},${round2(ay)} Q ${round2(cur.x)},${round2(cur.y)} ${round2(bx)},${round2(by)}`;
  }
  const last = p[p.length - 1];
  return `${d} L ${round2(last.x)},${round2(last.y)}`;
}

// Closes a line path down to `bottom` so the area under it can carry a fade.
export function closeAreaPath(linePath: string, points: string, bottom: number): string {
  const p = parsePoints(points);
  if (p.length < 2) return "";
  const first = p[0];
  const last = p[p.length - 1];
  return `${linePath} L ${round2(last.x)},${bottom} L ${round2(first.x)},${bottom} Z`;
}
