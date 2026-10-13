// ===========================================================
// SALA 3 — A obra começou (segurança + imprevisto)
// ===========================================================
import { qs, qsa, shuffle, shakeEl, showModal, makeDraggable } from './utils.js';

const HAZARD_TILES = [
  { id: 'tubulacao-segura', img: 'assets/img/hazard-tubulacao-segura.webp', label: 'Instalação segura da tubulação', isHazard: false },
  { id: 'agua-acumulada', img: 'assets/img/hazard-agua-acumulada.webp', label: 'Água acumulada em vala sem isolamento', isHazard: true },
  { id: 'tubos-sinalizados', img: 'assets/img/hazard-tubos-sinalizados.webp', label: 'Tubos armazenados e sinalizados', isHazard: false },
  { id: 'compactador-seguro', img: 'assets/img/hazard-compactador-seguro.webp', label: 'Uso correto do equipamento', isHazard: false },
  { id: 'sem-epi', img: 'assets/img/hazard-sem-epi.webp', label: 'Trabalhador sem equipamento de proteção', isHazard: true },
  { id: 'nivelamento-seguro', img: 'assets/img/hazard-nivelamento-seguro.webp', label: 'Conferência segura do nivelamento', isHazard: false },
];

const HAZARD_COUNT = HAZARD_TILES.filter(h => h.isHazard).length;

const TESTIMONIES = [
  { id: 'tecnico', img: 'assets/img/testimony-tecnico.webp', name: 'Técnico de campo', quote: '"Encontramos água acumulada exatamente onde a tubulação deveria passar."' },
  { id: 'seguranca', img: 'assets/img/testimony-seguranca.webp', name: 'Segurança', quote: '"Não é seguro continuar até descobrirmos de onde essa água está vindo."' },
  { id: 'planejamento', img: 'assets/img/testimony-planejamento.webp', name: 'Planejamento', quote: '"Na planta não existe nenhuma tubulação registrada nesse ponto."' },
  { id: 'morador', img: 'assets/img/testimony-morador.webp', name: 'Morador', quote: '"Há muitos anos existia uma tubulação antiga nesse local."' },
];

const ORDER_STEPS = [
  { id: 'interromper', label: '⏸️ Interromper a atividade' },
  { id: 'investigar', label: '🔎 Investigar a tubulação' },
  { id: 'atualizar', label: '📝 Atualizar o planejamento' },
];

let foundHazards = new Set();
let placedTestimonies = new Set();
let orderPicked = [];
let onComplete = null;

export function init(completeCallback) {
  onComplete = completeCallback;
  qs('#s3-start-obra').addEventListener('click', startObra);
}

export function enter() {
  foundHazards = new Set();
  placedTestimonies = new Set();
  orderPicked = [];

  qs('#s3-safety-card').style.display = '';
  qs('#s3-incident-card').style.display = 'none';
  qs('#s3-mc').style.display = 'none';
  qs('#s3-order').style.display = 'none';

  buildHazards();
  buildTestimonies();
  buildOrderStep();
  qs('#s3-start-obra').disabled = true;
  qs('#s3-hazard-count').textContent = '0';
  qs('#s3-hazard-total').textContent = String(HAZARD_COUNT);
}

function buildHazards() {
  const grid = qs('#s3-hazard-grid');
  grid.innerHTML = '';
  shuffle(HAZARD_TILES).forEach(hz => {
    const tile = document.createElement('div');
    tile.className = 'hazard-tile';
    tile.dataset.id = hz.id;
    tile.innerHTML = `
      <img src="${hz.img}" alt="${hz.label}" loading="lazy">
      <span class="found-badge">✓</span>
      <span class="hz-label">${hz.label}</span>
    `;
    tile.addEventListener('click', () => {
      if (foundHazards.has(hz.id)) return;
      if (!hz.isHazard) {
        shakeEl(tile);
        tile.classList.add('wrong-flash');
        setTimeout(() => tile.classList.remove('wrong-flash'), 500);
        return;
      }
      foundHazards.add(hz.id);
      tile.classList.add('found');
      qs('#s3-hazard-count').textContent = String(foundHazards.size);
      if (foundHazards.size === HAZARD_COUNT) {
        qs('#s3-start-obra').disabled = false;
      }
    });
    grid.appendChild(tile);
  });
}

