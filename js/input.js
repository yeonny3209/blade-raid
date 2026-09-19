'use strict';
// ============================================================
//  입력 : 키 상태 + 입력 큐(선입력 버퍼용) + 더블탭 대시
// ============================================================
// WASD 이동 + 마우스 좌클릭(공격) K(점프) L(백스텝) / U I O P H Space(스킬)
// J / 방향키 + X C Z 조합도 그대로 사용 가능
const KEYMAP = {
  Mouse0: 'attack',   // 마우스 좌클릭 (가상 키코드)
  KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right',
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyJ: 'attack', KeyK: 'jump', KeyL: 'back',
  KeyX: 'attack', KeyC: 'jump', KeyZ: 'back',
  KeyU: 's1', KeyI: 's2', KeyO: 's3', KeyP: 's4', KeyH: 's5', Space: 's6',
  Digit1: 'pot1', Digit2: 'pot2', Numpad1: 'pot1', Numpad2: 'pot2',
  Escape: 'pause', KeyM: 'mute', Enter: 'confirm', NumpadEnter: 'confirm',
  F2: 'debug',
};
const SKILL_KEY_LABELS = ['U', 'I', 'O', 'P', 'H', 'SPC'];

const Input = {
  held: {},
  down: new Set(),    // 눌려있는 물리 키 (같은 액션에 키가 여러 개라서)
  queue: [],          // {a, t, dir}
  lastTap: { left: 0, right: 0 },
  lastDir: 0,         // 마지막으로 누른 좌우 (동시 입력 시 우선)
  any: false,

  init() {
    addEventListener('keydown', e => {
      if (KEYMAP[e.code] || e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
      if (e.repeat) return;
      this.press(e.code);
    });
    addEventListener('keyup', e => this.release(e.code));
    // 마우스 좌클릭 = 기본 공격
    addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();          // 드래그로 텍스트/이미지가 선택되지 않게
      this.press('Mouse0');
    });
    addEventListener('mouseup', e => { if (e.button === 0) this.release('Mouse0'); });
    addEventListener('blur', () => { this.held = {}; this.down.clear(); });
  },

  press(code) {
    const a = KEYMAP[code];
    this.any = true;
    if (!a) { this.queue.push({ a: 'any', t: performance.now() }); return; }
    const wasHeld = this.held[a];
    this.down.add(code);
    this.held[a] = true;
    const now = performance.now();
    if ((a === 'left' || a === 'right') && !wasHeld) {
      const d = a === 'left' ? -1 : 1;
      this.lastDir = d;
      if (now - this.lastTap[a] < 240) this.queue.push({ a: 'dash', dir: d, t: now });
      this.lastTap[a] = now;
    }
    this.queue.push({ a, t: now });
  },

  release(code) {
    const a = KEYMAP[code];
    this.down.delete(code);
    if (!a) return;
    this.held[a] = [...this.down].some(c => KEYMAP[c] === a);
    if (a === 'left' && this.held.right) this.lastDir = 1;
    if (a === 'right' && this.held.left) this.lastDir = -1;
  },

  axisX() {
    const l = this.held.left, r = this.held.right;
    if (l && r) return this.lastDir;
    return (r ? 1 : 0) - (l ? 1 : 0);
  },
  axisY() { return (this.held.down ? 1 : 0) - (this.held.up ? 1 : 0); },

  // 특정 액션을 큐에서 꺼냄 (UI용)
  take(a) {
    const i = this.queue.findIndex(q => q.a === a);
    if (i >= 0) { this.queue.splice(i, 1); return true; }
    return false;
  },
  takeAny() {
    const now = performance.now();
    const ok = this.queue.some(q => now - q.t < 400 && q.a !== 'mute' && q.a !== 'debug');
    return ok;
  },
  // 게임플레이 입력 소비 : 오래된 입력 제거
  drain(maxAge = 450) {
    const now = performance.now();
    const out = this.queue.filter(q => now - q.t < maxAge && q.a !== 'pause' && q.a !== 'mute' && q.a !== 'debug');
    this.queue = this.queue.filter(q => q.a === 'pause' || q.a === 'mute' || q.a === 'debug');
    return out;
  },
  clear() { this.queue.length = 0; },
};
