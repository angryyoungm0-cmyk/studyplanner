export function animateEntrance(containerEl, selector, animationType = 'anim-slide-up', staggerDelay = 50) {
  if (!containerEl) return;
  try {
    const elements = containerEl.querySelectorAll(selector);
    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.classList.remove(animationType);
      void el.offsetWidth;
      setTimeout(() => {
        el.classList.add(animationType);
        el.style.opacity = '';
      }, i * staggerDelay);
    });
  } catch {
    // CSS animations failed — content is still visible
  }
}

export function animatePageIn(containerEl) {
  if (!containerEl) return;
  try {
    const items = containerEl.querySelectorAll('.card, .welcome-banner, .stats-grid, .subject-card, .exam-card');
    items.forEach((el, i) => {
      el.style.opacity = '0';
      setTimeout(() => {
        el.classList.add('anim-scale-in');
        el.style.opacity = '';
      }, i * 60);
    });
  } catch {}
}

export function animateToast(el) {
  if (!el) return;
  try {
    el.classList.remove('anim-slide-up');
    void el.offsetWidth;
    el.classList.add('anim-slide-up');
  } catch {}
}

export function animateModal(el) {
  if (!el) return;
  try {
    el.style.opacity = '0';
    el.style.transform = 'scale(0.9)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    });
  } catch {}
}

export function animateHero(el) {
  if (!el) return;
  try {
    el.classList.add('anim-scale-in');
  } catch {}
}

export function animateChatMessage(el) {
  if (!el) return;
  try {
    el.classList.add('anim-slide-up');
  } catch {}
}