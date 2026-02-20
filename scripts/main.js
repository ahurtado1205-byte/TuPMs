document.addEventListener('DOMContentLoaded', () => {
    // Apply Theme
    document.body.setAttribute('data-theme', Store.settings.theme);

    // Initial Render
    const renderCurrentView = () => {
        const activeNav = document.querySelector('.nav-item.active');
        const view = activeNav ? activeNav.getAttribute('data-view') : 'rack';
        UI.renderKPIs();
        // UI.toggleUnassignedDrawer(false); // Removed: Unassigned management is now handled via modal

        switch (view) {
            case 'rack': UI.renderRack(); break;
            case 'availability': UI.renderAvailability(); break;
            case 'guests': UI.renderGuestsView(); break;
            case 'quote': UI.renderQuickQuoteView(); break;
            case 'rates': UI.renderRates(); break;
            case 'reservations': UI.renderReservationsList(); break;
            case 'housekeeping': UI.renderHousekeeping(); break;
            case 'reports': UI.renderReports(); break;
            case 'preferences': UI.renderPreferences(); break;
        }
    };

    Store.subscribe(renderCurrentView);
    renderCurrentView();

    // Navigation logic
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');
            renderCurrentView();
        });
    });

    // Handle modal closing on overlay click
    const modal = document.getElementById('reservation-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('reservation-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeModal();
                return;
            }
        }
        if (e.key.toLowerCase() === 'n' && e.altKey) {
            UI.openReservationModal();
        }
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            const search = document.querySelector('.search-bar input');
            if (search) search.focus();
        }
    });

    console.log('NEXUS PMS | Operational');
});
/* =========================================================
   PATCH: MODAL OPEN/CLOSE SYNC (mobile scroll friendly)
   Pegar AL FINAL de: scripts/main.js
   ========================================================= */

(() => {
  const modal = document.getElementById("reservation-modal");
  if (!modal) return;

  const syncModalState = () => {
    const isOpen = !modal.classList.contains("hidden");
    document.documentElement.classList.toggle("modal-open", isOpen);
    document.body.classList.toggle("modal-open", isOpen);

    if (isOpen) document.body.classList.remove("sidebar-open");
  };

  const observer = new MutationObserver(syncModalState);
  observer.observe(modal, { attributes: true, attributeFilter: ["class"] });

  syncModalState();
})();


