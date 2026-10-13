// ===========================================================
// SALA 4 — Para quem estamos construindo?
// ===========================================================
import { qs, qsa, shuffle, shakeEl, showModal, launchConfetti, makeDraggable } from './utils.js';

const SCENARIOS = [
  {
    title: 'A moradora precisa sair',
    text: 'Uma parte da rua está interditada. Uma mãe precisa sair para levar o filho ao médico.',
    choices: [
      { letter: 'A', text: 'Ela deve esperar.', correct: false },
      { letter: 'B', text: 'A equipe organiza uma passagem segura.', correct: true },
      { letter: 'C', text: 'Ela atravessa rapidamente a obra.', correct: false },
    ],
    successTitle: 'BOA ESCOLHA!',
    successText: 'A equipe da ENOPS pensa nas pessoas que vivem na comunidade — por isso organiza uma passagem segura, garantindo mobilidade mesmo com a obra em andamento.',
  },
  {
    title: 'Ninguém sabe o que está acontecendo',
    text: 'Os moradores observam máquinas chegando, mas ainda não receberam informações.',
    choices: [
      { letter: 'A', text: 'Começar imediatamente.', correct: false },
      { letter: 'B', text: 'Conversar com os moradores, explicar a intervenção e orientar sobre horários e acessos.', correct: true },
      { letter: 'C', text: 'Apenas colocar uma placa.', correct: false },
    ],
    successTitle: 'BOA ESCOLHA!',
    successText: 'Uma obra acontece em um lugar onde pessoas vivem. Explicar o que está sendo feito constrói confiança com a comunidade.',
  },
  {
    title: 'O acesso à garagem',
    text: 'Um morador reclama que temporariamente não consegue entrar na garagem.',
    choices: [
      { letter: 'A', text: 'Ignorar.', correct: false },
      { letter: 'B', text: 'Dizer que ele precisa esperar.', correct: false },
      { letter: 'C', text: 'Ouvir, explicar o motivo e verificar se existe alguma alternativa segura.', correct: true },
    ],
    successTitle: 'BOA ESCOLHA!',
    successText: 'Ouvir e buscar alternativas mostra respeito por quem vive ao lado da obra.',
  },
];

const SORT_ITEMS = [
  { id: 'residencias', img: 'assets/img/cartao-residencias.webp', name: 'RESIDÊNCIAS' },
  { id: 'coleta', img: 'assets/img/cartao-coleta.webp', name: 'REDE DE COLETA' },
  { id: 'transporte', img: 'assets/img/cartao-transporte.webp', name: 'TRANSPORTE' },
  { id: 'tratamento', img: 'assets/img/cartao-tratamento.webp', name: 'TRATAMENTO' },
];

let scenarioIndex = 0;
let sortFilled = {};
let onComplete = null;
let goToEnding = null;

export function init(completeCallback, endingCallback) {
  onComplete = completeCallback;
  goToEnding = endingCallback;
}

export function enter() {
  scenarioIndex = 0;
  qs('#s4-scenario-card').style.display = '';
  qs('#s4-final-card').style.display = 'none';
  renderScenario();
}

