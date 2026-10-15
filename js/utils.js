// ===========================================================
// Utilidades compartilhadas: modal, confete, drag-and-drop
// ===========================================================

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shakeEl(el) {
  el.classList.remove('shake');
  // force reflow so the animation can restart
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

// ---------------- Modal ----------------

const modalRoot = () => qs('#modal-root');

let modalCtaHandler = null;

export function showModal({ icon = '✓', iconClass = 'ok', title, text, ctaText = 'Continuar', onCta = null, dismissible = true }) {
  const root = modalRoot();
  qs('#modal-icon').textContent = icon;
  qs('#modal-icon').className = 'modal-icon ' + iconClass;
  qs('#modal-title').textContent = title;
  qs('#modal-text').textContent = text;
  const cta = qs('#modal-cta');
  cta.textContent = ctaText;
  root.classList.add('open');

  if (modalCtaHandler) cta.removeEventListener('click', modalCtaHandler);
  modalCtaHandler = () => {
    closeModal();
    if (onCta) onCta();
  };
  cta.addEventListener('click', modalCtaHandler);

  if (dismissible) {
    root.onclick = (e) => { if (e.target === root) { closeModal(); } };
  } else {
    root.onclick = null;
  }
}

export function closeModal() {
  modalRoot().classList.remove('open');
}

// ---------------- Confete ----------------

const CONFETTI_COLORS = ['#1f6fd1', '#f2792b', '#ffc83d', '#2bab5f', '#0c2a52'];

export function launchConfetti(count = 70) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const duration = 2.4 + Math.random() * 1.6;
    const delay = Math.random() * 0.4;
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay = delay + 's';
    piece.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + delay) * 1000 + 200);
  }
}

// ---------------- Drag and drop (Pointer Events) ----------------
//
// makeDraggable(cardEl, { getZones, onDrop, onReturn })
//   getZones()  -> array of current drop-zone elements to test against
//   onDrop(cardEl, zoneEl) -> called when dropped inside a zone; return false to reject
//   onReturn(cardEl) -> called when dropped outside any zone (snap back)

export function makeDraggable(cardEl, { getZones, onDrop, onReturn, draggingClass = 'dragging' }) {
  let startX, startY, startRect, offsetX, offsetY, placeholder;

  cardEl.style.touchAction = 'none';

  cardEl.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    startRect = cardEl.getBoundingClientRect();
    offsetX = e.clientX - startRect.left;
    offsetY = e.clientY - startRect.top;
    startX = e.clientX;
    startY = e.clientY;

    placeholder = document.createElement('div');
    placeholder.style.width = startRect.width + 'px';
    placeholder.style.height = startRect.height + 'px';
    placeholder.style.flexShrink = '0';
    cardEl.parentNode.insertBefore(placeholder, cardEl.nextSibling);

    cardEl.style.width = startRect.width + 'px';
    document.body.appendChild(cardEl);
    cardEl.style.left = startRect.left + 'px';
    cardEl.style.top = startRect.top + 'px';
    cardEl.classList.add(draggingClass);

    cardEl.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      const x = startRect.left + (ev.clientX - startX);
      const y = startRect.top + (ev.clientY - startY);
      cardEl.style.left = x + 'px';
      cardEl.style.top = y + 'px';

      const zones = getZones();
      zones.forEach(z => z.classList.remove('drag-over'));
      const hit = findZoneUnderPoint(zones, ev.clientX, ev.clientY);
      if (hit) hit.classList.add('drag-over');
    };

    const onUp = (ev) => {
      cardEl.removeEventListener('pointermove', onMove);
      cardEl.removeEventListener('pointerup', onUp);
      cardEl.removeEventListener('pointercancel', onUp);
      try { cardEl.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }

      const zones = getZones();
      zones.forEach(z => z.classList.remove('drag-over'));
      const hit = findZoneUnderPoint(zones, ev.clientX, ev.clientY);

      cardEl.classList.remove(draggingClass);
      cardEl.style.position = '';
      cardEl.style.left = '';
      cardEl.style.top = '';
      cardEl.style.width = '';

      let accepted = false;
      if (hit) {
        accepted = onDrop(cardEl, hit) !== false;
      }
      if (!accepted) {
        placeholder.parentNode.insertBefore(cardEl, placeholder);
        if (onReturn) onReturn(cardEl);
      }
      placeholder.remove();
    };

    cardEl.addEventListener('pointermove', onMove);
    cardEl.addEventListener('pointerup', onUp);
    cardEl.addEventListener('pointercancel', onUp);
  });
}

function findZoneUnderPoint(zones, x, y) {
  for (const z of zones) {
    const r = z.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return z;
  }
  return null;
}