function startObra() {
  showModal({
    icon: '✓', iconClass: 'ok',
    title: 'OBRA LIBERADA',
    text: 'Todos os riscos foram identificados. A obra pode começar.',
    ctaText: 'Iniciar obra',
    onCta: () => {
      showModal({
        icon: '🚨', iconClass: 'warn',
        title: 'OBRA INTERROMPIDA',
        text: 'Algo diferente do projeto foi encontrado durante a escavação.',
        ctaText: 'Ver detalhes',
        onCta: () => {
          qs('#s3-safety-card').style.display = 'none';
          qs('#s3-incident-card').style.display = '';
        },
      });
    },
  });
}

function buildTestimonies() {
  const pool = qs('#s3-testimony-pool');
  const panel = qs('#s3-panel');
  pool.innerHTML = '';
  panel.innerHTML = '';

  shuffle(TESTIMONIES).forEach(t => {
    const card = document.createElement('div');
    card.className = 'testimony-card';
    card.dataset.id = t.id;
    card.innerHTML = `<img src="${t.img}" alt="${t.name}" loading="lazy"><div class="tc-name">${t.name}</div>`;
    pool.appendChild(card);

    makeDraggable(card, {
      getZones: () => [panel, pool],
      onDrop: (el, zone) => {
        zone.appendChild(el);
        if (zone === panel) {
          el.classList.add('placed');
          if (!placedTestimonies.has(t.id)) {
            placedTestimonies.add(t.id);
            checkTestimoniesComplete();
          }
        } else {
          el.classList.remove('placed');
          placedTestimonies.delete(t.id);
        }
        return true;
      },
    });
  });
}

function checkTestimoniesComplete() {
  if (placedTestimonies.size === TESTIMONIES.length) {
    setTimeout(() => { qs('#s3-mc').style.display = ''; }, 300);
    qsa('#s3-mc .choice-btn').forEach(btn => {
      btn.onclick = () => handleMcChoice(btn);
    });
  }
}

function handleMcChoice(btn) {
  const correct = btn.dataset.correct === 'true';
  if (!correct) {
    btn.classList.add('wrong-pick');
    shakeEl(btn);
    return;
  }
  btn.classList.add('correct-pick');
  setTimeout(() => { qs('#s3-order').style.display = ''; }, 400);
}

function buildOrderStep() {
  const row = qs('#s3-order-row');
  row.innerHTML = '';
  qsa('.order-slot').forEach(s => { s.classList.remove('filled'); s.textContent = (s.dataset.slot === '0' ? '1º' : s.dataset.slot === '1' ? '2º' : '3º'); });

  shuffle(ORDER_STEPS).forEach(step => {
    const btn = document.createElement('button');
    btn.className = 'order-btn';
    btn.textContent = step.label;
    btn.dataset.id = step.id;
    btn.addEventListener('click', () => handleOrderPick(btn, step));
    row.appendChild(btn);
  });
}

function handleOrderPick(btn, step) {
  const expected = ORDER_STEPS[orderPicked.length].id;
  if (step.id !== expected) {
    btn.classList.add('shake');
    btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
    return;
  }
  orderPicked.push(step.id);
  btn.classList.add('picked');
  const slot = qs(`.order-slot[data-slot="${orderPicked.length - 1}"]`);
  slot.textContent = step.label;
  slot.classList.add('filled');

  if (orderPicked.length === ORDER_STEPS.length) {
    setTimeout(() => {
      showModal({
        icon: '✓', iconClass: 'ok',
        title: 'IMPREVISTO SOLUCIONADO',
        text: 'Nem tudo acontece exatamente como estava planejado. Engenharia também significa investigar, trabalhar em equipe e tomar decisões seguras. Sala 4 desbloqueada.',
        ctaText: 'Continuar',
        onCta: () => onComplete && onComplete(),
      });
    }, 500);
  }
}