function renderScenario() {
  const sc = SCENARIOS[scenarioIndex];
  qs('#s4-badge').textContent = `DESAFIO ${scenarioIndex + 1}`;
  qs('#s4-scenario-title').textContent = sc.title;
  qs('#s4-scenario-text').textContent = sc.text;

  const dots = qsa('#s4-dots span');
  dots.forEach((d, i) => {
    d.classList.toggle('on', i === scenarioIndex);
    d.classList.toggle('ok', i < scenarioIndex);
  });

  const wrap = qs('#s4-scenario-choices');
  wrap.innerHTML = '';
  shuffle(sc.choices).forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="ch-letter">${choice.letter}</span>${choice.text}`;
    btn.addEventListener('click', () => {
      if (choice.correct) {
        btn.classList.add('correct-pick');
        setTimeout(() => {
          showModal({
            icon: '✓', iconClass: 'ok',
            title: sc.successTitle,
            text: sc.successText,
            ctaText: scenarioIndex < SCENARIOS.length - 1 ? 'Próximo desafio' : 'Continuar',
            onCta: advanceScenario,
          });
        }, 300);
      } else {
        btn.classList.add('wrong-pick');
        shakeEl(btn);
      }
    });
    wrap.appendChild(btn);
  });
}

function advanceScenario() {
  scenarioIndex++;
  if (scenarioIndex < SCENARIOS.length) {
    renderScenario();
  } else {
    showModal({
      icon: '🤝', iconClass: 'ok',
      title: 'COMUNIDADE INFORMADA',
      text: 'Uma obra acontece em um lugar onde pessoas vivem, trabalham, estudam e constroem suas histórias. Mas ainda falta uma última etapa.',
      ctaText: 'Último desafio →',
      onCta: () => {
        qs('#s4-scenario-card').style.display = 'none';
        qs('#s4-final-card').style.display = '';
        buildFinalSort();
      },
    });
  }
}

function buildFinalSort() {
  sortFilled = {};
  const pool = qs('#s4-sort-pool');
  const chain = qs('#s4-sort-chain');
  pool.innerHTML = '';
  chain.innerHTML = '';

  SORT_ITEMS.forEach((item, i) => {
    const slot = document.createElement('div');
    slot.className = 'sort-slot';
    slot.dataset.index = i;
    slot.innerHTML = `<span class="num">${i + 1}</span>`;
    chain.appendChild(slot);
    if (i < SORT_ITEMS.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'sort-connector';
      chain.appendChild(conn);
    }
  });

  const slots = qsa('.sort-slot', chain);

  shuffle(SORT_ITEMS).forEach(item => {
    const card = document.createElement('div');
    card.className = 'sort-card';
    card.dataset.id = item.id;
    card.innerHTML = `<img src="${item.img}" alt="${item.name}" loading="lazy"><div class="sc-name">${item.name}</div>`;
    pool.appendChild(card);

    makeDraggable(card, {
      getZones: () => slots.concat([pool]),
      onDrop: (el, zone) => {
        // free up any slot this card previously occupied
        Object.keys(sortFilled).forEach(k => { if (sortFilled[k] === item.id) delete sortFilled[k]; });

        if (zone === pool) {
          pool.appendChild(el);
          refreshSlotClasses(slots);
          return true;
        }

        // bounce any card currently occupying this slot back to the pool
        const existing = zone.querySelector('.sort-card');
        if (existing && existing !== el) {
          pool.appendChild(existing);
          Object.keys(sortFilled).forEach(k => { if (sortFilled[k] === existing.dataset.id) delete sortFilled[k]; });
        }

        zone.appendChild(el);
        sortFilled[zone.dataset.index] = item.id;
        refreshSlotClasses(slots);
        checkFinalSort();
        return true;
      },
    });
  });

  refreshSlotClasses(slots);
}

function refreshSlotClasses(slots) {
  slots.forEach(s => s.classList.toggle('filled', !!s.querySelector('.sort-card')));
}

function checkFinalSort() {
  if (Object.keys(sortFilled).length < SORT_ITEMS.length) return;
  const correctOrder = SORT_ITEMS.map(i => i.id);
  const currentOrder = SORT_ITEMS.map((_, i) => sortFilled[i]);
  const allCorrect = correctOrder.every((id, i) => id === currentOrder[i]);

  if (allCorrect) {
    launchConfetti(90);
    setTimeout(() => {
      showModal({
        icon: '🎉', iconClass: 'ok',
        title: 'Sistema funcionando!',
        text: 'Das residências até o tratamento — o saneamento agora funciona de ponta a ponta.',
        ctaText: 'Ver o resultado',
        onCta: () => { onComplete && onComplete(); goToEnding && goToEnding(); },
      });
    }, 400);
  } else {
    setTimeout(() => {
      qsa('.sort-slot', qs('#s4-sort-chain')).forEach(slot => {
        const id = slot.dataset.filledId;
        const idx = Number(slot.dataset.index);
        if (id && id !== correctOrder[idx]) shakeEl(slot);
      });
    }, 150);
  }
}
