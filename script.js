/**
 * Robust expand/collapse behaviour for order cards.
 * - Expands only the clicked card.
 * - Measures scrollHeight and animates max-height.
 * - After expand transition completes, sets max-height to 'none' so content
 *   is free to reflow (prevents content from being clipped).
 * - Handles collapse smoothly.
 * - Adjusts open panels on window resize.
 */

document.addEventListener('DOMContentLoaded', () => {
  const allCards = Array.from(document.querySelectorAll('.order-card'));

  if (!allCards.length) {
    console.warn('No .order-card elements found.');
    return;
  }

  // Collapse a panel with smooth animation
  function collapsePanel(infoEl, cardEl) {
    // Make sure padding/styling for expanded state is still present while we
    // calculate current height
    infoEl.style.overflow = 'hidden';
    // Set current height explicitly so we can animate to 0
    infoEl.style.maxHeight = infoEl.scrollHeight + 'px';
    // Force layout so the browser registers the starting height
    infoEl.getBoundingClientRect();

    // Animate to zero
    requestAnimationFrame(() => {
      infoEl.style.maxHeight = '0px';
    });

    // Remove active class (visual styles). We remove class now so that the
    // visual style (padding) is removed smoothly as max-height animates.
    infoEl.classList.remove('active');
    if (cardEl) cardEl.setAttribute('aria-expanded', 'false');

    // Ensure overflow remains hidden after transition end
    const onEnd = (ev) => {
      if (ev.propertyName === 'max-height') {
        infoEl.style.overflow = 'hidden';
        // keep maxHeight at 0 to avoid accidental expansion
        infoEl.style.maxHeight = '0px';
        infoEl.removeEventListener('transitionend', onEnd);
      }
    };
    infoEl.addEventListener('transitionend', onEnd);
  }

  // Expand a panel with smooth animation and then free it (max-height -> none)
  function expandPanel(infoEl, cardEl) {
    // Add active class first so padding/visual styles apply and affect height
    infoEl.classList.add('active');

    // Force a reflow so new padding/styles are taken into account
    infoEl.getBoundingClientRect();

    // Measure the full height and animate to it
    const fullHeight = infoEl.scrollHeight;
    infoEl.style.overflow = 'hidden';
    infoEl.style.maxHeight = fullHeight + 'px';
    if (cardEl) cardEl.setAttribute('aria-expanded', 'true');

    // After transition finishes, free the panel so it can grow freely
    const onEnd = (ev) => {
      if (ev.propertyName === 'max-height') {
        // Only set to 'none' if still active (not collapsed immediately)
        if (infoEl.classList.contains('active')) {
          infoEl.style.maxHeight = 'none';
          infoEl.style.overflow = 'visible';
        }
        infoEl.removeEventListener('transitionend', onEnd);
      }
    };
    infoEl.addEventListener('transitionend', onEnd);
  }

  // Toggle card (close others first)
  function toggleCard(cardEl, infoEl) {
    const isOpen = infoEl.classList.contains('active');

    // Close any other open panels
    allCards.forEach(other => {
      if (other === cardEl) return;
      const otherInfo = other.querySelector('.order-info');
      if (otherInfo && otherInfo.classList.contains('active')) {
        collapsePanel(otherInfo, other);
      }
    });

    // Toggle current panel
    if (isOpen) {
      collapsePanel(infoEl, cardEl);
    } else {
      expandPanel(infoEl, cardEl);
    }
  }

  // Init each card
  allCards.forEach(card => {
    const info = card.querySelector('.order-info');
    if (!info) return;

    // Accessibility and initial state
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    info.style.maxHeight = '0px';
    info.style.overflow = 'hidden';

    // Click & keyboard handlers
    card.addEventListener('click', () => toggleCard(card, info));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card, info);
      }
    });

    // Prevent clicks inside the info panel (e.g. links) from bubbling up and re-toggling
    info.addEventListener('click', (ev) => ev.stopPropagation());
  });

  // Recalculate heights on window resize for any open panels
  window.addEventListener('resize', () => {
    allCards.forEach(card => 
      {
      const info = card.querySelector('.order-info');
      if (!info) return;

      if (info.classList.contains('active')) {
        // If the panel was freed (maxHeight === 'none'), set it temporarily
        // to the new scrollHeight so the content fits the new width.
        // We then set it back to 'none' after a frame to allow future growth.
        info.style.maxHeight = info.scrollHeight + 'px';
        requestAnimationFrame(() => {
          // allow it to be flexible again
          info.style.maxHeight = 'none';
        });
      }
    });
  });
});
