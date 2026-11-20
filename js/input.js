'use strict';
// ============================================================
//  입력 : 키 상태 + 입력 큐(선입력 버퍼용) + 더블탭 대시
// ============================================================
// WASD 이동 + 마우스 좌클릭(공격) + Space(점프) + Z(백스텝)
// 스킬 Q E T F G / 각성기 R / 물약 C V  (J·X 공격, L 백스텝, 방향키, 1·2 물약도 그대로 사용 가능)
const KEYMAP = {
  Mouse0: 'attack',   // 마우스 좌클릭 (가상 키코드)
  KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right',
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyJ: 'attack', KeyX: 'attack',
  Space: 'jump',
  KeyZ: 'back', KeyL: 'back',
  KeyQ: 's1', KeyE: 's2', KeyT: 's3', KeyF: 's4', KeyG: 's5', KeyR: 's6', KeyY: 'awk',
  KeyB: 'shop', KeyN: 'tower', KeyU: 'tower2', KeyK: 'codex', Digit3: 'gacha', Numpad3: 'gacha', Digit4: 'hub', Numpad4: 'hub', KeyI: 'tree', KeyO: 'options', KeyH: 'diff', KeyP: 'share', KeyC: 'pot1', KeyV: 'pot2', Digit1: 'pot1', Digit2: 'pot2', Numpad1: 'pot1', Numpad2: 'pot2',
  Escape: 'pause', KeyM: 'mute', Enter: 'confirm', NumpadEnter: 'confirm',
  F2: 'debug',
};
const SKILL_KEY_LABELS = ['Q', 'E', 'T', 'F', 'G', 'R'];
const POTION_KEY_LABELS = ['C', 'V'];

