/**
 * Folder 3D Interactive Component - Vanilla JS Implementation
 * Enhanced for Graywolftek OMEGA New Talent Member Cards
 */
(function(window) {
  'use strict';

  const TAU = Math.PI * 2;
  const STEP = 1 / 240;
  const MAX_ITEMS = 6;
  const DEFAULT_ITEMS = [{ title: 'Profile' }, { title: 'Credentials' }, { title: 'Skills' }];

  const PILE_TURN = [0.5, -1.1, 1.5, -0.7, 1.2, -1.6];
  const BOOK_REST = [
    { x: 0.14, y: -0.004, r: 1.4 },
    { x: 0.115, y: 0.008, r: -1.1 },
    { x: 0.09, y: 0, r: 0.6 }
  ];
  const BOOK_PEEK = [
    { x: 0.27, y: -0.016, r: 4.5 },
    { x: 0.2, y: 0.014, r: 1.2 },
    { x: 0.14, y: 0, r: -1.2 }
  ];
  const FLAP_REST = [
    { x: 0.16, rise: 0, r: 3 },
    { x: -0.17, rise: 0.05, r: -3.5 },
    { x: 0, rise: 0.1, r: 0.5 },
    { x: 0.25, rise: 0.08, r: 5 },
    { x: -0.25, rise: 0.09, r: -5.5 },
    { x: 0.08, rise: 0.12, r: 1.5 }
  ];
  const SPREAD_TURN = [4, -5, 3, -6, 5, -3];
  const SPREAD_DROP = [0.03, -0.04, 0.05, -0.02, 0.04, -0.05];
  const DROP_TURN = [-6, 4, -3, 7, -5, 3];
  const BOOK_ANGLES = { open: -180, receive: -24, peek: -13, rest: 0 };
  const FLAP_ANGLES = { open: -64, receive: -30, peek: -15, rest: 0 };
  const LAYERS = { out: 50, drag: 80, focus: 90 };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const parseColor = (() => {
    let context = null;
    const cache = new Map();
    return value => {
      const key = String(value);
      if (cache.has(key)) return cache.get(key);
      let rgb = [61, 139, 255];
      if (typeof document !== 'undefined') {
        context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        if (context) {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = '#3d8bff';
          context.fillStyle = key;
          context.fillRect(0, 0, 1, 1);
          rgb = Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
        }
      }
      cache.set(key, rgb);
      return rgb;
    };
  })();

  const mixRgb = (rgb, target, amount) => rgb.map((channel, i) => Math.round(channel + (target[i] - channel) * amount));
  const rgbString = rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  const luma = rgb => (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

  const multiply = (a, b) => {
    const out = new Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        out[col * 4 + row] =
          a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
      }
    }
    return out;
  };

  const chain = (...list) => list.reduce(multiply);
  const move = (x, y, z = 0) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  const stretch = (x, y) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  const turnX = degrees => {
    const r = (degrees * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  };

  const turnY = degrees => {
    const r = (degrees * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  };

  const turnZ = degrees => {
    const r = (degrees * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  };

  const toCss = m => `matrix3d(${m.map(v => (Math.abs(v) < 1e-7 ? 0 : Number(v.toFixed(6)))).join(', ')})`;

  const measureFolder = (book, scale, labelWidth, hasLabel, tabPosition) => {
    const w = (book ? 180 : 224) * scale;
    const h = (book ? 232 : 176) * scale;
    const tabH = 20 * scale;
    const r = 12 * scale;
    const shoulder = tabH * 0.75;
    const frontTop = book ? tabH : tabH + h * 0.3;
    const corners = book ? [0, r, r, 0] : [r, r, r, r];
    const maxTab = w - corners[0] - corners[1] - shoulder * 2 - 10 * scale;
    const tabW = clamp(hasLabel ? labelWidth + 14 * scale + shoulder : w * 0.34, Math.min(w * 0.3, maxTab), maxTab);
    const tabX =
      tabPosition === 'left'
        ? corners[0] + 5 * scale + shoulder
        : tabPosition === 'center'
          ? (w - tabW) / 2
          : w - corners[1] - 5 * scale - shoulder - tabW;
    const docW = book ? w * 0.8 : w * 0.54;
    return {
      book,
      scale,
      w,
      h,
      tabH,
      r,
      shoulder,
      corners,
      tabW,
      tabX,
      frontTop,
      frontH: tabH + h - frontTop,
      docW,
      docH: docW * (book ? 1.28 : 1.22)
    };
  };

  const backPath = g => {
    const { w, h, tabX, tabW, tabH, shoulder } = g;
    const [tl, tr, br, bl] = g.corners;
    const top = tabH;
    const bottom = tabH + h;
    return [
      `M 0 ${top + tl}`,
      `Q 0 ${top} ${tl} ${top}`,
      `L ${tabX - shoulder} ${top}`,
      `C ${tabX} ${top} ${tabX} 0 ${tabX + shoulder} 0`,
      `L ${tabX + tabW - shoulder} 0`,
      `C ${tabX + tabW} 0 ${tabX + tabW} ${top} ${tabX + tabW + shoulder} ${top}`,
      `L ${w - tr} ${top}`,
      `Q ${w} ${top} ${w} ${top + tr}`,
      `L ${w} ${bottom - br}`,
      `Q ${w} ${bottom} ${w - br} ${bottom}`,
      `L ${bl} ${bottom}`,
      `Q 0 ${bottom} 0 ${bottom - bl}`,
      'Z'
    ].join(' ');
  };

  const placeBook = (rank, count, phase, layout, g) => {
    const pileX = g.w / 2;
    const pileY = g.frontTop + g.frontH / 2;
    if (phase === 'open') {
      if (layout === 'row') {
        const gap = 10 * g.scale;
        const fit = Math.min(0.8, (g.w * 1.86 - gap * (count - 1)) / (count * g.docW));
        const step = g.docW * fit + gap;
        return { x: g.w / 2 + (rank - (count - 1) / 2) * step, y: pileY, z: 0, r: 0, ry: 0, s: fit };
      }
      if (layout === 'stack') {
        const fit = 0.74;
        const strip = Math.min(26 * g.scale, (g.h * 0.36) / Math.max(1, count - 1));
        const top = g.frontTop + 14 * g.scale + (count - 1) * strip;
        return { x: g.w, y: top + (g.docH * fit) / 2 - rank * strip, z: 0, r: 0, ry: 0, s: fit };
      }
      const fit = count > 4 ? 0.58 : count > 3 ? 0.64 : 0.72;
      const span = count === 2 ? g.w : Math.min(g.w * 1.3, g.w * 0.6 * (count - 1));
      const x = count > 1 ? span / 2 - (rank * span) / (count - 1) : g.w * 0.5;
      return { x: g.w / 2 + x, y: pileY + SPREAD_DROP[rank] * g.h, z: 0, r: SPREAD_TURN[rank], ry: 0, s: fit };
    }
    const offsets = phase === 'rest' ? BOOK_REST : BOOK_PEEK;
    const offset = offsets[rank] ?? { x: 0.06, y: 0, r: PILE_TURN[rank] ?? 0 };
    return {
      x: pileX + offset.x * g.w,
      y: pileY + offset.y * g.h + rank * 0.8 * g.scale,
      z: 0,
      r: offset.r,
      ry: 0,
      s: 1
    };
  };

  const placeFlap = (rank, count, phase, layout, g, pointer) => {
    const rest = FLAP_REST[rank] ?? FLAP_REST[FLAP_REST.length - 1];
    const floor = g.tabH + g.h - 5 * g.scale - g.docH / 2;
    const mid = (count - 1) / 2;
    if (phase === 'open') {
      const lift = g.tabH - g.h * 0.02;
      if (layout === 'stack') {
        const strip = Math.min(30 * g.scale, (g.h * 0.62) / Math.max(1, count - 1));
        const fit = 1.04 - rank * 0.05;
        return {
          x: g.w / 2,
          y: g.tabH + g.h * 0.1 - rank * strip - (g.docH * (1.04 - fit)) / 2,
          z: -rank * 18 * g.scale,
          r: 0,
          ry: 0,
          s: fit
        };
      }
      const gap = 12 * g.scale;
      const fit = Math.min(0.94, (g.w * 2.3 - gap * (count - 1)) / (count * g.docW));
      const step = g.docW * fit + gap;
      const tidy = layout === 'row';
      return {
        x: g.w / 2 + (rank - mid) * step,
        y: lift + (tidy ? 0 : SPREAD_DROP[rank] * g.h * 0.7),
        z: 0,
        r: tidy ? 0 : SPREAD_TURN[rank] * 0.55,
        ry: 0,
        s: fit
      };
    }
    const part = phase === 'receive' ? 1.7 : phase === 'peek' ? 1.3 : 1;
    const x = g.w / 2 + rest.x * g.w * part;
    if (phase === 'rest') return { x, y: floor - rest.rise * g.h, z: 0, r: rest.r, ry: 0, s: 1 };
    const near = phase === 'peek' && pointer != null ? Math.max(0, 1 - Math.abs(pointer - x) / (g.w * 0.32)) : 0;
    const rise = rest.rise + (phase === 'receive' ? 0.03 : 0.1);
    return { x, y: floor - rise * g.h - near * near * g.h * 0.09, z: 0, r: rest.r * 1.6, ry: 0, s: 1 };
  };

  /**
   * Helper to build DOM for an item
   */
  function createItemContent(item) {
    if (item instanceof HTMLElement) {
      return item;
    }
    if (item && typeof item === 'object') {
      if (item.html) {
        const wrap = document.createElement('div');
        wrap.className = 'w-full h-full';
        wrap.innerHTML = item.html;
        return wrap;
      }
      if (item.image) {
        const photo = document.createElement('div');
        photo.className = 'folder-photo';
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.alt || item.title || 'Member Photo';
        img.draggable = false;
        photo.appendChild(img);

        if (item.name || item.role) {
          const badge = document.createElement('div');
          badge.className = 'photo-badge';
          if (item.name) {
            const nameEl = document.createElement('div');
            nameEl.className = 'photo-badge-name';
            nameEl.textContent = item.name;
            badge.appendChild(nameEl);
          }
          if (item.role) {
            const roleEl = document.createElement('div');
            roleEl.className = 'photo-badge-role';
            roleEl.textContent = item.role;
            badge.appendChild(roleEl);
          }
          photo.appendChild(badge);
        }
        return photo;
      }
      if (item.title || item.description) {
        const doc = document.createElement('div');
        doc.className = 'folder-doc';
        if (item.title) {
          const t = document.createElement('span');
          t.className = 'folder-doc-title';
          t.textContent = item.title;
          doc.appendChild(t);
        }
        if (item.description) {
          const d = document.createElement('span');
          d.className = 'folder-doc-text';
          d.textContent = item.description;
          doc.appendChild(d);
        }
        const l1 = document.createElement('span'); l1.className = 'folder-doc-line'; l1.style.width = '92%'; doc.appendChild(l1);
        const l2 = document.createElement('span'); l2.className = 'folder-doc-line'; l2.style.width = '84%'; doc.appendChild(l2);
        const bl = document.createElement('span'); bl.className = 'folder-doc-block'; doc.appendChild(bl);
        const l3 = document.createElement('span'); l3.className = 'folder-doc-line'; l3.style.width = '68%'; doc.appendChild(l3);
        return doc;
      }
    }
    const div = document.createElement('div');
    div.className = 'folder-doc';
    div.innerHTML = `<span class="folder-doc-heading"></span><span class="folder-doc-line" style="width:85%"></span><span class="folder-doc-block"></span>`;
    return div;
  }

  /**
   * Vanilla JS Folder Instance
   */
  class Folder {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        console.error('Folder container not found:', container);
        return;
      }

      this.options = Object.assign({
        items: DEFAULT_ITEMS,
        label: '',
        mode: 'flap',
        variant: 'solid',
        color: '#6366f1',
        paperColor: '#ffffff',
        tabPosition: 'right',
        layout: 'spread',
        size: 1.15,
        openOn: 'click',
        defaultOpen: false,
        draggable: true,
        zoomOnClick: true,
        peek: true,
        intro: true,
        tilt: 0.5,
        bounce: 0.4,
        speed: 1,
        frost: 0.25,
        closeOnOutsideClick: true,
        theme: 'dark'
      }, options);

      this.isOpen = Boolean(this.options.defaultOpen);
      this.outside = [];
      this.labelWidth = 0;
      this.init();
    }

    init() {
      const { mode, variant, color, paperColor, tabPosition, size, label, theme, draggable } = this.options;
      const book = mode === 'book';
      const scale = Math.max(0.3, Number(size) || 1);
      const rgb = parseColor(color);
      const paper = parseColor(paperColor);
      const backTone = mixRgb(rgb, [0, 0, 0], 0.16);
      const insideTop = rgbString(mixRgb(rgb, [0, 0, 0], 0.08));
      const insideBottom = rgbString(backTone);

      const entries = (this.options.items || DEFAULT_ITEMS).slice(0, MAX_ITEMS);
      const count = entries.length;

      // Temporary element to measure label
      let labelWidth = 0;
      if (label) {
        const tempSpan = document.createElement('span');
        tempSpan.className = 'folder-tab-text folder-measure';
        tempSpan.textContent = label;
        tempSpan.style.visibility = 'hidden';
        document.body.appendChild(tempSpan);
        labelWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
      }
      this.labelWidth = labelWidth;

      const g = measureFolder(book, scale, labelWidth, Boolean(label), tabPosition);
      const total = g.tabH + g.h;
      const shape = backPath(g);

      // Root element
      const root = document.createElement('div');
      root.className = `folder-root ${this.options.className || ''}`.trim();
      root.dataset.mode = book ? 'book' : 'flap';
      root.dataset.variant = variant;
      root.dataset.theme = theme === 'light' ? 'light' : 'dark';
      if (this.isOpen) root.dataset.open = '';
      if (draggable) root.dataset.draggable = '';

      const depth = Math.round(Math.max(g.w, g.h) * 5);

      const vars = {
        '--folder-rgb': rgb.join(', '),
        '--folder-base': rgbString(rgb),
        '--folder-front-top': rgbString(mixRgb(rgb, [255, 255, 255], 0.14)),
        '--folder-front-bottom': rgbString(mixRgb(rgb, [0, 0, 0], 0.08)),
        '--folder-inside-top': insideTop,
        '--folder-inside-bottom': insideBottom,
        '--folder-tab-ink': luma(backTone) > 0.6 ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.95)',
        '--folder-paper': rgbString(paper),
        '--folder-paper-ink': rgbString(mixRgb(paper, [0, 0, 0], 0.11)),
        '--folder-paper-ink-strong': rgbString(mixRgb(paper, [0, 0, 0], 0.28)),
        '--folder-paper-text': rgbString(mixRgb(paper, [0, 0, 0], 0.72)),
        '--folder-w': `${g.w}px`,
        '--folder-h': `${g.h}px`,
        '--folder-tab-h': `${g.tabH}px`,
        '--folder-front-y': `${g.frontTop}px`,
        '--folder-front-h': `${g.frontH}px`,
        '--folder-r': `${g.r}px`,
        '--folder-front-radius': book ? `0 ${g.r}px ${g.r}px 0` : `${g.r}px`,
        '--folder-doc-w': `${g.docW}px`,
        '--folder-doc-h': `${g.docH}px`,
        '--folder-frost': `${(1.5 + clamp(this.options.frost, 0, 1) * 10) * scale}px`,
        '--folder-depth': `${depth}px`,
        '--folder-scale': scale
      };

      for (const [k, v] of Object.entries(vars)) {
        root.style.setProperty(k, v);
      }

      // Stage
      const stage = document.createElement('div');
      stage.className = 'folder-stage';
      stage.setAttribute('role', 'button');
      stage.setAttribute('tabindex', '0');
      stage.setAttribute('aria-expanded', String(this.isOpen));
      stage.setAttribute('aria-label', label ? `${label} folder` : 'Folder');

      // Ground
      const ground = document.createElement('span');
      ground.className = 'folder-layer folder-ground';
      ground.setAttribute('aria-hidden', 'true');
      stage.appendChild(ground);

      let cast = null;
      if (book) {
        cast = document.createElement('span');
        cast.className = 'folder-layer folder-cast';
        cast.setAttribute('aria-hidden', 'true');
        stage.appendChild(cast);
      }

      // Back
      const back = document.createElement('div');
      back.className = 'folder-layer folder-back';
      back.setAttribute('aria-hidden', 'true');

      const backFill = document.createElement('div');
      backFill.className = 'folder-back-fill';
      backFill.style.clipPath = `path('${shape}')`;
      if (book) {
        const gutter = document.createElement('span');
        gutter.className = 'folder-gutter';
        backFill.appendChild(gutter);
      }
      back.appendChild(backFill);

      const svgRim = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgRim.setAttribute('class', 'folder-back-rim');
      svgRim.setAttribute('width', String(g.w));
      svgRim.setAttribute('height', String(total));
      svgRim.setAttribute('viewBox', `0 0 ${g.w} ${total}`);
      const pathRim = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathRim.setAttribute('class', 'folder-focus');
      pathRim.setAttribute('d', shape);
      svgRim.appendChild(pathRim);
      back.appendChild(svgRim);

      if (label) {
        const tabText = document.createElement('span');
        tabText.className = 'folder-tab-text';
        tabText.style.left = `${g.tabX}px`;
        tabText.style.width = `${g.tabW}px`;
        tabText.textContent = label;
        back.appendChild(tabText);
      }
      stage.appendChild(back);

      // Items
      const itemNodes = [];
      entries.forEach((item, index) => {
        const itemNode = document.createElement('div');
        itemNode.className = 'folder-layer folder-item';
        itemNode.setAttribute('data-folder-item', String(index));
        itemNode.setAttribute('tabindex', '-1');
        itemNode.appendChild(createItemContent(item));
        stage.appendChild(itemNode);
        itemNodes.push(itemNode);
      });

      let shade = null;
      if (book) {
        shade = document.createElement('span');
        shade.className = 'folder-layer folder-shade';
        shade.setAttribute('aria-hidden', 'true');
        stage.appendChild(shade);
      }

      // Front Flap
      const front = document.createElement('div');
      front.className = 'folder-layer folder-front';
      front.dataset.face = 'outer';
      front.setAttribute('aria-hidden', 'true');

      const faceOuter = document.createElement('div');
      faceOuter.className = 'folder-face folder-face-outer';
      front.appendChild(faceOuter);

      if (book) {
        const faceInner = document.createElement('div');
        faceInner.className = 'folder-face folder-face-inner';
        const innerGutter = document.createElement('span');
        innerGutter.className = 'folder-inner-gutter';
        faceInner.appendChild(innerGutter);
        front.appendChild(faceInner);
      }
      stage.appendChild(front);
      root.appendChild(stage);

      this.container.innerHTML = '';
      this.container.appendChild(root);

      // Save refs
      this.root = root;
      this.stage = stage;
      this.ground = ground;
      this.cast = cast;
      this.back = back;
      this.front = front;
      this.shade = shade;
      this.itemNodes = itemNodes;
      this.g = g;
      this.entries = entries;
      this.depth = depth;

      this.setupPhysicsEngine();
    }

    setupPhysicsEngine() {
      const root = this.root;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

      const spring = value => ({ value, velocity: 0 });
      const state = {
        raf: 0,
        last: 0,
        ready: false,
        hovered: false,
        pressed: false,
        pointerX: 0,
        pointerY: 0,
        deskX: 0,
        deskY: 0,
        hoveredItem: -1,
        phase: 'rest',
        previous: 'rest',
        changedAt: 0,
        front: spring(0),
        rx: spring(0),
        ry: spring(0),
        lift: spring(0),
        squash: spring(1),
        items: [],
        focus: -1,
        drag: null,
        receiving: false,
        receiveUntil: 0,
        suppressClick: false,
        dropCount: 0,
        intro: { phase: 'done', start: 0, opening: false },
        anchor: spring(0),
        appear: 1
      };

      const ensureItems = n => {
        while (state.items.length < n) {
          state.items.push({
            x: spring(0),
            y: spring(0),
            z: spring(0),
            r: spring(0),
            ry: spring(0),
            s: spring(1),
            hover: spring(0),
            mx: spring(0),
            my: spring(0),
            alpha: spring(1),
            place: 'inside',
            rank: 0,
            layer: 'inside',
            elevated: false,
            insertUntil: 0,
            insertFrom: null,
            outX: 0,
            outY: 0,
            outR: 0,
            outS: 1,
            outOrder: 0,
            localX: 0,
            localY: 0,
            fresh: true
          });
        }
      };

      ensureItems(this.entries.length);

      const integrate = (item, target, omega, zeta, dt) => {
        const k = omega * omega;
        const d = 2 * zeta * omega;
        const steps = Math.max(1, Math.ceil(dt / STEP));
        const step = dt / steps;
        for (let i = 0; i < steps; i++) {
          item.velocity += (k * (target - item.value) - d * item.velocity) * step;
          item.value += item.velocity * step;
        }
        return Math.abs(target - item.value) > 0.01 || Math.abs(item.velocity) > 0.01;
      };

      const snap = (item, value) => {
        item.value = value;
        item.velocity = 0;
      };

      const toDesk = (clientX, clientY) => {
        const box = root.getBoundingClientRect();
        const kx = root.offsetWidth / (box.width || 1);
        const ky = root.offsetHeight / (box.height || 1);
        return [(clientX - box.left) * kx, (clientY - box.top) * ky];
      };

      const clipBounds = () => {
        const box = root.getBoundingClientRect();
        let left = 0;
        let top = 0;
        let right = window.innerWidth;
        let bottom = window.innerHeight;
        for (let node = root.parentElement; node && node !== document.body; node = node.parentElement) {
          const computed = getComputedStyle(node);
          if (/(hidden|clip|auto|scroll)/.test(`${computed.overflowX} ${computed.overflowY}`)) {
            const rect = node.getBoundingClientRect();
            left = Math.max(left, rect.left);
            top = Math.max(top, rect.top);
            right = Math.min(right, rect.right);
            bottom = Math.min(bottom, rect.bottom);
            break;
          }
        }
        const kx = root.offsetWidth / (box.width || 1);
        const ky = root.offsetHeight / (box.height || 1);
        return {
          left: (left - box.left) * kx,
          top: (top - box.top) * ky,
          right: (right - box.left) * kx,
          bottom: (bottom - box.top) * ky
        };
      };

      const overFolder = (x, y) => {
        const geometry = this.g;
        if (geometry.book) {
          const shift = (geometry.w / 2) * clamp(-state.front.value / 180, 0, 1);
          const left = state.front.value < -90 ? shift - geometry.w : shift;
          return x >= left && x <= shift + geometry.w && y >= geometry.tabH * 0.5 && y <= geometry.tabH + geometry.h;
        }
        return x >= 0 && x <= geometry.w && y >= 0 && y <= geometry.tabH + geometry.h;
      };

      const inPocket = item => {
        const geometry = this.g;
        const halfW = (geometry.docW * item.s.value) / 2;
        const halfH = (geometry.docH * item.s.value) / 2;
        if (geometry.book) {
          if (state.front.value < -60) return false;
          const shift = (geometry.w / 2) * clamp(-state.front.value / 180, 0, 1);
          return (
            item.x.value - halfW < shift + geometry.w &&
            item.x.value + halfW > shift &&
            item.y.value + halfH > geometry.tabH &&
            item.y.value - halfH < geometry.tabH + geometry.h
          );
        }
        if (state.front.value < -45) return false;
        return (
          item.y.value + halfH > geometry.frontTop + 4 * geometry.scale &&
          item.x.value + halfW > 0 &&
          item.x.value - halfW < geometry.w
        );
      };

      const velocityOf = samples => {
        if (samples.length < 2) return [0, 0];
        const first = samples[0];
        const last = samples[samples.length - 1];
        const span = Math.max(0.016, (last[0] - first[0]) / 1000);
        return [(last[1] - first[1]) / span, (last[2] - first[2]) / span];
      };

      const phaseOf = (time) => {
        if (this.isOpen) return 'open';
        if (state.receiving || time < state.receiveUntil) return 'receive';
        if (this.options.peek && state.hovered && !state.drag?.active) return 'peek';
        return 'rest';
      };

      const place = (rank, inside, phase) => {
        if (this.g.book) return placeBook(rank, inside, phase, this.options.layout, this.g);
        const pointer = state.hovered ? ((state.pointerX + 1) / 2) * this.g.w : null;
        return placeFlap(rank, inside, phase, this.options.layout, this.g, pointer);
      };

      const approach = (item, slot) => {
        const geometry = this.g;
        if (item.insertFrom === 'side') {
          return { ...slot, x: Math.max(slot.x, geometry.w + geometry.docW * 0.54 * slot.s) };
        }
        return { ...slot, y: Math.min(slot.y, geometry.frontTop - geometry.docH * 0.5 * slot.s - 8 * geometry.scale) };
      };

      const write = () => {
        const { w, h, tabH, frontTop, frontH, docW, docH, scale, book: isBook } = this.g;
        const pivotX = w / 2;
        const pivotY = tabH + h / 2;
        const theta = state.front.value;
        const angle = (theta * Math.PI) / 180;
        const unfold = isBook ? clamp(-theta / 180, 0, 1) : 0;
        const shift = (w / 2) * unfold * (1 - state.anchor.value);
        const zoom = (1 + state.lift.value * 0.012) * state.squash.value * (0.94 + 0.06 * state.appear);
        root.style.opacity = state.appear < 0.999 ? state.appear.toFixed(3) : '';
        const desk = chain(
          move(pivotX, pivotY),
          turnX(state.rx.value),
          turnY(state.ry.value),
          stretch(zoom, zoom),
          move(-pivotX, -pivotY)
        );
        const folder = multiply(desk, move(shift, 0));
        const flipped = isBook && theta < -90;
        const frontZ = flipped ? '3' : '40';

        if (this.back) {
          this.back.style.transform = toCss(folder);
          this.back.style.setProperty('--folder-gutter', unfold.toFixed(3));
          this.back.style.setProperty(
            '--folder-label',
            (isBook ? 1 : 1 - clamp((-theta - 18) / 26, 0, 1)).toFixed(3)
          );
        }

        const frontMatrix = isBook
          ? chain(folder, move(0, frontTop, 2 * scale * (1 - unfold)), turnY(theta))
          : chain(folder, move(0, tabH + h, 2 * scale), turnX(theta), move(0, -frontH));
        const facing = isBook
          ? Math.sin(angle) * -0.42 + Math.cos(angle) * 0.9
          : Math.sin(angle) * 0.5 + Math.cos(angle) * 0.86;
        const light = (flipped ? -facing : facing) / (isBook ? 0.9 : 0.86);
        const glint = clamp((light - 1) * 0.9, 0, 0.18);
        const dim = clamp((1 - light) * (isBook ? 0.5 : 0.22), 0, 0.5);

        if (this.front) {
          this.front.style.transform = toCss(frontMatrix);
          this.front.style.zIndex = frontZ;
          this.front.dataset.face = flipped ? 'inner' : 'outer';
          this.front.style.setProperty('--folder-glint', glint.toFixed(3));
          this.front.style.setProperty('--folder-dim', dim.toFixed(3));
        }

        const rise = isBook ? Math.max(0, Math.sin(-angle)) : 0;
        if (this.ground) {
          this.ground.style.transform = toCss(multiply(folder, move(0, isBook ? tabH : tabH + h)));
          this.ground.style.opacity = (0.75 + state.lift.value * 0.25).toFixed(3);
        }
        if (this.cast) {
          this.cast.style.transform = toCss(
            chain(folder, move(w * rise * 0.12, frontTop + h * rise * 0.04), stretch(Math.cos(angle), 1))
          );
          this.cast.style.opacity = (flipped ? 1 - rise * 0.7 : 0).toFixed(3);
        }
        if (this.shade) {
          const edge = w * Math.cos(angle) + w * rise * 0.36;
          this.shade.style.transform = toCss(
            chain(folder, move(0, frontTop + h * rise * 0.03), stretch(edge / w, 1))
          );
          this.shade.style.zIndex = edge > 0 ? '39' : '2';
          this.shade.style.opacity = (clamp(rise * 4, 0, 1) * (1 - rise * 0.45)).toFixed(3);
        }

        const outs = state.items
          .map((item, index) => [item, index])
          .filter(([item]) => item.layer === 'out')
          .sort((a, b) => a[0].outOrder - b[0].outOrder)
          .map(([, index]) => index);

        state.items.forEach((item, index) => {
          const node = this.itemNodes[index];
          const z = 3 * scale + item.z.value + item.hover.value * 26 * scale;
          const matrix = chain(
            desk,
            move(item.x.value + item.mx.value, item.y.value + item.my.value, z),
            turnY(item.ry.value),
            turnZ(item.r.value),
            stretch(item.s.value, item.s.value),
            move(-docW / 2, -docH / 2)
          );
          let layer = 10 + this.entries.length - item.rank;
          if (item.layer === 'inside' && state.phase === 'open' && state.hoveredItem === index) layer = 30;
          if (item.layer === 'out') layer = LAYERS.out + outs.indexOf(index);
          if (item.layer === 'drag') layer = LAYERS.drag;
          if (item.layer === 'focus') layer = LAYERS.focus;

          if (!node) return;
          node.style.transform = toCss(matrix);
          node.style.zIndex = String(layer);
          node.style.setProperty('--folder-lift', clamp(item.hover.value, 0, 2.4).toFixed(3));
          node.style.opacity = item.alpha.value < 0.995 ? Math.max(0, item.alpha.value).toFixed(3) : '';
        });
      };

      const frame = now => {
        state.raf = 0;
        const geometry = this.g;
        const time = now / 1000;
        const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
        state.last = now;
        const zeta = reduce ? 1 : 1 - 0.72 * this.options.bounce;
        const frontOmega = TAU * (geometry.book ? 1.55 : 2) * this.options.speed;
        const itemOmega = TAU * 2.1 * this.options.speed;
        const soft = TAU * 1.6 * this.options.speed;
        const phase = phaseOf(time);
        if (phase !== state.phase) {
          state.previous = state.phase;
          state.phase = phase;
          state.changedAt = now;
        }
        const elapsed = (now - state.changedAt) / 1000;
        let busy = time < state.receiveUntil;

        const ranks = [];
        state.items.forEach((item, index) => {
          if (item.place === 'inside') ranks.push(index);
        });
        const inside = ranks.length;
        ranks.forEach((index, rank) => {
          state.items[index].rank = rank;
        });
        if (state.focus >= 0 && phase !== 'open' && state.items[state.focus]?.place === 'inside') state.focus = -1;

        const intro = state.intro;
        if (!state.ready) intro.opening = this.isOpen;
        if (intro.phase === 'run' && !intro.opening && (this.isOpen || state.drag?.active)) intro.phase = 'done';
        const introTime = intro.phase === 'run' ? time - intro.start : 0;
        const staged = intro.phase !== 'done' && !intro.opening;
        const closeAt = (0.16 + inside * 0.085 + 0.3) / this.options.speed;
        const holding = staged && introTime < closeAt;
        const dropAt = rank => (0.16 + (inside - 1 - rank) * 0.085) / this.options.speed;
        const introPose = (item, slot) =>
          geometry.book
            ? { ...slot, r: slot.r + (item.rank % 2 ? 7 : -6), s: slot.s * 1.12 }
            : {
                ...slot,
                y: slot.y - (geometry.h * 0.8 + geometry.docH * 0.5),
                r: slot.r + (item.rank % 2 ? 9 : -7)
              };
        if (intro.phase === 'run') {
          busy = true;
          if (introTime > (intro.opening ? 1.4 : closeAt + 1) / this.options.speed) intro.phase = 'done';
        }
        const appear = intro.phase === 'wait' ? 0 : intro.phase === 'run' ? clamp(introTime / (0.34 / this.options.speed), 0, 1) : 1;
        state.appear = 1 - (1 - appear) ** 3;

        const closing = state.previous === 'open' && phase !== 'open';
        const frontDelay = closing && !reduce ? ((geometry.book ? 0.1 : 0.06) + 0.035 * inside) / this.options.speed : 0;
        const frontPhase = elapsed < frontDelay ? state.previous : phase;
        const frontTarget = holding
          ? geometry.book
            ? -150
            : -42
          : (geometry.book ? BOOK_ANGLES : FLAP_ANGLES)[frontPhase];

        if (!state.ready) {
          state.ready = true;
          const opening = intro.phase !== 'done' && intro.opening;
          if (opening) {
            state.phase = 'rest';
            state.previous = 'rest';
          }
          snap(state.front, opening ? 0 : frontTarget);
          snap(state.anchor, staged ? 1 : 0);
          state.items.forEach(item => {
            const slot = place(item.rank, inside, opening ? 'rest' : phase);
            const target = staged ? introPose(item, slot) : slot;
            snap(item.x, target.x);
            snap(item.y, target.y);
            snap(item.z, target.z);
            snap(item.r, target.r);
            snap(item.ry, target.ry);
            snap(item.s, target.s);
            snap(item.alpha, staged ? 0 : 1);
            snap(item.hover, staged && geometry.book ? 3 : 0);
            item.fresh = false;
          });
        }

        if (intro.phase === 'wait') {
          write();
          state.last = 0;
          return;
        }

        busy = integrate(state.front, frontTarget, frontOmega, zeta, dt) || busy;
        const restitution = 0.2 + 0.35 * this.options.bounce;
        if (geometry.book && state.front.value < -180) {
          state.front.value = -360 - state.front.value;
          state.front.velocity = -state.front.velocity * restitution;
        } else if (state.front.value > 0) {
          state.front.value = -state.front.value;
          state.front.velocity = -state.front.velocity * restitution;
        }
        if (elapsed < frontDelay) busy = true;
        busy = integrate(state.anchor, staged ? 1 : 0, frontOmega, 1, dt) || busy;

        const engaged = state.hovered && !reduce;
        busy = integrate(state.rx, engaged ? -state.pointerY * 8 * this.options.tilt : 0, soft, 1, dt) || busy;
        busy = integrate(state.ry, engaged ? state.pointerX * 10 * this.options.tilt : 0, soft, 1, dt) || busy;
        busy = integrate(state.lift, state.hovered && phase !== 'open' ? 1 : 0, soft, 1, dt) || busy;
        busy = integrate(state.squash, state.pressed ? 0.975 : 1, TAU * 3.2, 0.6, dt) || busy;

        const opening = phase === 'open' && state.previous !== 'open';
        const drag = state.drag?.active ? state.drag : null;
        const hover = state.hoveredItem;
        const hovering = !drag && hover >= 0 && state.items[hover] ? state.items[hover] : null;
        const lead =
          hovering && hovering.place === 'inside' && phase === 'open' ? place(hovering.rank, inside, 'open') : null;
        const focusScale = clamp(((geometry.tabH + geometry.h) * 1.18) / geometry.docH, 1.2, 2.2);
        const focusY = geometry.book ? geometry.tabH + geometry.h / 2 : geometry.tabH + geometry.h * 0.36;

        state.items.forEach((item, index) => {
          if (item.fresh) {
            const start = place(item.rank, inside, 'rest');
            snap(item.x, start.x);
            snap(item.y, start.y);
            snap(item.r, start.r);
            item.fresh = false;
          }
          let target;
          let omega = itemOmega;
          let damping = zeta;
          let lift = 0;
          let fade = 1;
          let magnet = false;
          if (state.focus === index) {
            target = { x: geometry.w / 2, y: focusY, z: 0, r: 0, ry: 0, s: focusScale };
            lift = 2.4;
            item.layer = 'focus';
          } else if (drag && drag.index === index) {
            const [vx] = velocityOf(drag.samples);
            target = {
              x: state.deskX + drag.grabX,
              y: state.deskY + drag.grabY,
              z: 0,
              r: clamp(vx * 0.012, -14, 14),
              ry: 0,
              s: drag.scale * 1.05
            };
            omega = TAU * 5;
            damping = 0.78;
            lift = 1.4;
            if (!item.elevated && !inPocket(item)) item.elevated = true;
            item.layer = item.elevated ? 'drag' : 'inside';
          } else if (item.place === 'out') {
            target = { x: item.outX, y: item.outY, z: 0, r: item.outR, ry: 0, s: item.outS };
            lift = hover === index ? 1 : 0.15;
            magnet = hover === index;
            item.layer = 'out';
          } else {
            const order = opening ? (geometry.book ? inside - 1 - item.rank : item.rank) : item.rank;
            const delay = reduce
              ? 0
              : opening
                ? ((geometry.book ? 0.16 : 0.05) + order * (geometry.book ? 0.055 : 0.045)) / this.options.speed
                : (order * 0.03) / this.options.speed;
            const active = elapsed >= delay ? phase : state.previous;
            target = place(item.rank, inside, active);
            if (elapsed < delay) busy = true;
            if (staged && introTime < dropAt(item.rank)) {
              target = introPose(item, target);
              fade = 0;
              lift = geometry.book ? 3 : 0;
              item.layer = 'inside';
            } else if (item.insertUntil > time) {
              busy = true;
              target = approach(item, target);
              item.layer = 'drag';
              lift = 0.6;
            } else {
              item.insertUntil = 0;
              item.elevated = false;
              item.layer = 'inside';
              if (lead && active === 'open') {
                if (hover === index) {
                  target = { ...target, y: target.y - 6 * geometry.scale, r: target.r * 0.2, ry: 0, s: target.s * 1.05 };
                  lift = 1;
                  magnet = true;
                } else {
                  const distance = target.x - lead.x;
                  target = {
                    ...target,
                    x:
                      target.x +
                      Math.sign(distance) * 12 * geometry.scale * Math.max(0, 1 - Math.abs(distance) / (geometry.w * 1.1))
                  };
                  lift = 0.2;
                }
              } else if (active === 'open') {
                lift = 0.2;
              }
            }
          }
          busy = integrate(item.x, target.x, omega, damping, dt) || busy;
          busy = integrate(item.y, target.y, omega, damping, dt) || busy;
          if (!geometry.book && item.layer === 'inside') {
            const tilt = (item.r.value * Math.PI) / 180;
            const reach =
              ((geometry.docW * Math.abs(Math.sin(tilt)) + geometry.docH * Math.abs(Math.cos(tilt))) * item.s.value) / 2;
            const floor = geometry.tabH + geometry.h - 2 * geometry.scale - reach;
            if (item.y.value > floor) {
              item.y.value = floor;
              if (item.y.velocity > 0) item.y.velocity *= -0.25;
            }
          }
          busy = integrate(item.z, target.z, itemOmega, zeta, dt) || busy;
          busy = integrate(item.r, target.r, omega, damping, dt) || busy;
          busy = integrate(item.ry, target.ry, itemOmega, zeta, dt) || busy;
          busy = integrate(item.s, target.s, itemOmega, zeta, dt) || busy;
          busy = integrate(item.hover, lift, itemOmega, zeta, dt) || busy;
          busy = integrate(item.alpha, fade, TAU * 3 * this.options.speed, 1, dt) || busy;
          busy = integrate(item.mx, magnet ? item.localX * 7 * geometry.scale : 0, soft, 0.85, dt) || busy;
          busy = integrate(item.my, magnet ? item.localY * 7 * geometry.scale : 0, soft, 0.85, dt) || busy;
        });

        write();
        if (busy || drag) state.raf = requestAnimationFrame(frame);
        else state.last = 0;
      };

      const wake = () => {
        if (!state.raf) state.raf = requestAnimationFrame(frame);
      };

      const updateReceiving = () => {
        const drag = state.drag;
        const item = drag ? state.items[drag.index] : null;
        state.receiving = Boolean(
          drag?.active && item && (item.place === 'out' || item.elevated) && overFolder(state.deskX, state.deskY)
        );
      };

      const startDrag = drag => {
        const item = state.items[drag.index];
        if (!item) return;
        drag.active = true;
        drag.grabX = item.x.value - drag.downX;
        drag.grabY = item.y.value - drag.downY;
        drag.scale = item.place === 'out' ? item.outS : item.s.value;
        drag.clip = clipBounds();
        state.suppressClick = true;
        if (state.focus === drag.index) state.focus = -1;
        item.elevated = item.place === 'out' || !inPocket(item);
        root.dataset.dragging = '';
      };

      const drop = (drag, cancelled) => {
        const item = state.items[drag.index];
        state.receiving = false;
        delete root.dataset.dragging;
        if (!item) return;
        const time = performance.now() / 1000;
        const [vx, vy] = cancelled ? [0, 0] : velocityOf(drag.samples);
        if (overFolder(state.deskX, state.deskY)) {
          const entering = item.place === 'out' || item.elevated;
          item.place = 'inside';
          if (entering && !reduce) {
            item.insertUntil = time + 0.24 / this.options.speed;
            item.insertFrom = this.g.book ? (state.front.value < -90 ? null : 'side') : 'top';
            if (!item.insertFrom) item.insertUntil = 0;
            state.receiveUntil = item.insertUntil ? item.insertUntil + 0.14 / this.options.speed : 0;
          }
          item.elevated = false;
          return;
        }
        const clip = drag.clip ?? clipBounds();
        const halfW = (this.g.docW * drag.scale) / 2;
        const halfH = (this.g.docH * drag.scale) / 2;
        const x = state.deskX + drag.grabX + clamp(vx, -2400, 2400) * 0.09;
        const y = state.deskY + drag.grabY + clamp(vy, -2400, 2400) * 0.09;
        item.place = 'out';
        item.elevated = true;
        const margin = 8 * this.g.scale;
        const reachX = halfW * 1.08 + margin;
        const reachY = halfH * 1.08 + margin;
        item.outX = clamp(x, clip.left + reachX, Math.max(clip.left + reachX, clip.right - reachX));
        item.outY = clamp(y, clip.top + reachY, Math.max(clip.top + reachY, clip.bottom - reachY));
        item.outR = clamp(item.r.value * 0.5 + clamp(vx, -2400, 2400) * 0.003 + DROP_TURN[drag.index % 6] * 0.6, -12, 12);
        item.outS = drag.scale;
        state.dropCount += 1;
        item.outOrder = state.dropCount;
      };

      const onMove = event => {
        const drag = state.drag;
        if (drag && event.pointerId === drag.id) {
          const [x, y] = toDesk(event.clientX, event.clientY);
          state.deskX = x;
          state.deskY = y;
          const now = performance.now();
          drag.samples.push([now, x, y]);
          while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
          if (!drag.active) {
            const threshold = event.pointerType === 'touch' ? 8 : 4;
            if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > threshold) startDrag(drag);
          }
          if (drag.active) updateReceiving();
          wake();
        }
        if (event.pointerType === 'touch') return;
        const box = root.getBoundingClientRect();
        state.pointerX = clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1.5, 1.5);
        state.pointerY = clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1.5, 1.5);
        const target = event.target.closest?.('[data-folder-item]');
        const index = target && root.contains(target) ? Number(target.getAttribute('data-folder-item')) : -1;
        state.hoveredItem = index;
        if (target && index >= 0 && !state.drag?.active) {
          const rect = target.getBoundingClientRect();
          const item = state.items[index];
          if (item) {
            item.localX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
            item.localY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
          }
        }
        if (!state.hovered) {
          state.hovered = true;
          if (this.options.openOn === 'hover') this.setOpen(true);
        }
        wake();
      };

      const onLeave = event => {
        if (event.pointerType === 'touch' || state.drag?.active) return;
        state.hovered = false;
        state.pressed = false;
        state.hoveredItem = -1;
        if (this.options.openOn === 'hover') this.setOpen(false);
        wake();
      };

      const onDown = event => {
        if (event.button > 0) return;
        state.suppressClick = false;
        const target = event.target.closest?.('[data-folder-item]');
        if (target && root.contains(target) && this.options.draggable) {
          const [x, y] = toDesk(event.clientX, event.clientY);
          state.deskX = x;
          state.deskY = y;
          state.drag = {
            index: Number(target.getAttribute('data-folder-item')),
            id: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            downX: x,
            downY: y,
            grabX: 0,
            grabY: 0,
            scale: 1,
            clip: null,
            active: false,
            samples: [[performance.now(), x, y]]
          };
          try {
            target.setPointerCapture(event.pointerId);
          } catch {
            state.drag.id = event.pointerId;
          }
        } else {
          state.pressed = true;
        }
        wake();
      };

      const onUp = event => {
        state.pressed = false;
        const drag = state.drag;
        if (drag && event.pointerId === drag.id) {
          state.drag = null;
          if (drag.active) drop(drag, event.type === 'pointercancel');
        }
        wake();
      };

      const onDocumentDown = event => {
        if (root.contains(event.target)) return;
        if (state.focus >= 0) {
          state.focus = -1;
          wake();
        }
        if (this.isOpen && this.options.closeOnOutsideClick) {
          this.setOpen(false);
        }
      };

      const onKey = event => {
        if (event.key !== 'Escape') return;
        if (state.focus >= 0) {
          state.focus = -1;
          wake();
          return;
        }
        if (this.isOpen && this.options.closeOnOutsideClick) {
          this.setOpen(false);
        }
      };

      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerleave', onLeave);
      root.addEventListener('pointerdown', onDown);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      document.addEventListener('pointerdown', onDocumentDown);
      document.addEventListener('keydown', onKey);

      // Stage click to toggle
      this.stage.addEventListener('click', (event) => {
        if (event.target.closest?.('a')) return; // Allow links inside cards to click
        if (state.suppressClick) {
          state.suppressClick = false;
          return;
        }
        if (state.focus >= 0) {
          state.focus = -1;
          wake();
          return;
        }
        const itemTarget = event.target.closest?.('[data-folder-item]');
        if (itemTarget) {
          const idx = Number(itemTarget.getAttribute('data-folder-item'));
          const interactive = this.isOpen || state.items[idx]?.place === 'out' || state.focus === idx;
          if (interactive && this.options.zoomOnClick) {
            state.focus = state.focus === idx ? -1 : idx;
            wake();
            return;
          }
        }
        if (this.options.openOn === 'hover') return;
        this.setOpen(!this.isOpen);
      });

      this.stage.addEventListener('keydown', (event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.setOpen(!this.isOpen);
        }
      });

      this.state = state;
      this.wake = wake;
      this.cleanup = () => {
        cancelAnimationFrame(state.raf);
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerleave', onLeave);
        root.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        document.removeEventListener('pointerdown', onDocumentDown);
        document.removeEventListener('keydown', onKey);
      };

      wake();
    }

    setOpen(open) {
      if (this.isOpen === open) return;
      this.isOpen = open;
      if (this.isOpen) {
        this.root.dataset.open = '';
      } else {
        delete this.root.dataset.open;
      }
      this.stage.setAttribute('aria-expanded', String(this.isOpen));
      if (typeof this.options.onOpenChange === 'function') {
        this.options.onOpenChange(this.isOpen);
      }
      this.wake();
    }

    toggle() {
      this.setOpen(!this.isOpen);
    }

    destroy() {
      if (this.cleanup) this.cleanup();
      this.container.innerHTML = '';
    }
  }

  window.Folder = Folder;
})(window);
