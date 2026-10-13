// ===========================================================
// SALA 2 — Planejamento
// ===========================================================
import { qs, qsa, shuffle, shakeEl, showModal, makeDraggable } from './utils.js';

const MAP_PIECES = [
  { id: 'casas', emoji: '🏘️', label: 'Casas' },
  { id: 'ruas', emoji: '🛣️', label: 'Ruas' },
  { id: 'rede', emoji: '🔧', label: 'Rede existente' },
  { id: 'destino', emoji: '🎯', label: 'Ponto de destino' },
];

let onComplete = null;
let mapFilled = new Set();

export function init(completeCallback) {
  onComplete = completeCallback;
  qs('#s2-map-check').addEventListener('click', checkMap);

  qsa('#s2-stage1 .choice-btn').forEach(btn => btn.addEventListener('click', () => handlePipeChoice(btn, 1)));
  qsa('#s2-stage2 .choice-btn').forEach(btn => btn.addEventListener('click', () => handlePipeChoice(btn, 2)));
}

export function enter() {
  buildMap();
  qs('#s2-map-card').style.display = '';
  qs('#s2-pipe-card').style.display = 'none';
  resetPipeChain();
}

function buildMap() {
  mapFilled = new Set();
  const tilePool = qs('#s2-tile-pool');
  const puzzle = qs('#s2-map-puzzle');
  tilePool.innerHTML = '';
  puzzle.innerHTML = '';
  qs('#s2-map-check').disabled = true;

  const order = shuffle(MAP_PIECES);

  // drop slots (fixed order so the puzzle layout stays predictable)
  MAP_PIECES.forEach(piece => {
    const slot = document.createElement('div');
    slot.className = 'map-slot';
    slot.dataset.accept = piece.id;
    slot.innerHTML = `<span>${piece.emoji}</span><span class="slot-hint">${piece.label}</span>`;
    puzzle.appendChild(slot);
  });

  order.forEach(piece => {
    const tile = document.createElement('div');
    tile.className = 'map-tile';
    tile.dataset.id = piece.id;
    tile.innerHTML = `<span>${piece.emoji}</span><span>${piece.label}</span>`;
    tilePool.appendChild(tile);

    makeDraggable(tile, {
      getZones: () => qsa('.map-slot', puzzle).concat([tilePool]),
      onDrop: (el, zone) => {
        if (zone === tilePool) { zone.appendChild(el); return true; }
        if (zone.dataset.accept !== piece.id) {
          shakeEl(zone);
          return false;
        }
        // if slot already filled, bounce current occupant back to pool
        const existing = zone.querySelector('.map-tile');
        if (existing) tilePool.appendChild(existing);
        zone.appendChild(el);
        zone.classList.add('filled');
        mapFilled.add(piece.id);
        qs('#s2-map-check').disabled = mapFilled.size < MAP_PIECES.length;
        return true;
      },
      onReturn: () => {
        // if tile left a slot, mark it unfilled again
        qsa('.map-slot', puzzle).forEach(s => {
          if (!s.querySelector('.map-tile')) { s.classList.remove('filled'); mapFilled.delete(s.dataset.accept); }
        });
        qs('#s2-map-check').disabled = mapFilled.size < MAP_PIECES.length;
      },
    });
  });
}

function checkMap() {
  if (mapFilled.size === MAP_PIECES.length) {
    showModal({
      icon: '🗺️', iconClass: 'ok',
      title: 'Mapa montado!',
      text: 'Agora vamos planejar o caminho da tubulação.',
      ctaText: 'Continuar',
      onCta: () => {
        qs('#s2-map-card').style.display = 'none';
        qs('#s2-pipe-card').style.display = '';
      },
    });
  }
}

function resetPipeChain() {
  qs('#s2-stage1').style.display = '';
  qs('#s2-stage2').style.display = 'none';
  qsa('.pipe-node').forEach(n => n.classList.remove('active', 'locked-in'));
  qsa('.pipe-arrow').forEach(a => a.classList.remove('active'));
  qs('[data-node="casas"]').classList.add('active');
  qsa('.choice-btn', document).forEach(b => b.classList.remove('correct-pick', 'wrong-pick'));
}

function handlePipeChoice(btn, stage) {
  const correct = btn.dataset.correct === 'true';

  if (!correct) {
    btn.classList.add('wrong-pick');
    shakeEl(btn);
    let msg = 'Esse caminho pode direcionar o esgoto para um local inadequado.';
    if (btn.textContent.includes('bloqueada')) {
      msg = 'Essa ligação pode provocar retorno do esgoto para algumas residências.';
    } else if (btn.textContent.includes('irregular')) {
      msg = 'Esse destino não é tratado — o esgoto continuaria poluindo a comunidade.';
    }
    showModal({ icon: '⚠️', iconClass: 'warn', title: 'ALERTA', text: msg, ctaText: 'Tentar outro caminho' });
    return;
  }

  btn.classList.add('correct-pick');

  if (stage === 1) {
    qs('[data-node="coleta"]').classList.add('locked-in');
    qs('#s2-arrow-1').classList.add('active');
    setTimeout(() => {
      qs('#s2-stage1').style.display = 'none';
      qs('#s2-stage2').style.display = '';
    }, 500);
  } else {
    qs('[data-node="sistema"]').classList.add('locked-in');
    qs('#s2-arrow-2').classList.add('active');
    setTimeout(() => {
      showModal({
        icon: '✓', iconClass: 'ok',
        title: 'PLANEJAMENTO CONCLUÍDO',
        text: 'Antes de executar uma obra, é preciso pensar no caminho, analisar o local e prever possíveis problemas. Sala 3 desbloqueada.',
        ctaText: 'Continuar',
        onCta: () => onComplete && onComplete(),
      });
    }, 500);
  }
}
