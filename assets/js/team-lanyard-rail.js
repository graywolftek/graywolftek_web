/**
 * Graywolftek - Team Lanyard Rail Component
 * Interactive physical lanyard badge rail featuring realistic cloth ribbon sway,
 * retractable badge reel cord spring physics, 3D badge flipping, procedural QR/barcodes,
 * and agile squad member profiles.
 */
(function () {
  'use strict';

  // Constants & Physics Parameters
  const RATIO = 96 / 62;
  const MAX_W = 124;
  const MIN_RAIL_W = 100;
  const EM = 11.2;
  const RAIL_PITCH_MIN = 1.16;
  const RAIL_PITCH_MAX = 1.62;
  const CAROUSEL_PITCH = 1.2;
  const GAP = 0.07;
  const PERSPECTIVE = 900;
  const MAX_STRETCH = 64;
  const FIRST_DELAY = 1200;
  const FLIP_DELAY = 800;
  const SWING_K = 28;
  const SWING_DAMP = 2.2;
  const LAG = 0.12;
  const REEL_K = 220;
  const REEL_ZETA = 0.5;
  const REST_Y = [9, -10, 7, -8, 10, -7, 8, -9];
  const REST_Z = [-1.6, 1.2, -2, 1.5, -1, 1.8, -1.3, 2];
  const DROPS = [6, 20, 0, 13, 22, 4, 16, 9];
  const TONES = ["text-chart-1", "text-chart-2", "text-chart-3", "text-chart-4", "text-chart-5"];

  const DEFAULT_LABELS = {
    flip: "Click or press Enter to flip badge",
    back: "Click LinkedIn to open profile, or click again to turn back",
    show: "Show"
  };

  const METAL = "linear-gradient(to right, #1e293b, #cbd5e1 38%, #64748b 70%, #0f172a)";
  const PLASTIC = "linear-gradient(180deg, rgba(148, 163, 184, 0.45), rgba(11, 34, 45, 0.95))";

  // Graywolftek Wolfpack Team Roster
  const GRAYWOLFTEK_TEAM = [
    {
      id: "vishal",
      name: "Vishal Maurya",
      role: "Founder & CEO",
      tone: 1, // Teal
      image: "assets/team/vishal.png",
      linkedin: "https://www.linkedin.com/in/vishal-maurya-aba607243/",
      drop: 8
    },
    {
      id: "akshay",
      name: "Akshay Nandanwar",
      role: "Senior DevOps Consultant",
      tone: 2, // Sky
      image: "assets/team/akshay.JPG",
      linkedin: "https://www.linkedin.com/in/akshay-nandanwar-29ba8255/",
      drop: 20
    },
    {
      id: "anudeep",
      name: "Anudeep Kankipati",
      role: "Data Center Expert",
      tone: 3, // Violet
      image: "assets/team/anudeep.JPG",
      linkedin: "https://www.linkedin.com/in/anudeep29ak/",
      drop: 0
    },
    {
      id: "utkarsh",
      name: "Utkarsh Maurya",
      role: "Full-Stack Developer",
      tone: 4, // Pink
      image: "assets/team/utkarsh.png",
      linkedin: "https://linkedin.com/in/utkarsh-maurya-822a3832a",
      drop: 14
    },
    {
      id: "aakash",
      name: "Aakash Maurya",
      role: "Junior Marketing Executive",
      tone: 5, // Amber
      image: "assets/team/Aakash Maurya.jpg",
      linkedin: "https://www.linkedin.com/in/aakash-maurya-36a544278/",
      drop: 22
    },
    {
      id: "aryan",
      name: "Aryan Maurya",
      role: "Software Developer",
      tone: 1, // Teal
      image: "assets/team/Aryan Maurya.jpg",
      linkedin: "https://www.linkedin.com/in/aryan-maurya-0b68a732a/",
      drop: 4
    },
    {
      id: "shreyansh",
      name: "Shreyansh Yadav",
      role: "Software Developer",
      tone: 2, // Sky
      image: "assets/team/Shreyansh Yadav.jpg",
      linkedin: "https://www.linkedin.com/in/shreyansh-yadav-a9b72b384/",
      drop: 16
    }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function random(seed) {
    let a = seed || 1;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function qrPath(seed) {
    const size = 21;
    const next = random(seed);
    const corners = [[0, 0], [size - 7, 0], [0, size - 7]];
    let d = "";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const corner = corners.find(([cx = 0, cy = 0]) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7);
        const quiet = (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
        let on;
        if (corner) on = Math.max(Math.abs(x - (corner[0] ?? 0) - 3), Math.abs(y - (corner[1] ?? 0) - 3)) !== 2;
        else if (quiet) on = false;
        else if (x === 6 || y === 6) on = (x + y) % 2 === 0;
        else on = next() > 0.52;
        if (on) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return d;
  }

  function barcode(seed) {
    const next = random(seed ^ 0x9e3779b9);
    let x = 0;
    let d = "";
    while (x < 92) {
      const w = 1 + Math.floor(next() * 3);
      d += `M${x} 0h${w}v20h-${w}z`;
      x += w + 1 + Math.floor(next() * 2.2);
    }
    return { d, width: x };
  }

  function soft(distance, max) {
    const knee = max * 0.75;
    if (distance <= knee) return distance;
    return knee + (max - knee) * (1 - Math.exp(-(distance - knee) / (max - knee)));
  }

  function geometry(W, items) {
    const u = W / MAX_W;
    const H = W * RATIO;
    const railR = Math.max(3, 4.2 * u);
    const railY = 14 + railR;
    const ring = 9 * u;
    const pivotY = railY + ring * 0.8;
    const strapW = Math.max(8, 11 * u);
    const crimp = 6 * u;
    const reel = 21 * u;
    const cordRest = 12 * u;
    const clipH = 13 * u;
    const clipW = 30 * u;
    const base = 56 * u;
    const straps = items.map((item, i) => base + Math.max(0, item.drop ?? DROPS[i % DROPS.length] ?? 0) * u);
    const reelTops = straps.map((len) => pivotY + len + crimp * 0.6);
    const clipTops = reelTops.map((top) => top + reel * 0.82 + cordRest);
    const cardTops = clipTops.map((top) => top + clipH * 0.62);
    const pendulum = cardTops.map((top) => top + H / 2 - pivotY);
    const restLength = pivotY + base + crimp * 0.6 + reel * 0.82 + cordRest + clipH * 0.62 + H / 2 - pivotY;
    const bottom = Math.max(0, ...cardTops.map((top) => top + H));
    return {
      W, H, u, railR, railY, ring, pivotY, strapW, crimp, reel, cordRest, clipH, clipW, straps, reelTops, clipTops, cardTops, pendulum,
      swingK: pendulum.map((len) => (SWING_K * restLength) / len),
      couple: pendulum.map((len) => (0.25 * 57.3) / len),
      maxStretch: Math.round(MAX_STRETCH * Math.min(1, W / 118)),
      height: Math.ceil(bottom + 16 * u + 8),
    };
  }

  function layoutTargets(width, W, carousel, center, count) {
    if (!carousel) {
      const pitch = clamp((width - 40 - W * 0.6) / Math.max(1, count), W * RAIL_PITCH_MIN, W * RAIL_PITCH_MAX);
      const start = width / 2 - (pitch * (count - 1)) / 2;
      return { xs: Array.from({ length: count }, (_, i) => start + i * pitch), total: 0 };
    }
    const pitch = W * CAROUSEL_PITCH;
    const total = pitch * count;
    const cyclic = count > 2 && total >= width + W * 2;
    const c = center ?? 0;
    const xs = Array.from({ length: count }, (_, i) => {
      let k = i - c;
      if (cyclic) {
        k = ((k % count) + count) % count;
        if (k >= count / 2) k -= count;
      }
      return width / 2 + k * pitch;
    });
    return { xs, total: cyclic ? total : 0 };
  }

  function spring(value, velocity, target, i, k, zeta, h) {
    const v = velocity[i] ?? 0;
    const x = value[i] ?? 0;
    const next = v + (-k * (x - target) - 2 * zeta * Math.sqrt(k) * v) * h;
    velocity[i] = next;
    value[i] = x + next * h;
  }

  function badgeWidth(s, W, i) {
    return W * (1 + 0.08 * (s.pop[i] ?? 0));
  }

  function minGap(s, W, a, b) {
    return (badgeWidth(s, W, a) + badgeWidth(s, W, b)) / 2 + W * GAP;
  }

  function stops(s, W, width, count) {
    return [W * 0.32 + badgeWidth(s, W, 0) / 2, width - W * 0.32 - badgeWidth(s, W, count - 1) / 2];
  }

  function cardEdge(s, g, i, side) {
    const theta = ((s.sw[i] ?? 0) * Math.PI) / 180;
    const psi = (((s.beta[i] ?? 0) + (s.rz[i] ?? 0)) * Math.PI) / 180;
    const scale = 1 + 0.08 * (s.pop[i] ?? 0);
    const clipDepth = (g.clipTops[i] ?? 0) + (s.st[i] ?? 0) - 4 * (s.lift[i] ?? 0) - g.pivotY;
    const offset = (g.cardTops[i] ?? 0) - (g.clipTops[i] ?? 0);
    const cx = (s.x[i] ?? 0) - clipDepth * Math.sin(theta);
    const half = (g.W / 2) * scale * Math.cos(psi) * side;
    return [
      cx + half - offset * scale * Math.sin(psi),
      cx + half - (offset + g.H) * scale * Math.sin(psi),
      clipDepth + offset * scale,
      clipDepth + (offset + g.H) * scale,
    ];
  }

  function LinkIconSvg(label) {
    if (/mail|@/i.test(label)) {
      return `<svg aria-hidden="true" viewBox="0 0 16 16" class="w-[1.05em] h-[1.05em] shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
        <rect x="2" y="3.5" width="12" height="9" rx="1.6"></rect>
        <path d="M2.6 4.6 8 8.9l5.4-4.3"></path>
      </svg>`;
    }
    return `<svg aria-hidden="true" viewBox="0 0 16 16" class="w-[1.05em] h-[1.05em] shrink-0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 11 11 5M6.2 5H11v4.8"></path>
    </svg>`;
  }

  // Lanyard Rail Engine Class
  class TeamLanyardRail {
    constructor(container, options = {}) {
      this.container = container;
      this.items = options.items || GRAYWOLFTEK_TEAM;
      this.count = this.items.length;
      this.eyebrow = options.eyebrow || "Meet the Pack · Seven Specialists";
      this.heading = options.heading || "Specialized Wolfpack Badges — Flip, Pull & Connect";
      this.caption = options.caption || "Hover along the rail, pull a badge down to test the reel cord, or click to flip.";
      this.labels = Object.assign({}, DEFAULT_LABELS, options.labels);
      this.autoplay = options.autoplay !== undefined ? options.autoplay : true;
      this.interval = options.interval || 2800;

      this.active = null;
      this.flipped = null;
      this.focusIndex = 0;
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.playing = this.autoplay;
      this.carouselIndex = 0;
      this.cyclic = false;
      this.pendingOpen = -1;

      this.pointer = {
        id: -1,
        index: -1,
        x: 0,
        y: 0,
        mode: "",
        kind: "",
        lastX: 0,
        lastY: 0,
        lastT: 0,
        v: 0,
        swipe: 0,
        hoverX: 0,
        hoverT: 0,
        hoverHit: -1
      };

      this.sim = {
        x: [], vx: [], px: [], tx: [],
        sw: [], vsw: [], beta: [],
        ry: [], vry: [], tr: [],
        rz: [], vrz: [], tz: [],
        lift: [], vlift: [], tl: [],
        pop: [], vpop: [], tp: [],
        st: [], vst: [],
        drag: -1, grab: 0, pull: -1, free: 0, last: 0, raf: 0, carousel: null
      };

      this.size = { width: 0, W: MAX_W, carousel: false };
      this.geo = geometry(MAX_W, this.items);
      this.slots = [];
      this.swings = [];
      this.straps = [];
      this.cords = [];
      this.hangs = [];
      this.buttons = [];
      this.flips = [];
      this.shadows = [];
      this.linkLayers = [];

      this.initDom();
      this.bindEvents();
    }

    initDom() {
      this.container.setAttribute("data-slot", "team-lanyard-rail");
      this.container.setAttribute("data-mode", "rail");
      this.container.className = "relative isolate w-full overflow-hidden bg-background text-foreground my-8 py-6 rounded-3xl border border-teal-500/20 shadow-2xl";

      this.container.innerHTML = `
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10" style="background: radial-gradient(closest-side at 50% 46%, rgba(20, 184, 166, 0.08), transparent);"></div>
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10" style="background: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1.3px) 0 0 / 18px 18px; mask-image: radial-gradient(closest-side at 50% 50%, black 55%, transparent); -webkit-mask-image: radial-gradient(closest-side at 50% 50%, black 55%, transparent);"></div>
        
        <header class="relative z-10 flex flex-col items-center gap-2 px-6 pt-2 text-center">
          <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-400">${this.eyebrow}</p>
          <h2 class="text-balance text-2xl font-bold tracking-tight md:text-3xl text-white text-glow">${this.heading}</h2>
        </header>

        <div data-stage role="group" aria-label="Graywolftek Team Badges" class="relative mt-4 w-full touch-pan-y select-none" style="height: 380px; overflow-x: clip;">
          <div aria-hidden="true" data-rail class="pointer-events-none absolute inset-x-0 z-0">
            <div class="absolute inset-x-0 h-3 rounded-full bg-teal-400/10 blur-[5px]" style="top: 14px;"></div>
            <div class="absolute inset-0 rounded-full" style="background: linear-gradient(to bottom, #94a3b8 0%, #ffffff 20%, #64748b 40%, #475569 64%, #0f172a 100%); box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);"></div>
            <div class="absolute inset-0 rounded-full opacity-40 mix-blend-overlay" style="background: repeating-linear-gradient(90deg, transparent 0 2px, rgba(255, 255, 255, 0.4) 2px 3px, transparent 3px 7px);"></div>
            <div data-rail-bracket="left" class="absolute top-1/2 h-7 w-4 -translate-y-1/2 rounded-[3px]" style="left: 6px; background: linear-gradient(to right, #94a3b8, #475569, #0f172a); box-shadow: 0 3px 6px rgba(0,0,0,0.4);">
              <span class="absolute left-1/2 top-1 size-1 -translate-x-1/2 rounded-full bg-white/40"></span>
              <span class="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-white/40"></span>
            </div>
            <div data-rail-bracket="right" class="absolute top-1/2 h-7 w-4 -translate-y-1/2 rounded-[3px]" style="right: 6px; background: linear-gradient(to right, #94a3b8, #475569, #0f172a); box-shadow: 0 3px 6px rgba(0,0,0,0.4);">
              <span class="absolute left-1/2 top-1 size-1 -translate-x-1/2 rounded-full bg-white/40"></span>
              <span class="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-white/40"></span>
            </div>
          </div>
          <div data-badges-container></div>
          <div data-carousel-vignette-left aria-hidden="true" class="hidden pointer-events-none absolute inset-y-0 left-0 z-50 w-12 bg-gradient-to-r from-background from-25% to-transparent"></div>
          <div data-carousel-vignette-right aria-hidden="true" class="hidden pointer-events-none absolute inset-y-0 right-0 z-50 w-12 bg-gradient-to-l from-background from-25% to-transparent"></div>
        </div>

        <div data-carousel-dots class="hidden relative z-10 mt-1 flex justify-center gap-1.5" role="group" aria-label="Show badge"></div>

        <div class="relative z-10 flex flex-col items-center gap-3 px-6 pb-4 pt-3 text-center">
          <div data-caption aria-live="polite" class="min-h-[2.6rem]">
            <p data-caption-line1 class="text-sm font-semibold text-white">${this.caption}</p>
            <p data-caption-line2 class="mt-0.5 text-[13px] text-gray-400">${this.labels.flip}</p>
          </div>
          <a href="#contact" class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-md outline-none transition-transform hover:-translate-y-0.5 hover:shadow-teal-500/25">
            <span aria-hidden="true" class="size-2 rounded-full bg-white animate-pulse"></span>
            Connect With Our Team
          </a>
        </div>
      `;

      this.stage = this.container.querySelector("[data-stage]");
      this.rail = this.container.querySelector("[data-rail]");
      this.badgesContainer = this.container.querySelector("[data-badges-container]");
      this.captionLine1 = this.container.querySelector("[data-caption-line1]");
      this.captionLine2 = this.container.querySelector("[data-caption-line2]");
      this.dotsContainer = this.container.querySelector("[data-carousel-dots]");
      this.vignetteLeft = this.container.querySelector("[data-carousel-vignette-left]");
      this.vignetteRight = this.container.querySelector("[data-carousel-vignette-right]");

      this.renderBadges();
      this.renderDots();
    }

    renderDots() {
      this.dotsContainer.innerHTML = this.items.map((item, i) => `
        <button type="button" data-dot="${i}" aria-label="Show ${item.name}" class="h-1.5 rounded-full outline-none transition-[width,background-color] duration-300 w-1.5 bg-white/25 hover:bg-white/45"></button>
      `).join("");

      this.dots = Array.from(this.dotsContainer.querySelectorAll("[data-dot]"));
      this.dots.forEach((dot, idx) => {
        dot.addEventListener("click", () => {
          this.stop();
          this.setActive(idx);
        });
      });
    }

    renderBadges() {
      this.badgesContainer.innerHTML = "";
      this.slots = [];
      this.swings = [];
      this.straps = [];
      this.cords = [];
      this.hangs = [];
      this.buttons = [];
      this.flips = [];
      this.shadows = [];
      this.linkLayers = [];

      this.items.forEach((item, i) => {
        const toneClass = TONES[((item.tone ?? (i % 5) + 1) - 1) % TONES.length] || TONES[0];
        const seed = hash(`item.id:${item.name}`);
        const bars = barcode(seed);

        const slot = document.createElement("div");
        slot.setAttribute("data-lanyard", i);
        slot.className = `pointer-events-none absolute left-0 top-0 ${toneClass}`;
        slot.style.width = `${MAX_W}px`;
        slot.style.height = "380px";
        slot.style.zIndex = 10 + i;

        slot.innerHTML = `
          <!-- Metal Rail Ring -->
          <span aria-hidden="true" class="absolute block rounded-full" style="border: 2px solid #cbd5e1; box-shadow: inset 1px 0 0 rgba(0,0,0,0.3), 1px 1px 2px rgba(0,0,0,0.3);"></span>

          <!-- Swing Parent -->
          <span data-swing class="absolute inset-0 block">
            <!-- Ribbon Strap & Reel Hardware -->
            <span data-strap aria-hidden="true" class="absolute inset-0 block" style="--stretch: 0px;">
              <span data-strap-shadow class="absolute block bg-black/45 blur-[2px]"></span>
              <span data-strap-body class="absolute block" style="background: repeating-linear-gradient(135deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 3px), repeating-linear-gradient(45deg, rgba(0,0,0,0.13) 0 1px, transparent 1px 3px), linear-gradient(90deg, rgba(0,0,0,0.6) 0%, currentColor 20%, #ffffff 50%, currentColor 80%, rgba(0,0,0,0.6) 100%);">
                <span class="absolute inset-y-0 left-[1.5px] right-[1.5px] block border-x border-dashed border-white/35"></span>
                <span data-strap-cap class="absolute inset-x-0 top-0 block bg-black/35"></span>
                <span data-strap-stitch class="absolute inset-x-[2px] block border-t border-dashed border-white/45"></span>
              </span>
              <svg aria-hidden="true" data-strap-ring class="absolute overflow-visible" viewBox="0 0 30 16" preserveAspectRatio="none">
                <rect x="2" y="3" width="26" height="10" rx="5" fill="none" stroke="#94a3b8" stroke-width="3"></rect>
                <path d="M7 4.5 H23" stroke="white" stroke-opacity="0.6" stroke-width="1"></path>
              </svg>
              <span data-strap-crimp class="absolute block rounded-[2px]" style="background: ${METAL}; box-shadow: 0 1px 1.5px rgba(0,0,0,0.4);"></span>
              
              <!-- Retractable Badge Reel Round Body -->
              <span data-reel class="absolute block rounded-full" style="background: radial-gradient(circle at 34% 30%, #334155 0%, #0f172a 58%, #020617 100%); box-shadow: inset 0 -1px 2px rgba(0,0,0,0.6), 0 2px 3px rgba(0,0,0,0.4);">
                <span class="absolute inset-[14%] block rounded-full border border-teal-400/30"></span>
                <span class="absolute left-1/2 top-1/2 block size-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full" style="background: ${METAL};"></span>
              </span>
              
              <!-- Retractable Reel Cord -->
              <span data-cord class="absolute block w-[1.5px] bg-slate-300" style="transform-origin: 50% 0;"></span>
            </span>

            <!-- Hang Parent -->
            <span data-hang class="absolute left-0 block">
              <!-- Floor/Wall Shadow -->
              <span aria-hidden="true" data-shadow-wrapper class="absolute left-0 block">
                <span data-shadow class="absolute inset-0 block rounded-[10px] bg-black/60"></span>
              </span>

              <!-- Badge Interactive Card Button -->
              <button type="button" data-badge="${i}" aria-label="${item.name}, ${item.role}" tabIndex="${i === 0 ? 0 : -1}" class="pointer-events-auto absolute left-0 cursor-pointer rounded-[0.85em] p-0 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-400">
                <span data-flip class="absolute inset-0 block preserve-3d">
                  
                  <!-- FRONT FACE -->
                  <span data-face="front" class="absolute inset-0 flex flex-col items-center overflow-hidden rounded-[0.85em] border border-teal-500/25 bg-[#071923] px-[0.8em] pb-[0.7em] text-slate-100 backface-hidden" style="transform: translateZ(1px);">
                    <!-- Band -->
                    <span aria-hidden="true" class="absolute inset-x-0 top-0 block h-[4.3em] ${toneClass}" style="background: repeating-linear-gradient(135deg, transparent 0 0.45em, rgba(255,255,255,0.15) 0.45em 0.56em), linear-gradient(180deg, rgba(255,255,255,0.3), currentColor 70%, rgba(0,0,0,0.5));">
                      <span class="absolute inset-x-0 bottom-0 h-px bg-black/25"></span>
                    </span>
                    <!-- Lanyard Hole -->
                    <span aria-hidden="true" class="absolute left-1/2 top-[0.72em] block h-[0.56em] w-[2.7em] -translate-x-1/2 rounded-full bg-[#040d12]" style="box-shadow: inset 0 0.09em 0.2em rgba(0,0,0,0.8), 0 0.05em 0 rgba(255,255,255,0.2);"></span>
                    <!-- Photo Circle -->
                    <span class="relative mt-[2.05em] block size-[5.3em] shrink-0 rounded-full bg-[#0a2330] p-[0.2em] shadow-lg">
                      <span class="relative block size-full overflow-hidden rounded-full bg-slate-800">
                        <img src="${item.image}" alt="${item.name}" draggable="false" decoding="async" class="pointer-events-none absolute inset-0 block size-full select-none object-cover" onerror="this.onerror=null; this.src='https://placehold.co/400x400/0f172a/14b8a6?text=${encodeURIComponent(item.name.charAt(0))}'" />
                      </span>
                    </span>
                    <div class="mt-[0.5em] flex flex-col items-center justify-start w-full px-1">
                      <span class="block w-full text-center text-[1.02em] font-bold leading-tight tracking-tight text-white">${item.name}</span>
                      <span class="mt-[0.25em] block w-full text-center text-[0.70em] font-medium leading-[1.3] text-gray-300 px-0.5 break-words">${item.role}</span>
                    </div>
                    <!-- Barcode Footer -->
                    <span class="mt-auto block w-full border-t border-dashed border-white/20 pt-[0.65em] pb-[0.35em]">
                      <svg aria-hidden="true" viewBox="0 0 ${bars.width} 20" preserveAspectRatio="none" class="block h-[1.8em] w-full text-slate-200">
                        <path d="${bars.d}" fill="currentColor"></path>
                      </svg>
                    </span>
                    <!-- Gloss Reflection -->
                    <span aria-hidden="true" class="pointer-events-none absolute inset-y-0 -left-1/2 block w-[200%] opacity-40" style="background: linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.26) 48%, rgba(255,255,255,0.08) 52%, transparent 58%); transform: translateX(var(--gx, 0%));"></span>
                    <span aria-hidden="true" class="pointer-events-none absolute inset-0 block bg-black" style="opacity: var(--shade, 0);"></span>
                  </span>

                  <!-- BACK FACE (Name, Designation, and LinkedIn Only) -->
                  <span data-face="back" class="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[0.85em] border border-teal-500/25 bg-[#071923] p-[1.1em] text-slate-100 backface-hidden" style="transform: rotateY(180deg) translateZ(1px);">
                    <!-- Band -->
                    <span aria-hidden="true" class="absolute inset-x-0 top-0 block h-[2.15em] ${toneClass}" style="background: linear-gradient(180deg, rgba(255,255,255,0.3), currentColor 70%, rgba(0,0,0,0.5));">
                      <span class="absolute inset-x-0 bottom-0 h-px bg-black/25"></span>
                    </span>
                    <!-- Lanyard Hole -->
                    <span aria-hidden="true" class="absolute left-1/2 top-[0.72em] block h-[0.56em] w-[2.7em] -translate-x-1/2 rounded-full bg-[#040d12]" style="box-shadow: inset 0 0.09em 0.2em rgba(0,0,0,0.8), 0 0.05em 0 rgba(255,255,255,0.2);"></span>
                    
                    <!-- Centered Member Info (Name & Designation) -->
                    <div class="mt-[2.8em] flex flex-col items-center justify-center w-full text-center px-1">
                      <span class="block w-full text-center text-[1.08em] font-bold leading-tight text-white">${item.name}</span>
                      <span class="mt-[0.35em] block w-full text-center text-[0.72em] font-medium leading-[1.35] text-teal-300 break-words">${item.role}</span>
                    </div>

                    <!-- LinkedIn Profile Button Visual -->
                    <div class="mb-[0.9em] w-full flex justify-center">
                      <span class="inline-flex items-center gap-[0.45em] rounded-[0.55em] border border-teal-500/35 bg-teal-950/80 px-[0.85em] py-[0.45em] text-[0.74em] font-semibold text-white shadow-sm" style="opacity: var(--drawn, 1);">
                        <svg class="w-[1.15em] h-[1.15em] text-teal-400 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </span>
                    </div>

                    <!-- Gloss Reflection -->
                    <span aria-hidden="true" class="pointer-events-none absolute inset-y-0 -left-1/2 block w-[200%] opacity-40" style="background: linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.26) 48%, rgba(255,255,255,0.08) 52%, transparent 58%); transform: translateX(var(--gx, 0%));"></span>
                    <span aria-hidden="true" class="pointer-events-none absolute inset-0 block bg-black" style="opacity: var(--shade, 0);"></span>
                  </span>

                  <!-- 3D Bevel Edges -->
                  <span aria-hidden="true" class="absolute inset-y-[0.85em] left-0 block w-[2px] bg-slate-700" style="transform: translateX(-1px) rotateY(90deg);"></span>
                  <span aria-hidden="true" class="absolute inset-y-[0.85em] right-0 block w-[2px] bg-slate-700" style="transform: translateX(1px) rotateY(90deg);"></span>
                </span>
              </button>

              <!-- Plastic Clip Attached to Top of Badge -->
              <span aria-hidden="true" data-clip class="pointer-events-none absolute block">
                <span data-clip-tongue class="absolute left-1/2 block -translate-x-1/2 rounded-b-[2px]" style="background: ${PLASTIC};"></span>
                <span data-clip-jaw class="absolute inset-x-0 top-0 block" style="clip-path: polygon(24% 0, 76% 0, 100% 72%, 94% 100%, 6% 100%, 0 72%); background: ${PLASTIC};"></span>
                <span data-clip-highlight class="absolute block bg-white/50" style="left: 30%; right: 30%; top: 1px; height: 1px;"></span>
                <span data-clip-hole class="absolute left-1/2 block -translate-x-1/2 rounded-full bg-slate-900" style="box-shadow: inset 0 1px 1px rgba(0,0,0,0.6);"></span>
              </span>

              <!-- Real Clickable Back LinkedIn Link Layer -->
              ${item.linkedin ? `
                <div data-links class="pointer-events-none absolute left-0 flex items-end justify-center pb-[1.9em] transition-opacity duration-150" style="opacity: 0; visibility: hidden;">
                  <a href="${item.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="${item.name}'s LinkedIn" class="pointer-events-auto inline-flex items-center gap-[0.45em] rounded-[0.55em] border border-teal-500/40 bg-teal-900/90 px-[0.85em] py-[0.45em] text-[0.74em] font-semibold text-white hover:text-teal-200 hover:bg-teal-800 transition shadow-md outline-none focus-visible:ring-2 focus-visible:ring-teal-400">
                    <svg class="w-[1.15em] h-[1.15em] text-teal-400 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </a>
                </div>
              ` : ""}
            </span>
          </span>
        `;

        this.badgesContainer.appendChild(slot);

        this.slots[i] = slot;
        this.swings[i] = slot.querySelector("[data-swing]");
        this.straps[i] = slot.querySelector("[data-strap]");
        this.cords[i] = slot.querySelector("[data-cord]");
        this.hangs[i] = slot.querySelector("[data-hang]");
        this.buttons[i] = slot.querySelector("button[data-badge]");
        this.flips[i] = slot.querySelector("[data-flip]");
        this.shadows[i] = slot.querySelector("[data-shadow]");
        this.linkLayers[i] = slot.querySelector("[data-links]");
      });
    }

    bindEvents() {
      // Resize Observer for Stage width
      this.resizeObserver = new ResizeObserver((entries) => {
        const box = entries[0];
        if (box) this.measure(box.contentRect.width);
      });
      this.resizeObserver.observe(this.stage);

      // Pointer events on Stage
      this.stage.addEventListener("pointerdown", (e) => this.onPointerDown(e));
      this.stage.addEventListener("pointermove", (e) => this.onPointerMove(e));
      this.stage.addEventListener("pointerup", (e) => this.finishPointer(e, false));
      this.stage.addEventListener("pointercancel", (e) => this.finishPointer(e, true));
      this.stage.addEventListener("pointerleave", (e) => {
        this.pointer.hoverHit = -1;
        if (e.pointerType === "mouse" && this.pointer.id < 0 && !this.size.carousel) {
          this.setActive(null);
        }
      });

      // Keyboard navigation
      this.stage.addEventListener("keydown", (e) => this.onKeyDown(e));

      // Badge clicks
      this.buttons.forEach((btn, idx) => {
        btn.addEventListener("focus", () => {
          this.focusIndex = idx;
          if (this.pointer.id < 0) {
            this.stop();
            this.setActive(idx);
          }
        });
        btn.addEventListener("click", (e) => {
          const pending = this.pendingOpen;
          this.pendingOpen = -1;
          if (e.detail === 0 || pending === idx) {
            this.toggle(idx);
          }
        });
      });

      // Reduced motion media query
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", (e) => {
        this.reduced = e.matches;
        this.kick();
      });

      // Start autoplay
      this.startAutoplay();
    }

    measure(width) {
      if (!width) return;
      const n = Math.max(1, this.count);
      const railW = Math.min(MAX_W, (width - 40) / (n * RAIL_PITCH_MIN + 0.4));
      const carousel = railW < MIN_RAIL_W;
      const W = Math.round((carousel ? clamp(width * 0.38, 96, 118) : railW) * 4) / 4;

      if (Math.abs(this.size.width - width) < 0.5 && this.size.carousel === carousel && this.size.W === W) {
        return;
      }

      this.size = { width, W, carousel };
      this.geo = geometry(W, this.items);
      this.updateGeometryDom();
      this.updateLayout();
    }

    updateGeometryDom() {
      const g = this.geo;
      const W = g.W;
      const base = W / EM;

      this.container.setAttribute("data-mode", this.size.carousel ? "carousel" : "rail");
      this.stage.style.height = `${g.height}px`;

      // Rail styling
      this.rail.style.top = `${g.railY - g.railR}px`;
      this.rail.style.height = `${g.railR * 2}px`;

      // Carousel indicators
      if (this.size.carousel) {
        this.dotsContainer.classList.remove("hidden");
        this.vignetteLeft.classList.remove("hidden");
        this.vignetteRight.classList.remove("hidden");
        this.container.querySelectorAll("[data-rail-bracket]").forEach(el => el.classList.add("hidden"));
      } else {
        this.dotsContainer.classList.add("hidden");
        this.vignetteLeft.classList.add("hidden");
        this.vignetteRight.classList.add("hidden");
        this.container.querySelectorAll("[data-rail-bracket]").forEach(el => el.classList.remove("hidden"));
      }

      this.items.forEach((item, i) => {
        const slot = this.slots[i];
        if (!slot) return;
        slot.style.width = `${W}px`;
        slot.style.height = `${g.height}px`;

        const ring = slot.querySelector(".rounded-full");
        if (ring) {
          ring.style.left = `${W / 2 - 4.5 * g.u}px`;
          ring.style.top = `${g.railY - g.ring}px`;
          ring.style.width = `${9 * g.u}px`;
          ring.style.height = `${g.ring * 2}px`;
          ring.style.borderWidth = `${Math.max(1.6, 2.2 * g.u).toFixed(2)}px`;
        }

        const swing = this.swings[i];
        if (swing) {
          swing.style.transformOrigin = `${W / 2}px ${g.pivotY}px`;
        }

        const strapLen = g.straps[i] || 0;
        const strapShadow = slot.querySelector("[data-strap-shadow]");
        if (strapShadow) {
          strapShadow.style.left = `${W / 2 - g.strapW / 2 + 3 * g.u}px`;
          strapShadow.style.top = `${g.pivotY + 3}px`;
          strapShadow.style.width = `${g.strapW}px`;
          strapShadow.style.height = `${strapLen}px`;
        }

        const strapBody = slot.querySelector("[data-strap-body]");
        if (strapBody) {
          strapBody.style.left = `${W / 2 - g.strapW / 2}px`;
          strapBody.style.top = `${g.pivotY - 2}px`;
          strapBody.style.width = `${g.strapW}px`;
          strapBody.style.height = `${strapLen + 2}px`;
        }

        const strapCap = slot.querySelector("[data-strap-cap]");
        if (strapCap) strapCap.style.height = `${7 * g.u}px`;

        const strapStitch = slot.querySelector("[data-strap-stitch]");
        if (strapStitch) strapStitch.style.top = `${9 * g.u}px`;

        const strapRing = slot.querySelector("[data-strap-ring]");
        if (strapRing) {
          strapRing.style.left = `${W / 2 - g.strapW * 0.75}px`;
          strapRing.style.top = `${g.pivotY - 4 * g.u}px`;
          strapRing.style.width = `${g.strapW * 1.5}px`;
          strapRing.style.height = `${8 * g.u}px`;
        }

        const strapCrimp = slot.querySelector("[data-strap-crimp]");
        if (strapCrimp) {
          strapCrimp.style.left = `${W / 2 - g.strapW / 2 - 1.5}px`;
          strapCrimp.style.top = `${g.pivotY + strapLen - g.crimp * 0.4}px`;
          strapCrimp.style.width = `${g.strapW + 3}px`;
          strapCrimp.style.height = `${g.crimp}px`;
        }

        const reelTop = g.reelTops[i] || 0;
        const reel = slot.querySelector("[data-reel]");
        if (reel) {
          reel.style.left = `${W / 2 - g.reel / 2}px`;
          reel.style.top = `${reelTop}px`;
          reel.style.width = `${g.reel}px`;
          reel.style.height = `${g.reel}px`;
        }

        const cord = this.cords[i];
        if (cord) {
          cord.style.left = `${W / 2 - 0.75}px`;
          cord.style.top = `${reelTop + g.reel * 0.82}px`;
          cord.style.height = `${g.cordRest}px`;
        }

        const clipTop = g.clipTops[i] || 0;
        const cardOffset = (g.cardTops[i] || 0) - clipTop;

        const hang = this.hangs[i];
        if (hang) {
          hang.style.top = `${clipTop}px`;
          hang.style.width = `${W}px`;
          hang.style.height = `${cardOffset + g.H}px`;
          hang.style.transformOrigin = `${W / 2}px 0px`;
        }

        const shadowWrapper = slot.querySelector("[data-shadow-wrapper]");
        if (shadowWrapper) {
          shadowWrapper.style.top = `${cardOffset}px`;
          shadowWrapper.style.width = `${W}px`;
          shadowWrapper.style.height = `${g.H}px`;
          shadowWrapper.style.filter = `blur(${Math.max(4, 8 * g.u).toFixed(1)}px)`;
        }

        const btn = this.buttons[i];
        if (btn) {
          btn.style.top = `${cardOffset}px`;
          btn.style.width = `${W}px`;
          btn.style.height = `${g.H}px`;
          btn.style.fontSize = `${base}px`;
        }

        const clip = slot.querySelector("[data-clip]");
        if (clip) {
          clip.style.left = `${W / 2 - g.clipW / 2}px`;
          clip.style.top = "0px";
          clip.style.width = `${g.clipW}px`;
          clip.style.height = `${g.clipH + 10 * g.u}px`;
        }

        const tongue = slot.querySelector("[data-clip-tongue]");
        if (tongue) {
          tongue.style.top = `${g.clipH * 0.7}px`;
          tongue.style.width = `${g.clipW * 0.42}px`;
          tongue.style.height = `${cardOffset - g.clipH * 0.7 + 0.72 * base + 0.3 * base}px`;
        }

        const jaw = slot.querySelector("[data-clip-jaw]");
        if (jaw) jaw.style.height = `${g.clipH}px`;

        const hole = slot.querySelector("[data-clip-hole]");
        if (hole) {
          hole.style.top = `${g.clipH * 0.14}px`;
          hole.style.width = `${g.clipH * 0.34}px`;
          hole.style.height = `${g.clipH * 0.34}px`;
        }

        const linkLayer = this.linkLayers[i];
        if (linkLayer) {
          linkLayer.style.top = `${cardOffset}px`;
          linkLayer.style.width = `${W}px`;
          linkLayer.style.height = `${g.H}px`;
          linkLayer.style.fontSize = `${base}px`;
        }
      });
    }

    updateLayout() {
      if (!this.size.width) return;
      const s = this.sim;
      const count = this.count;
      const center = this.size.carousel ? (this.active ?? this.carouselIndex) : null;
      const { xs, total } = layoutTargets(this.size.width, this.size.W, this.size.carousel, center, count);
      this.cyclic = total > 0;
      const fresh = s.x.length !== count || s.carousel !== this.size.carousel;
      s.carousel = this.size.carousel;

      for (let i = 0; i < count; i++) {
        const tx = (xs[i] ?? 0) + (this.size.carousel ? this.pointer.swipe : 0);
        if (!fresh && total > 0) {
          const shift = Math.round((tx - (s.tx[i] ?? tx)) / total) * total;
          if (shift) s.x[i] = (s.x[i] ?? 0) + shift;
        }
        s.tx[i] = tx;
        const front = this.flipped === i || this.active === i;
        s.tr[i] = this.flipped === i ? 180 : this.active === i ? 0 : REST_Y[i % REST_Y.length] ?? 0;
        s.tz[i] = front ? 0 : REST_Z[i % REST_Z.length] ?? 0;
        s.tl[i] = front ? 1 : 0;
        s.tp[i] = this.flipped === i ? 1 : 0;

        if (fresh) {
          s.x[i] = tx; s.vx[i] = 0; s.px[i] = 0; s.sw[i] = 0; s.vsw[i] = 0; s.beta[i] = 0; s.st[i] = 0; s.vst[i] = 0;
          s.ry[i] = s.tr[i] ?? 0; s.vry[i] = 0; s.rz[i] = s.tz[i] ?? 0; s.vrz[i] = 0;
          s.lift[i] = s.tl[i] ?? 0; s.vlift[i] = 0; s.pop[i] = s.tp[i] ?? 0; s.vpop[i] = 0;
        }
      }

      const keys = ["x", "vx", "px", "tx", "sw", "vsw", "beta", "ry", "vry", "tr", "rz", "vrz", "tz", "lift", "vlift", "tl", "pop", "vpop", "tp", "st", "vst"];
      keys.forEach(k => { s[k].length = count; });

      if (fresh) {
        for (let i = 0; i < count; i++) this.paint(i);
      }
      this.kick();
    }

    paint(i) {
      const s = this.sim;
      const g = this.geo;
      const slot = this.slots[i];
      if (!slot) return;

      slot.style.transform = `translate3d(${((s.x[i] ?? 0) - g.W / 2).toFixed(2)}px,0,0)`;
      const sw = s.sw[i] ?? 0;
      const swing = this.swings[i];
      if (swing) swing.style.transform = `rotate(${sw.toFixed(3)}deg)`;

      const st = s.st[i] ?? 0;
      if (this.straps[i]) this.straps[i].style.setProperty("--stretch", `${st.toFixed(2)}px`);

      const cord = this.cords[i];
      if (cord) cord.style.transform = `scaleY(${Math.max(0.12, (g.cordRest + st) / g.cordRest).toFixed(4)})`;

      const lift = s.lift[i] ?? 0;
      const pop = s.pop[i] ?? 0;
      const hang = this.hangs[i];
      if (hang) {
        hang.style.transform = `translate3d(0,${(st - 4 * lift).toFixed(2)}px,0) rotate(${(((s.beta[i] ?? 0) - sw + (s.rz[i] ?? 0))).toFixed(3)}deg) scale(${(1 + 0.08 * pop).toFixed(4)})`;
      }

      const ry = s.ry[i] ?? 0;
      const flip = this.flips[i];
      const facing = Math.abs(Math.cos((ry * Math.PI) / 180));
      if (flip) {
        flip.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${ry.toFixed(2)}deg)`;
        flip.style.setProperty("--shade", ((1 - facing) * 0.45).toFixed(3));
        const phi = ((((ry + 90) % 180) + 180) % 180) - 90;
        flip.style.setProperty("--gx", `${(phi * 0.9).toFixed(1)}%`);
      }

      const shadow = this.shadows[i];
      if (shadow) {
        shadow.style.transform = `translate3d(${(g.W * 0.045 + lift * 3 * g.u).toFixed(2)}px,${(g.H * 0.03 + lift * 7 * g.u).toFixed(2)}px,0) scale(${(Math.max(0.12, facing) * (1 + 0.03 * lift + 0.05 * pop)).toFixed(3)},${(1 + 0.03 * lift + 0.05 * pop).toFixed(3)})`;
        shadow.style.opacity = (0.72 + 0.28 * lift).toFixed(3);
      }

      const layer = this.linkLayers[i];
      const on = !!layer && Math.abs(ry - 180) < (layer.style.visibility === "visible" ? 24 : 9);
      if (layer) {
        layer.style.opacity = on ? "1" : "0";
        layer.style.visibility = on ? "visible" : "hidden";
      }
      if (flip) flip.style.setProperty("--drawn", on ? "0" : "1");

      const isFlipped = this.flipped === i;
      const isActive = this.active === i;
      slot.style.zIndex = isFlipped ? 40 : isActive ? 30 : 10 + i;
    }

    step(now) {
      const s = this.sim;
      const n = this.count;
      const g = this.geo;
      const { width, carousel } = this.size;
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 1 / 60;
      s.last = now;

      const sub = Math.max(3, Math.ceil(dt / 0.006));
      const h = dt / sub;
      let busy = false;

      for (let k = 0; k < sub; k++) {
        for (let i = 0; i < n; i++) {
          const before = s.vx[i] ?? 0;
          if (i !== s.drag) {
            const restoring = now > s.free;
            const ax = restoring ? -130 * ((s.x[i] ?? 0) - (s.tx[i] ?? 0)) - 2 * Math.sqrt(130) * 0.86 * before : -3.2 * before;
            s.vx[i] = before + ax * h;
            s.x[i] = (s.x[i] ?? 0) + (s.vx[i] ?? 0) * h;
          }
        }

        if (!carousel && n > 0) {
          const [left, right] = stops(s, g.W, width, n);
          if (s.drag >= 0) {
            const d = s.drag;
            for (let j = d - 1; j >= 0; j--) {
              const limit = (s.x[j + 1] ?? 0) - minGap(s, g.W, j, j + 1);
              if ((s.x[j] ?? 0) > limit) { s.x[j] = limit; s.vx[j] = Math.min(s.vx[j] ?? 0, s.vx[j + 1] ?? 0); }
            }
            for (let j = d + 1; j < n; j++) {
              const limit = (s.x[j - 1] ?? 0) + minGap(s, g.W, j - 1, j);
              if ((s.x[j] ?? 0) < limit) { s.x[j] = limit; s.vx[j] = Math.max(s.vx[j] ?? 0, s.vx[j - 1] ?? 0); }
            }
          } else {
            for (let pass = 0; pass < 3; pass++) {
              for (let j = 0; j < n - 1; j++) {
                const a = s.x[j] ?? 0;
                const b = s.x[j + 1] ?? 0;
                const overlap = minGap(s, g.W, j, j + 1) - (b - a);
                if (overlap <= 0) continue;
                s.x[j] = a - overlap / 2;
                s.x[j + 1] = b + overlap / 2;
                const va = s.vx[j] ?? 0;
                const vb = s.vx[j + 1] ?? 0;
                if (va > vb) { const shared = (va + vb) / 2; s.vx[j] = shared; s.vx[j + 1] = shared; }
              }
            }
            if ((s.x[0] ?? 0) < left) { s.x[0] = left; s.vx[0] = Math.abs(s.vx[0] ?? 0) * 0.3; }
            for (let j = 1; j < n; j++) s.x[j] = Math.max(s.x[j] ?? 0, (s.x[j - 1] ?? 0) + minGap(s, g.W, j - 1, j));
            if ((s.x[n - 1] ?? 0) > right) { s.x[n - 1] = right; s.vx[n - 1] = -Math.abs(s.vx[n - 1] ?? 0) * 0.3; }
            for (let j = n - 2; j >= 0; j--) s.x[j] = Math.min(s.x[j] ?? 0, (s.x[j + 1] ?? 0) - minGap(s, g.W, j, j + 1));
          }
        }

        for (let i = 0; i < n; i++) {
          const dv = (s.vx[i] ?? 0) - (s.px[i] ?? 0);
          s.px[i] = s.vx[i] ?? 0;
          if (i !== s.pull) {
            const sw = s.sw[i] ?? 0;
            const vsw = clamp((s.vsw[i] ?? 0) + (g.couple[i] ?? 0.07) * clamp(dv, -900, 900), -90, 90);
            const next = vsw + (-(g.swingK[i] ?? SWING_K) * sw - SWING_DAMP * vsw) * h;
            s.vsw[i] = next;
            s.sw[i] = clamp(sw + next * h, -18, 18);
          }
          s.beta[i] = (s.beta[i] ?? 0) + ((s.sw[i] ?? 0) - (s.beta[i] ?? 0)) * Math.min(1, h / LAG);
          spring(s.ry, s.vry, s.tr[i] ?? 0, i, 170, 0.62, h);
          spring(s.rz, s.vrz, s.tz[i] ?? 0, i, 120, 0.8, h);
          spring(s.lift, s.vlift, s.tl[i] ?? 0, i, 200, 0.75, h);
          spring(s.pop, s.vpop, s.tp[i] ?? 0, i, 160, 0.55, h);
          if (i !== s.pull) {
            spring(s.st, s.vst, 0, i, REEL_K, REEL_ZETA, h);
            s.st[i] = Math.max(-g.cordRest * 0.85, s.st[i] ?? 0);
          }
        }

        for (let a = 0; a < n - 1; a++) {
          const b = a + 1;
          if ((s.x[b] ?? 0) <= (s.x[a] ?? 0)) continue;
          const [aTop, aBottom, aArmTop, aArmBottom] = cardEdge(s, g, a, 1);
          const [bTop, bBottom, bArmTop, bArmBottom] = cardEdge(s, g, b, -1);
          const topExcess = aTop - bTop + 2;
          const bottomExcess = aBottom - bBottom + 2;
          const excess = Math.max(topExcess, bottomExcess);
          if (excess <= 0) continue;
          const arm = Math.max(40, topExcess > bottomExcess ? (aArmTop + bArmTop) / 2 : (aArmBottom + bArmBottom) / 2);
          const push = (Math.asin(clamp(excess / arm, 0, 1)) * 180) / Math.PI;
          const share = a === s.pull ? 0 : b === s.pull ? 1 : 0.5;
          s.sw[a] = clamp((s.sw[a] ?? 0) + push * share, -18, 18);
          s.beta[a] = (s.beta[a] ?? 0) + push * share;
          s.sw[b] = clamp((s.sw[b] ?? 0) - push * (1 - share), -18, 18);
          s.beta[b] = (s.beta[b] ?? 0) - push * (1 - share);
          const va = s.vsw[a] ?? 0;
          const vb = s.vsw[b] ?? 0;
          if (vb - va > 0) {
            const mean = (va + vb) / 2;
            if (a !== s.pull) s.vsw[a] = mean + (vb - va) * 0.15;
            if (b !== s.pull) s.vsw[b] = mean - (vb - va) * 0.15;
          }
        }
      }

      for (let i = 0; i < n; i++) {
        this.paint(i);
        if (
          Math.abs(s.vx[i] ?? 0) > 0.4 || (now > s.free && Math.abs((s.x[i] ?? 0) - (s.tx[i] ?? 0)) > 0.25) ||
          Math.abs((s.ry[i] ?? 0) - (s.tr[i] ?? 0)) > 0.05 || Math.abs(s.vry[i] ?? 0) > 0.05 ||
          Math.abs((s.rz[i] ?? 0) - (s.tz[i] ?? 0)) > 0.02 || Math.abs(s.vrz[i] ?? 0) > 0.05 ||
          Math.abs((s.lift[i] ?? 0) - (s.tl[i] ?? 0)) > 0.002 || Math.abs(s.vlift[i] ?? 0) > 0.01 ||
          Math.abs((s.pop[i] ?? 0) - (s.tp[i] ?? 0)) > 0.002 || Math.abs(s.vpop[i] ?? 0) > 0.01 ||
          Math.abs(s.sw[i] ?? 0) > 0.02 || Math.abs(s.vsw[i] ?? 0) > 0.05 || Math.abs((s.beta[i] ?? 0) - (s.sw[i] ?? 0)) > 0.01 ||
          Math.abs(s.st[i] ?? 0) > 0.05 || Math.abs(s.vst[i] ?? 0) > 0.1
        ) busy = true;
      }

      if (s.drag >= 0 || s.pull >= 0 || now < s.free) busy = true;

      if (busy) {
        s.raf = requestAnimationFrame((t) => this.step(t));
      } else {
        s.raf = 0;
        s.last = 0;
        for (let i = 0; i < n; i++) {
          if (now > s.free) { s.x[i] = s.tx[i] ?? 0; s.vx[i] = 0; s.px[i] = 0; }
          s.sw[i] = 0; s.vsw[i] = 0; s.beta[i] = 0; s.st[i] = 0; s.vst[i] = 0;
          s.ry[i] = s.tr[i] ?? 0; s.vry[i] = 0; s.rz[i] = s.tz[i] ?? 0; s.vrz[i] = 0;
          s.lift[i] = s.tl[i] ?? 0; s.vlift[i] = 0; s.pop[i] = s.tp[i] ?? 0; s.vpop[i] = 0;
          this.paint(i);
        }
      }
    }

    snap() {
      const s = this.sim;
      for (let i = 0; i < this.count; i++) {
        s.x[i] = s.tx[i] ?? 0; s.vx[i] = 0; s.px[i] = 0;
        s.sw[i] = 0; s.vsw[i] = 0; s.beta[i] = 0;
        if (i !== s.pull) { s.st[i] = 0; s.vst[i] = 0; }
        s.ry[i] = s.tr[i] ?? 0; s.vry[i] = 0; s.rz[i] = s.tz[i] ?? 0; s.vrz[i] = 0;
        s.lift[i] = s.tl[i] ?? 0; s.vlift[i] = 0; s.pop[i] = s.tp[i] ?? 0; s.vpop[i] = 0;
        this.paint(i);
      }
    }

    kick() {
      const s = this.sim;
      if (this.reduced) {
        cancelAnimationFrame(s.raf);
        s.raf = 0;
        this.snap();
        return;
      }
      if (!s.raf) {
        s.last = 0;
        s.raf = requestAnimationFrame((t) => this.step(t));
      }
    }

    impulse(i, amount) {
      if (this.reduced || i < 0 || i >= this.count) return;
      this.sim.vsw[i] = (this.sim.vsw[i] ?? 0) + amount;
      this.kick();
    }

    tug(i, amount) {
      if (this.reduced || i < 0 || i >= this.count) return;
      this.sim.vst[i] = (this.sim.vst[i] ?? 0) + amount;
      this.kick();
    }

    setActive(index) {
      if (this.active === index) return;
      const old = this.active;
      this.active = index;
      if (index !== null) this.carouselIndex = index;
      this.updateCaption();
      this.updateDots();

      const wrap = (i) => (this.cyclic ? ((i % this.count) + this.count) % this.count : i);
      if (index !== null) {
        this.impulse(wrap(index - 1), 16);
        this.impulse(wrap(index + 1), -16);
      }
      if (old !== null) {
        this.impulse(wrap(old - 1), -6);
        this.impulse(wrap(old + 1), 6);
      }

      this.updateLayout();
    }

    setFlipped(index) {
      if (this.flipped === index) return;
      const old = this.flipped;
      this.flipped = index;
      this.updateCaption();

      if (index !== null) {
        this.impulse(index, index % 2 ? 9 : -9);
        this.tug(index, 70);
      }
      if (old !== null) {
        this.tug(old, 40);
      }

      this.updateLayout();
    }

    toggle(index) {
      this.stop();
      const next = this.flipped === index ? null : index;
      if (next !== null) this.setActive(index);
      this.setFlipped(next);
    }

    updateCaption() {
      const current = this.active ?? this.flipped;
      const person = current === null ? null : this.items[current];
      const showingBack = current !== null && current === this.flipped;

      if (person) {
        this.captionLine1.textContent = `${person.name} — ${person.role}`;
        this.captionLine2.textContent = showingBack ? this.labels.back : this.labels.flip;
      } else {
        this.captionLine1.textContent = this.caption;
        this.captionLine2.textContent = this.labels.flip;
      }
    }

    updateDots() {
      if (!this.dots) return;
      const center = this.active ?? this.carouselIndex;
      this.dots.forEach((dot, idx) => {
        if (idx === center) {
          dot.className = "h-1.5 rounded-full outline-none transition-[width,background-color] duration-300 w-6 bg-teal-400";
        } else {
          dot.className = "h-1.5 rounded-full outline-none transition-[width,background-color] duration-300 w-1.5 bg-white/25 hover:bg-white/45";
        }
      });
    }

    stop() {
      this.playing = false;
      if (this.autoplayTimer) {
        clearTimeout(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    startAutoplay() {
      if (!this.playing || this.reduced || this.count === 0) return;

      const scheduleFront = (index) => {
        if (!this.playing) return;
        this.setActive(index);
        this.autoplayTimer = setTimeout(() => scheduleFlip(index), FLIP_DELAY);
      };

      const scheduleFlip = (index) => {
        if (!this.playing) return;
        this.setFlipped(index);
        this.autoplayTimer = setTimeout(() => {
          if (!this.playing) return;
          this.setFlipped(null);
          scheduleFront((index + 1) % this.count);
        }, this.interval);
      };

      this.autoplayTimer = setTimeout(() => scheduleFront(0), FIRST_DELAY);
    }

    nearest(clientX, clientY) {
      const box = this.stage.getBoundingClientRect();
      const x = clientX - box.left;
      const y = clientY - box.top;
      const g = this.geo;
      const s = this.sim;
      if (y < g.railY - 12) return null;

      let best = null;
      let distance = Infinity;
      for (let i = 0; i < this.count; i++) {
        if (y > (g.cardTops[i] ?? 0) + g.H + Math.max(0, s.st[i] ?? 0) + 8) continue;
        const d = Math.abs(x - (s.x[i] ?? 0));
        if (d < g.W / 2 + 6 && d < distance) {
          best = i;
          distance = d;
        }
      }
      return best;
    }

    feasible(d) {
      const s = this.sim;
      const W = this.geo.W;
      const n = this.count;
      let [lo, hi] = stops(s, W, this.size.width, n);
      for (let k = 0; k < d; k++) lo += minGap(s, W, k, k + 1);
      for (let k = n - 1; k > d; k--) hi -= minGap(s, W, k - 1, k);
      return [lo, Math.max(lo, hi)];
    }

    onPointerDown(event) {
      if (event.button !== 0) return;
      const hit = this.nearest(event.clientX, event.clientY);
      const now = performance.now();
      this.pendingOpen = -1;
      this.pointer = {
        id: event.pointerId,
        index: hit ?? -1,
        x: event.clientX,
        y: event.clientY,
        mode: "",
        kind: event.pointerType,
        lastX: event.clientX,
        lastY: event.clientY,
        lastT: now,
        v: 0,
        swipe: 0,
        hoverX: event.clientX,
        hoverT: now,
        hoverHit: hit ?? -1
      };
    }

    onPointerMove(event) {
      const p = this.pointer;
      const s = this.sim;
      const now = performance.now();

      if (p.id === event.pointerId && this.stage) {
        const dx = event.clientX - p.x;
        const dy = event.clientY - p.y;

        if (!p.mode && Math.hypot(dx, dy) > 8) {
          if (Math.abs(dy) > Math.abs(dx)) {
            p.mode = dy > 0 && p.index >= 0 ? "pull" : "none";
          } else {
            p.mode = this.size.carousel ? "swipe" : p.index >= 0 && !this.reduced ? "drag" : "none";
          }

          if (p.mode !== "none") {
            this.stop();
            if (this.stage.isConnected) this.stage.setPointerCapture(event.pointerId);
          }
          if (p.mode === "pull") s.pull = p.index;
          if (p.mode === "drag") {
            s.drag = p.index;
            s.grab = event.clientX - this.stage.getBoundingClientRect().left - (s.x[p.index] ?? 0);
          }
        }

        const elapsed = Math.max(1, now - p.lastT);
        p.v = p.v * 0.6 + ((event.clientX - p.lastX) / elapsed) * 0.4;
        p.lastX = event.clientX;
        p.lastY = event.clientY;
        p.lastT = now;

        if (p.mode === "pull") {
          const i = p.index;
          s.st[i] = soft(Math.max(0, dy), this.geo.maxStretch);
          s.vst[i] = 0;
          const angle = clamp((-Math.atan2(dx, (this.geo.pendulum[i] ?? 200) + (s.st[i] ?? 0)) * 180) / Math.PI, -16, 16);
          s.vsw[i] = ((angle - (s.sw[i] ?? 0)) / elapsed) * 1000 * 0.5;
          s.sw[i] = angle;
          if (this.reduced) this.paint(i);
          else this.kick();
        } else if (p.mode === "drag" && s.drag >= 0) {
          const [lo, hi] = this.feasible(s.drag);
          s.x[s.drag] = clamp(event.clientX - this.stage.getBoundingClientRect().left - s.grab, lo, hi);
          s.vx[s.drag] = p.v * 1000;
          s.free = now + 900;
          this.kick();
        } else if (p.mode === "swipe") {
          p.swipe = dx;
          this.updateLayout();
        }
        return;
      }

      if (event.pointerType !== "mouse" || p.id >= 0) return;
      const hit = this.nearest(event.clientX, event.clientY);
      const hoverV = (event.clientX - p.hoverX) / Math.max(1, now - p.hoverT);
      p.hoverX = event.clientX;
      p.hoverT = now;

      if (this.size.carousel) {
        const center = this.active ?? this.carouselIndex;
        if (hit !== null && hit === center && this.active !== hit) {
          this.stop();
          this.setActive(hit);
        }
        return;
      }

      if (hit !== null && hit !== p.hoverHit) {
        this.impulse(hit, clamp(-hoverV * 22, -24, 24));
      }
      p.hoverHit = hit ?? -1;
      if (hit !== null && hit !== this.active) {
        this.stop();
        this.setActive(hit);
      }
    }

    finishPointer(event, cancelled) {
      const p = this.pointer;
      if (p.id !== event.pointerId) return;
      const s = this.sim;

      if (this.stage?.hasPointerCapture(event.pointerId)) {
        this.stage.releasePointerCapture(event.pointerId);
      }
      this.pointer = Object.assign({}, p, { id: -1 });

      if (p.mode === "pull") {
        const i = s.pull;
        s.pull = -1;
        if (this.reduced) {
          s.st[i] = 0; s.vst[i] = 0; s.sw[i] = 0; s.vsw[i] = 0; s.beta[i] = 0;
          this.paint(i);
        } else {
          this.kick();
        }
        return;
      }

      if (p.mode === "drag") {
        s.drag = -1;
        s.free = performance.now() + 700;
        this.kick();
        return;
      }

      if (p.mode === "swipe") {
        const dx = event.clientX - p.x;
        const n = this.count;
        const current = this.active ?? this.carouselIndex;
        const by = Math.abs(dx) > 40 || Math.abs(p.v) > 0.45 ? (dx < 0 ? 1 : -1) : 0;
        this.pointer.swipe = 0;
        const next = this.cyclic ? (((current + by) % n) + n) % n : clamp(current + by, 0, n - 1);
        if (next === this.active) this.updateLayout();
        else this.setActive(next);
        return;
      }

      if (cancelled || p.mode || p.index < 0) return;
      this.stop();
      if ((p.kind !== "mouse" || this.size.carousel) && this.active !== p.index) {
        this.setActive(p.index);
      } else {
        this.pendingOpen = p.index;
      }
    }

    onKeyDown(event) {
      if (event.key === "Escape") {
        if (this.flipped !== null) {
          event.preventDefault();
          this.setFlipped(null);
        }
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      const badge = target?.dataset?.badge;

      if (event.key === "ArrowDown") {
        if (badge === undefined) return;
        event.preventDefault();
        this.stop();
        this.tug(Number(badge), 300);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        if (badge !== undefined) {
          event.preventDefault();
          this.toggle(Number(badge));
          return;
        }
      }

      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      this.stop();
      const from = this.active ?? this.focusIndex;
      const next = event.key === "Home" ? 0 : event.key === "End" ? this.count - 1 : clamp(from + (event.key === "ArrowRight" ? 1 : -1), 0, this.count - 1);
      this.focusIndex = next;
      this.setActive(next);
      this.buttons[next]?.focus({ preventScroll: true });
    }
  }

  // Auto-initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    const mount = document.getElementById("team-lanyard-rail");
    if (mount) {
      new TeamLanyardRail(mount, {
        items: GRAYWOLFTEK_TEAM
      });
    }
  });

  window.TeamLanyardRail = TeamLanyardRail;
})();

