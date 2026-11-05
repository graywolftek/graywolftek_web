/**
 * Graywolftek - Pushpin Tear Footer Component
 * Interactive torn-poster site footer in signature Deep Ocean Blue & Midnight palette.
 * Procedurally generated paper rip, interactive physics pin, live India clock,
 * email copy toast, newsletter interaction, and ecosystem navigation.
 */
(function () {
  'use strict';

  // Constants & Procedural Math
  const RIDGE_N = 84;
  const START = 1.06;
  const FLAPS = 6;
  const clamp01 = (v) => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0);

  function rng(seed) {
    let a = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const XS = (() => {
    const r = rng(911);
    const out = [];
    for (let i = 0; i < RIDGE_N; i++) {
      const u = i / (RIDGE_N - 1);
      const j = i > 0 && i < RIDGE_N - 1 ? (r() - 0.5) * (0.8 / RIDGE_N) : 0;
      out.push(-0.02 + u * 1.04 + j);
    }
    return out;
  })();

  function ridgeFloor(x) {
    const d = Math.abs(x - 0.5);
    if (d < 0.13) return 0.39;
    if (d < 0.25) return 0.43;
    return 0.5;
  }

  function makeTear(seed, n = RIDGE_N) {
    const r = rng(seed);
    const ph = [r() * 6.283, r() * 6.283, r() * 6.283];
    const ys = [];
    const rim = [];
    const lag = [];
    for (let i = 0; i < n; i++) {
      const x = XS[Math.min(i, XS.length - 1)];
      const d = Math.min(1, Math.abs(x - 0.5) * 2);
      const base = 0.43 + 0.3 * Math.pow(d, 1.35);
      const wander = (0.022 * Math.sin(x * 7 + ph[0]) + 0.016 * Math.sin(x * 13 + ph[1]) + 0.01 * Math.sin(x * 29 + ph[2])) * (0.45 + 0.55 * d);
      const spike = r() < 0.16 ? 2.3 : 1;
      const jag = (r() - 0.5) * 0.022 * spike;
      ys.push(Math.min(0.8, Math.max(ridgeFloor(x), base + wander + jag)));
      rim.push(1.2 + r() * 3.6);
      lag.push(Math.min(0.48, d * 0.4 + 0.04 + 0.03 * Math.sin(x * 23 + ph[1]) + r() * 0.012));
    }
    const slots = [0.05, 0.19, 0.33, 0.67, 0.81, 0.95];
    const up = r() < 0.5 ? [2, 4] : [1, 3];
    const flaps = slots.map((slot, k) => {
      const x = slot + (r() - 0.5) * 0.05;
      const span = 3 + Math.floor(r() * 5);
      const at = Math.max(0, Math.min(n - 1 - span, Math.round(x * (n - 1))));
      const dir = up.includes(k) ? -1 : 1;
      const outer = k === 0 || k === slots.length - 1;
      const len = dir < 0 ? 0.022 + r() * 0.022 : outer ? 0.085 + r() * 0.04 : 0.045 + r() * 0.05;
      return { at, span, len, skew: (r() - 0.5) * 1.1, dir, jag: [r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5] };
    });
    return { ys, rim, lag, flaps };
  }

  function easeTear(t) {
    const x = clamp01(t);
    if (x === 0 || x === 1) return x;
    const c1 = 0.9;
    return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  function easeInOut(t) {
    const x = clamp01(t);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function introYs(tear, t) {
    return tear.ys.map((y, i) => START + (y - START) * easeTear((t - tear.lag[i]) / 0.5));
  }

  function morphYs(from, to, t) {
    return to.ys.map((y, i) => {
      const a = from[i] ?? y;
      return a + (y - a) * easeInOut((t - to.lag[i] * 0.6) / 0.6);
    });
  }

  function flapOpen(tear, f, t) {
    return easeTear((t - tear.lag[f.at] - 0.18) / 0.32);
  }

  function flapPoly(ys, f, W, H, open) {
    const b = Math.min(ys.length - 1, f.at + f.span);
    const top = [];
    for (let k = f.at; k <= b; k++) top.push([XS[k] * W, ys[k] * H]);
    const A = top[0];
    const B = top[top.length - 1];
    const mx = (A[0] + B[0]) / 2;
    const my = (A[1] + B[1]) / 2;
    const L = f.len * H * Math.max(0, open);
    const tip = [mx + f.skew * L, my + f.dir * L];
    const side = (P, Q, j0, j1) => {
      const dx = Q[0] - P[0];
      const dy = Q[1] - P[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      return [
        [P[0] + dx / 3 + nx * j0 * 0.22 * L, P[1] + dy / 3 + ny * j0 * 0.22 * L],
        [P[0] + (dx * 2) / 3 + nx * j1 * 0.22 * L, P[1] + (dy * 2) / 3 + ny * j1 * 0.22 * L],
      ];
    };
    return [...top, ...side(B, tip, f.jag[0], f.jag[1]), tip, ...side(tip, A, f.jag[2], f.jag[3])];
  }

  const n1 = (v) => Math.round(v * 10) / 10;

  function polyD(pts) {
    return pts.length ? "M" + pts.map((p) => n1(p[0]) + " " + n1(p[1])).join("L") + "Z" : "";
  }

  function sheetD(ys, W, H, off) {
    let d = "M-20 -20L" + (W + 20) + " -20";
    for (let i = ys.length - 1; i >= 0; i--) d += "L" + n1(XS[i] * W) + " " + n1(ys[i] * H - (off ? off[i] : 0));
    return d + "Z";
  }

  function mixHex(a, b, t) {
    const p = (h) => {
      const s = h.replace("#", "");
      const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s.padEnd(6, "0").slice(0, 6);
      return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
    };
    const x = p(a);
    const y = p(b);
    const k = clamp01(t);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("");
  }

  // Icons Helper
  function getIconSvg(name) {
    const P = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    switch (name) {
      case "chevL": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>`;
      case "arrow": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><path d="M5 12h13M13 6.5 18.5 12 13 17.5"/></svg>`;
      case "check": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><path d="m5.5 12.5 4 4 9-9.5"/></svg>`;
      case "copy": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><path d="M13.5 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h10a2.5 2.5 0 0 0 2.5-2.5v-6.5"/><circle cx="18.5" cy="5.5" r="2.3"/></svg>`;
      case "squiggle": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><path d="M3.5 15c1.8-3.2 3.6-3.2 5.4 0s3.6 3.2 5.4 0 3.6-3.2 5.4 0"/></svg>`;
      case "github": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" fill="currentColor"><path fill-rule="evenodd" d="M12 2.8a9.3 9.3 0 0 0-2.9 18.1c.5.1.6-.2.6-.5v-1.7c-2.6.6-3.1-1.1-3.1-1.1-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.2 1 2.7.8.1-.6.3-1 .6-1.2-2.1-.2-4.2-1-4.2-4.6 0-1 .4-1.8 1-2.5-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a8.8 8.8 0 0 1 4.6 0c1.8-1.2 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.5 1 2.5 0 3.6-2.2 4.4-4.2 4.6.3.3.6.8.6 1.6v2.4c0 .3.2.6.7.5A9.3 9.3 0 0 0 12 2.8z"/></svg>`;
      case "linkedin": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" fill="currentColor"><path fill-rule="evenodd" d="M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5zm.2 6.6v7h2.2v-7zm1.1-3.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm2.6 3.4v7h2.2v-3.7c0-1 .4-1.6 1.2-1.6s1.1.6 1.1 1.6v3.7h2.2v-4.3c0-2-1-2.9-2.5-2.9-.9 0-1.6.4-2 1v-.8z"/></svg>`;
      case "ig": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.1" cy="6.9" r=".6" fill="currentColor"/></svg>`;
      case "globe": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z"/></svg>`;
      case "mail": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/></svg>`;
      case "phone": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
      case "pin": return `<svg viewBox="0 0 24 24" class="tpf-ico" aria-hidden="true" ${P}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
      default: return '';
    }
  }

  function getSealSvg() {
    let d = "";
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? 8.6 : 10;
      d += (i ? "L" : "M") + (12 + Math.cos(a) * r).toFixed(2) + " " + (12 + Math.sin(a) * r).toFixed(2);
    }
    return `
      <svg viewBox="0 0 24 24" class="tpf-seal" aria-hidden="true">
        <path d="${d}Z" fill="currentColor" stroke-linejoin="round" stroke="currentColor" stroke-width="2.2" />
        <path d="m8.3 12.2 2.5 2.5 5-5.2" fill="none" stroke="var(--tpf-sheet)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  function getPinSvg(base, id) {
    const hi = mixHex(base, "#ffffff", 0.62);
    const mid = base;
    const lo = mixHex(base, "#000000", 0.42);
    const deep = mixHex(base, "#000000", 0.66);
    return `
      <svg viewBox="0 0 100 200" class="tpf-pin-svg" aria-hidden="true">
        <defs>
          <linearGradient id="${id}s" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="${lo}" />
            <stop offset=".24" stop-color="${mid}" />
            <stop offset=".4" stop-color="${hi}" />
            <stop offset=".58" stop-color="${mid}" />
            <stop offset="1" stop-color="${deep}" />
          </linearGradient>
          <radialGradient id="${id}t" cx=".38" cy=".3" r=".8">
            <stop offset="0" stop-color="${hi}" />
            <stop offset=".55" stop-color="${mid}" />
            <stop offset="1" stop-color="${lo}" />
          </radialGradient>
          <linearGradient id="${id}n" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="#5b616b" />
            <stop offset=".4" stop-color="#f4f5f7" />
            <stop offset=".7" stop-color="#a3a9b2" />
            <stop offset="1" stop-color="#4a4f57" />
          </linearGradient>
          <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <path d="M48.3 112h3.4l-.7 76-1 4-1-4z" fill="url(#${id}n)" />
        <ellipse cx="50" cy="191.5" rx="3.2" ry="1.1" fill="#0b1a33" opacity=".35" />
        <path d="M28 103v6.5a22 7 0 0 0 44 0V103z" fill="url(#${id}s)" />
        <ellipse cx="50" cy="103" rx="22" ry="7" fill="url(#${id}t)" />
        <path d="M41.5 38c1.6 16 4.6 26 3 36-1.8 10-13 19-14.6 29h40.2c-1.6-10-12.8-19-14.6-29-1.6-10 1.4-20 3-36z" fill="url(#${id}s)" />
        <path d="M16 22v14a34 13 0 0 0 68 0V22z" fill="url(#${id}s)" />
        <ellipse cx="50" cy="22" rx="34" ry="13" fill="url(#${id}t)" />
        <ellipse cx="50" cy="22" rx="33" ry="12.3" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".8" />
        <ellipse cx="37" cy="17.5" rx="12" ry="4" fill="#fff" opacity=".7" filter="url(#${id}b)" />
        <path d="M22 38c4 4.5 9.5 6.4 15 7" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round" filter="url(#${id}b)" />
        <path d="M45 50c.8 8 1.6 14 .8 22" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" fill="none" stroke-linecap="round" />
      </svg>
    `;
  }

  // CSS Stylesheet
  const CSS = `
    .tpf {
      position: relative;
      overflow: hidden;
      container-type: size;
      min-height: 680px;
      height: clamp(680px, 94vh, 880px);
      background: var(--tpf-paper);
      color: var(--tpf-on-sheet);
      font-family: var(--tpf-sans);
      isolation: isolate;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      --ease: cubic-bezier(.22,1,.36,1);
      --fs: max(12px, 1.85cqmin);
      width: 100%;
    }
    .tpf *, .tpf *::before, .tpf *::after { box-sizing: border-box; }
    :where(.tpf) a { color: inherit; text-decoration: none; }
    :where(.tpf) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; }
    :where(.tpf) input { font: inherit; color: inherit; background: none; border: 0; margin: 0; outline: none; }
    :where(.tpf) :focus-visible { outline: 1.5px solid currentColor; outline-offset: 4px; border-radius: 4px; }
    .tpf .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .tpf-stage { position: absolute; left: 0; top: 0; max-width: none; display: block; pointer-events: none; z-index: 0; width: 100%; height: 100%; }
    .tpf.is-hit .tpf-sheet-g { animation: tpf-hit .32s cubic-bezier(.3,.7,.4,1); }
    .tpf-sheet { fill: var(--tpf-sheet); }
    .tpf-paper { fill: var(--tpf-paper); }
    .tpf-rim { fill: var(--tpf-rim); }
    .tpf-ico { width: 1.35em; height: 1.35em; display: block; max-width: none; flex: none; }
    .tpf-seal { width: 100%; height: 100%; display: block; max-width: none; }
    .tpf-z { position: absolute; z-index: 2; }
    .tpf-ink { color: var(--tpf-on-paper); }
    
    /* Assembly animations */
    .tpf-h { transition: opacity .7s var(--ease), translate .8s var(--ease), filter .7s var(--ease); transition-delay: calc(var(--i,0)*45ms); }
    .tpf:not(.s1) .tpf-h { opacity: 0; translate: 0 10px; filter: blur(6px); }
    .tpf-p { transition: opacity .8s var(--ease), translate .9s var(--ease), filter .8s var(--ease); transition-delay: calc(480ms + var(--i,0)*70ms); }
    .tpf:not(.s3) .tpf-p { opacity: 0; translate: 0 18px; filter: blur(8px); transition-delay: 0s; }
    
    /* Top Bar */
    .tpf-top { left: 0; right: 0; top: 10.5%; transform: translateY(-50%); display: flex; align-items: center; justify-content: space-between; padding: 0 11%; font-size: max(14px, 2.5cqmin); }
    .tpf-row { display: flex; align-items: center; gap: .55em; }
    .tpf-ib { display: grid; place-items: center; width: 2.1em; height: 2.1em; border-radius: 50%; transition: transform .35s var(--ease), background-color .25s; border: 1px solid rgba(255,255,255,0.12); }
    .tpf-ib:hover { transform: translateY(-2px); background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }
    .tpf-ib:active { transform: scale(.9); }
    .tpf-up .tpf-ico { transform: rotate(90deg); }
    
    .tpf-logo { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); display: flex; align-items: center; gap: 0.5em; }
    .tpf-logo-img { height: 2em; width: auto; object-fit: contain; }
    .tpf-logo-text { font-size: 1.15em; font-weight: 800; letter-spacing: 0.08em; color: #fff; }
    .tpf-logo-text span { color: var(--color-primary-accent, #2dd4bf); text-shadow: 0 0 12px rgba(45, 212, 191, 0.4); }
    
    .tpf-mail { display: flex; align-items: center; gap: .6em; font-size: var(--fs); letter-spacing: .01em; padding: .35em .5em; border-radius: 99px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); transition: all .35s var(--ease); }
    .tpf-mail:hover { transform: translateY(-2px); background: rgba(255,255,255,0.14); border-color: rgba(45, 212, 191, 0.4); }
    .tpf-mail span { font-mono; }
    .tpf-mail .tpf-ico { width: 1.25em; height: 1.25em; color: var(--tpf-on-paper); }
    .tpf-toast { position: absolute; top: calc(100% + .5em); right: 0; font-size: max(11px, 1.6cqmin); letter-spacing: .04em; white-space: nowrap; padding: .35em .8em; border-radius: 99px; background: var(--tpf-on-paper); color: #070e17; font-weight: 600; opacity: 0; transform: translateY(-4px); transition: opacity .25s, transform .35s var(--ease); pointer-events: none; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
    .tpf-toast.on { opacity: 1; transform: none; }
    
    /* Newsletter */
    .tpf-news { left: 50%; top: 15.5%; width: max-content; transform: translateX(-50%); display: grid; justify-items: center; gap: max(8px, 1.4cqmin); font-size: var(--fs); }
    .tpf-pill { position: relative; display: flex; align-items: center; width: max(280px, 42cqmin); height: max(42px, 5.8cqmin); padding: 0 .35em 0 1.2em; border-radius: 99px; background: rgba(255,255,255,0.96); color: #070e17; transition: box-shadow .3s var(--ease); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .tpf-pill:focus-within { box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.5); }
    .tpf-pill input { flex: 1; min-width: 0; height: 100%; font-size: max(13px, 2cqmin); color: #070e17; font-weight: 500; }
    .tpf-pill input::placeholder { color: #526071; opacity: .8; }
    .tpf-knob { display: grid; place-items: center; flex: none; height: calc(100% - .6em); aspect-ratio: 1; border-radius: 50%; background: #0b3a4b; color: #fff; box-shadow: inset 0 0 0 .18em rgba(45, 212, 191, 0.4); transition: transform .45s cubic-bezier(.5,1.7,.4,1); }
    .tpf-knob:hover { transform: translateX(2px) scale(1.08); background: #006466; color: #2dd4bf; }
    .tpf-knob .tpf-ico { width: 52%; height: 52%; }
    .tpf-pill[data-sent=true] input { opacity: 0; }
    .tpf-sent { position: absolute; left: 1.2em; right: 3em; top: 0; bottom: 0; display: flex; align-items: center; gap: .4em; font-size: max(13px, 2cqmin); font-weight: 600; color: #047857; pointer-events: none; opacity: 0; transition: opacity .4s; }
    .tpf-pill[data-sent=true] .tpf-sent { opacity: 1; }
    
    .tpf-flank { top: 22.8%; transform: translate(-50%, -50%); font-size: var(--fs); letter-spacing: .04em; white-space: nowrap; font-weight: 600; opacity: .85; }
    .tpf-clock { font-variant-numeric: tabular-nums; }
    .tpf-clock i { font-style: normal; animation: tpf-blink 2s steps(1) infinite; color: var(--tpf-on-paper); }
    
    .tpf-status { left: 50%; top: 30.5%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: .6em; font-size: max(13px, 2.1cqmin); white-space: nowrap; letter-spacing: .02em; background: rgba(0,0,0,0.25); padding: .35em .9em; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); }
    .tpf-live { position: relative; width: .55em; height: .55em; border-radius: 50%; background: #10b981; }
    .tpf-live::after { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid #10b981; animation: tpf-ping 2.2s var(--ease) infinite; }
    .tpf a.tpf-status:hover span { text-decoration: underline; text-underline-offset: .2em; color: var(--tpf-on-paper); }
    .tpf-badge { left: 50%; top: 35.2%; transform: translate(-50%, -50%); width: max(16px, 2.4cqmin); height: max(16px, 2.4cqmin); color: var(--tpf-on-paper); }
    
    /* Columns */
    .tpf-col { top: 27.5%; display: grid; gap: max(5px, .9cqmin); font-size: var(--fs); }
    .tpf-col.l { left: 13%; justify-items: start; }
    .tpf-col.r { right: 13%; justify-items: end; text-align: right; }
    .tpf-col h3 { all: unset; display: flex; align-items: center; gap: .7em; margin-bottom: max(5px, .7cqmin); opacity: .85; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--tpf-on-paper); }
    .tpf-col.r h3 { flex-direction: row-reverse; }
    .tpf-col h3 .tpf-ico { width: 1.1em; height: 1.1em; color: var(--tpf-on-paper); }
    .tpf-col ul { all: unset; display: grid; gap: max(4px, .7cqmin); justify-items: inherit; }
    .tpf-col li { list-style: none; }
    .tpf-col li a { display: inline-block; transition: transform .35s var(--ease), opacity .25s, color .2s; opacity: .88; font-weight: 500; }
    .tpf-col li a:hover { opacity: 1; color: var(--tpf-on-paper); }
    .tpf-col.l li a:hover { transform: translateX(4px); }
    .tpf-col.r li a:hover { transform: translateX(-4px); }
    .tpf-big { margin-top: max(6px, 1cqmin); font-size: max(24px, 4.2cqmin); font-weight: 700; letter-spacing: -.02em; line-height: 1; text-decoration: underline; text-decoration-thickness: max(1.5px, .04em); text-underline-offset: .12em; transition: text-underline-offset .35s var(--ease), color .2s; color: #fff; }
    .tpf .tpf-big:hover { text-underline-offset: .22em; color: var(--tpf-on-paper); }
    
    /* Pushpin */
    .tpf-pin { position: absolute; z-index: 3; left: 50%; top: 64%; width: max(46px, 9cqmin); height: max(92px, 18cqmin); transform: translate(-50%, -100%); cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    .tpf-pin:focus-visible { outline-offset: 6px; }
    .tpf-tilt { position: absolute; inset: 0; transform-origin: 50% 100%; transform: rotate(calc(5deg + var(--tilt, 0deg))); transition: transform .7s var(--ease); }
    .tpf-drop, .tpf-body { position: absolute; inset: 0; transform-origin: 50% 100%; }
    .tpf-body { transition: transform .32s var(--ease); }
    .tpf-pin-svg { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; display: block; overflow: visible; }
    .tpf-shadow { position: absolute; right: 50%; bottom: -.5%; width: 150%; height: 24%; transform-origin: 100% 50%; transform: rotate(16deg); transition: transform .45s var(--ease), opacity .45s; }
    .tpf-shadow::before, .tpf-shadow::after { content: ''; position: absolute; top: 50%; border-radius: 50%; transform: translateY(-50%); }
    .tpf-shadow::before { right: 0; width: 100%; height: 24%; background: linear-gradient(90deg, transparent, rgba(9,22,48,.35) 60%, rgba(9,22,48,.6)); filter: blur(2px); }
    .tpf-shadow::after { left: -6%; width: 60%; height: 100%; background: radial-gradient(closest-side, rgba(9,22,48,.4), transparent); filter: blur(3px); }
    .tpf:not(.s2) .tpf-pin { opacity: 0; pointer-events: none; }
    .tpf.s2 .tpf-drop { animation: tpf-drop .62s cubic-bezier(.5,0,.75,0) both; }
    .tpf.s2 .tpf-shadow { animation: tpf-shade .62s cubic-bezier(.5,0,.75,0) both; }
    .tpf-pin:hover .tpf-body { transform: translateY(-3%); }
    .tpf-pin:hover .tpf-shadow { transform: rotate(16deg) translateX(-5%) scaleX(1.06); }
    .tpf-pin[data-pin=lift] .tpf-body { transform: translateY(-22%) rotate(-10deg); transition-duration: .3s; }
    .tpf-pin[data-pin=lift] .tpf-shadow { transform: rotate(16deg) translateX(-26%) scale(1.25); opacity: .55; }
    .tpf-pin[data-pin=stab] .tpf-body { animation: tpf-stab .42s cubic-bezier(.55,0,.8,.2) both; }
    
    /* Paper Print beneath the rip */
    .tpf-brand { left: 50%; top: 67%; width: max-content; transform: translateX(-50%); display: grid; justify-items: center; text-align: center; }
    .tpf-brand-top { display: flex; align-items: center; justify-content: center; gap: 1em; padding: 0 .2em 0 .5em; }
    .tpf-eye { font-size: max(14px, 2.3cqmin); font-weight: 600; text-transform: uppercase; letter-spacing: .08em; background: linear-gradient(90deg, var(--tpf-on-paper), #ffffff); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .tpf-bub { display: inline-flex; align-items: center; gap: .5em; height: 1.7em; padding: 0 .55em; border-radius: 99px; background: rgba(45, 212, 191, 0.12); border: 1px solid rgba(45, 212, 191, 0.25); font-size: max(11px, 1.6cqmin); overflow: hidden; transition: padding .45s var(--ease); }
    .tpf-dots { display: flex; gap: .22em; }
    .tpf-dots i { width: .38em; height: .38em; border-radius: 50%; background: var(--tpf-on-paper); animation: tpf-dot 1.2s ease-in-out infinite; }
    .tpf-dots i:nth-child(2) { animation-delay: .15s; }
    .tpf-dots i:nth-child(3) { animation-delay: .3s; }
    .tpf-bub b { font-weight: 600; max-width: 0; opacity: 0; white-space: nowrap; transition: max-width .5s var(--ease), opacity .3s; color: var(--tpf-on-paper); }
    .tpf-bub:hover, .tpf-bub:focus-visible { padding: 0 .8em; }
    .tpf-bub:hover b, .tpf-bub:focus-visible b { max-width: 8em; opacity: 1; }
    
    .tpf-word { display: block; overflow: hidden; padding: 0 .04em .14em; font-size: max(38px, min(10.5cqmin, 12.8cqw)); font-weight: 900; letter-spacing: -.03em; line-height: .98; white-space: nowrap; color: var(--tpf-on-paper); text-shadow: 0 0 25px rgba(45, 212, 191, 0.45); text-decoration: none; }
    .tpf-word span { display: block; position: relative; transition: transform 1s var(--ease) .5s; }
    .tpf-word span::after { display: none !important; }
    .tpf:not(.s3) .tpf-word span { transform: translateY(125%); transition-delay: 0s; }
    .tpf-word:hover { text-decoration: none; }
    
    .tpf-side {
      top: 75%;
      display: inline-flex;
      align-items: center;
      gap: .55em;
      font-size: max(12px, 1.75cqmin);
      transform: translateX(-50%);
      font-weight: 500;
      padding: .45em 1em;
      border-radius: 99px;
      background: rgba(45, 212, 191, 0.08);
      border: 1px solid rgba(45, 212, 191, 0.24);
      color: var(--tpf-on-paper);
      transition: all .35s var(--ease);
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      z-index: 5;
    }
    .tpf-side.l { left: 10%; }
    .tpf-side.r { left: 90%; }
    .tpf-side .tpf-ico { width: 1.25em; height: 1.25em; transition: transform .35s var(--ease); color: var(--tpf-on-paper); flex-shrink: 0; }
    .tpf-side:hover {
      background: rgba(45, 212, 191, 0.18);
      border-color: rgba(45, 212, 191, 0.55);
      transform: translateX(-50%) translateY(-2px);
      color: #ffffff;
      box-shadow: 0 6px 20px rgba(45, 212, 191, 0.3);
    }
    .tpf-side:hover .tpf-ico { transform: rotate(-8deg) scale(1.1); color: #2dd4bf; }
    .tpf-side span { transition: color .2s; }
    
    .tpf-foot { left: 0; right: 0; bottom: 4.5%; display: flex; align-items: center; justify-content: space-between; gap: 1.5em; padding: 0 12%; font-size: max(12px, 1.85cqmin); opacity: .85; }
    .tpf-credit { position: absolute; left: 50%; transform: translateX(-50%); font-size: max(10px, 1.4cqmin); letter-spacing: .12em; text-transform: uppercase; font-weight: 700; color: var(--tpf-on-paper); opacity: .9; white-space: nowrap; }
    .tpf-handle { font-weight: 600; color: var(--tpf-on-paper); }
    .tpf-handle:hover { text-decoration: underline; text-underline-offset: .2em; color: #fff; }
    
    @container (max-width: 1080px) {
      .tpf-side.l { left: 8.5%; }
      .tpf-side.r { left: 91.5%; }
    }

    /* Responsive adjustment */
    @container (max-width: 768px) {
      .tpf-side { top: 83%; font-size: max(11px, 1.5cqmin); }
      .tpf-side.l { left: 50% !important; top: 80% !important; }
      .tpf-side.r { left: 50% !important; top: 85.5% !important; }
    }

    @container (max-width: 680px) {
      .tpf { min-height: 780px; height: auto; }
      .tpf-top { padding: 0 6%; top: 8%; }
      .tpf-flank, .tpf-mail span { display: none; }
      .tpf-news { top: 15%; }
      .tpf-pill { width: min(84cqw, 320px); }
      .tpf-status { top: 27%; }
      .tpf-badge { top: 31%; }
      .tpf-col { top: 35%; }
      .tpf-col.l { left: 6%; }
      .tpf-col.r { right: 6%; }
      .tpf-col li:nth-child(n+4) { display: none; }
      .tpf-pin { top: 62%; }
      .tpf-brand { top: 66%; }
      .tpf-side { font-size: max(11px, 1.5cqmin); }
      .tpf-foot { padding: 0 6%; bottom: 3%; }
      .tpf-credit { bottom: 2.2em; }
    }
    
    @keyframes tpf-hit { 0% { transform: translateY(0); } 30% { transform: translateY(2px); } 60% { transform: translateY(-.5px); } 100% { transform: translateY(0); } }
    @keyframes tpf-drop { 0% { transform: translateY(-62cqh) rotate(-28deg) scale(1.5); opacity: 0; } 25% { opacity: 1; } 80% { transform: translateY(0) rotate(3deg) scale(1); } 90% { transform: scale(1.04, .95); } 100% { transform: none; opacity: 1; } }
    @keyframes tpf-shade { 0% { transform: rotate(16deg) translateX(-60%) scale(2.4); opacity: 0; } 80% { transform: rotate(16deg); opacity: 1; } 100% { transform: rotate(16deg); opacity: 1; } }
    @keyframes tpf-stab { 0% { transform: translateY(-22%) rotate(-10deg); } 70% { transform: translateY(1.5%) rotate(1deg); } 100% { transform: none; } }
    @keyframes tpf-dot { 0%, 60%, 100% { transform: translateY(0); opacity: .55; } 30% { transform: translateY(-2.5px); opacity: 1; } }
    @keyframes tpf-blink { 0% { opacity: 1; } 50% { opacity: .2; } }
    @keyframes tpf-ping { 0% { transform: scale(1); opacity: .9; } 80%, 100% { transform: scale(2.6); opacity: 0; } }
    
    @media (prefers-reduced-motion: reduce) {
      .tpf *, .tpf *::before, .tpf *::after { animation: none !important; transition-duration: .01s !important; transition-delay: 0s !important; }
    }
  `;

  // Inject Styles
  if (!document.getElementById('pushpin-footer-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'pushpin-footer-styles';
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  // Initialization Function
  function initPushpinFooter() {
    const footer = document.getElementById('contact');
    if (!footer) return;

    // Detect if we are in a subdirectory (like founder/)
    const isSubdir = window.location.pathname.includes('/founder') ||
      document.querySelector('script[src*="pushpin-footer.js"]')?.getAttribute('src')?.startsWith('..');
    const p = isSubdir ? '../' : '';

    const uid = 'gw_' + Math.random().toString(36).substring(2, 8);
    const seed = 19;

    // Graywolftek Theme Colors
    const sheet = '#0d3446'; // Signature Deep Ocean Blue-Teal poster
    const paper = '#070e17'; // Midnight Abyssal Black-Blue substrate
    const sheetInk = '#ffffff';
    const paperInk = '#2dd4bf'; // Luminous Ocean Teal brand watermark
    const pinBase = '#2dd4bf';
    const flapBase = mixHex(paper, '#ffffff', 0.35);

    footer.className = 'tpf';
    footer.style.setProperty('--tpf-sheet', sheet);
    footer.style.setProperty('--tpf-paper', paper);
    footer.style.setProperty('--tpf-on-sheet', sheetInk);
    footer.style.setProperty('--tpf-on-paper', paperInk);
    footer.style.setProperty('--tpf-rim', mixHex(flapBase, '#ffffff', 0.6));
    footer.style.setProperty('--tpf-sans', 'Inter, system-ui, -apple-system, sans-serif');

    // Build Internal Markup
    footer.innerHTML = `
      <svg class="tpf-stage" aria-hidden="true">
        <defs>
          <radialGradient id="${uid}v" cx=".5" cy=".78" r=".75">
            <stop offset=".45" stop-color="#fff" stop-opacity="0" />
            <stop offset="1" stop-color="#000d1a" stop-opacity=".12" />
          </radialGradient>
          <linearGradient id="${uid}l" x1="0" y1="0" x2=".35" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity=".14" />
            <stop offset=".55" stop-color="#fff" stop-opacity="0" />
            <stop offset="1" stop-color="#001033" stop-opacity=".15" />
          </linearGradient>
          <filter id="${uid}d" x="-5%" y="-5%" width="110%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#020914" flood-opacity=".4" />
          </filter>
          <filter id="${uid}f" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="-2" dy="4" stdDeviation="4" flood-color="#020914" flood-opacity=".35" />
          </filter>
          ${Array.from({ length: FLAPS * 2 }, (_, k) => `
            <linearGradient id="${uid}fg${k}" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="${mixHex(flapBase, "#0b2038", 0.4)}" />
              <stop offset=".5" stop-color="${mixHex(flapBase, "#0b2038", 0.1)}" />
              <stop offset="1" stop-color="#ffffff" />
            </linearGradient>
          `).join('')}
          <path id="${uid}s" />
        </defs>
        <rect class="tpf-paper" width="100%" height="100%" />
        <rect width="100%" height="100%" fill="url(#${uid}v)" style="mix-blend-mode: multiply;" />
        <g class="tpf-sheet-g" filter="url(#${uid}d)">
          <path class="tpf-rim" />
          <use href="#${uid}s" class="tpf-sheet" />
        </g>
        <use href="#${uid}s" fill="url(#${uid}l)" />
        <g filter="url(#${uid}f)">
          ${Array.from({ length: FLAPS * 2 }, (_, k) => `<path class="tpf-flap-${k}" />`).join('')}
        </g>
      </svg>

      <!-- Sheet Top Chrome -->
      <div class="tpf-z tpf-top">
        <div class="tpf-row tpf-h" style="--i: 0;">
          <button type="button" class="tpf-ib tpf-up" id="tpf-back-top" aria-label="Back to top" title="Back to top">
            ${getIconSvg('chevL')}
          </button>
          <span style="width: .6em;"></span>
          <a href="https://www.linkedin.com/company/graywolftek/posts/?feedView=all" target="_blank" rel="noopener noreferrer" class="tpf-ib" aria-label="LinkedIn" title="Graywolftek on LinkedIn">
            ${getIconSvg('linkedin')}
          </a>
          <a href="https://www.instagram.com/graywolftek/" target="_blank" rel="noopener noreferrer" class="tpf-ib" aria-label="Instagram" title="Graywolftek on Instagram">
            ${getIconSvg('ig')}
          </a>
          <a href="mailto:graywolftek@gmail.com" class="tpf-ib" aria-label="Email Graywolftek" title="Email Graywolftek">
            ${getIconSvg('mail')}
          </a>
        </div>

        <a href="${p}index.html" class="tpf-logo tpf-h" aria-label="Graywolftek Home" style="--i: 1;">
          <img src="${p}assets/images/logo.png" alt="Graywolftek Wolf Logo" class="tpf-logo-img" />
          <span class="tpf-logo-text"><span>GRAY</span>WOLFTEK</span>
        </a>

        <div class="tpf-h" style="--i: 2; position: relative;">
          <button type="button" class="tpf-mail" id="tpf-copy-email" aria-label="Copy graywolftek@gmail.com" title="Copy email address">
            <span>graywolftek@gmail.com</span>
            ${getIconSvg('copy')}
          </button>
          <span class="tpf-toast" id="tpf-toast-el" role="status" aria-live="polite">email copied</span>
        </div>
      </div>

      <!-- Newsletter Pill -->
      <form class="tpf-z tpf-news tpf-h" style="--i: 3;" id="tpf-news-form">
        <label for="${uid}e">Stay updated with Graywolftek Tech, AI & R&D insights</label>
        <div class="tpf-pill" id="tpf-pill-el">
          <input id="${uid}e" type="email" placeholder="your@email.com" autocomplete="email" required />
          <span class="tpf-sent" aria-live="polite">
            ${getIconSvg('check')} you're on the list
          </span>
          <button type="submit" class="tpf-knob" aria-label="Subscribe to Graywolftek updates">
            ${getIconSvg('arrow')}
          </button>
        </div>
      </form>

      <!-- Side Flanks -->
      <span class="tpf-z tpf-flank tpf-h" style="--i: 4; left: 21%;">Graywolftek/2026</span>
      <span class="tpf-z tpf-flank tpf-h" style="--i: 4; left: 77%;" title="Local Time · Asia/Kolkata">
        <span class="tpf-clock" id="tpf-clock-el">IST --<i aria-hidden="true">:</i>--</span>
      </span>

      <!-- Availability Status Badge -->
      <a href="mailto:graywolftek@gmail.com" class="tpf-z tpf-status tpf-h" style="--i: 5;" title="Contact us for engineering, datacenter, and staffing requirements">
        <i class="tpf-live" aria-hidden="true"></i>
        <span>Available for Strategic Client Engagements & Squad Deployments</span>
      </a>
      <span class="tpf-z tpf-badge" aria-hidden="true">
        <span class="tpf-h" style="--i: 6; display: block; width: 100%; height: 100%;">
          ${getSealSvg()}
        </span>
      </span>

      <!-- Link Columns -->
      <!-- Left Column: Solutions -->
      <nav class="tpf-z tpf-col tpf-h l" style="--i: 6;" aria-label="Core Solutions">
        <h3>
          solutions
          ${getIconSvg('squiggle')}
        </h3>
        <ul>
          <li><a href="${p}datacenter.html">Data Centre Infrastructure</a></li>
          <li><a href="${p}staffing.html">Staffing Firm & Squads</a></li>
          <li><a href="${p}software.html">Software & App Dev</a></li>
          <li><a href="${p}insights.html">Industry Insights</a></li>
        </ul>
        <a href="mailto:graywolftek@gmail.com" class="tpf-big" title="Start consulting call">consult.</a>
      </nav>

      <!-- Right Column: Ecosystem -->
      <nav class="tpf-z tpf-col tpf-h r" style="--i: 7;" aria-label="Ecosystem & R&D">
        <h3>
          ecosystem
          ${getIconSvg('squiggle')}
        </h3>
        <ul>
          <li><a href="${p}product.html">Shelfly Book Platform</a></li>
          <li><a href="${p}projects.html">Innovation Lab</a></li>
          <li><a href="${p}skitre.html">Skitre AI Partner</a></li>
          <li><a href="${p}founder/index.html">Founder & Leadership</a></li>
          <li><a href="${p}about.html">About Us & Vision</a></li>
        </ul>
        <a href="mailto:graywolftek@gmail.com" class="tpf-big" title="Talk with our engineering team">talk.</a>
      </nav>

      <!-- The 3D Pushpin (Click to re-tear new edge) -->
      <button type="button" class="tpf-pin" id="tpf-pin-btn" data-pin="idle" aria-label="Re-pin: tear a new edge" title="Pull the pin to re-rip poster">
        <span class="tpf-shadow" aria-hidden="true"></span>
        <span class="tpf-tilt" id="tpf-pin-tilt">
          <span class="tpf-drop">
            <span class="tpf-body">
              ${getPinSvg(pinBase, uid + 'p')}
            </span>
          </span>
        </span>
      </button>

      <!-- Printed on Paper Beneath the Tear -->
      <div class="tpf-z tpf-brand tpf-ink">
        <div class="tpf-brand-top tpf-p" style="--i: 0;">
          <span class="tpf-eye">THE ALPHA IN TECHNOLOGY SOLUTIONS</span>
          <a href="mailto:graywolftek@gmail.com" class="tpf-bub" aria-label="Start conversation">
            <span class="tpf-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <b>start conversation</b>
          </a>
        </div>
        <a href="${p}index.html" class="tpf-word" aria-label="Graywolftek">
          <span>GRAYWOLFTEK</span>
        </a>
      </div>

      <!-- Side Links Under Rip (Positioned cleanly below wordmark) -->
      <a href="tel:+917559185780" class="tpf-z tpf-side tpf-ink tpf-p l" style="--i: 1;" title="Call Graywolftek">
        ${getIconSvg('phone')}
        <span>+91-7559185780</span>
      </a>
      <a href="https://maps.google.com/?q=Jalalpur+Ambedkar+Nagar+India" target="_blank" rel="noopener noreferrer" class="tpf-z tpf-side tpf-ink tpf-p r" style="--i: 2;" title="Visit Office in India">
        ${getIconSvg('pin')}
        <span>Ambedkar Nagar, India</span>
      </a>

      <!-- Bottom Foot Bar -->
      <div class="tpf-z tpf-foot tpf-ink">
        <span class="tpf-p" style="--i: 3;">&copy; 2026 Graywolftek. All Rights Reserved.</span>
        <span class="tpf-credit tpf-p" style="--i: 4;">FORGED BY THE PACK</span>
        <a href="https://www.linkedin.com/company/graywolftek/" target="_blank" rel="noopener noreferrer" class="tpf-handle tpf-p" style="--i: 5;">@graywolftek</a>
      </div>
    `;

    // References
    const svgEl = footer.querySelector('.tpf-stage');
    const sheetPath = document.getElementById(uid + 's');
    const rimPath = footer.querySelector('.tpf-rim');
    const pinBtn = document.getElementById('tpf-pin-btn');
    const pinTilt = document.getElementById('tpf-pin-tilt');
    const flapPaths = [];
    const gradEls = [];
    for (let k = 0; k < FLAPS * 2; k++) {
      flapPaths.push(footer.querySelector(`.tpf-flap-${k}`));
      gradEls.push(document.getElementById(`${uid}fg${k}`));
    }

    // Interactive State
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stage = 0;
    let hit = false;
    let visible = false;
    let pinState = 'idle';
    let currentSeed = seed;

    const s = {
      W: 0,
      H: 0,
      tear: makeTear(currentSeed),
      prev: null,
      from: [],
      ys: [],
      mode: 'wait',
      t0: 0,
      dur: 1,
      raf: 0,
      px: -1e4,
      py: -1e4,
      lift: new Array(FLAPS).fill(0),
      busy: false,
    };

    function frame(now) {
      s.raf = 0;
      const { W, H, tear } = s;
      if (!W || !H) return;
      let busy = false;
      let ys;
      const open = new Array(FLAPS).fill(1);
      const openOld = new Array(FLAPS).fill(0);

      if (s.mode === 'wait') {
        ys = tear.ys.map(() => START);
        open.fill(0);
      } else if (s.mode === 'intro') {
        const progress = (now - s.t0) / s.dur;
        ys = introYs(tear, Math.min(1, progress));
        tear.flaps.forEach((f, k) => (open[k] = flapOpen(tear, f, Math.min(1, progress))));
        if (progress >= 1) s.mode = 'rest';
        else busy = true;
      } else if (s.mode === 'morph') {
        const progress = (now - s.t0) / s.dur;
        ys = morphYs(s.from, tear, Math.min(1, progress));
        open.fill(easeTear((progress - 0.5) / 0.5));
        openOld.fill(1 - easeInOut(progress / 0.35));
        if (progress >= 1) s.mode = 'rest';
        else busy = true;
      } else {
        ys = tear.ys;
      }
      s.ys = ys;

      // Flaps lift towards pointer
      tear.flaps.forEach((f, k) => {
        const b = Math.min(ys.length - 1, f.at + f.span);
        const mx = ((XS[f.at] + XS[b]) / 2) * W;
        const my = ((ys[f.at] + ys[b]) / 2) * H;
        const target = still ? 0 : clamp01(1 - Math.hypot(s.px - mx, s.py - my) / (0.2 * Math.max(W, 520)));
        s.lift[k] += (target - s.lift[k]) * 0.14;
        if (Math.abs(target - s.lift[k]) > 0.003) busy = true;
        open[k] *= 1 + 0.32 * s.lift[k];
      });

      sheetPath?.setAttribute('d', sheetD(ys, W, H, tear.rim));
      rimPath?.setAttribute('d', sheetD(ys, W, H));

      const drawFlap = (k, f, o) => {
        const el = flapPaths[k];
        const g = gradEls[k];
        if (!el || !g) return;
        if (!f || o < 0.01) return el.setAttribute('d', '');
        const pts = flapPoly(ys, f, W, H, o);
        el.setAttribute('d', polyD(pts));
        const b = Math.min(ys.length - 1, f.at + f.span);
        const tip = pts[f.span + 3];
        if (tip) {
          g.setAttribute('x1', String(((XS[f.at] + XS[b]) / 2) * W));
          g.setAttribute('y1', String(((ys[f.at] + ys[b]) / 2) * H));
          g.setAttribute('x2', String(tip[0]));
          g.setAttribute('y2', String(tip[1]));
        }
      };

      for (let k = 0; k < FLAPS; k++) {
        drawFlap(k, tear.flaps[k], open[k]);
        drawFlap(FLAPS + k, s.prev?.flaps[k], openOld[k]);
      }

      if (busy) s.raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!s.raf) s.raf = requestAnimationFrame(frame);
    }

    // Size Handling with ResizeObserver
    const ro = new ResizeObserver(() => {
      s.W = footer.clientWidth;
      s.H = footer.clientHeight;
      if (svgEl) {
        svgEl.setAttribute('width', String(s.W));
        svgEl.setAttribute('height', String(s.H));
        svgEl.setAttribute('viewBox', `0 0 ${s.W} ${s.H}`);
      }
      kick();
    });
    ro.observe(footer);

    // Visibility with IntersectionObserver
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        startAssembly();
      }
    }, { threshold: 0.15 });
    io.observe(footer);

    function startAssembly() {
      if (still) {
        footer.classList.add('s1', 's2', 's3');
        s.mode = 'rest';
        kick();
        return;
      }
      stage = 1;
      footer.classList.add('s1');
      setTimeout(() => {
        stage = 2;
        footer.classList.add('s2');
      }, 640);
      setTimeout(() => {
        hit = true;
        stage = 3;
        footer.classList.add('s3', 'is-hit');
        s.mode = 'intro';
        s.t0 = performance.now();
        s.dur = 1550;
        kick();
      }, 1140);
      setTimeout(() => {
        footer.classList.remove('is-hit');
      }, 1480);
    }

    // Interactive Pointer Move (Tilt & Flap Lift)
    footer.addEventListener('pointermove', (e) => {
      if (still) return;
      const r = footer.getBoundingClientRect();
      s.px = e.clientX - r.left;
      s.py = e.clientY - r.top;
      const tilt = Math.max(-9, Math.min(9, (s.px / r.width - 0.5) * 18));
      pinTilt?.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
      kick();
    });

    footer.addEventListener('pointerleave', () => {
      s.px = -1e4;
      s.py = -1e4;
      pinTilt?.style.setProperty('--tilt', '0deg');
      kick();
    });

    // Re-pin Click (Rip a new edge)
    pinBtn?.addEventListener('click', () => {
      if (s.busy || stage < 3) return;
      currentSeed++;
      const nextTear = makeTear(currentSeed);

      if (still) {
        s.prev = null;
        s.tear = nextTear;
        s.mode = 'rest';
        kick();
        return;
      }

      s.busy = true;
      pinBtn.setAttribute('data-pin', 'lift');

      setTimeout(() => {
        s.seed = currentSeed;
        s.prev = s.tear;
        s.from = s.ys.length ? s.ys : s.tear.ys;
        s.tear = nextTear;
        s.mode = 'morph';
        s.t0 = performance.now();
        s.dur = 1150;
        kick();
      }, 300);

      setTimeout(() => {
        pinBtn.setAttribute('data-pin', 'stab');
      }, 1280);

      setTimeout(() => {
        pinBtn.setAttribute('data-pin', 'idle');
        s.busy = false;
      }, 1720);
    });

    // Back to Top Button
    document.getElementById('tpf-back-top')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
    });

    // Copy Email to Clipboard
    const copyBtn = document.getElementById('tpf-copy-email');
    const toastEl = document.getElementById('tpf-toast-el');
    copyBtn?.addEventListener('click', () => {
      const email = 'graywolftek@gmail.com';
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(email).then(() => {
          showToast('email copied');
        }).catch(() => {
          showToast(email);
        });
      } else {
        showToast(email);
      }
    });

    function showToast(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('on');
      setTimeout(() => {
        toastEl.classList.remove('on');
      }, 1800);
    }

    // Newsletter Submission
    const newsForm = document.getElementById('tpf-news-form');
    const pillEl = document.getElementById('tpf-pill-el');
    newsForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = pillEl.querySelector('input');
      const val = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        showToast('check that email');
        return;
      }
      pillEl.setAttribute('data-sent', 'true');
      input.disabled = true;
    });

    // Live India Clock (Asia/Kolkata IST)
    const clockEl = document.getElementById('tpf-clock-el');
    function updateClock() {
      if (!clockEl) return;
      try {
        const formatter = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
          timeZone: 'Asia/Kolkata',
        });
        const parts = formatter.format(new Date()).split(':');
        clockEl.innerHTML = `IST ${parts[0]}<i aria-hidden="true">:</i>${parts[1]}`;
      } catch (err) {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        clockEl.innerHTML = `IST ${h}<i aria-hidden="true">:</i>${m}`;
      }
    }
    updateClock();
    setInterval(updateClock, 10000);
  }

  // Execute upon DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPushpinFooter);
  } else {
    initPushpinFooter();
  }
})();

