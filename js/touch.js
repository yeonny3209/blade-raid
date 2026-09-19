'use strict';
// ============================================================
//  모바일 터치 조작
//   왼쪽 : 화면을 누른 자리에 가상 스틱이 생김 (같은 방향 두 번 튕기면 대시)
//   오른쪽 : 공격 / 점프 / 백스텝 / 스킬 6 / 물약 2 버튼
//   입력은 전부 가상 키코드(T_*)로 바꿔 키보드와 똑같은 경로를 탄다
// ============================================================
const Touch = {
  on: false, stick: null, btns: [], dirs: {},

  init() {
    for (const a of ['left', 'right', 'up', 'down', 'attack', 'jump', 'back',
      's1', 's2', 's3', 's4', 's5', 's6', 'pot1', 'pot2', 'pause']) KEYMAP['T_' + a] = a;

    const B = (id, x, y, r, icon) => ({ id, x, y, r, icon, ptr: null, glow: 0 });
    this.btns = [
      B('attack', 1163, 588, 72, 'attack'),
      B('jump', 1016, 626, 48, 'jump'),
      B('back', 896, 600, 44, 'back'),
      B('s1', 884, 470, 41, 'upper'), B('s2', 984, 470, 41, 'rush'), B('s3', 1084, 470, 41, 'triple'),
      B('s4', 884, 364, 41, 'draw'), B('s5', 984, 364, 41, 'quake'), B('s6', 1084, 364, 41, 'ult'),
      B('pot1', 1202, 298, 34, 'hpPot'), B('pot2', 1202, 392, 34, 'mpPot'),
      B('pause', 1006, 40, 26, 'pause'),
    ];
    const opt = { passive: false };
    addEventListener('pointerdown', e => this.down(e), opt);
    addEventListener('pointermove', e => this.move(e), opt);
    addEventListener('pointerup', e => this.up(e), opt);
    addEventListener('pointercancel', e => this.up(e), opt);
    addEventListener('contextmenu', e => { if (this.on) e.preventDefault(); });
    // 터치를 놓친 채 앱이 백그라운드로 가면 키가 눌린 상태로 남는다 → 강제 해제
    addEventListener('blur', () => this.release());
    addEventListener('visibilitychange', () => { if (document.hidden) this.release(); });
    if (IS_MOBILE) this.on = true;
  },

  // 전체화면 + 가로 고정 (터치 제스처 안에서만 허용됨)
  goFullscreen() {
    if (this.fsTried) return;
    this.fsTried = true;
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => { });
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { });
    } catch (e) { }
  },

  toLogical(e) {
    const r = Game.canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
  },

  // 조작 버튼이 보이는 상태인가 (메뉴에서는 아무 데나 터치 = 확인)
  playing() {
    const s = Game.state;
    return s === 'play' || s === 'transition' || s === 'intro';
  },

  down(e) {
    if (e.pointerType === 'mouse') return;
    this.on = true;
    e.preventDefault();
    this.goFullscreen();
    const [x, y] = this.toLogical(e);

    // 일시정지 버튼은 항상 (일시정지 화면 포함)
    const pb = this.btns[this.btns.length - 1];
    if (this.playing() || Game.state === 'paused') {
      if (Math.hypot(x - pb.x, y - pb.y) < pb.r * 1.4) { pb.ptr = e.pointerId; pb.glow = 1; Input.press('T_pause'); return; }
    }
    if (Game.state === 'paused') { this.menuPtr = e.pointerId; Input.press('T_pause'); return; }  // 아무 데나 터치 = 계속
    if (!this.playing()) {                                             // 타이틀 / 결과 / 컨티뉴
      this.menuPtr = e.pointerId;
      Input.press('T_attack');
      return;
    }
    for (const b of this.btns) {
      if (b === pb || b.ptr !== null) continue;
      if (Math.hypot(x - b.x, y - b.y) < b.r * 1.25) { b.ptr = e.pointerId; b.glow = 1; Input.press('T_' + b.id); return; }
    }
    if (!this.stick && x < W * 0.55) { this.stick = { id: e.pointerId, ox: x, oy: y, x, y }; this.apply(); }
  },

  move(e) {
    if (!this.on || e.pointerType === 'mouse') return;
    if (this.stick && this.stick.id === e.pointerId) {
      e.preventDefault();
      const [x, y] = this.toLogical(e);
      this.stick.x = x; this.stick.y = y;
      // 스틱을 멀리 끌면 원점을 따라오게 (손가락이 미끄러져도 계속 조작됨)
      const dx = x - this.stick.ox, dy = y - this.stick.oy, L = Math.hypot(dx, dy);
      if (L > 110) { this.stick.ox += (dx / L) * (L - 110); this.stick.oy += (dy / L) * (L - 110); }
      this.apply();
    }
  },

  up(e) {
    if (e.pointerType === 'mouse') return;
    if (this.stick && this.stick.id === e.pointerId) { this.stick = null; this.apply(); }
    for (const b of this.btns) if (b.ptr === e.pointerId) { b.ptr = null; Input.release('T_' + b.id); }
    // 메뉴 탭은 눌린 채 남지 않도록 반드시 떼어준다 (도중에 화면이 바뀌어도)
    if (this.menuPtr === e.pointerId) { this.menuPtr = null; Input.release('T_attack'); Input.release('T_pause'); }
  },

  // 스틱 방향 → 방향키 (누르고 떼는 시점이 있어야 더블탭 대시가 동작함)
  apply() {
    const d = { left: false, right: false, up: false, down: false };
    if (this.stick) {
      const dx = this.stick.x - this.stick.ox, dy = this.stick.y - this.stick.oy;
      const L = Math.hypot(dx, dy);
      if (L > 16) {
        const nx = dx / L, ny = dy / L;
        d.right = nx > 0.38; d.left = nx < -0.38;
        d.down = ny > 0.42; d.up = ny < -0.42;
      }
    }
    for (const k in d) {
      if (d[k] && !this.dirs[k]) Input.press('T_' + k);
      else if (!d[k] && this.dirs[k]) Input.release('T_' + k);
    }
    this.dirs = d;
  },

  release() {   // 방 이동 등으로 조작이 끊길 때
    for (const k in this.dirs) if (this.dirs[k]) Input.release('T_' + k);
    this.dirs = {};
    for (const b of this.btns) if (b.ptr !== null) { b.ptr = null; Input.release('T_' + b.id); }
    this.stick = null;
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    if (!this.on) return;
    const pb = this.btns[this.btns.length - 1];
    if (Game.state === 'paused') { this.btn(ctx, pb, 0.5); return; }
    if (!this.playing()) return;
    const p = Game.player;
    for (const b of this.btns) {
      if (b.glow > 0) b.glow *= 0.85;
      this.btn(ctx, b, b.ptr !== null ? 0.62 : 0.32, p);
    }
    // 가상 스틱
    if (this.stick) {
      const s = this.stick;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(s.ox, s.oy, 78, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(10,14,24,0.3)'; ctx.fill();
      const dx = s.x - s.ox, dy = s.y - s.oy, L = Math.min(78, Math.hypot(dx, dy)) || 0;
      const a = Math.atan2(dy, dx);
      const kx = s.ox + Math.cos(a) * L, ky = s.oy + Math.sin(a) * L;
      ctx.fillStyle = 'rgba(180,215,255,0.5)'; ctx.beginPath(); ctx.arc(kx, ky, 36, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    }
  },

  btn(ctx, b, alpha, p) {
    ctx.save();
    ctx.globalAlpha = alpha + b.glow * 0.3;
    ctx.fillStyle = '#0c1018';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = b.id === 'attack' ? '#c9a55c' : '#8ea0c0'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = Math.min(1, alpha + 0.45 + b.glow * 0.3);
    const ic = UI.icons[b.icon];
    if (ic) {
      const s = b.r * 1.32;
      ctx.drawImage(ic, b.x - s / 2, b.y - s / 2, s, s);
    } else this.glyph(ctx, b);
    // 스킬 쿨타임 / 물약 개수
    if (p && /^s\d$/.test(b.id)) {
      const sk = SKILL_BY_KEY[b.id], cd = p.cd[b.id];
      if (p.mp < sk.mp) { ctx.globalAlpha = alpha + 0.25; ctx.fillStyle = 'rgba(10,20,70,0.6)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 1, 0, TAU); ctx.fill(); }
      if (cd > 0) {
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        ctx.arc(b.x, b.y, b.r - 1, -Math.PI / 2, -Math.PI / 2 + (cd / sk.cd) * TAU); ctx.closePath(); ctx.fill();
        UI.text(ctx, cd >= 1 ? Math.ceil(cd) : cd.toFixed(1), b.x, b.y + 1, { size: 22, align: 'center', stroke: 4 });
      }
    } else if (p && (b.id === 'pot1' || b.id === 'pot2')) {
      const n = b.id === 'pot1' ? p.pots.hp : p.pots.mp;
      ctx.globalAlpha = 1;
      UI.text(ctx, n, b.x + b.r * 0.55, b.y + b.r * 0.6, { size: 18, align: 'center', stroke: 4 });
    }
    ctx.restore();
  },

  glyph(ctx, b) {
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.strokeStyle = '#eaf2ff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#eaf2ff';
    const r = b.r;
    if (b.id === 'attack') {          // 검격 호
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(-r * 0.15, r * 0.15, r * 0.55, -Math.PI * 0.95, -Math.PI * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.36, -r * 0.42); ctx.lineTo(r * 0.52, -r * 0.1); ctx.lineTo(r * 0.16, -r * 0.2); ctx.closePath(); ctx.fill();
    } else if (b.id === 'jump') {     // 위 화살표
      ctx.beginPath(); ctx.moveTo(0, r * 0.4); ctx.lineTo(0, -r * 0.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.32, -r * 0.05); ctx.lineTo(0, -r * 0.45); ctx.lineTo(r * 0.32, -r * 0.05); ctx.closePath(); ctx.fill();
    } else if (b.id === 'back') {     // 뒤로 스텝
      ctx.beginPath(); ctx.moveTo(r * 0.45, 0); ctx.lineTo(-r * 0.2, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(-r * 0.1, -r * 0.32); ctx.lineTo(-r * 0.1, r * 0.32); ctx.closePath(); ctx.fill();
    } else if (b.id === 'pause') {    // 일시정지
      ctx.fillRect(-r * 0.34, -r * 0.4, r * 0.24, r * 0.8);
      ctx.fillRect(r * 0.1, -r * 0.4, r * 0.24, r * 0.8);
    }
    ctx.restore();
  },

  // 세로 화면 경고
  drawRotate(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2 - 40);
    ctx.strokeStyle = '#ffd87a'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
    ctx.save(); ctx.rotate(Math.sin(Game.time * 0.04) * 0.5 - 0.35);
    roundRect(ctx, -46, -76, 92, 152, 12); ctx.stroke();
    ctx.restore();
    UI.text(ctx, '가로로 돌려주세요', 0, 130, { size: 34, align: 'center', fill: '#ffe070', stroke: 6 });
    ctx.restore();
  },
};
