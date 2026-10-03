"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { GradientWordmark } from "@/components/aruna/GradientWordmark";
import { SmoothScroll } from "@/components/aruna/SmoothScroll";
import { brandCopy } from "@/lib/content/copy";
import { primaryNavLinks } from "@/lib/nav";

// ── canvas color constants (mapped from design tokens) ──────────────────────
const INK = '#0e0f12';
const INK2 = '#16181d';
const PAPER = '#eceae5';
const O1 = '#e08a4a';
const O2 = '#efa469';
const MUTED = '#98a0ab';
const MONO_FONT = "IBM Plex Mono, ui-monospace, Menlo, monospace";

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const sgn = (n: number, d = 0) => (n >= 0 ? '+' : '−') + fmt(Math.abs(n), d);

// ── spring physics ───────────────────────────────────────────────────────────
class Spring {
  x: number; v = 0; t: number;
  constructor(x = 0, readonly k = 170, readonly d = 18) { this.x = x; this.t = x; }
  step(dt: number) {
    const a = this.k * (this.t - this.x) - this.d * this.v;
    this.v += a * dt; this.x += this.v * dt;
    return this.x;
  }
}

// ── seeded random / gaussian ─────────────────────────────────────────────────
function makeRng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  let u = 0; while (!u) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

// ── price path simulation ────────────────────────────────────────────────────
const N = 336, PPY = 17520;
function makePath(seed: number, target: number, clustered: boolean) {
  const r = makeRng(seed), z = new Float64Array(N); let env = 1;
  for (let i = 0; i < N; i++) {
    if (clustered) env = 0.88 * env + 0.12 * (0.25 + r() * r() * 3.4);
    z[i] = gauss(r) * env;
  }
  const W = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) W[i] = W[i - 1] + z[i - 1];
  const B = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) B[i] = W[i] - (i / N) * W[N];
  const drift = Math.log(1.03) / N;
  let msb = 0;
  for (let i = 1; i <= N; i++) { const d = B[i] - B[i - 1]; msb += d * d; }
  msb /= N;
  const s = Math.sqrt(Math.max(0, (target * target) / PPY - drift * drift) / msb);
  const p = new Float64Array(N + 1), cum = new Float64Array(N + 1);
  p[0] = 1;
  for (let i = 1; i <= N; i++) {
    p[i] = Math.exp(drift * i + s * B[i]);
    const d = Math.log(p[i] / p[i - 1]);
    cum[i] = cum[i - 1] + d * d;
  }
  return { p, cum, rv: Math.sqrt((cum[N] / N) * PPY) };
}
const calmPath = makePath(7, 0.094, false);
const whipPath = makePath(23, 0.637, true);
const maxCum = Math.max(calmPath.cum[N], whipPath.cum[N]);
let Y0 = 9, Y1 = 0;
for (const S of [calmPath, whipPath]) for (const v of S.p) { Y0 = Math.min(Y0, v); Y1 = Math.max(Y1, v); }
Y0 = Math.min(Y0, 0.98) - 0.015; Y1 = Math.max(Y1, 1.045) + 0.015;

// ── Bklit chart data ─────────────────────────────────────────────────────────
const CMP_BASE_MS = new Date('2024-01-08T00:00:00Z').getTime();
const CMP_STEP_MS = 30 * 60 * 1000; // 30 min per step, 336 steps = 7 days
const calmChartData = Array.from({ length: N + 1 }, (_, i) => ({
  date: new Date(CMP_BASE_MS + i * CMP_STEP_MS),
  value: calmPath.p[i],
}));
const whipChartData = Array.from({ length: N + 1 }, (_, i) => ({
  date: new Date(CMP_BASE_MS + i * CMP_STEP_MS),
  value: whipPath.p[i],
}));

