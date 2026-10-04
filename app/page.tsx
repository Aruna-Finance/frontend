"use client";

import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/aruna/Header";
import { SmoothScroll } from "@/components/aruna/SmoothScroll";
import { HeroSection } from "@/components/landing/HeroSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { VaultSection } from "@/components/landing/VaultSection";
import { RefuseSection } from "@/components/landing/RefuseSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

// ── canvas color constants (kept as JS for canvas 2D — mirror of CSS tokens) ─
const INK = '#0e0f12';    // --color-canvas
const PAPER = '#eceae5';  // --color-foreground
const O1 = '#e08a4a';     // --color-accent
const O2 = '#efa469';     // --color-accent-hover
const MUTED = '#98a0ab';  // --color-foreground-muted
const MONO_FONT = "IBM Plex Mono, ui-monospace, Menlo, monospace";

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const sgn = (n: number, d = 0) => (n >= 0 ? '+' : '−') + fmt(Math.abs(n), d);

// ── spring physics ────────────────────────────────────────────────────────────
class Spring {
  x: number; v = 0; t: number;
  constructor(x = 0, readonly k = 170, readonly d = 18) { this.x = x; this.t = x; }
  step(dt: number) {
    const a = this.k * (this.t - this.x) - this.d * this.v;
    this.v += a * dt; this.x += this.v * dt;
    return this.x;
  }
}

// ── seeded random / gaussian ──────────────────────────────────────────────────
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

// ── price path simulation ─────────────────────────────────────────────────────
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

