/**
 * 3D ModelViewer Engine for Graywolftek Center Logo
 * Direct JavaScript recreation of the user's React Three Fiber ModelViewer component:
 * - Exact Graywolftek logo displayed in full cut-out prominence (no enclosing circle)
 * - Real 3D WebGL rendering via Three.js with graceful high-fidelity CSS 3D fallback
 * - Auto-rotation turntable with configurable speed and idle resume delay
 * - Pointer drag-to-rotate with inertia physics, velocity tracking, and exponential decay
 * - Dynamic cursor hover tilt (tiltX & tiltY)
 * - Harmonious floating bob animation: Math.sin(clock * 1.3) * float
 * - Contact shadow scaling and opacity modulation with vertical elevation
 * - Intro rise & twist animation with cubic easing (1 - (1 - t)^3)
 * - Double-click to smoothly reset orientation
 */
(function () {
  'use strict';

  const FOV = 30;
  const INTRO_SECONDS = 1.3;
  const DRAG_SPEED = 0.0065;
  const PITCH_LIMIT = (65 * Math.PI) / 180;
  const toRadians = deg => (deg * Math.PI) / 180;

  const config = {
    url: 'assets/images/logo.png',
    autoRotate: true,
    autoRotateSpeed: 0.45,
    autoRotateDelay: 2,
    dragRotate: true,
    turntable: false,
    hoverTilt: 0.22,
    float: 0.4,
    shadow: true,
    shadowOpacity: 0.55,
    intro: 'rise',
    startAngle: -20,
    tilt: 8,
    resetOnDoubleClick: true
  };

  function initLogoModelViewer() {
    const container = document.getElementById('model-viewer-container');
    const shadowEl = document.querySelector('.orbital-logo-contact-shadow');
    if (!container) return;

    // Motion State matching user's component exactly
    const motion = {
      yaw: toRadians(config.startAngle),
      pitch: toRadians(config.tilt),
      yawVelocity: 0,
      pitchVelocity: 0,
      tiltX: 0,
      tiltY: 0,
      tiltGoalX: 0,
      tiltGoalY: 0,
      spinSpeed: 0,
      idle: 0,
      dragging: false,
      intro: 0,
      clock: 0,
      reset: null
    };

    // Check if Three.js is available
    if (typeof THREE !== 'undefined') {
      initThreeJsViewer(container, shadowEl, motion);
    } else {
      initCss3DViewer(container, shadowEl, motion);
    }
  }

  // =========================================================================
  // WebGL Three.js Implementation (Exact Cut-out Logo in 3D)
  // =========================================================================
  function initThreeJsViewer(container, shadowEl, motion) {
    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.NeutralToneMapping || THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Group Hierarchy matching React Three Fiber Stage
    const placeGroup = new THREE.Group();
    const floatGroup = new THREE.Group();
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();

    scene.add(placeGroup);
    placeGroup.add(floatGroup);
    floatGroup.add(tiltGroup);
    tiltGroup.add(spinGroup);

    // Dynamic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 2.0);
    cyanRim.position.set(-3, -2, -3);
    scene.add(cyanRim);

    const pointFront = new THREE.PointLight(0x60a5fa, 1.8, 10);
    pointFront.position.set(0, 0, 3);
    scene.add(pointFront);

    // Load Exact Graywolftek Logo as 3D Cutout Object
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(config.url, (logoTex) => {
      logoTex.colorSpace = THREE.SRGBColorSpace;
      logoTex.generateMipmaps = true;

      // Aspect ratio of 438 x 570
      const planeH = 2.45;
      const planeW = planeH * (438 / 570);
      const geom = new THREE.PlaneGeometry(planeW, planeH);

      const mat = new THREE.MeshStandardMaterial({
        map: logoTex,
        transparent: true,
        alphaTest: 0.02,
        side: THREE.DoubleSide,
        roughness: 0.25,
        metalness: 0.4
      });

      const logoMesh = new THREE.Mesh(geom, mat);
      spinGroup.add(logoMesh);
    });

    bindPointerEvents(container, motion);

    // Frame Animation Loop
    let lastTime = performance.now();
    function animate(now) {
      requestAnimationFrame(animate);

      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(delta, 0.05);

      updateMotion(motion, dt);

      // Transformations
      const eased = 1 - Math.pow(1 - motion.intro, 3);
      const rise = (1 - eased) * -0.45;
      const grow = 0.9 + 0.1 * eased;
      const twist = (1 - eased) * -0.5;
      const bob = Math.sin(motion.clock * 1.3) * config.float * 0.14;

      floatGroup.position.y = rise + bob;
      floatGroup.scale.setScalar(grow);

      tiltGroup.rotation.set(motion.tiltX, motion.tiltY, 0);
      spinGroup.rotation.set(motion.pitch, motion.yaw + twist, 0, 'YXZ');

      // Update contact shadow
      if (shadowEl) {
        const shadowScale = (1 - bob * 1.6) * grow;
        const shadowOp = config.shadowOpacity * (1 - bob * 1.8);
        shadowEl.style.transform = `scale(${shadowScale.toFixed(3)})`;
        shadowEl.style.opacity = Math.max(0.1, shadowOp).toFixed(3);
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    // Handle Resize
    window.addEventListener('resize', () => {
      const w = container.clientWidth || 200;
      const h = container.clientHeight || 200;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  // =========================================================================
  // High-Fidelity CSS 3D Fallback Implementation (Exact Logo Cutout)
  // =========================================================================
  function initCss3DViewer(container, shadowEl, motion) {
    container.innerHTML = `
      <div class="model-logo-3d-wrapper">
        <div class="model-logo-3d-tilt">
          <div class="model-logo-3d-spin">
            <img src="${config.url}" alt="Graywolftek Exact Logo" class="big-exact-logo" />
          </div>
        </div>
      </div>
    `;

    const tiltEl = container.querySelector('.model-logo-3d-tilt');
    const spinEl = container.querySelector('.model-logo-3d-spin');

    bindPointerEvents(container, motion);

    let lastTime = performance.now();
    function animate(now) {
      requestAnimationFrame(animate);

      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(delta, 0.05);

      updateMotion(motion, dt);

      const eased = 1 - Math.pow(1 - motion.intro, 3);
      const rise = (1 - eased) * -35;
      const twist = (1 - eased) * -35;
      const bob = Math.sin(motion.clock * 1.3) * config.float * 18;

      if (tiltEl) {
        tiltEl.style.transform = `translateY(${(rise + bob).toFixed(2)}px) rotateX(${(motion.tiltX * 57.3).toFixed(2)}deg) rotateY(${(motion.tiltY * 57.3).toFixed(2)}deg)`;
      }

      if (spinEl) {
        const yawDeg = (motion.yaw * 57.3 + twist).toFixed(2);
        const pitchDeg = (motion.pitch * 57.3).toFixed(2);
        spinEl.style.transform = `rotateX(${pitchDeg}deg) rotateY(${yawDeg}deg)`;
      }

      if (shadowEl) {
        const shadowScale = 1 - (bob / 20) * 0.25;
        const shadowOp = config.shadowOpacity * (1 - (bob / 20) * 0.35);
        shadowEl.style.transform = `scale(${shadowScale.toFixed(3)})`;
        shadowEl.style.opacity = Math.max(0.1, shadowOp).toFixed(3);
      }
    }
    requestAnimationFrame(animate);
  }

  // =========================================================================
  // Motion Physics & Pointer Logic (Exact Math from User's Component)
  // =========================================================================
  function updateMotion(m, dt) {
    m.clock += dt;
    m.idle += dt;

    if (m.intro < 1) {
      m.intro = Math.min(1, m.intro + dt / INTRO_SECONDS);
    }

    if (m.reset) {
      m.yaw += (m.reset.yaw - m.yaw) * (1 - Math.exp(-dt * 7));
      m.pitch += (m.reset.pitch - m.pitch) * (1 - Math.exp(-dt * 7));
      if (Math.abs(m.reset.yaw - m.yaw) < 0.001 && Math.abs(m.reset.pitch - m.pitch) < 0.001) {
        m.reset = null;
      }
    } else if (!m.dragging) {
      const decay = Math.exp(-dt * 4.5);
      m.yaw += m.yawVelocity * dt;
      m.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, m.pitch + m.pitchVelocity * dt));
      m.yawVelocity *= decay;
      m.pitchVelocity *= decay;
      if (config.turntable) {
        m.pitch += (toRadians(config.tilt) - m.pitch) * (1 - Math.exp(-dt * 4));
      }
    }

    const spinning = config.autoRotate && !m.dragging && m.idle > config.autoRotateDelay;
    m.spinSpeed += ((spinning ? config.autoRotateSpeed : 0) - m.spinSpeed) * (1 - Math.exp(-dt * 2));
    m.yaw += m.spinSpeed * dt;

    // Hover tilt interpolation
    m.tiltX += (m.tiltGoalX - m.tiltX) * (1 - Math.exp(-dt * 6));
    m.tiltY += (m.tiltGoalY - m.tiltY) * (1 - Math.exp(-dt * 6));
  }

  function bindPointerEvents(element, motion) {
    const pointers = new Map();

    const onDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, t: event.timeStamp });
      motion.dragging = true;
      motion.yawVelocity = 0;
      motion.pitchVelocity = 0;
      motion.idle = 0;
      element.style.cursor = 'grabbing';
      if (element.setPointerCapture) {
        element.setPointerCapture(event.pointerId);
      }
    };

    const onMove = (event) => {
      const rect = element.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      motion.tiltGoalX = ny * config.hoverTilt * 0.6;
      motion.tiltGoalY = nx * config.hoverTilt;

      const last = pointers.get(event.pointerId);
      if (last && motion.dragging) {
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        const elapsed = Math.max((event.timeStamp - last.t) / 1000, 1 / 240);
        last.x = event.clientX;
        last.y = event.clientY;
        last.t = event.timeStamp;

        motion.yaw += dx * DRAG_SPEED;
        motion.yawVelocity = motion.yawVelocity * 0.4 + ((dx * DRAG_SPEED) / elapsed) * 0.6;

        if (!config.turntable) {
          motion.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, motion.pitch + dy * DRAG_SPEED));
          motion.pitchVelocity = motion.pitchVelocity * 0.4 + ((dy * DRAG_SPEED) / elapsed) * 0.6;
        }
        motion.idle = 0;
      }
    };

    const onUp = (event) => {
      const last = pointers.get(event.pointerId);
      if (last && event.timeStamp - last.t > 80) {
        motion.yawVelocity = 0;
        motion.pitchVelocity = 0;
      }
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        motion.dragging = false;
        element.style.cursor = 'grab';
      }
    };

    const onLeave = () => {
      motion.tiltGoalX = 0;
      motion.tiltGoalY = 0;
    };

    const onDoubleClick = () => {
      if (!config.resetOnDoubleClick) return;
      const turns = Math.round((motion.yaw - toRadians(config.startAngle)) / (Math.PI * 2));
      motion.reset = { yaw: toRadians(config.startAngle) + turns * Math.PI * 2, pitch: toRadians(config.tilt) };
      motion.yawVelocity = 0;
      motion.pitchVelocity = 0;
      motion.idle = 0;
    };

    element.style.cursor = 'grab';
    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);
    element.addEventListener('pointerleave', onLeave);
    element.addEventListener('dblclick', onDoubleClick);
  }

  // Auto-initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoModelViewer);
  } else {
    initLogoModelViewer();
  }
})();