// ── IL surface math ──────────────────────────────────────────────────────────
const LNR = 0.916;
const ILf = (r: number) => 1 - 2 * Math.sqrt(r) / (1 + r);
const Lf = (r: number, k: number) => Math.min(1, k * ILf(r));
const ilRamp = (t: number) => {
  t = clamp(t, 0, 1);
  const C0 = [34,26,19], C1 = [224,138,74], C2 = [239,164,105];
  const a = t < 0.55 ? C0 : C1, b = t < 0.55 ? C1 : C2, u = t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45;
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], u))).join(',')})`;
};

// ── vault math ───────────────────────────────────────────────────────────────
const VC = 1000, VP = 120, VN = 2400, VK = 0.30;
const calcVault = (v: number) => {
  const pay = Math.min(VC, VN * Math.max(0, v * v - VK * VK));
  return { pay, lp: pay - VP, uw: VP - pay };
};

// ── TWAP data ────────────────────────────────────────────────────────────────
const BN = 3600, BS = 150;
function buildTwapData(wickIdx: number) {
  const r = makeRng(99), x = new Float64Array(BN); let v2 = 0;
  const sd = 0.6 / Math.sqrt(2628000);
  for (let i = 0; i < BN; i++) { v2 += gauss(r) * sd; x[i] = v2; }
  const spot = new Float64Array(BN);
  for (let i = 0; i < BN; i++) spot[i] = Math.exp(x[i]);
  if (wickIdx >= 0) spot[wickIdx] *= 1.2;
  const tw: number[] = [];
  for (let k = 0; k < BN / BS; k++) { let a = 0; for (let i = k * BS; i < (k + 1) * BS; i++) a += spot[i]; tw.push(a / BS); }
  const rvOf = (arr: Float64Array | number[], ppy: number) => {
    let ss = 0; for (let i = 1; i < arr.length; i++) { const d = Math.log((arr as number[])[i] / (arr as number[])[i - 1]); ss += d * d; }
    return Math.sqrt(ss / (arr.length - 1) * ppy);
  };
  return { spot, tw, spotVol: (rvOf(spot, 2628000) * 100).toFixed(0) + '%', twapVol: (rvOf(tw, PPY) * 100).toFixed(0) + '%' };
}

type Particle = { a: [number, number]; b: [number, number]; c: string; t: number; s: number; o: number };

export default function LandingPage() {
  // canvas refs
  const c3dRef = useRef<HTMLCanvasElement>(null);
  const chCalmRef = useRef<HTMLCanvasElement>(null);
  const chWhipRef = useRef<HTMLCanvasElement>(null);
  const cvaultRef = useRef<HTMLCanvasElement>(null);
  const cTwapRef = useRef<HTMLCanvasElement>(null);
  const cLiaRef = useRef<HTMLCanvasElement>(null);

  // mutable RAF state — no re-renders
  const st = useRef({
    yaw: -0.6, pitch: 0.95, vyaw: 0, drag3d: false, drag3dLx: 0, drag3dLy: 0,
    priceMove: 78, rangeTightness: 30,
    pathT: 0, autoPlay: false, autoT0: 0,
    realizedVol: 0.637,
    dispPay: new Spring(0, 90, 14), dispLp: new Spring(0, 90, 14), dispUw: new Spring(0, 90, 14),
    particles: [] as Particle[],
    vaultSold: 0, coverSize: 400,
    twap: buildTwapData(-1), wickIdx: -1,
    liaVol: 64, liaExit: 3,
    px: -9999,
  });

  // display state for readouts
  const [il3d, setIl3d] = useState({ move: '+0%', k: '3.0×', il: '0.00%', ilk: '0.0%' });
  const [vault, setVault] = useState({ vol: '63.7%', pay: '0', lp: '+0', uw: '+0', note: '' });
  const [cmpT, setCmpT] = useState('day 0.0 / 7');
  const [scrubPos, setScrubPos] = useState(0);
  const [calmBars, setCalmBars] = useState({ w: '0%', t: '0.0000' });
  const [whipBars, setWhipBars] = useState({ w: '0%', t: '0.0000' });
  const [refuseA, setRefuseA] = useState({ left: '1,000 capacity left', msg: 'Choose a size and try to buy it.', bad: false });
  const [refuseB, setRefuseB] = useState({ spot: '—', twap: '—', btnLabel: 'Fire a flash-loan wick' });
  const [refuseC, setRefuseC] = useState({ msg: '' });
  const [liaReadout, setLiaReadout] = useState({ vol: 64, exit: 3 });

  useEffect(() => {
    const s = st.current;
    let rafId = 0, last = 0;


    // canvas size helper
    function cvSize(el: HTMLCanvasElement) {
      const r = el.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      const w = r.width, h = r.height;
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.max(1, Math.round(w * dpr));
        el.height = Math.max(1, Math.round(h * dpr));
      }
      return { w, h, dpr };
    }

    function draw3d(ts: number) {
      const el = c3dRef.current; if (!el) return;
      const { w, h, dpr } = cvSize(el);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!s.drag3d) { s.yaw += s.vyaw + 0.0022; s.vyaw *= 0.95; }
      const S = Math.min(w, h * 1.15) * 0.34, cx = w / 2, cy = h * 0.54, D = 4.3;
      const c1 = Math.cos(s.yaw), s1 = Math.sin(s.yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
      const P = (x: number, y: number, z: number): [number, number, number] => {
        const x1 = x * c1 - y * s1, y1 = x * s1 + y * c1;
        const y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
        const p = D / (D + y2);
        return [cx + x1 * p * S, cy - z2 * p * S, y2];
      };
      const NU = 34, NV = 20;
      const g: { x: number; y: number; d: number; L: number }[][] = [];
      for (let j = 0; j <= NV; j++) {
        const row = [];
        for (let i = 0; i <= NU; i++) {
          const u = i / NU, v = j / NV;
          const r2 = Math.exp(lerp(-LNR, LNR, u)), k = lerp(1, 8, v);
          const L = Lf(r2, k); const q = P((u - 0.5) * 2, (v - 0.5) * 2, L * 1.15);
          row.push({ x: q[0], y: q[1], d: q[2], L });
        }
        g.push(row);
      }
      const faces: { q: typeof g[0]; d: number; L: number }[] = [];
      for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
        const a = g[j][i], b = g[j][i+1], c2 = g[j+1][i+1], d2 = g[j+1][i];
        faces.push({ q: [a,b,c2,d2], d: (a.d+b.d+c2.d+d2.d)/4, L: (a.L+b.L+c2.L+d2.L)/4 });
      }
      faces.sort((a, b) => b.d - a.d);
      ctx.lineJoin = 'round';
      for (const f of faces) {
        ctx.beginPath(); ctx.moveTo(f.q[0].x, f.q[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(f.q[i].x, f.q[i].y);
        ctx.closePath(); ctx.fillStyle = ilRamp(f.L / 0.75); ctx.fill();
        ctx.strokeStyle = 'rgba(20,16,12,.55)'; ctx.lineWidth = 0.6; ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(236,234,229,.22)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1; ctx.beginPath();
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach((p2, i) => {
        const q = P(p2[0], p2[1], 0); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
      });
      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '10px ' + MONO_FONT; ctx.fillStyle = 'rgba(236,234,229,.55)'; ctx.textAlign = 'center';
      const lab = (s2: string, x: number, y: number, z: number) => { const q = P(x,y,z); ctx.fillText(s2, q[0], q[1]); };
      lab('−60%',-1,-1.22,0); lab('+150%',1,-1.22,0); lab('full',1.3,-1,0); lab('tight',1.3,1,0); lab('loss',-1.15,-1.15,1.25);
      const u2 = s.priceMove / 100, k2 = s.rangeTightness / 10, v2 = (k2 - 1) / 7;
      const r3 = Math.exp(lerp(-LNR, LNR, u2)), L2 = Lf(r3, k2);
      const mx = (u2 - 0.5) * 2, my = (v2 - 0.5) * 2;
      const top = P(mx, my, L2 * 1.15), bot = P(mx, my, 0);
      ctx.strokeStyle = O2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bot[0], bot[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
      ctx.fillStyle = INK; ctx.strokeStyle = O2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(top[0], top[1], 5, 0, 7); ctx.fill(); ctx.stroke();
      const pr = (ts * 0.0016) % 1;
      ctx.globalAlpha = 1 - pr; ctx.beginPath(); ctx.arc(top[0], top[1], 5 + pr * 16, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    }

    function update3dReadout() {
      const u = s.priceMove / 100, k = s.rangeTightness / 10;
      const r2 = Math.exp(lerp(-LNR, LNR, u));
      const il = ILf(r2), ilk = Math.min(1, k * il);
      setIl3d({
        move: (r2 >= 1 ? '+' : '−') + ((Math.abs(r2 - 1)) * 100).toFixed(0) + '%',
        k: k.toFixed(1) + '×',
        il: (il * 100).toFixed(2) + '%',
        ilk: (ilk * 100).toFixed(1) + '%',
      });
    }

    function drawChart(ctx: CanvasRenderingContext2D, w: number, h: number, S: typeof calmPath, col: string) {
      const L = 44, R = 14, Tp = 16, B = 24;
      const X = (i: number) => L + (w - L - R) * i / N;
      const Y = (p: number) => Tp + (h - Tp - B) * (1 - (p - Y0) / (Y1 - Y0));
      const idx = Math.round(s.pathT * N);
      ctx.font = '11px ' + MONO_FONT; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
      for (let v = Math.ceil(Y0 * 20) / 20; v < Y1; v += 0.05) {
        const y = Y(v);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(w - R, y); ctx.stroke();
        ctx.fillStyle = '#1a1814'; ctx.textAlign = 'right'; ctx.fillText('$' + v.toFixed(2), L - 6, y);
      }
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, Y(1)); ctx.lineTo(w - R, Y(1)); ctx.stroke();
      ctx.strokeStyle = O1; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, Y(1.03)); ctx.lineTo(w - R, Y(1.03)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = O1; ctx.textAlign = 'right'; ctx.fillText('$1.03', w - R, Y(1.03) - 8);
      ctx.fillStyle = '#1a1814'; ctx.textAlign = 'center';
      for (let d = 0; d <= 7; d++) ctx.fillText('' + d, X(d / 7 * N), h - 8);
      ctx.strokeStyle = col; ctx.globalAlpha = 0.15; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i <= N; i++) { const x = X(i), y = Y(S.p[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.globalAlpha = 1;
      ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= idx; i++) { const x = X(i), y = Y(S.p[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      const px = X(idx), py = Y(S.p[idx]);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, Tp); ctx.lineTo(px, h - B); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(px - 4, py - 4, 8, 8);
    }

    function drawComparison() {
      const elC = chCalmRef.current, elW = chWhipRef.current;
      if (elC) { const { w, h, dpr } = cvSize(elC); const ctx = elC.getContext('2d')!; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h); drawChart(ctx,w,h,calmPath,INK); }
      if (elW) { const { w, h, dpr } = cvSize(elW); const ctx = elW.getContext('2d')!; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h); drawChart(ctx,w,h,whipPath,O1); }
      const i = Math.round(s.pathT * N);
      setCmpT('day ' + (s.pathT * 7).toFixed(1) + ' / 7');
      setScrubPos(s.pathT);
      setCalmBars({ w: (calmPath.cum[i] / maxCum * 100) + '%', t: calmPath.cum[i].toFixed(4) });
      setWhipBars({ w: (whipPath.cum[i] / maxCum * 100) + '%', t: whipPath.cum[i].toFixed(4) });
    }

    function drawVault(ts: number) {
      const el = cvaultRef.current; if (!el) return;
      const { w, h, dpr } = cvSize(el);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const small = w < 560, nw = small ? 42 : 100, nh = 48, vw = Math.min(240, w * 0.32);
      const vx = w / 2 - vw / 2, vy = h * 0.09, vh = h * 0.82, base = vy + vh, tot = 1200;
      const lpx = 10, uwx = w - 10 - nw, ny = h / 2 - nh / 2;
      ctx.font = '10px ' + MONO_FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      [[lpx, small ? 'LP' : 'LP · HEDGER'], [uwx, small ? 'UW' : 'UNDERWRITER']].forEach(([x, lbl]) => {
        const xn = x as number;
        ctx.fillStyle = 'rgba(236,234,229,.05)'; ctx.fillRect(xn, ny, nw, nh);
        ctx.strokeStyle = 'rgba(236,234,229,.4)'; ctx.lineWidth = 1; ctx.strokeRect(xn + 0.5, ny + 0.5, nw, nh);
        ctx.fillStyle = PAPER; ctx.fillText(lbl as string, xn + nw / 2, h / 2);
      });
      const capH = vh * VC / tot, preH = vh * VP / tot, top = base - capH - preH;
      ctx.fillStyle = 'rgba(236,234,229,.1)'; ctx.fillRect(vx, base - capH, vw, capH);
      ctx.fillStyle = O1; ctx.fillRect(vx, top, vw, preH);
      const pl = clamp(s.dispPay.x, 0, 1120) / tot * vh;
      if (pl > 1) {
        ctx.save(); ctx.beginPath(); ctx.rect(vx, top, vw, pl); ctx.clip();
        ctx.fillStyle = INK; ctx.fillRect(vx, top, vw, pl);
        ctx.strokeStyle = O2; ctx.lineWidth = 1;
        const off = (ts * 0.02) % 10;
        for (let k = -pl - 10; k < vw + 10; k += 10) { ctx.beginPath(); ctx.moveTo(vx + k + off, top + pl); ctx.lineTo(vx + k + off + pl, top); ctx.stroke(); }
        ctx.restore();
        ctx.fillStyle = O2; ctx.textAlign = 'center';
        if (pl > 22) ctx.fillText('payout ' + fmt(s.dispPay.x), w / 2, top + pl / 2);
      }
      ctx.strokeStyle = 'rgba(236,234,229,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(vx + 0.5, vy, vw - 1, vh);
      ctx.fillStyle = 'rgba(236,234,229,.5)'; ctx.textAlign = 'center'; ctx.fillText('capital 1,000', w / 2, base - 14);
      if (pl < preH - 18) { ctx.fillStyle = INK; ctx.fillText('premium +120', w / 2, top + preH - 14); }
      ctx.setLineDash([3,4]); ctx.strokeStyle = 'rgba(236,234,229,.25)'; ctx.beginPath(); ctx.moveTo(vx - 14, base - capH); ctx.lineTo(vx + vw + 14, base - capH); ctx.stroke(); ctx.setLineDash([]);
      // particles
      const cur = calcVault(s.realizedVol);
      const L0: [number,number] = [lpx + nw, ny + nh * 0.3], L1: [number,number] = [vx, top + preH * 0.5];
      const P0: [number,number] = [vx, base - capH * 0.35], P1: [number,number] = [lpx + nw, ny + nh * 0.75];
      const U0: [number,number] = [uwx, ny + nh * 0.3], U1: [number,number] = [vx + vw, base - capH * 0.65];
      const R0: [number,number] = [vx + vw, base - capH * 0.3], R1: [number,number] = [uwx, ny + nh * 0.75];
      const spawn = (a: [number,number], b: [number,number], c: string, rate: number) => {
        if (Math.random() < rate && s.particles.length < 260)
          s.particles.push({ a, b, c, t: 0, s: 0.006 + Math.random() * 0.005, o: Math.random() * Math.PI * 2 });
      };
      spawn(L0, L1, O1, 0.22); spawn(U0, U1, PAPER, 0.12);
      spawn(P0, P1, O2, cur.pay / VC * 0.55);
      spawn(R0, R1, PAPER, Math.max(0, VC + VP - cur.pay) / 1120 * 0.2);
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]; p.t += p.s;
        if (p.t >= 1) { s.particles.splice(i, 1); continue; }
        const e = p.t * p.t * (3 - 2 * p.t);
        const px2 = lerp(p.a[0], p.b[0], e), py2 = lerp(p.a[1], p.b[1], e) + Math.sin(p.t * 6 + p.o) * 3;
        ctx.globalAlpha = Math.sin(p.t * Math.PI); ctx.fillStyle = p.c; ctx.fillRect(px2 - 2, py2 - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
    }

    function drawTwap() {
      const el = cTwapRef.current; if (!el) return;
      const { w, h, dpr } = cvSize(el);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
      const { spot, tw } = s.twap;
      const L = 34, R = 8, Tp = 10, B = 18, Ya = 0.94, Yb = 1.24;
      const X = (i: number) => L + (w - L - R) * i / BN;
      const Y = (p: number) => Tp + (h - Tp - B) * (1 - (p - Ya) / (Yb - Ya));
      ctx.font = '9px ' + MONO_FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(236,234,229,.4)';
      [1, 1.1, 1.2].forEach(v2 => {
        ctx.strokeStyle = 'rgba(236,234,229,.08)'; ctx.beginPath(); ctx.moveTo(L, Y(v2)); ctx.lineTo(w - R, Y(v2)); ctx.stroke();
        ctx.fillText(v2.toFixed(2), L - 4, Y(v2));
      });
      ctx.textAlign = 'center';
      for (let hr = 0; hr <= 12; hr += 3) ctx.fillText(hr + 'h', X(hr / 12 * BN), h - 7);
      ctx.strokeStyle = 'rgba(236,234,229,.5)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < BN; i += 1) { const x = X(i), y = Y(spot[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = O1; ctx.lineWidth = 2; ctx.beginPath();
      tw.forEach((v2, k) => { const x0 = X(k * BS), x1 = X((k + 1) * BS), y = Y(v2); k ? ctx.lineTo(x0, y) : ctx.moveTo(x0, y); ctx.lineTo(x1, y); });
      ctx.stroke();
      ctx.fillStyle = O2; tw.forEach((v2, k) => ctx.fillRect(X((k + 1) * BS) - 2.5, Y(v2) - 2.5, 5, 5));
    }

    function drawLia() {
      const el = cLiaRef.current; if (!el) return;
      const { w, h, dpr } = cvSize(el);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
      const v = s.liaVol / 100, e = s.liaExit;
      const cur = calcVault(v);
      const L = 40, R = 10, Tp = 10, B = 18;
      const y0 = -VP * 1.8, y1 = Math.max(300, cur.lp * 1.12);
      const X = (d: number) => L + (w - L - R) * d / 7;
      const Y2 = (n: number) => Tp + (h - Tp - B) * (1 - (n - y0) / (y1 - y0));
      ctx.save(); ctx.beginPath(); ctx.rect(L, Y2(-VP), w - L - R, h - B - Y2(-VP)); ctx.clip();
      ctx.strokeStyle = 'rgba(239,164,105,.25)'; ctx.lineWidth = 1;
      for (let k = -h; k < w; k += 9) { ctx.beginPath(); ctx.moveTo(L + k, h - B); ctx.lineTo(L + k + h, Y2(-VP)); ctx.stroke(); }
      ctx.restore();
      ctx.font = '9px ' + MONO_FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(236,234,229,.4)';
      [0, 500].forEach(n => {
        if (n < y1) { ctx.strokeStyle = 'rgba(236,234,229,.1)'; ctx.beginPath(); ctx.moveTo(L, Y2(n)); ctx.lineTo(w - R, Y2(n)); ctx.stroke(); ctx.fillText('' + n, L - 4, Y2(n)); }
      });
      ctx.textAlign = 'center';
      for (let d = 0; d <= 7; d++) ctx.fillText('' + d, X(d), h - 7);
      ctx.strokeStyle = O1; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(L, Y2(-VP)); ctx.lineTo(w - R, Y2(-VP)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = O1; ctx.textAlign = 'left'; ctx.fillText('floor −' + VP + ' · nothing owed below', L + 6, Y2(-VP) + 12);
      const net = (d: number) => cur.pay * d / 7 - VP;
      ctx.strokeStyle = PAPER; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y2(net(0))); ctx.lineTo(X(7), Y2(net(7))); ctx.stroke();
      ctx.strokeStyle = O2; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(0), Y2(net(0))); ctx.lineTo(X(e), Y2(net(e))); ctx.stroke();
      ctx.fillStyle = O2; ctx.fillRect(X(e) - 4, Y2(net(e)) - 4, 8, 8);
      const n2 = net(e);
      setRefuseC({ msg: `Exit day ${e}: net ${sgn(n2)}. Worst case: −${VP}.` });
    }

    function updateVaultReadout() {
      const cur = calcVault(s.realizedVol);
      const be = Math.sqrt(VK * VK + VP / VN);
      setVault({
        vol: (s.realizedVol * 100).toFixed(1) + '%',
        pay: fmt(cur.pay),
        lp: sgn(cur.lp),
        uw: sgn(cur.uw),
        note: cur.pay >= VC
          ? 'Payout hit the cap.'
          : `Breakeven: ${(be * 100).toFixed(1)}% realized vol.`,
      });
      s.dispPay.t = cur.pay; s.dispLp.t = cur.lp; s.dispUw.t = cur.uw;
    }
    updateVaultReadout();
    update3dReadout();

    function frame(ts: number) {
      const dt = Math.min(0.033, (ts - last) / 1000 || 0.016); last = ts;
      // auto-play comparison
      if (s.autoPlay) {
        const k = (ts - s.autoT0) / 7500;
        if (k >= 1) { s.autoPlay = false; s.pathT = 1; }
        else s.pathT = k * k * (3 - 2 * k);
      }
      // spring readouts for vault
      s.dispPay.step(dt); s.dispLp.step(dt); s.dispUw.step(dt);
      draw3d(ts);
      drawComparison();
      drawVault(ts);
      drawTwap();
      drawLia();
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // ── 3D canvas drag ────────────────────────────────────────────────────────
    const el3d = c3dRef.current;
    if (el3d) {
      const onDown = (e: PointerEvent) => { s.drag3d = true; s.drag3dLx = e.clientX; s.drag3dLy = e.clientY; el3d.setPointerCapture(e.pointerId); };
      const onMove = (e: PointerEvent) => {
        if (!s.drag3d) return;
        const dx = e.clientX - s.drag3dLx, dy = e.clientY - s.drag3dLy;
        s.drag3dLx = e.clientX; s.drag3dLy = e.clientY;
        s.yaw += dx * 0.009; s.vyaw = dx * 0.0009;
        if (e.pointerType === 'mouse') s.pitch = clamp(s.pitch + dy * 0.006, 0.35, 1.4);
      };
      const onUp = () => { s.drag3d = false; };
      el3d.addEventListener('pointerdown', onDown);
      el3d.addEventListener('pointermove', onMove);
      el3d.addEventListener('pointerup', onUp);
      el3d.addEventListener('pointercancel', onUp);
    }

    // ── comparison chart drag ─────────────────────────────────────────────────
    const setPathT = (v: number) => { s.autoPlay = false; s.pathT = clamp(v, 0, 1); };
    [[chCalmRef], [chWhipRef]].forEach(([ref]) => {
      const el = ref.current; if (!el) return;
      const mv = (e: PointerEvent) => { const r = el.getBoundingClientRect(); setPathT((e.clientX - r.left - 44) / (r.width - 58)); };
      el.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' && !e.buttons) return; mv(e as PointerEvent); });
      el.addEventListener('pointerdown', (e) => mv(e as PointerEvent));
    });

    // auto-play comparison when visible
    const compObs = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { s.autoPlay = true; s.autoT0 = performance.now(); s.pathT = 0; compObs.disconnect(); }
    }, { threshold: 0.35 });
    if (chWhipRef.current) compObs.observe(chWhipRef.current);

    // cleanup
    return () => {
      cancelAnimationFrame(rafId);
      compObs.disconnect();
    };
  }, []);

  // ── event handlers (stable, access st.current) ────────────────────────────
  const onPriceMoveChange = (v: number) => {
    st.current.priceMove = v;
    const u = v / 100, r2 = Math.exp(lerp(-LNR, LNR, u));
    const il = ILf(r2), k = st.current.rangeTightness / 10, ilk = Math.min(1, k * il);
    setIl3d(prev => ({ ...prev, move: (r2 >= 1 ? '+' : '−') + (Math.abs(r2 - 1) * 100).toFixed(0) + '%', il: (il * 100).toFixed(2) + '%', ilk: (ilk * 100).toFixed(1) + '%' }));
  };
  const onRangeTightnessChange = (v: number) => {
    st.current.rangeTightness = v;
    const k = v / 10, u = st.current.priceMove / 100, r2 = Math.exp(lerp(-LNR, LNR, u));
    const il = ILf(r2), ilk = Math.min(1, k * il);
    setIl3d(prev => ({ ...prev, k: k.toFixed(1) + '×', ilk: (ilk * 100).toFixed(1) + '%' }));
  };
  const onVolChange = (v: number) => {
    st.current.realizedVol = v / 100;
    const cur = calcVault(v / 100), be = Math.sqrt(VK * VK + VP / VN);
    st.current.dispPay.t = cur.pay; st.current.dispLp.t = cur.lp; st.current.dispUw.t = cur.uw;
    setVault({ vol: v.toFixed(1) + '%', pay: fmt(cur.pay), lp: sgn(cur.lp), uw: sgn(cur.uw), note: cur.pay >= VC ? 'Payout hit the cap.' : `Breakeven: ${(be * 100).toFixed(1)}% realized vol.` });
  };
  const onScrub = (v: number) => { const s = st.current; s.autoPlay = false; s.pathT = v / 1000; setScrubPos(v / 1000); };
  const onBuyCover = () => {
    const s = st.current;
    if (s.vaultSold + s.coverSize > 1000) {
      setRefuseA({ left: fmt(1000 - s.vaultSold) + ' capacity left', msg: `Not sold. Asked ${fmt(s.coverSize)}, only ${fmt(1000 - s.vaultSold)} backed.`, bad: true });
    } else {
      s.vaultSold += s.coverSize;
      setRefuseA({ left: fmt(1000 - s.vaultSold) + ' capacity left', msg: `Sold. Payout capped at ${fmt(s.coverSize)} — capital already in vault.`, bad: false });
    }
  };
  const onResetVault = () => { st.current.vaultSold = 0; setRefuseA({ left: '1,000 capacity left', msg: 'Vault reset.', bad: false }); };
  const onFireWick = () => {
    const s = st.current;
    if (s.wickIdx < 0) {
      s.wickIdx = Math.floor(BN * (0.25 + Math.random() * 0.5));
      s.twap = buildTwapData(s.wickIdx);
      setRefuseB({ spot: s.twap.spotVol, twap: s.twap.twapVol, btnLabel: 'Clear the wick' });
    } else {
      s.wickIdx = -1; s.twap = buildTwapData(-1);
      setRefuseB({ spot: s.twap.spotVol, twap: s.twap.twapVol, btnLabel: 'Fire a flash-loan wick' });
    }
  };
  const onLiaVol = (v: number) => { st.current.liaVol = v; setLiaReadout(r => ({ ...r, vol: v })); };
  const onLiaExit = (v: number) => { st.current.liaExit = v; setLiaReadout(r => ({ ...r, exit: v })); };

  return (
    <div className="flex flex-col flex-1 text-foreground overflow-x-hidden">
      {/* grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.055] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")` }} />
      <SmoothScroll />
      <Header variant="landing" />

      {/* ── HERO ── */}
      <section className="relative min-h-[calc(100svh-72px)] flex flex-col justify-center py-[18px] lg:py-[20px]">
        {/* ambient glow */}
        <div className="absolute top-[15%] left-[8%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(224,138,74,0.08) 0%, transparent 70%)' }} />

        <div className="relative px-[16px] sm:px-[24px] lg:px-[28px] py-[28px] lg:py-[32px] w-full max-w-[1600px] mx-auto bg-[#121212]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,0.52fr)_minmax(0,1.48fr)] gap-[26px] lg:gap-[32px] items-stretch min-h-[clamp(600px,calc(100svh-112px),820px)]">
            {/* copy */}
            <div className="flex flex-col justify-between pt-[8px] pb-0 lg:pt-[20px] lg:pb-0">
              <div className="flex flex-1 items-center">
                <div className="w-full max-w-[430px]">
              <h1 className="font-display text-[clamp(2.6rem,4.2vw,5rem)] leading-[0.98] font-normal tracking-[-0.015em]">
                Cover priced<br />
                by how{" "}
                <em className="text-accent not-italic" style={{ animation: 'wildPulse 3s ease-in-out infinite' }}>wildly</em>
                <br />
                price moves.
              </h1>
              <p className="text-foreground-muted text-[clamp(0.95rem,1.1vw,1.05rem)] mt-[40px] mb-0 max-w-[24em] leading-[1.7]">
                Variance, not direction. Settlement reads realized variance directly from the pool's TWAP oracle.
              </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-[10px] p-0 m-0 mt-[30px]">
                <Button href="/protect" className="!rounded-none">Protect a position</Button>
                <Button variant="ghost" href="/underwrite" className="!rounded-none">Underwrite</Button>
              </div>
            </div>

            {/* 3D IL surface panel */}
            <div className="bg-[#101010] relative overflow-hidden min-h-[520px] lg:min-h-0 flex flex-col">
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[16px] py-[14px] pointer-events-none">
                <span className="font-mono text-[9px] tracking-[0.12em] text-foreground-muted/70">INTERACTIVE MODEL / 01</span>
                <span className="font-mono text-[9px] tracking-[0.12em] text-accent/70">IL SURFACE · ILLUSTRATIVE</span>
              </div>
              <canvas ref={c3dRef} className="block w-full flex-1 min-h-0 cursor-grab active:cursor-grabbing" aria-label="3D impermanent loss surface" />
              <div className="px-[16px] pt-[12px] pb-[14px] bg-canvas/60 flex flex-col gap-[6px]">
                <label className="grid grid-cols-[110px_1fr_60px] gap-[12px] items-center">
                  <span className="font-mono text-[9px] tracking-[0.1em] text-foreground-muted">price move</span>
                  <input type="range" min={0} max={100} defaultValue={78} onChange={e => onPriceMoveChange(+e.target.value)} className="w-full cursor-pointer" />
                  <output className="font-mono text-[11px] text-right text-accent-hover">{il3d.move}</output>
                </label>
                <label className="grid grid-cols-[110px_1fr_60px] gap-[12px] items-center">
                  <span className="font-mono text-[9px] tracking-[0.1em] text-foreground-muted">range tightness</span>
                  <input type="range" min={10} max={80} defaultValue={30} onChange={e => onRangeTightnessChange(+e.target.value)} className="w-full cursor-pointer" />
                  <output className="font-mono text-[11px] text-right text-accent-hover">{il3d.k}</output>
                </label>
              </div>
              <div className="grid grid-cols-2">
                <div className="px-[16px] py-[14px]">
                  <div className="font-mono text-[9px] tracking-[0.1em] text-foreground-muted mb-[6px]">FULL-RANGE LP</div>
                  <div className="font-display text-[2rem] font-normal leading-tight">−{il3d.il}</div>
                </div>
                <div className="px-[16px] py-[14px]">
                  <div className="font-mono text-[9px] tracking-[0.1em] text-foreground-muted mb-[6px]">CONCENTRATED ≈</div>
                  <div className="font-display text-[2rem] font-normal leading-tight text-accent">{il3d.ilk === '0.0%' ? '−' + il3d.ilk : '−' + il3d.ilk}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 01 COMPARISON ── */}
      <section className="border-t border-border py-[clamp(80px,12vw,160px)] bg-[#f0ece3]">
        <div className="px-[24px] lg:px-[40px] w-full max-w-[1600px] mx-auto">
          <div className="mb-[56px]">
            <h2 className="font-display text-[clamp(2.6rem,5vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em] text-[#1a1814]">
              Same path.<br />Different risk.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-[1px] bg-transparent">
            {/* calm */}
            <div className="bg-white min-h-[620px] p-[28px] lg:p-[36px]">
              <div className="flex justify-between items-start gap-[12px] mb-[24px]">
                <div>
                  <div className="font-display text-[clamp(2rem,2.8vw,2.8rem)] font-normal tracking-[-0.03em] text-[#1a1814]">Calm drift</div>
                </div>
                <div className="border border-[#ddd8d0] px-[10px] py-[6px] font-mono text-[11px] whitespace-nowrap text-[#9c9690] bg-[#f5f0e8] shrink-0">
                  realized {(calmPath.rv * 100).toFixed(1)}% vol
                </div>
              </div>
              <canvas ref={chCalmRef} className="block w-full h-[400px] cursor-crosshair" />
              <div className="mt-[20px] flex items-center gap-[14px]">
                <span className="font-mono text-[10px] text-[#9c9690] shrink-0">variance accrued</span>
                <div className="flex-1 h-[3px] bg-[#c8c3bb] overflow-hidden">
                  <div className="h-full bg-[#6b6560]" style={{ width: calmBars.w }} />
                </div>
                <span className="font-mono text-[11px] text-[#1a1814] shrink-0">{calmBars.t}</span>
              </div>
              <p className="mt-[20px] text-[13px] text-[#6b6560] leading-[1.6]">Little variance accumulated. Little impermanent loss. No payout owed — and the premium reflected that up front.</p>
            </div>

            {/* whipsaw */}
            <div className="bg-white min-h-[620px] p-[28px] lg:p-[36px]">
              <div className="flex justify-between items-start gap-[12px] mb-[24px]">
                <div>
                 <div className="font-display text-[clamp(2rem,2.8vw,2.8rem)] font-normal tracking-[-0.03em] text-[#c97d3e]">Whipsaw</div>
                </div>
                <div className="border border-[#c97d3e]/30 px-[10px] py-[6px] font-mono text-[11px] whitespace-nowrap text-[#c97d3e] bg-[#c97d3e]/[0.06] shrink-0">
                  realized {(whipPath.rv * 100).toFixed(1)}% vol
                </div>
              </div>
              <canvas ref={chWhipRef} className="block w-full h-[400px] cursor-crosshair" />
              <div className="mt-[20px] flex items-center gap-[14px]">
                <span className="font-mono text-[10px] text-[#9c9690] shrink-0">variance accrued</span>
                <div className="flex-1 h-[3px] bg-[#c8c3bb] overflow-hidden">
                  <div className="h-full bg-[#c97d3e]" style={{ width: whipBars.w }} />
                </div>
                <span className="font-mono text-[11px] text-[#c97d3e] shrink-0">{whipBars.t}</span>
              </div>
              <p className="mt-[20px] text-[13px] text-[#6b6560] leading-[1.6]">Every swing is rebalanced against you. Variance is what drained the position, so variance is what the contract pays on.</p>
            </div>
          </div>

          {/* scrubber bar */}
          <div className="flex items-center gap-[16px] mt-[1px] px-[20px] py-[14px]">
            <div
              className="flex-1 relative h-[20px] flex items-center cursor-pointer"
              onPointerDown={e => {
                const r = e.currentTarget.getBoundingClientRect();
                const v = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 1000);
                onScrub(v);
                const move = (ev: PointerEvent) => { const v2 = Math.round(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * 1000); onScrub(v2); };
                const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
              }}
            >
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#a09890]" />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-[10px] h-[10px] rotate-45 bg-[#c97d3e]"
                style={{ left: `calc(${scrubPos * 100}% - 5px)` }}
              />
            </div>
            <output className="shrink-0 font-mono text-[10px] text-[#9c9690] min-w-[7em] text-right">{cmpT}</output>
          </div>
        </div>
      </section>

      {/* ── 02 VAULT ── */}
      <section className="py-[clamp(80px,12vw,160px)] bg-[#101010]">
        <div className="px-[24px] lg:px-[48px] w-full">
          <div className="mb-[56px]">
            <h2 className="font-display text-[clamp(2.6rem,5vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em]">
              Variance decides<br />what comes out.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] bg-border gap-[1px]">
            <canvas ref={cvaultRef} className="block w-full h-[500px] bg-[#101010]" aria-label="Vault flow simulation" />
            <div className="bg-[#101010] p-[28px] flex flex-col gap-[20px]">
              <div>
                <div className="font-mono text-[9px] tracking-[0.14em] text-foreground-muted mb-[8px]">REALIZED VOL THIS CYCLE</div>
                <div className="font-display text-[4rem] font-normal leading-[1] tracking-[-0.04em] text-accent">{vault.vol}</div>
              </div>
              <input type="range" min={5} max={120} step={0.1} defaultValue={63.7} onChange={e => onVolChange(+e.target.value)} className="w-full cursor-pointer" />
              <div className="flex flex-col gap-0 border-t border-border pt-[16px]">
                {([['Payout to LP', vault.pay, false], ['LP net', vault.lp, true], ['Underwriter net', vault.uw, true]] as [string, string, boolean][]).map(([k, v, signed]) => (
                  <div key={k} className="flex justify-between items-center py-[11px] border-b border-border">
                    <span className="text-[13px] text-foreground-muted">{k}</span>
                    <strong className={`font-mono text-[13px] tabular-nums ${signed && v.startsWith('+') ? 'text-accent' : ''}`}>{v}</strong>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] text-foreground-muted leading-[1.6] mt-auto">{vault.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 REFUSE ── */}
      <section className="border-t border-on-accent/20 py-[clamp(80px,12vw,160px)] bg-accent">
        <div className="px-[24px] lg:px-[48px] w-full">
          <div className="mb-[56px]">
            <h2 className="font-display text-[clamp(2.6rem,5vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em] text-on-accent">
              What we refuse to do.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-on-accent/15">
            {/* no 1 */}
            <div className="bg-[#121212] p-[36px] flex flex-col min-h-[560px]">
              <h3 className="font-display text-[clamp(1.6rem,2.1vw,2.3rem)] font-normal leading-[1.05] tracking-[-0.03em]">
                If capacity isn't there,<br />the cover isn't sold.
              </h3>
              <div className="mt-auto pt-[28px] border-t border-border flex flex-col gap-[12px]">
                <div className="h-[28px] border border-border relative overflow-hidden bg-surface">
                  <div className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500" style={{ width: (st.current.vaultSold / 1000 * 100) + '%' }} />
                  <span className="absolute inset-0 flex items-center px-[10px] font-mono text-[10px] mix-blend-difference text-white">{refuseA.left}</span>
                </div>
                <label className="grid grid-cols-[60px_1fr_44px] gap-[10px] items-center">
                  <span className="font-mono text-[9px] text-foreground-muted">size</span>
                  <input type="range" min={100} max={1500} step={50} defaultValue={400} onChange={e => { st.current.coverSize = +e.target.value; }} className="w-full cursor-pointer" />
                  <output className="font-mono text-[10px] text-accent text-right">400</output>
                </label>
                <div className="flex gap-[10px] pt-[4px]">
                  <Button onClick={onBuyCover} className="!rounded-none">Buy cover</Button>
                  <Button variant="ghost" onClick={onResetVault} className="!rounded-none">Reset</Button>
                </div>
              </div>
            </div>

            {/* no 2 */}
            <div className="bg-[#121212] p-[36px] flex flex-col min-h-[560px]">
              <h3 className="font-display text-[clamp(1.6rem,2.1vw,2.3rem)] font-normal leading-[1.05] tracking-[-0.03em]">
                A flash-loan wick can't<br />manufacture variance.
              </h3>
              <div className="mt-auto pt-[28px] border-t border-border flex flex-col gap-[12px]">
                <canvas ref={cTwapRef} className="block w-full h-[160px] bg-[#121212]" />
                <div className="grid grid-cols-2 gap-[1px] bg-border">
                  <div className="bg-[#121212] p-[10px_14px]">
                    <div className="font-mono text-[9px] text-foreground-muted uppercase tracking-[0.1em] mb-[5px]">Spot vol</div>
                    <div className="font-mono text-[22px] font-medium leading-none">{refuseB.spot}</div>
                  </div>
                  <div className="bg-[#121212] p-[10px_14px]">
                    <div className="font-mono text-[9px] text-foreground-muted uppercase tracking-[0.1em] mb-[5px]">TWAP vol</div>
                    <div className="font-mono text-[22px] font-medium leading-none text-accent">{refuseB.twap}</div>
                  </div>
                </div>
                <div className="pt-[4px]">
                  <Button onClick={onFireWick} className="!rounded-none">{refuseB.btnLabel}</Button>
                </div>
              </div>
            </div>

            {/* no 3 */}
            <div className="bg-[#121212] p-[36px] flex flex-col min-h-[560px]">
              <h3 className="font-display text-[clamp(1.6rem,2.1vw,2.3rem)] font-normal leading-[1.05] tracking-[-0.03em]">
                The premium is your<br />maximum loss. Always.
              </h3>
              <div className="mt-auto pt-[28px] border-t border-border flex flex-col gap-[12px]">
                <canvas ref={cLiaRef} className="block w-full h-[160px]" />
                <label className="grid grid-cols-[60px_1fr_44px] gap-[10px] items-center">
                  <span className="font-mono text-[9px] text-foreground-muted">vol</span>
                  <input type="range" min={5} max={120} defaultValue={64} onChange={e => onLiaVol(+e.target.value)} className="w-full cursor-pointer" />
                  <output className="font-mono text-[10px] text-accent text-right">{liaReadout.vol}%</output>
                </label>
                <label className="grid grid-cols-[60px_1fr_44px] gap-[10px] items-center">
                  <span className="font-mono text-[9px] text-foreground-muted">exit day</span>
                  <input type="range" min={0} max={7} step={0.5} defaultValue={3} onChange={e => onLiaExit(+e.target.value)} className="w-full cursor-pointer" />
                  <output className="font-mono text-[10px] text-accent text-right">{liaReadout.exit}</output>
                </label>
                {refuseC.msg && <p className="font-mono text-[10px] text-foreground-muted leading-[1.5]">{refuseC.msg}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (existing) ── */}
      <footer className="mt-auto border-t border-border">
        <div className="w-full max-w-[1440px] mx-auto px-[24px] lg:px-[48px]">
          <div className="py-[40px] flex flex-col md:flex-row md:justify-between gap-[32px]">
            <div className="flex flex-col gap-[10px] max-w-[320px]">
              <div className="flex items-center gap-[8px]">
                <Image src="/images/logo.png" alt="" width={22} height={22} />
                <span className="font-display text-[22px] text-foreground">{brandCopy.name}</span>
              </div>
              <span className="font-mono text-[11px] tracking-[0.1em] text-foreground-muted">IMPERMANENT LOSS COVER · UNISWAP V3</span>
            </div>
            <nav className="flex flex-wrap gap-x-[32px] gap-y-[10px] text-[14px]">
              {primaryNavLinks.map((link) => (
                <Link key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-border py-[20px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[8px] sm:gap-[16px]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-[4px] sm:gap-[16px]">
              <span className="font-mono text-[12px] text-foreground-muted">© {new Date().getFullYear()} Aruna</span>
              <span className="font-mono text-[12px] text-foreground-muted">Cover is capped by vault capacity. Read the settlement method before buying.</span>
            </div>
            <div className="flex gap-[16px]">
              <Link href="/proof" target="_blank" rel="noopener noreferrer" className="text-[13px] text-foreground-muted hover:text-foreground transition-colors">Settlement proof</Link>
              <Link href="/states" target="_blank" rel="noopener noreferrer" className="text-[13px] text-foreground-muted hover:text-foreground transition-colors">UI states</Link>
            </div>
          </div>
          <div className="@container overflow-hidden pt-[56px]">
            <GradientWordmark text={brandCopy.name.toUpperCase()} className="font-display [font-size:calc(100cqw/2.328)] leading-[0.74] -mb-[0.16em] -ml-[0.0613em]" />
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes wildPulse {
          0%, 100% { color: #e08a4a; }
          50% { color: #efa469; transform: translateY(-2px); }
        }
        @keyframes badgePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-runnable-track { height: 1px; background: currentColor; opacity: 0.3; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; margin-top: -6px; background: #e08a4a; border: 0; transform: rotate(45deg); }
        input[type=range]::-moz-range-track { height: 1px; background: currentColor; opacity: 0.3; }
        input[type=range]::-moz-range-thumb { width: 11px; height: 11px; background: #e08a4a; border: 0; border-radius: 0; transform: rotate(45deg); }
      `}</style>
    </div>
  );
}