// ── IL surface math ───────────────────────────────────────────────────────────
const LNR = 0.916;
const ILf = (r: number) => 1 - 2 * Math.sqrt(r) / (1 + r);
const Lf = (r: number, k: number) => Math.min(1, k * ILf(r));
const ilRamp = (t: number) => {
  t = clamp(t, 0, 1);
  const C0 = [34, 26, 19], C1 = [224, 138, 74], C2 = [239, 164, 105];
  const a = t < 0.55 ? C0 : C1, b = t < 0.55 ? C1 : C2, u = t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45;
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], u))).join(',')})`;
};

// ── vault math ────────────────────────────────────────────────────────────────
const VC = 1000, VP = 120, VN = 2400, VK = 0.30;
const calcVault = (v: number) => {
  const pay = Math.min(VC, VN * Math.max(0, v * v - VK * VK));
  return { pay, lp: pay - VP, uw: VP - pay };
};

// ── TWAP data ─────────────────────────────────────────────────────────────────
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
  const cCapRef = useRef<HTMLCanvasElement>(null);

  // DOM refs for per-frame readouts (mutated directly to skip React re-renders)
  const calmBarFill = useRef<HTMLDivElement>(null);
  const calmBarText = useRef<HTMLSpanElement>(null);
  const whipBarFill = useRef<HTMLDivElement>(null);
  const whipBarText = useRef<HTMLSpanElement>(null);
  const scrubThumb = useRef<HTMLDivElement>(null);
  const cmpTOut = useRef<HTMLOutputElement>(null);

  // mutable RAF state — no re-renders
  const st = useRef({
    yaw: -2.45, pitch: 0.50, vyaw: 0, drag3d: false, drag3dLx: 0, drag3dLy: 0,
    priceMove: 78, rangeTightness: 65,
    pathT: 0, autoPlay: false, autoT0: 0,
    realizedVol: 0.637,
    dispPay: new Spring(0, 90, 14), dispLp: new Spring(0, 90, 14), dispUw: new Spring(0, 90, 14),
    particles: [] as Particle[],
    vaultSold: 0, coverSize: 400,
    twap: buildTwapData(-1), wickIdx: -1,
    twapAutoNext: 420, twapWickFlash: 0,
    twapSpot: 1.0, twapRw: 0,
    twapSpotHist: Array.from({ length: 120 }, () => 1.0) as number[],
    twapSmoothed: Array.from({ length: 120 }, () => 1.0) as number[],
    liaVol: 64, liaExit: 3,
    liaAutoT: 0,
    liaNetHist: Array.from({ length: 120 }, () => 0) as number[],
    px: -9999,
    capLevel: 1000,
    capHistory: Array.from({ length: 120 }, () => 1000) as number[],
    capFlash: 0,
    capFlashOk: true,
    capNextEvent: 160,
  });

  // display state
  const [vault, setVault] = useState({ vol: '63.7%', pay: '0', lp: '+0', uw: '+0', note: '' });

  useEffect(() => {
    const s = st.current;
    let rafId = 0, last = 0;

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
        const a = g[j][i], b = g[j][i + 1], c2 = g[j + 1][i + 1], d2 = g[j + 1][i];
        faces.push({ q: [a, b, c2, d2], d: (a.d + b.d + c2.d + d2.d) / 4, L: (a.L + b.L + c2.L + d2.L) / 4 });
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
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((p2, i) => {
        const q = P(p2[0], p2[1], 0); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
      });
      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '10px ' + MONO_FONT; ctx.fillStyle = 'rgba(236,234,229,.55)'; ctx.textAlign = 'center';
      const lab = (s2: string, x: number, y: number, z: number) => { const q = P(x, y, z); ctx.fillText(s2, q[0], q[1]); };
      lab('−60%', -1, -1.22, 0); lab('+150%', 1, -1.22, 0); lab('full', 1.3, -1, 0); lab('tight', 1.3, 1, 0); lab('loss', -1.15, -1.15, 1.25);
      const u2 = s.priceMove / 100, k2 = s.rangeTightness / 10, v2 = (k2 - 1) / 7;
      const r3 = Math.exp(lerp(-LNR, LNR, u2)), L2 = Lf(r3, k2);
      const mx = (u2 - 0.5) * 2, my = (v2 - 0.5) * 2;
      const top = P(mx, my, L2 * 1.15), bot = P(mx, my, 0);
      ctx.strokeStyle = O2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bot[0], bot[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
      ctx.fillStyle = INK; ctx.strokeStyle = O2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(top[0], top[1], 5, 0, 7); ctx.fill(); ctx.stroke();
      const pr = (ts * 0.0016) % 1;
      ctx.globalAlpha = 1 - pr; ctx.beginPath(); ctx.arc(top[0], top[1], 5 + pr * 16, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
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
      if (elC) { const { w, h, dpr } = cvSize(elC); const ctx = elC.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); drawChart(ctx, w, h, calmPath, INK); }
      if (elW) { const { w, h, dpr } = cvSize(elW); const ctx = elW.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); drawChart(ctx, w, h, whipPath, O1); }
      const i = Math.round(s.pathT * N);
      if (cmpTOut.current) cmpTOut.current.textContent = 'day ' + (s.pathT * 7).toFixed(1) + ' / 7';
      if (scrubThumb.current) scrubThumb.current.style.left = `calc(${s.pathT * 100}% - 5px)`;
      if (calmBarFill.current) calmBarFill.current.style.width = (calmPath.cum[i] / maxCum * 100) + '%';
      if (calmBarText.current) calmBarText.current.textContent = calmPath.cum[i].toFixed(4);
      if (whipBarFill.current) whipBarFill.current.style.width = (whipPath.cum[i] / maxCum * 100) + '%';
      if (whipBarText.current) whipBarText.current.textContent = whipPath.cum[i].toFixed(4);
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
      ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(236,234,229,.25)'; ctx.beginPath(); ctx.moveTo(vx - 14, base - capH); ctx.lineTo(vx + vw + 14, base - capH); ctx.stroke(); ctx.setLineDash([]);
      const cur = calcVault(s.realizedVol);
      const L0: [number, number] = [lpx + nw, ny + nh * 0.3], L1: [number, number] = [vx, top + preH * 0.5];
      const P0: [number, number] = [vx, base - capH * 0.35], P1: [number, number] = [lpx + nw, ny + nh * 0.75];
      const U0: [number, number] = [uwx, ny + nh * 0.3], U1: [number, number] = [vx + vw, base - capH * 0.65];
      const R0: [number, number] = [vx + vw, base - capH * 0.3], R1: [number, number] = [uwx, ny + nh * 0.75];
      const spawn = (a: [number, number], b: [number, number], c: string, rate: number) => {
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

    function drawCapacity() {
      const el = cCapRef.current; if (!el) return;
      const { w, h, dpr } = cvSize(el);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      s.capNextEvent--;
      if (s.capNextEvent <= 0) {
        if (s.capLevel > 0) {
          const bite = Math.min(s.capLevel, 150 + Math.random() * 200);
          s.capLevel = Math.max(0, s.capLevel - bite);
          s.capFlash = 18; s.capFlashOk = true;
        } else {
          s.capFlash = 18; s.capFlashOk = false;
        }
        s.capNextEvent = 130 + Math.floor(Math.random() * 100);
      }
      s.capLevel = Math.min(1000, s.capLevel + 0.35);
      s.capHistory.push(s.capLevel);
      if (s.capHistory.length > 120) s.capHistory.shift();
      if (s.capFlash > 0) s.capFlash--;
      const CAP_MAX = 1000;
      const L = 44, R = 10, Tp = 12, B = 20;
      const X = (i: number) => L + (w - L - R) * i / (s.capHistory.length - 1);
      const Y = (v: number) => Tp + (h - Tp - B) * (1 - v / CAP_MAX);
      ctx.font = '9px ' + MONO_FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
      [0, 500, 1000].forEach(v => {
        ctx.strokeStyle = 'rgba(236,234,229,.07)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - R, Y(v)); ctx.stroke();
        ctx.fillStyle = 'rgba(236,234,229,.35)';
        ctx.fillText(v === 1000 ? '1k' : v === 500 ? '500' : '0', L - 5, Y(v));
      });
      ctx.fillStyle = 'rgba(236,234,229,.25)'; ctx.textAlign = 'center';
      ctx.fillText('capacity', L + (w - L - R) / 2, h - 6);
      const grad = ctx.createLinearGradient(0, Tp, 0, h - B);
      grad.addColorStop(0, 'rgba(224,138,74,.18)');
      grad.addColorStop(1, 'rgba(224,138,74,.02)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      s.capHistory.forEach((v, i) => { const x = X(i), y = Y(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.lineTo(X(s.capHistory.length - 1), h - B);
      ctx.lineTo(X(0), h - B);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = s.capLevel < 100 ? 'rgba(200,80,70,.9)' : O1;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      s.capHistory.forEach((v, i) => { const x = X(i), y = Y(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      if (s.capFlash > 0) {
        const alpha = s.capFlash / 18;
        const xFlash = X(s.capHistory.length - 1);
        ctx.strokeStyle = s.capFlashOk ? `rgba(224,138,74,${alpha})` : `rgba(200,70,60,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(xFlash, Tp); ctx.lineTo(xFlash, h - B); ctx.stroke();
        ctx.fillStyle = s.capFlashOk ? `rgba(239,164,105,${alpha})` : `rgba(220,80,70,${alpha})`;
        ctx.beginPath(); ctx.arc(xFlash, Y(s.capLevel), 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = s.capFlashOk ? `rgba(239,164,105,${alpha})` : `rgba(220,80,70,${alpha})`;
        ctx.font = '9px ' + MONO_FONT; ctx.textAlign = 'right';
        ctx.fillText(s.capFlashOk ? 'sold' : 'rejected', w - R - 2, Tp + 10);
      }
    }

    function drawTwap() {
      const el = cTwapRef.current; if (!el) return;
      const { w, h, dpr } = cvSize(el);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      s.twapAutoNext--;
      if (s.twapWickFlash > 0) s.twapWickFlash--;
      if (s.twapAutoNext <= 0) {
        s.twapSpot *= 1.22;
        s.twapWickFlash = 50;
        s.twapAutoNext = 480 + Math.floor(Math.random() * 180);
      } else {
        s.twapRw += (Math.random() - 0.5) * 0.004;
        s.twapRw *= 0.94;
        s.twapSpot *= Math.exp(s.twapRw * 0.02);
        s.twapSpot = clamp(s.twapSpot, 0.88, 1.18);
      }
      s.twapSpotHist.push(s.twapSpot);
      if (s.twapSpotHist.length > 120) s.twapSpotHist.shift();
      const win = 24;
      const twapVal = s.twapSpotHist.slice(-win).reduce((a, b) => a + b, 0) / win;
      s.twapSmoothed.push(twapVal);
      if (s.twapSmoothed.length > 120) s.twapSmoothed.shift();
      const N2 = s.twapSpotHist.length;
      const allVals = [...s.twapSpotHist, ...s.twapSmoothed];
      const Ya = Math.min(...allVals) - 0.02, Yb = Math.max(...allVals) + 0.02;
      const L = 44, R = 10, Tp = 12, B = 20;
      const X = (i: number) => L + (w - L - R) * i / (N2 - 1);
      const Y = (p: number) => Tp + (h - Tp - B) * (1 - (p - Ya) / (Yb - Ya));
      ctx.font = '9px ' + MONO_FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
      const mid = (Ya + Yb) / 2;
      [Ya + (Yb - Ya) * 0.1, mid, Yb - (Yb - Ya) * 0.1].forEach(v2 => {
        ctx.strokeStyle = 'rgba(236,234,229,.07)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, Y(v2)); ctx.lineTo(w - R, Y(v2)); ctx.stroke();
        ctx.fillStyle = 'rgba(236,234,229,.35)';
        ctx.fillText(v2.toFixed(2), L - 5, Y(v2));
      });
      ctx.fillStyle = 'rgba(236,234,229,.25)'; ctx.textAlign = 'center';
      ctx.fillText('twap', L + (w - L - R) / 2, h - 6);
      ctx.strokeStyle = 'rgba(236,234,229,.3)'; ctx.lineWidth = 1;
      ctx.beginPath();
      s.twapSpotHist.forEach((v2, i) => { const x = X(i), y = Y(v2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      const grad = ctx.createLinearGradient(0, Tp, 0, h - B);
      grad.addColorStop(0, 'rgba(224,138,74,.18)');
      grad.addColorStop(1, 'rgba(224,138,74,.02)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      s.twapSmoothed.forEach((v2, i) => { const x = X(i), y = Y(v2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.lineTo(X(N2 - 1), h - B); ctx.lineTo(X(0), h - B);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = O1; ctx.lineWidth = 1.5;
      ctx.beginPath();
      s.twapSmoothed.forEach((v2, i) => { const x = X(i), y = Y(v2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      if (s.twapWickFlash > 0) {
        const alpha = s.twapWickFlash / 30;
        const xFlash = X(N2 - 1);
        ctx.strokeStyle = `rgba(236,234,229,${alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xFlash, Tp); ctx.lineTo(xFlash, h - B); ctx.stroke();
        ctx.fillStyle = `rgba(236,234,229,${alpha})`;
        ctx.beginPath(); ctx.arc(xFlash, Y(s.twapSpot), 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = '9px ' + MONO_FONT; ctx.textAlign = 'right';
        ctx.fillStyle = `rgba(236,234,229,${alpha * 0.7})`;
        ctx.fillText('wick', w - R - 2, Tp + 10);
      }
    }

    function drawLia() {
      const el = cLiaRef.current; if (!el) return;
      const { w, h, dpr } = cvSize(el);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      s.liaAutoT += 0.005;
      const autoVol = 20 + 80 * (0.5 + 0.5 * Math.sin(s.liaAutoT));
      const autoExit = 3.5 + 3 * Math.sin(s.liaAutoT * 0.55);
      const cur = calcVault(autoVol / 100);
      const netNow = cur.pay * clamp(autoExit, 0, 7) / 7 - VP;
      s.liaNetHist.push(netNow);
      if (s.liaNetHist.length > 120) s.liaNetHist.shift();
      const FLOOR = -VP;
      const N2 = s.liaNetHist.length;
      const maxNet = Math.max(...s.liaNetHist, 50);
      const L = 44, R = 10, Tp = 12, B = 20;
      const Ya = FLOOR - (maxNet - FLOOR) * 0.18, Yb = maxNet + (maxNet - FLOOR) * 0.1;
      const X = (i: number) => L + (w - L - R) * i / (N2 - 1);
      const Y = (n: number) => Tp + (h - Tp - B) * (1 - (n - Ya) / (Yb - Ya));
      ctx.font = '9px ' + MONO_FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
      [0, Math.round(maxNet * 0.5)].forEach(v2 => {
        ctx.strokeStyle = 'rgba(236,234,229,.07)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, Y(v2)); ctx.lineTo(w - R, Y(v2)); ctx.stroke();
        ctx.fillStyle = 'rgba(236,234,229,.35)'; ctx.fillText(v2 === 0 ? '0' : '+' + v2, L - 5, Y(v2));
      });
      ctx.fillStyle = 'rgba(236,234,229,.25)'; ctx.textAlign = 'center';
      ctx.fillText('net p&l', L + (w - L - R) / 2, h - 6);
      ctx.strokeStyle = O1; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(L, Y(FLOOR)); ctx.lineTo(w - R, Y(FLOOR)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(224,138,74,.7)'; ctx.textAlign = 'left'; ctx.font = '9px ' + MONO_FONT;
      ctx.fillText('floor −' + VP, L + 5, Y(FLOOR) - 7);
      const grad = ctx.createLinearGradient(0, Tp, 0, Y(FLOOR));
      grad.addColorStop(0, 'rgba(224,138,74,.15)');
      grad.addColorStop(1, 'rgba(224,138,74,.03)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      s.liaNetHist.forEach((v2, i) => { const x = X(i), y = Y(Math.max(v2, FLOOR)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.lineTo(X(N2 - 1), Y(FLOOR)); ctx.lineTo(X(0), Y(FLOOR));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(236,234,229,.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      s.liaNetHist.forEach((v2, i) => { const x = X(i), y = Y(Math.max(v2, FLOOR)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      ctx.fillStyle = O2;
      ctx.beginPath(); ctx.arc(X(N2 - 1), Y(Math.max(netNow, FLOOR)), 3.5, 0, Math.PI * 2); ctx.fill();
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

    function frame(ts: number) {
      const dt = Math.min(0.033, (ts - last) / 1000 || 0.016); last = ts;
      if (s.autoPlay) {
        const k = (ts - s.autoT0) / 7500;
        if (k >= 1) { s.autoPlay = false; s.pathT = 1; }
        else s.pathT = k * k * (3 - 2 * k);
      }
      s.dispPay.step(dt); s.dispLp.step(dt); s.dispUw.step(dt);
      draw3d(ts);
      drawComparison();
      drawVault(ts);
      drawCapacity();
      drawTwap();
      drawLia();
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // 3D canvas drag
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

    // comparison chart scrub
    const setPathT = (v: number) => { s.autoPlay = false; s.pathT = clamp(v, 0, 1); };
    [[chCalmRef], [chWhipRef]].forEach(([ref]) => {
      const el = ref.current; if (!el) return;
      const mv = (e: PointerEvent) => { const r = el.getBoundingClientRect(); setPathT((e.clientX - r.left - 44) / (r.width - 58)); };
      el.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' && !e.buttons) return; mv(e as PointerEvent); });
      el.addEventListener('pointerdown', (e) => mv(e as PointerEvent));
    });

    // auto-play comparison on scroll into view
    const compObs = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { s.autoPlay = true; s.autoT0 = performance.now(); s.pathT = 0; compObs.disconnect(); }
    }, { threshold: 0.35 });
    if (chWhipRef.current) compObs.observe(chWhipRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      compObs.disconnect();
    };
  }, []);

  // event handlers
  const onVolChange = (v: number) => {
    st.current.realizedVol = v / 100;
    const cur = calcVault(v / 100), be = Math.sqrt(VK * VK + VP / VN);
    st.current.dispPay.t = cur.pay; st.current.dispLp.t = cur.lp; st.current.dispUw.t = cur.uw;
    setVault({ vol: v.toFixed(1) + '%', pay: fmt(cur.pay), lp: sgn(cur.lp), uw: sgn(cur.uw), note: cur.pay >= VC ? 'Payout hit the cap.' : `Breakeven: ${(be * 100).toFixed(1)}% realized vol.` });
  };
  const onScrub = (v: number) => {
    const s = st.current; s.autoPlay = false; s.pathT = v / 1000;
    if (scrubThumb.current) scrubThumb.current.style.left = `calc(${(v / 1000) * 100}% - 5px)`;
  };

  return (
    <div className="flex flex-col flex-1 text-foreground overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none z-[90] opacity-[0.055] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")` }}
      />
      <SmoothScroll />
      <Header variant="landing" />

      <HeroSection c3dRef={c3dRef as React.RefObject<HTMLCanvasElement>} />

      <ComparisonSection
        chCalmRef={chCalmRef as React.RefObject<HTMLCanvasElement>}
        chWhipRef={chWhipRef as React.RefObject<HTMLCanvasElement>}
        calmBarFill={calmBarFill as React.RefObject<HTMLDivElement>}
        calmBarText={calmBarText as React.RefObject<HTMLSpanElement>}
        whipBarFill={whipBarFill as React.RefObject<HTMLDivElement>}
        whipBarText={whipBarText as React.RefObject<HTMLSpanElement>}
        scrubThumb={scrubThumb as React.RefObject<HTMLDivElement>}
        cmpTOut={cmpTOut as React.RefObject<HTMLOutputElement>}
        calmRv={calmPath.rv}
        whipRv={whipPath.rv}
        onScrub={onScrub}
      />

      <VaultSection
        cvaultRef={cvaultRef as React.RefObject<HTMLCanvasElement>}
        vault={vault}
        onVolChange={onVolChange}
      />

      <RefuseSection
        cCapRef={cCapRef as React.RefObject<HTMLCanvasElement>}
        cTwapRef={cTwapRef as React.RefObject<HTMLCanvasElement>}
        cLiaRef={cLiaRef as React.RefObject<HTMLCanvasElement>}
      />

      <LandingFooter />
    </div>
  );
}
