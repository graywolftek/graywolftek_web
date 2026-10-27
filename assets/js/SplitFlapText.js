/**
 * SplitFlapText - Mechanical departure-board split-flap animation
 * Faithful Vanilla JS implementation of the React SplitFlapText component.
 */
(function(window) {
  'use strict';

  const DEFAULT_WORDS = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

  const CHARSETS = {
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    numeric: '0123456789'
  };

  const toCssUnit = value => (typeof value === 'number' ? `${value}px` : value);

  const resolveCharset = charset => {
    if (CHARSETS[charset]) return CHARSETS[charset];
    return typeof charset === 'string' && charset.length > 0 ? charset : CHARSETS.alphanumeric;
  };

  const normalizePhrase = (phrase, width, align = 'left') => {
    const safe = String(phrase ?? '').slice(0, width);
    if (align === 'right') return safe.padStart(width, ' ');
    if (align === 'center') {
      return safe.padStart(safe.length + Math.floor((width - safe.length) / 2), ' ').padEnd(width, ' ');
    }
    return safe.padEnd(width, ' ');
  };

  const sampleChar = charset => charset.charAt(Math.floor(Math.random() * charset.length)) || ' ';

  const buildSequence = (target, flips, charset) => {
    const steps = [];
    for (let i = 0; i < flips; i += 1) {
      steps.push(sampleChar(charset));
    }
    steps.push(target);
    return steps;
  };

  const toGlyph = char => (char === ' ' || !char ? '\u00A0' : char);

  const shuffleIndices = count => {
    const list = Array.from({ length: count }, (_, index) => index);
    for (let i = count - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  const cascadeStep = (index, width, order, randomOrder) => {
    if (order === 'right') return width - 1 - index;
    if (order === 'center') return Math.floor(Math.abs(index - (width - 1) / 2));
    if (order === 'random' && randomOrder) return randomOrder[index];
    return index;
  };

  const clampUnit = value => Math.min(1, Math.max(0, Number(value) || 0));
  const round = value => Number(value.toFixed(3));

  const getReducedMotion = () =>
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  class SplitFlapText {
    constructor(options = {}) {
      this.target = typeof options.target === 'string'
        ? document.querySelector(options.target)
        : options.target;

      if (!this.target) {
        console.warn('SplitFlapText: target element not found for', options.target);
        return;
      }

      this.words = Array.isArray(options.words) && options.words.length > 0 ? options.words : DEFAULT_WORDS;
      this.text = options.text;
      this.flipDuration = options.flipDuration ?? 0.12;
      this.stagger = options.stagger ?? 0.06;
      this.cycleDelay = options.cycleDelay ?? 2400;
      this.charset = options.charset ?? 'alphanumeric';
      this.flipsPerChar = options.flipsPerChar ?? 8;
      this.tileColor = options.tileColor ?? '#111827';
      this.textColor = options.textColor ?? '#f8fafc';
      this.tileRadius = options.tileRadius ?? 8;
      this.gap = options.gap ?? 6;
      this.fontSize = options.fontSize ?? 52;
      this.loop = options.loop ?? true;
      this.padTo = options.padTo ?? 12;
      this.align = options.align ?? 'left';
      this.intro = options.intro ?? true;
      this.glare = options.glare ?? 0;
      this.depth = options.depth ?? 0.5;
      this.order = options.order ?? 'left';
      this.tileStyle = options.tileStyle ?? 'board';
      this.className = options.className ?? '';
      this.style = options.style ?? {};

      this.rafId = null;
      this.timerId = null;
      this.shown = null;
      this.from = null;
      this.index = 0;
      this.isDestroyed = false;

      this.init();
    }

    init() {
      const phrasesKey = typeof this.text === 'string'
        ? this.text
        : this.words.map(w => String(w ?? '')).join('\u001f');
      this.phrases = phrasesKey.split('\u001f');

      const longest = this.phrases.reduce((max, phrase) => Math.max(max, phrase.length), 1);
      this.width = Math.max(1, Math.ceil(Number(this.padTo) || 0), longest);

      this.normalizedPhrases = this.phrases.map(p => normalizePhrase(p, this.width, this.align));

      this.timing = {
        flipMs: Math.max(40, (Number(this.flipDuration) || 0.12) * 1000),
        staggerMs: Math.max(0, (Number(this.stagger) || 0) * 1000),
        holdMs: Math.max(400, Number(this.cycleDelay) || 2400),
        flips: Math.max(0, Math.floor(Number(this.flipsPerChar) || 0)),
        glyphs: resolveCharset(this.charset),
        order: this.order
      };

      this.render();

      this.shown = this.intro ? ' '.repeat(this.width) : this.normalizedPhrases[0];

      let startDuration = 0;
      if (this.shown === this.normalizedPhrases[0]) {
        this.setInitialText(this.shown);
      } else {
        startDuration = this.animateTo(this.normalizedPhrases[0]);
      }

      if (this.normalizedPhrases.length > 1) {
        this.scheduleNext(this.timing.holdMs + startDuration);
      }
    }

    render() {
      const minimal = this.tileStyle === 'minimal';
      const level = clampUnit(this.depth);
      const flat = Math.min(1, level * 2);
      const deep = Math.max(0, level - 0.5) * 2;
      const sheen = minimal ? 0 : clampUnit(this.glare);
      this.shaded = !minimal && deep > 0;

      const rootClass = [
        'split-flap-text',
        minimal && 'split-flap-text--minimal',
        sheen > 0 && 'split-flap-text--glare',
        this.className
      ].filter(Boolean).join(' ');

      this.container = document.createElement('div');
      this.container.className = rootClass;

      const componentStyle = {
        '--split-flap-tile-color': this.tileColor,
        '--split-flap-text-color': this.textColor,
        '--split-flap-radius': toCssUnit(this.tileRadius),
        '--split-flap-gap': toCssUnit(this.gap),
        '--split-flap-font-size': toCssUnit(this.fontSize),
        '--split-flap-flip-duration': `${Math.max(0.04, Number(this.flipDuration) || 0.12)}s`,
        '--split-flap-front-from': round(1 + 0.08 * flat),
        '--split-flap-front-to': round(1 - 0.48 * flat - 0.3 * deep),
        '--split-flap-back-from': round(1 - 0.42 * flat - 0.3 * deep),
        '--split-flap-hinge': `calc(1px + ${round(deep * 0.05)}em)`,
        '--split-flap-hinge-shade': round(0.25 + 0.39 * flat + 0.21 * deep),
        '--split-flap-drop': round(0.28 * flat + 0.2 * deep),
        '--split-flap-lift': round(0.4 + 0.6 * flat + 0.7 * deep),
        '--split-flap-cast': round(deep * 0.62),
        '--split-flap-edge': `${round(deep * 0.035)}em`,
        '--split-flap-split': `${round(0.015 + level * 0.06)}em`,
        '--split-flap-glare': round(sheen * 0.55),
        ...this.style
      };

      for (const [key, value] of Object.entries(componentStyle)) {
        this.container.style.setProperty(key, value);
      }

      this.srEl = document.createElement('span');
      this.srEl.className = 'split-flap-text__sr';
      this.srEl.textContent = String(this.phrases[0] ?? '').trim();
      this.container.appendChild(this.srEl);

      this.tiles = [];
      for (let i = 0; i < this.width; i++) {
        const tile = document.createElement('span');
        tile.className = 'split-flap-text__tile';
        tile.setAttribute('aria-hidden', 'true');

        const halfTop = document.createElement('span');
        halfTop.className = 'split-flap-text__half split-flap-text__half--top';
        const charTop = document.createElement('span');
        charTop.className = 'split-flap-text__char';
        charTop.textContent = '\u00A0';
        halfTop.appendChild(charTop);

        const halfBottom = document.createElement('span');
        halfBottom.className = 'split-flap-text__half split-flap-text__half--bottom';
        const charBottom = document.createElement('span');
        charBottom.className = 'split-flap-text__char';
        charBottom.textContent = '\u00A0';
        halfBottom.appendChild(charBottom);

        tile.appendChild(halfTop);
        tile.appendChild(halfBottom);

        this.container.appendChild(tile);

        this.tiles.push({
          tile,
          charTop,
          charBottom,
          current: ' ',
          next: ' ',
          flipping: false,
          flaps: null
        });
      }

      this.target.innerHTML = '';
      this.target.appendChild(this.container);
    }

    setInitialText(text) {
      for (let i = 0; i < this.width; i++) {
        const char = text[i] || ' ';
        this.tiles[i].current = char;
        this.tiles[i].next = char;
        this.tiles[i].charTop.textContent = toGlyph(char);
        this.tiles[i].charBottom.textContent = toGlyph(char);
        if (char === ' ') {
          this.tiles[i].tile.setAttribute('data-empty', 'true');
        } else {
          this.tiles[i].tile.removeAttribute('data-empty');
        }
      }
    }

    updateTileState(index, current, next, flipping) {
      const t = this.tiles[index];
      if (!t) return;

      t.current = current;
      t.next = next;

      t.charTop.textContent = toGlyph(flipping ? next : current);
      t.charBottom.textContent = toGlyph(current);

      if (flipping) {
        t.tile.removeAttribute('data-empty');
        if (!t.flipping) {
          t.tile.classList.add('is-flipping');
          t.flipping = true;
        }

        // Clean previous flaps
        if (t.flaps) {
          t.flaps.remove();
        }

        const flapsWrap = document.createElement('span');
        flapsWrap.style.display = 'contents';

        if (this.shaded) {
          const shadeTop = document.createElement('span');
          shadeTop.className = 'split-flap-text__shade split-flap-text__shade--top';
          const shadeBottom = document.createElement('span');
          shadeBottom.className = 'split-flap-text__shade split-flap-text__shade--bottom';
          flapsWrap.appendChild(shadeTop);
          flapsWrap.appendChild(shadeBottom);
        }

        const flapFront = document.createElement('span');
        flapFront.className = 'split-flap-text__flap split-flap-text__flap--front';
        const charFront = document.createElement('span');
        charFront.className = 'split-flap-text__char';
        charFront.textContent = toGlyph(current);
        flapFront.appendChild(charFront);

        const flapBack = document.createElement('span');
        flapBack.className = 'split-flap-text__flap split-flap-text__flap--back';
        const charBack = document.createElement('span');
        charBack.className = 'split-flap-text__char';
        charBack.textContent = toGlyph(next);
        flapBack.appendChild(charBack);

        flapsWrap.appendChild(flapFront);
        flapsWrap.appendChild(flapBack);

        t.tile.appendChild(flapsWrap);
        t.flaps = flapsWrap;
      } else {
        if (current === ' ') {
          t.tile.setAttribute('data-empty', 'true');
        } else {
          t.tile.removeAttribute('data-empty');
        }
        if (t.flaps) {
          t.flaps.remove();
          t.flaps = null;
        }
        t.tile.classList.remove('is-flipping');
        t.flipping = false;
      }
    }

    stopFrame() {
      if (this.rafId) {
        if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
          window.cancelAnimationFrame(this.rafId);
        } else {
          clearTimeout(this.rafId);
        }
        this.rafId = null;
      }
    }

    animateTo(target) {
      const { flipMs, staggerMs, flips, glyphs, order: cascade } = this.timing;
      const from = normalizePhrase(this.shown ?? target, target.length, this.align);
      const randomOrder = cascade === 'random' ? shuffleIndices(target.length) : null;

      this.stopFrame();
      this.shown = target;

      if (this.srEl) {
        this.srEl.textContent = target.trim();
      }

      const plans = [];
      const prefersReducedMotion = getReducedMotion();

      if (!prefersReducedMotion) {
        for (let i = 0; i < target.length; i += 1) {
          if (from[i] === target[i]) continue;
          plans.push({
            index: i,
            from: from[i],
            target: target[i],
            sequence: buildSequence(target[i], flips, glyphs),
            start: cascadeStep(i, target.length, cascade, randomOrder) * staggerMs,
            step: -1,
            done: false
          });
        }
      }

      if (!plans.length) {
        for (let i = 0; i < target.length; i += 1) {
          this.updateTileState(i, target[i], target[i], false);
        }
        return 0;
      }

      for (let i = 0; i < target.length; i += 1) {
        this.updateTileState(i, from[i], from[i], false);
      }

      const totalDuration = plans.reduce((max, plan) => Math.max(max, plan.start + plan.sequence.length * flipMs), 0);
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

      const requestFrame = typeof window !== 'undefined' && window.requestAnimationFrame
        ? window.requestAnimationFrame.bind(window)
        : cb => setTimeout(() => cb(Date.now()), 16);

      const tick = now => {
        if (this.isDestroyed) return;

        const elapsed = now - startedAt;
        let running = false;

        plans.forEach(plan => {
          const localElapsed = elapsed - plan.start;

          if (localElapsed < 0) {
            running = true;
            return;
          }

          const step = Math.floor(localElapsed / flipMs);

          if (step < plan.sequence.length) {
            running = true;
            if (step !== plan.step) {
              plan.step = step;
              const current = step === 0 ? plan.from : plan.sequence[step - 1];
              const next = plan.sequence[step];
              this.updateTileState(plan.index, current, next, true);
            }
          } else if (!plan.done) {
            plan.done = true;
            this.updateTileState(plan.index, plan.target, plan.target, false);
          }
        });

        if (running) {
          this.rafId = requestFrame(tick);
        } else {
          this.rafId = null;
        }
      };

      this.rafId = requestFrame(tick);
      return totalDuration;
    }

    scheduleNext(delay) {
      this.timerId = window.setTimeout(() => {
        if (this.isDestroyed) return;

        if (document.hidden) {
          this.scheduleNext(this.timing.holdMs);
          return;
        }

        const nextIndex = this.index + 1;
        if (nextIndex >= this.normalizedPhrases.length && !this.loop) return;

        this.index = nextIndex % this.normalizedPhrases.length;
        const duration = this.animateTo(this.normalizedPhrases[this.index]);
        this.scheduleNext(this.timing.holdMs + duration);
      }, delay);
    }

    destroy() {
      this.isDestroyed = true;
      this.stopFrame();
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }
  }

  // Export globally
  window.SplitFlapText = SplitFlapText;

})(typeof window !== 'undefined' ? window : this);
