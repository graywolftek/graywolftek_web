/**
 * Graywolftek - Header Navigation Dropdown Component
 * Handles Home, R&D, Services, Story dropdowns on desktop and mobile drawer
 */
(function () {
    // Inject styling for high opacity dropdowns and hover bridge
    if (!document.getElementById('menu-dropdown-styles')) {
        const style = document.createElement('style');
        style.id = 'menu-dropdown-styles';
        style.textContent = `
            .menu-dropdown-panel {
                background: #0b141d !important;
                background: linear-gradient(165deg, rgba(11, 20, 29, 0.98) 0%, rgba(18, 38, 52, 0.98) 55%, rgba(35, 25, 48, 0.98) 100%) !important;
                backdrop-filter: blur(28px) !important;
                -webkit-backdrop-filter: blur(28px) !important;
                border: 1px solid rgba(255, 255, 255, 0.16) !important;
                box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.92), 0 0 35px rgba(0, 100, 102, 0.25) !important;
            }
            .nav-dropdown-item {
                position: relative;
            }
            /* Invisible hover bridge between trigger and dropdown panel */
            .nav-dropdown-item .nav-dropdown-menu::before {
                content: '';
                position: absolute;
                top: -12px;
                left: 0;
                right: 0;
                height: 12px;
            }
            .nav-dropdown-item:hover .nav-chevron,
            .nav-dropdown-item.active .nav-chevron {
                transform: rotate(180deg);
            }
            .nav-dropdown-item:hover .nav-dropdown-menu,
            .nav-dropdown-item.active .nav-dropdown-menu {
                display: block !important;
            }
        `;
        document.head.appendChild(style);
    }

    function initNav() {
        // Desktop Click Toggles (supports touch devices and explicit click)
        const dropdownItems = document.querySelectorAll('.nav-dropdown-item');
        dropdownItems.forEach(function (item) {
            const trigger = item.querySelector('.nav-dropdown-trigger');
            if (!trigger) return;

            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                const isActive = item.classList.contains('active');
                dropdownItems.forEach(function (other) {
                    if (other !== item) other.classList.remove('active');
                });
                if (isActive) {
                    item.classList.remove('active');
                } else {
                    item.classList.add('active');
                }
            });
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            dropdownItems.forEach(function (item) {
                if (!item.contains(e.target)) {
                    item.classList.remove('active');
                }
            });
            const mobileDrawer = document.getElementById('mobile-nav-drawer');
            const mobileBtn = document.getElementById('mobile-menu-btn');
            if (mobileDrawer && mobileBtn && !mobileDrawer.contains(e.target) && !mobileBtn.contains(e.target)) {
                mobileDrawer.classList.add('hidden');
                mobileBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                dropdownItems.forEach(function (item) {
                    item.classList.remove('active');
                });
                const mobileDrawer = document.getElementById('mobile-nav-drawer');
                if (mobileDrawer) mobileDrawer.classList.add('hidden');
            }
        });

        // Mobile Drawer Toggle
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const mobileDrawer = document.getElementById('mobile-nav-drawer');
        if (mobileBtn && mobileDrawer) {
            mobileBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const isHidden = mobileDrawer.classList.contains('hidden');
                if (isHidden) {
                    mobileDrawer.classList.remove('hidden');
                    mobileBtn.setAttribute('aria-expanded', 'true');
                } else {
                    mobileDrawer.classList.add('hidden');
                    mobileBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Mobile Accordion Toggles
        const mobileAccordions = document.querySelectorAll('.mobile-accordion-btn');
        mobileAccordions.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const subitems = btn.nextElementSibling;
                const arrow = btn.querySelector('.mobile-accordion-arrow');
                if (subitems) {
                    const isCollapsed = subitems.classList.contains('hidden');
                    if (isCollapsed) {
                        subitems.classList.remove('hidden');
                        if (arrow) arrow.style.transform = 'rotate(180deg)';
                    } else {
                        subitems.classList.add('hidden');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });

        // Ensure lucide icons are rendered
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
})();
