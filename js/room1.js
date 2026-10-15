// ===========================================================
// SALA 1 — Diagnóstico
// ===========================================================
import { qs, qsa, shuffle, shakeEl, showModal, launchConfetti, makeDraggable } from './utils.js';

const SPOT_TEXT = {
  casa1: { name: 'Casa 1', quote: '"Quando chove, o esgoto volta para perto da nossa casa."' },
  familia: { name: 'Família Oliveira', quote: '"Às vezes o cheiro fica muito forte."' },
  posto: { name: 'Posto de saúde', quote: '"Algumas crianças ficaram doentes recentemente."' },
  area: { name: 'Área externa', quote: 'A área mostra esgoto exposto e água acumulada perto das casas.' },
};

const CARDS = [
  { id: 'esgoto', label: 'Esgoto exposto', correct: true },
  { id: 'cheiro', label: 'Mau cheiro', correct: true },
  { id: 'contaminacao', label: 'Risco de contaminação', correct: true },
  { id: 'agua', label: 'Água acumulada próxima às residências', correct: true },
  { id: 'saneamento', label: 'Falta de saneamento adequado', correct: true },
  { id: 'casanova', label: 'Construir uma nova casa', correct: false },
  { id: 'pintar', label: 'Pintar as residências', correct: false },
  { id: 'iluminacao', label: 'Aumentar a iluminação da rua', correct: false },
];

let visited = new Set();
let onComplete = null;

export function init(completeCallback) {
  onComplete = completeCallback;

  qsa('#s1-hotspots .hotspot-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.spot;
      visited.add(key);
      btn.classList.add('visited');
      updateVisitCounter();
      showModal({
        icon: '💬', iconClass: 'info',
        title: SPOT_TEXT[key].name,
        text: SPOT_TEXT[key].quote,
        ctaText: 'Entendi',
      });
    });
  });

  qs('#s1-to-challenge').addEventListener('click', () => {
    qs('#s1-investigate-card').style.display = 'none';
    qs('#s1-challenge-card').style.display = '';
    buildChallenge();
  });

  qs('#s1-check').addEventListener('click', checkDiagnosis);
}

export function enter() {
  // reset visual state each time the room is (re)entered
  visited = new Set();
  qsa('#s1-hotspots .hotspot-card').forEach(b => b.classList.remove('visited'));
  updateVisitCounter();
  qs('#s1-investigate-card').style.display = '';
  qs('#s1-challenge-card').style.display = 'none';
  qs('#s1-to-challenge').disabled = true;
}

function updateVisitCounter() {
  qs('#s1-visit-counter').textContent = `${visited.size} de 4 observações feitas`;
  qs('#s1-to-challenge').disabled = visited.size < 4;
}

function buildChallenge() {
  const pool = qs('#s1-pool');
  const zone = qs('#s1-zone');
  pool.innerHTML = '';
  zone.innerHTML = '';

  shuffle(CARDS).forEach(card => {
    const chip = document.createElement('div');
    chip.className = 'card-chip';
    chip.textContent = card.label;
    chip.dataset.id = card.id;
    chip.dataset.correct = card.correct;
    pool.appendChild(chip);

    makeDraggable(chip, {
      getZones: () => [zone, pool],
      onDrop: (el, hitZone) => { hitZone.appendChild(el); return true; },
    });
  });
}

function checkDiagnosis() {
  const zone = qs('#s1-zone');
  const inZone = qsa('.card-chip', zone);
  const inPool = qsa('.card-chip', qs('#s1-pool'));

  let allGood = true;

  const pool = qs('#s1-pool');

  inZone.forEach(chip => {
    const ok = chip.dataset.correct === 'true';
    chip.classList.remove('wrong-flag', 'correct-flag');
    if (ok) {
      chip.classList.add('correct-flag');
    } else {
      chip.classList.add('wrong-flag');
      shakeEl(chip);
      allGood = false;
      // send the wrong card back to its origin (the pool) once the shake finishes
      setTimeout(() => { pool.appendChild(chip); chip.classList.remove('wrong-flag'); }, 450);
    }
  });

  inPool.forEach(chip => {
    if (chip.dataset.correct === 'true') {
      allGood = false;
      shakeEl(chip);
    }
  });

  if (!allGood) {
    showModal({
      icon: '🤔', iconClass: 'hint',
      title: 'Ainda não...',
      text: 'Vocês estão investigando o problema, não escolhendo uma solução. Observem novamente os relatos dos moradores.',
      ctaText: 'Tentar de novo',
    });
    return;
  }

  launchConfetti(50);
  showModal({
    icon: '✓', iconClass: 'ok',
    title: 'DIAGNÓSTICO CONCLUÍDO',
    text: 'Antes de uma obra começar, é preciso entender o que realmente está acontecendo. Sala 2 desbloqueada.',
    ctaText: 'Continuar',
    onCta: () => onComplete && onComplete(),
  });
}