// 게임패드 (표준 배치 : Xbox 기준 이름)
//   전투 : X 공격 / A 점프 / B 백스텝 / Y·LB·RB·LT·RT 스킬 / 스틱 누르기 각성기 / 십자키 ↑↓ 물약 / START 일시정지
//   메뉴 : A 확인 / B 뒤로 / 그 밖의 버튼은 로비 바로가기
const PAD_COMBAT = { 0: 'jump', 1: 'back', 2: 'attack', 3: 's1', 4: 's2', 5: 's3', 6: 's4', 7: 's5', 10: 's6', 11: 's6', 8: 'awk', 9: 'pause', 12: 'pot1', 13: 'pot2', 14: 'left', 15: 'right' };
const PAD_MENU = { 0: 'confirm', 1: 'pause', 2: 'attack', 3: 'shop', 4: 'tree', 5: 'codex', 6: 'diff', 7: 'tower', 8: 'options', 9: 'pause', 10: 'tower2', 11: 'pot2', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
const PAD_SKILL_LABELS = ['Y', 'LB', 'RB', 'LT', 'RT', 'L3'];
const PAD_POTION_LABELS = ['↑', '↓'];
const PAD_ACTION_LABELS = { shop: 'Y', tree: 'LB', codex: 'RB', diff: 'LT', tower: 'RT', tower2: 'L3', options: 'SELECT', share: 'Y', pot2: 'R3' };
const KEY_ACTION_LABELS = { shop: 'B', tree: 'I', codex: 'K', gacha: '3', hub: '4', diff: 'H', tower: 'N', tower2: 'U', options: 'O', share: 'P', pot2: 'V' };

const Input = {
  held: {},
  down: new Set(),    // 눌려있는 물리 키 (같은 액션에 키가 여러 개라서)
  downAct: {},        // 눌린 키 → 그때 맡은 액션 (패드 버튼은 화면에 따라 역할이 바뀐다)
  padPrev: {}, padActive: false,     // padActive : 마지막 입력이 패드였는가 (화면의 키 안내를 바꾼다)
  queue: [],          // {a, t, dir}
  lastTap: { left: 0, right: 0 },
  lastDir: 0,         // 마지막으로 누른 좌우 (동시 입력 시 우선)
  any: false,

  init() {
    // 일부 환경(원격 입력 등)은 e.code 를 비워 보내므로 e.key 로 보충한다
    const codeOf = e => e.code || (e.key && e.key.length === 1 && /[a-z0-9]/i.test(e.key) ? (/[0-9]/.test(e.key) ? 'Digit' : 'Key') + e.key.toUpperCase() : (e.key === ' ' ? 'Space' : e.key || ''));
    addEventListener('keydown', e => {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;          // 닉네임 · 백업 코드 입력 중에는 게임 키로 쓰지 않는다
      if (e.ctrlKey || e.metaKey) return;   // Ctrl+R 새로고침 등 브라우저 단축키는 그대로 둠
      const code = codeOf(e);
      if (KEYMAP[code] || code.startsWith('Arrow') || code === 'Space' || code === 'Tab') e.preventDefault();
      if (e.repeat) return;
      this.press(code);
    });
    addEventListener('keyup', e => { if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return; this.release(codeOf(e)); });
    // 마우스 좌클릭 = 기본 공격
    addEventListener('mousedown', e => {
      if (e.button !== 0 || (e.target.closest && e.target.closest('#dlbar, #nickbox, #bakbox')) || (typeof Share !== 'undefined' && Share.swallow(e))) return;
      if (typeof Game !== 'undefined' && Game.state === 'paused') { e.preventDefault(); const [x, y] = Touch.toLogical(e); Pause.click(x, y); return; }
      if (typeof Game !== 'undefined' && /^(talk|cine|smap|camp|album|sres|hub|gacha)$/.test(Game.state)) { e.preventDefault(); return; }   // 스토리 화면 : 포인터 이벤트로 직접 처리
      if (typeof Game !== 'undefined' && Game.state === 'lobby') { e.preventDefault(); if (Lobby.enterT <= 0) { const [x, y] = Touch.toLogical(e); Lobby.touchAt(x, y); } return; }   // 로비 : 클릭한 버튼만 동작 (빈 곳 클릭으로 입장하지 않는다)
      e.preventDefault();          // 드래그로 텍스트/이미지가 선택되지 않게
      this.press('Mouse0');
    });
    addEventListener('mouseup', e => { if (e.button === 0) this.release('Mouse0'); });
    addEventListener('blur', () => { this.held = {}; this.down.clear(); this.downAct = {}; });
  },

  // ---------- 게임패드 : 매 프레임 상태를 읽어 키보드와 같은 길(press / release)로 보낸다 ----------
  pad() {
    if (!navigator.getGamepads) return null;
    let first = null;
    try { for (const g of navigator.getGamepads()) { if (!g || !g.connected) continue; if (g.mapping === 'standard') return g; first = first || g; } } catch (e) { }
    return first;
  },
  pollPad() {
    const gp = this.pad(), now = {};
    if (gp) {
      const st = typeof Game !== 'undefined' ? Game.state : 'title';
      const map = (st === 'play' || st === 'intro' || st === 'transition') ? PAD_COMBAT : PAD_MENU;
      for (let i = 0; i < gp.buttons.length; i++) {
        const b = gp.buttons[i];
        if (!map[i] || !(b && (b.pressed || b.value > 0.5))) continue;
        now['Pad' + i] = (i === 3 && (st === 'result' || st === 'gameover')) ? 'share' : map[i];
      }
      // 왼쪽 스틱 : 한 번 넘어가면 조금 돌아와도 유지 (경계에서 떨리지 않게)
      const x = gp.axes[0] || 0, y = gp.axes[1] || 0, th = c => (this.padPrev[c] ? 0.3 : 0.55);
      if (x < -th('PadAL')) now.PadAL = 'left'; else if (x > th('PadAR')) now.PadAR = 'right';
      if (y < -th('PadAU')) now.PadAU = 'up'; else if (y > th('PadAD')) now.PadAD = 'down';
    }
    for (const c in this.padPrev) if (!now[c]) this.release(c);
    for (const c in now) if (!this.padPrev[c]) this.press(c, now[c]);
    this.padPrev = now;
  },
  // 화면에 적는 조작 이름 (키보드 / 패드)
  skillLabel(i) { return (this.padActive ? PAD_SKILL_LABELS : SKILL_KEY_LABELS)[i]; },
  potionLabel(i) { return (this.padActive ? PAD_POTION_LABELS : POTION_KEY_LABELS)[i]; },
  label(a) { return (this.padActive ? PAD_ACTION_LABELS : KEY_ACTION_LABELS)[a] || ''; },

  press(code, act) {
    const a = act || KEYMAP[code];
    this.any = true; this.padActive = !!act;
    if (!a) { this.queue.push({ a: 'any', t: performance.now() }); return; }
    const wasHeld = this.held[a];
    this.down.add(code); this.downAct[code] = a;
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
    const a = this.downAct[code] || KEYMAP[code];
    this.down.delete(code); delete this.downAct[code];
    if (!a) return;
    this.held[a] = [...this.down].some(c => (this.downAct[c] || KEYMAP[c]) === a);
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
