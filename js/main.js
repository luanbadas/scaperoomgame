// ===========================================================
// MISSÃO ENOPS — roteamento principal
// ===========================================================
import { qs, qsa, showModal } from './utils.js';
import { loadState, saveState, markRoomComplete, isRoomUnlocked, resetState } from './state.js';

import * as Room1 from './room1.js';
import * as Room2 from './room2.js';
import * as Room3 from './room3.js';
import * as Room4 from './room4.js';

const ROOM_MODULES = { 1: Room1, 2: Room2, 3: Room3, 4: Room4 };

const ROOM_CHAPTERS = {
  1: {
    num: 'SALA 1',
    title: 'O que está acontecendo?',
    bg: 'assets/img/investigacao-comunidade.webp',
    fact: '💡 No Brasil, milhões de famílias ainda convivem com esgoto a céu aberto perto de casa.',
  },
  2: {
    num: 'SALA 2',
    title: 'Para onde vai o esgoto?',
    bg: 'assets/img/bg-recepcao.webp',
    fact: '💡 Planejar o caminho da água antes de cavar evita retrabalho e economiza tempo e dinheiro.',
  },
  3: {
    num: 'SALA 3',
    title: 'A obra começou',
    bg: 'assets/img/missao-antes.webp',
    fact: '💡 Esgoto exposto é uma das principais causas de doenças em crianças — por isso segurança e cuidado na obra importam tanto.',
  },
  4: {
    num: 'SALA 4',
    title: 'Para quem estamos construindo?',
    bg: 'assets/img/missao-depois.webp',
    fact: '💡 Saneamento básico não é só sobre tubulações — é sobre saúde, dignidade e qualidade de vida.',
  },
};

let chapterTimer = null;

function showChapterIntro(n, onDone) {
  const data = ROOM_CHAPTERS[n];
  const img = qs('#chapter-bg-img');
  img.src = data.bg;
  img.alt = data.title;
  // restart the ken-burns zoom from scratch every time this chapter plays
  img.style.animation = 'none';
  void img.offsetWidth;
  img.style.animation = '';

  qs('#chapter-num').textContent = data.num;
  qs('#chapter-title').textContent = data.title;
  qs('#chapter-fact').textContent = data.fact;

  showScreen('chapter-intro');

  const skipBtn = qs('#chapter-skip');
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(chapterTimer);
    skipBtn.removeEventListener('click', finish);
    onDone();
  };
  skipBtn.addEventListener('click', finish);
  chapterTimer = setTimeout(finish, 2600);
}

function showScreen(name) {
  qsa('.screen').forEach(s => s.classList.remove('active'));
  const target = qs(`.screen[data-screen="${name}"]`);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function goHub() {
  renderHub();
  showScreen('hub');
}

function renderHub() {
  const state = loadState();
  qsa('.room-card', qs('#room-grid')).forEach(card => {
    const n = Number(card.dataset.room);
    const unlocked = isRoomUnlocked(n, state);
    const done = !!state['room' + n];
    card.classList.toggle('locked', !unlocked);
    card.classList.toggle('done', done);
    card.disabled = !unlocked;
    const tag = qs('.state-tag', card);
    tag.innerHTML = done ? '✓ Concluída — jogar de novo' : (unlocked ? 'Jogar →' : '<span class="lock-icon">🔒</span> Bloqueada');
  });

  const dots = qs('#hub-progress-dots');
  dots.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const d = document.createElement('span');
    if (state['room' + i]) d.classList.add('done');
    dots.appendChild(d);
  }
}

function enterRoom(n) {
  const state = loadState();
  if (!isRoomUnlocked(n, state)) return;
  showChapterIntro(n, () => {
    ROOM_MODULES[n].enter();
    showScreen('room' + n);
  });
}

function completeRoom(n) {
  markRoomComplete(n);
  goHub();
}

function playEnding() {
  showScreen('ending');
  const before = qs('#ending-img-before');
  const after = qs('#ending-img-after');
  const caption = qs('#ending-caption');
  before.classList.add('show');
  after.classList.remove('show');
  caption.textContent = 'A comunidade antes da intervenção...';

  setTimeout(() => {
    after.classList.add('show');
    caption.textContent = 'E agora, depois da intervenção da equipe ENOPS.';
  }, 2200);

  setTimeout(() => {
    showScreen('complete');
  }, 4600);
}

function initNav() {
  qs('#btn-start-mission').addEventListener('click', goHub);

  qsa('[data-go="hub"]').forEach(btn => btn.addEventListener('click', goHub));

  qsa('#room-grid .room-card').forEach(card => {
    card.addEventListener('click', () => enterRoom(Number(card.dataset.room)));
  });

  qs('#btn-reset-progress').addEventListener('click', () => {
    showModal({
      icon: '↺', iconClass: 'hint',
      title: 'Reiniciar missão?',
      text: 'Todo o progresso das quatro salas será apagado.',
      ctaText: 'Reiniciar',
      onCta: () => { resetState(); renderHub(); },
    });
  });

  qs('#btn-play-again').addEventListener('click', () => {
    resetState();
    showScreen('intro-1');
  });
}

function init() {
  initNav();
  Room1.init(() => completeRoom(1));
  Room2.init(() => completeRoom(2));
  Room3.init(() => completeRoom(3));
  Room4.init(() => completeRoom(4), playEnding);
  renderHub();
}

document.addEventListener('DOMContentLoaded', init);
