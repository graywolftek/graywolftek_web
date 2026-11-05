/**
 * Radial Orbital Ecosystem Navigation Engine - Graywolftek
 * Features:
 * - 5 Ecosystem Nodes: Solutions, Product, Project, Partners, About Us
 * - Solutions Node: 3 Interactive Category Cards (Data Center Infrastructure, Staffing Firm, Software & App Development)
 * - Direct navigation to dedicated pages (datacenter.html, staffing.html, software.html, product.html, projects.html, skitre.html, about.html)
 * - Smooth auto-rotation, 3D trigonometric positioning, click-to-center focus, and background resume
 */
(function () {
  'use strict';

  const timelineData = [
    {
      id: 1,
      title: "Solutions",
      icon: "layers",
      badge: "3 CATEGORIES",
      badgeClass: "in-progress",
      badgeSub: "Core Practices",
      headline: "Enterprise Solutions",
      content: "Explore our three specialized technology pillars engineered for scalability, mission-critical infrastructure, and global remote expansion:",
      isSolutions: true,
      categories: [
        {
          name: "Data Center Infrastructure",
          desc: "Compute, cloud & high-density power",
          url: "datacenter.html",
          icon: "server",
          iconColor: "text-cyan-400"
        },
        {
          name: "Staffing Firm",
          desc: "Elite remote engineers & tech pack",
          url: "staffing.html",
          icon: "userCheck",
          iconColor: "text-emerald-400"
        },
        {
          name: "Software & App Development",
          desc: "Bespoke web, mobile & cloud systems",
          url: "software.html",
          icon: "code",
          iconColor: "text-indigo-400"
        }
      ],
      energy: 95
    },
    {
      id: 2,
      title: "Product",
      icon: "package",
      url: "product.html",
      badge: "INNOVATION",
      badgeClass: "completed",
      badgeSub: "R&D Lab",
      headline: "Proprietary Products",
      content: "Explore our proprietary internal tools, automation software, and intelligence platforms engineered for digital enterprise operations.",
      ctaText: "Open Product Page",
      energy: 90
    },
    {
      id: 3,
      title: "Project",
      icon: "briefcase",
      url: "projects.html",
      badge: "PORTFOLIO",
      badgeClass: "completed",
      badgeSub: "Deployments",
      headline: "Featured Projects",
      content: "Proven client case studies, mission-critical integrations, and high-performance engineering milestones delivered across industries.",
      ctaText: "View All Projects",
      energy: 85
    },
    {
      id: 4,
      title: "Partners",
      icon: "users",
      url: "skitre.html",
      badge: "ALLIANCES",
      badgeClass: "completed",
      badgeSub: "Venture",
      headline: "Strategic Partners",
      content: "Collaborating with transformative technology platforms and visionary ventures, including our AI partnership with Skitre.ai.",
      ctaText: "Explore Skitre.ai Partnership",
      energy: 80
    },
    {
      id: 5,
      title: "About Us",
      icon: "info",
      url: "about.html",
      badge: "COMPANY",
      badgeClass: "completed",
      badgeSub: "Mission",
      headline: "About Graywolftek",
      content: "The alpha in remote engineering, high-performance computing, and digital transformation headquartered in Ambedkar Nagar, India.",
      ctaText: "Read Company Story",
      energy: 90
    }
  ];

  // SVG Icon Templates
  const icons = {
    layers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2 17.5"/></svg>`,
    package: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.1Z"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    briefcase: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    server: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
    userCheck: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
    code: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    arrowRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    externalLink: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>`
  };

  function initRadialOrbitalTimeline() {
    const stage = document.getElementById('orbital-stage');
    const container = document.getElementById('radial-orbital-timeline-section');
    if (!stage || !container) return;

    let rotationAngle = 0;
    let autoRotate = true;
    let activeNodeId = null;
    let isCentering = false;
    let targetRotation = 0;
    const nodeElements = {};

    function getRadius() {
      const w = window.innerWidth;
      if (w < 420) return 125;
      if (w < 640) return 145;
      if (w < 1024) return 180;
      return 210;
    }

    // Build the nodes in the DOM
    timelineData.forEach((item, index) => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'orbital-node';
      nodeEl.dataset.id = item.id;
      nodeEl.setAttribute('role', 'button');
      nodeEl.setAttribute('tabindex', '0');
      nodeEl.setAttribute('aria-label', `Graywolftek ${item.title}`);

      // Energy halo
      const halo = document.createElement('div');
      halo.className = 'orbital-energy-halo';
      const haloSize = item.energy * 0.5 + 40;
      halo.style.width = `${haloSize}px`;
      halo.style.height = `${haloSize}px`;
      halo.style.left = `-${(haloSize - 44) / 2}px`;
      halo.style.top = `-${(haloSize - 44) / 2}px`;
      nodeEl.appendChild(halo);

      // Icon circle
      const circle = document.createElement('div');
      circle.className = 'orbital-node-circle';
      circle.innerHTML = icons[item.icon] || '';
      nodeEl.appendChild(circle);

      // Title label (Small circle label replacement)
      const label = document.createElement('div');
      label.className = 'orbital-node-label';
      label.textContent = item.title;
      nodeEl.appendChild(label);

      // Expanded Card Container
      const card = document.createElement('div');
      card.className = 'orbital-expanded-card hidden';

      let cardBody = `
        <div class="orbital-card-pin"></div>
        <div class="flex justify-between items-center mb-2">
          <span class="orbital-badge ${item.badgeClass}">${item.badge}</span>
          <span class="text-xs font-mono text-cyan-400">${item.badgeSub}</span>
        </div>
        <div class="text-sm font-bold text-white mt-1">${item.headline}</div>
        <div class="text-xs text-gray-300 mt-1 leading-relaxed">${item.content}</div>
      `;

      if (item.isSolutions) {
        // Solutions Card: 3 Category Links
        cardBody += `
          <div class="mt-3.5 space-y-2">
            ${item.categories.map(cat => `
              <a href="${cat.url}" class="orbital-service-item group">
                <div class="flex items-center gap-2.5">
                  <div class="orbital-service-icon ${cat.iconColor} group-hover:text-white transition-colors">
                    ${icons[cat.icon]}
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">${cat.name}</div>
                    <div class="text-[10px] text-gray-400">${cat.desc}</div>
                  </div>
                </div>
                <span class="text-gray-400 group-hover:text-white transition-colors">${icons.arrowRight}</span>
              </a>
            `).join('')}
          </div>
        `;
      } else {
        // Single Dedicated Page Link
        cardBody += `
          <div class="mt-3.5 pt-3 border-t border-white/10">
            <a href="${item.url}" class="orbital-action-btn">
              <span>${item.ctaText}</span>
              ${icons.externalLink}
            </a>
          </div>
        `;
      }

      card.innerHTML = cardBody;
      nodeEl.appendChild(card);

      // Node Click handler
      nodeEl.addEventListener('click', (e) => {
        // If clicking inside the card on links/buttons, allow normal navigation
        if (e.target.closest('a') || e.target.closest('button')) {
          return;
        }
        e.stopPropagation();

        // If clicking the active node and it has a direct URL (Product, Project, Partners, About Us),
        // let a second click navigate directly to that page!
        if (activeNodeId === item.id && item.url) {
          window.location.href = item.url;
          return;
        }

        toggleItem(item.id);
      });

      stage.appendChild(nodeEl);
      nodeElements[item.id] = {
        nodeEl,
        halo,
        card,
        item,
        index
      };
    });

    // Toggle / Expand Item
    function toggleItem(id) {
      if (activeNodeId === id) {
        // If already active, close card and resume
        closeAll();
        return;
      }

      activeNodeId = id;
      autoRotate = false;

      const current = nodeElements[id];
      if (!current) return;

      // Center the view on this node (rotate so node is at top center, 270 deg)
      const total = timelineData.length;
      const targetAngle = (current.index / total) * 360;
      targetRotation = (270 - targetAngle + 360) % 360;
      isCentering = true;

      // Update states on all nodes
      Object.keys(nodeElements).forEach((keyId) => {
        const numId = parseInt(keyId, 10);
        const entry = nodeElements[numId];
        const isSelected = numId === id;

        if (isSelected) {
          entry.nodeEl.classList.add('is-expanded');
          entry.card.classList.remove('hidden');
          entry.halo.classList.add('is-pulsing');
        } else {
          entry.nodeEl.classList.remove('is-expanded');
          entry.card.classList.add('hidden');
          entry.halo.classList.remove('is-pulsing');
        }
      });
    }

    function closeAll() {
      activeNodeId = null;
      isCentering = false;
      autoRotate = true;

      Object.keys(nodeElements).forEach((keyId) => {
        const entry = nodeElements[keyId];
        entry.nodeEl.classList.remove('is-expanded');
        entry.card.classList.add('hidden');
        entry.halo.classList.remove('is-pulsing');
      });
    }

    // Click background / container to close
    container.addEventListener('click', (e) => {
      if (e.target.closest('.orbital-expanded-card') || e.target.closest('.orbital-node') || e.target.closest('#orbital-logo-center')) {
        return;
      }
      closeAll();
    });

    // Update Node Positions according to current rotationAngle
    function updatePositions() {
      const radius = getRadius();
      const total = timelineData.length;

      Object.keys(nodeElements).forEach((keyId) => {
        const entry = nodeElements[keyId];
        const angle = ((entry.index / total) * 360 + rotationAngle) % 360;
        const radian = (angle * Math.PI) / 180;

        const x = radius * Math.cos(radian);
        const y = radius * Math.sin(radian);
        const zIndex = Math.round(100 + 50 * Math.cos(radian));
        const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));

        const isExpanded = entry.nodeEl.classList.contains('is-expanded');

        entry.nodeEl.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
        entry.nodeEl.style.zIndex = isExpanded ? 200 : zIndex;
        entry.nodeEl.style.opacity = isExpanded ? 1 : opacity.toFixed(3);
      });
    }

    // Animation loop
    let lastTime = performance.now();
    function animate(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isCentering) {
        // Smoothly interpolate rotationAngle toward targetRotation
        let diff = (targetRotation - (rotationAngle % 360) + 540) % 360 - 180;
        if (Math.abs(diff) < 0.2) {
          rotationAngle = targetRotation;
          isCentering = false;
        } else {
          rotationAngle += diff * Math.min(1, dt * 6);
        }
        updatePositions();
      } else if (autoRotate) {
        // Continuous auto-rotation (~6 degrees per second)
        rotationAngle = (rotationAngle + dt * 6.5) % 360;
        updatePositions();
      }

      requestAnimationFrame(animate);
    }

    // Initial positioning
    updatePositions();
    requestAnimationFrame(animate);

    // Responsive recalibration on window resize
    window.addEventListener('resize', updatePositions);
  }

  // Auto-initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRadialOrbitalTimeline);
  } else {
    initRadialOrbitalTimeline();
  }
})();
