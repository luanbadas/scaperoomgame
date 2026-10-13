// ===========================================================
// SALA 2 — Planejamento
// ===========================================================
import { qs, qsa, shuffle, shakeEl, showModal, launchConfetti, makeDraggable } from './utils.js';

const MAP_PIECES = [
  { id: 'casas', emoji: '🏘️', label: 'Casas' },
  { id: 'ruas', emoji: '🛣️', label: 'Ruas' },
  { id: 'rede', emoji: '🔧', label: 'Rede existente' },
  { id: 'destino', emoji: '🎯', label: 'Ponto de destino' },
];

const PIPE_PIECES = [
  { id: 'tubo-pvc', emoji: '🧵', label: 'Tubo de PVC novo', correct: true },
  { id: 'conexao-vedada', emoji: '🔩', label: 'Conexão vedada', correct: true },
  { id: 'registro', emoji: '🚰', label: 'Registro de passagem', correct: true },
  { id: 'caixa-inspecao', emoji: '🔲', label: 'Caixa de inspeção', correct: true },
  { id: 'tubo-reforcado', emoji: '🛠️', label: 'Tubo reforçado', correct: true },
  { id: 'tubo-rachado', emoji: '❌', label: 'Tubo rachado', correct: false },
  { id: 'diametro-errado', emoji: '⚠️', label: 'Conexão de diâmetro errado', correct: false },
  { id: 'mangueira', emoji: '🚫', label: 'Mangueira improvisada', correct: false },
];
const PIPE_SLOT_COUNT = PIPE_PIECES.filter(p => p.correct).length;

let onComplete = null;
let mapFilled = new Set();
let pipelineFilled = new Set();

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
  qs('#s2-pipepuzzle-card').style.display = 'none';
  resetPipeChain();
  buildPipelinePuzzle();
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
          shakeEl(el);
          return false; // wrong slot: tile snaps back to where it was dragged from
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
        title: 'Caminho identificado!',
        text: 'Agora vamos para a prática: montem a tubulação completa até o objetivo.',
        ctaText: 'Continuar',
        onCta: () => {
          qs('#s2-pipe-card').style.display = 'none';
          qs('#s2-pipepuzzle-card').style.display = '';
        },
      });
    }, 500);
  }
}

// ---------------- Desafio 3: quebra-cabeça da tubulação ----------------

function buildPipelinePuzzle() {
  pipelineFilled = new Set();
  const pool = qs('#s2-pipepuzzle-pool');
  const slotsWrap = qs('#s2-pipeline-slots');
  pool.innerHTML = '';
  slotsWrap.innerHTML = '';
  qs('#s2-pipeline-objective').classList.remove('objective-reached');

  for (let i = 0; i < PIPE_SLOT_COUNT; i++) {
    const slot = document.createElement('div');
    slot.className = 'pipeline-slot';
    slot.dataset.index = i;
    slotsWrap.appendChild(slot);
  }
  const slots = qsa('.pipeline-slot', slotsWrap);

  shuffle(PIPE_PIECES).forEach(piece => {
    const tile = document.createElement('div');
    tile.className = 'pipe-tile';
    tile.dataset.id = piece.id;
    tile.title = piece.label;
    tile.innerHTML = `<span class="emoji">${piece.emoji}</span><span class="label-text">${piece.label}</span>`;
    pool.appendChild(tile);

    makeDraggable(tile, {
      getZones: () => slots.concat([pool]),
      onDrop: (el, zone) => {
        if (zone === pool) {
          pipelineFilled.delete(piece.id);
          pool.appendChild(el);
          refreshPipelineSlots(slots);
          return true;
        }
        if (!piece.correct) {
          // damaged/incompatible piece: reject, tile snaps back to where it was dragged from
          shakeEl(zone);
          shakeEl(el);
          return false;
        }
        // bounce any tile already occupying this slot back to the pool
        const existing = zone.querySelector('.pipe-tile');
        if (existing && existing !== el) {
          pool.appendChild(existing);
          pipelineFilled.delete(existing.dataset.id);
        }
        zone.appendChild(el);
        pipelineFilled.add(piece.id);
        refreshPipelineSlots(slots);
        checkPipelineComplete(slots);
        return true;
      },
    });
  });

  refreshPipelineSlots(slots);
}

function refreshPipelineSlots(slots) {
  slots.forEach(s => s.classList.toggle('filled', !!s.querySelector('.pipe-tile')));
}

function checkPipelineComplete(slots) {
  if (pipelineFilled.size < PIPE_SLOT_COUNT) return;

  qs('#s2-pipeline-objective').classList.add('objective-reached');
  launchConfetti(40);

  setTimeout(() => {
    showModal({
      icon: '✓', iconClass: 'ok',
      title: 'PLANEJAMENTO CONCLUÍDO',
      text: 'Vocês conectaram cada peça até a Estação de Tratamento. Um projeto de saneamento só funciona quando cada conexão é planejada e testada com cuidado — um erro aqui pode significar retrabalho, desperdício de recursos e mais tempo sem saneamento para quem mais precisa. Sala 3 desbloqueada.',
      ctaText: 'Continuar',
      onCta: () => onComplete && onComplete(),
    });
  }, 500);
}
