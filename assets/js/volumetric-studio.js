/**
 * Volumetric Studio 3D Stage & Lighting Engine
 * Faithful recreation of the 21st.dev Volumetric Studio React component animation:
 * - Authentic electrical soundstage flicker sequence (off -> flash -> off -> pulses -> full bloom)
 * - Synchronized staggered entrance for title (delay: 1.7s), subtitle (delay: 1.9s), and CTAs (delay: 2.1s)
 * - SplitFlap mechanical departure board initialization triggered right as spotlights illuminate
 * - Subtle interactive pointer parallax on beam cones and floor light pools
 */
(function () {
  'use strict';

  function initVolumetricStudio() {
    const room = document.querySelector('.vs-room');
    const contentLayer = document.querySelector('.vs-content-layer');
    if (!room) return;

    // Sleep utility
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Exact electrical lamp warm-up flicker sequence from Volumetric Studio React component:
    // 600ms initial sleep -> 100ms flash -> 300ms pause -> 50ms flash -> 200ms pause -> 
    // 40ms flash -> 60ms gap -> 40ms flash -> 400ms pause -> Full Steady ON (~1790ms total)
    async function runFlickerSequence() {
      room.classList.add('flickering');
      room.classList.remove('lights-on');
      if (contentLayer) contentLayer.classList.remove('revealed');

      // Initial dark pause: 600ms
      await sleep(600);

      // Flash 1: 100ms
      room.classList.add('lights-on');
      await sleep(100);
      room.classList.remove('lights-on');

      // Pause: 300ms
      await sleep(300);

      // Flash 2: 50ms
      room.classList.add('lights-on');
      await sleep(50);
      room.classList.remove('lights-on');

      // Pause: 200ms
      await sleep(200);

      // Pulse 3: 40ms
      room.classList.add('lights-on');
      await sleep(40);
      room.classList.remove('lights-on');

      // Gap: 60ms
      await sleep(60);

      // Pulse 4: 40ms
      room.classList.add('lights-on');
      await sleep(40);
      room.classList.remove('lights-on');

      // Dark pause before main strike: 400ms
      await sleep(400);

      // Full steady power ignition!
      room.classList.remove('flickering');
      room.classList.add('lights-on');

      // Reveal title, subtitle, and CTAs with Framer Motion ease [0.16, 1, 0.3, 1]
      if (contentLayer) {
        contentLayer.classList.add('revealed');
      }

      // Trigger SplitFlap mechanical flip animation in perfect sync with the lights turning on
      if (typeof window.startHeroSplitFlap === 'function') {
        window.startHeroSplitFlap();
      }
    }

    // Interactive pointer parallax deflection on spotlights and floor pool
    const studio = document.querySelector('.volumetric-studio-container');
    if (studio) {
      const beams = studio.querySelectorAll('.vs-beam-cone');
      const pools = studio.querySelector('.vs-pool-floor');

      studio.addEventListener('pointermove', (e) => {
        const rect = studio.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        
        beams.forEach((beam, idx) => {
          const factor = (idx === 1 ? 16 : idx === 0 ? 12 : 20);
          beam.style.transform = `translateX(calc(-50% + ${(x * factor).toFixed(1)}px)) rotate(${(x * 2.8).toFixed(2)}deg)`;
        });

        if (pools) {
          pools.style.transform = `translateX(${(x * 14).toFixed(1)}px)`;
        }
      });

      studio.addEventListener('pointerleave', () => {
        beams.forEach((beam) => {
          beam.style.transform = 'translateX(-50%) rotate(0deg)';
          beam.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        });
        if (pools) {
          pools.style.transform = 'translateX(0px)';
          pools.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        }
        setTimeout(() => {
          beams.forEach(b => b.style.transition = '');
          if (pools) pools.style.transition = '';
        }, 600);
      });
    }

    runFlickerSequence();
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVolumetricStudio);
  } else {
    initVolumetricStudio();
  }
})();
