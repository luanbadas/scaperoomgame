// ===========================================================
// Progresso da missão (localStorage)
// ===========================================================

const KEY = 'enops-scaperoom-progress-v1';

function defaultState() {
  return { room1: false, room2: false, room3: false, room4: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) {
    return defaultState();
  }
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

export function markRoomComplete(n) {
  const s = loadState();
  s['room' + n] = true;
  saveState(s);
  return s;
}

export function isRoomUnlocked(n, state) {
  if (n === 1) return true;
  return !!state['room' + (n - 1)];
}

export function resetState() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}
