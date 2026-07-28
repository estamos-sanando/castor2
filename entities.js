'use strict';
/* ============================================================
   ENTITIES.JS — High-Performance Image-Sprite & Fallback System
   Castores en Tierra del Fuego — Newsgame Interactivo
   ============================================================ */

// ──────────────────────────────────────────────────────────────
// IMAGE CACHE SYSTEM
// Preloads all real cropped PNG sprites for zero-lag 60fps rendering
// ──────────────────────────────────────────────────────────────
const ASSET_MANIFEST = {
  // Trees & Flora
  tree_healthy_1: 'assets/vegetation/tree_healthy_1.png',
  tree_healthy_2: 'assets/vegetation/tree_healthy_2.png',
  tree_healthy_3: 'assets/vegetation/tree_healthy_3.png',
  tree_healthy_4: 'assets/vegetation/tree_healthy_4.png',
  tree_healthy_5: 'assets/vegetation/tree_healthy_5.png',
  tree_healthy_6: 'assets/vegetation/tree_healthy_6.png',
  tree_healthy_7: 'assets/vegetation/tree_healthy_7.png',
  tree_healthy_8: 'assets/vegetation/tree_healthy_8.png',
  tree_young_1:   'assets/vegetation/tree_young_1.png',
  tree_young_2:   'assets/vegetation/tree_young_2.png',
  tree_dead_1:    'assets/vegetation/tree_dead_1.png',
  tree_dead_2:    'assets/vegetation/tree_dead_2.png',
  tree_dead_3:    'assets/vegetation/tree_dead_3.png',
  tree_flooded_1: 'assets/vegetation/tree_flooded_1.png',
  tree_flooded_2: 'assets/vegetation/tree_flooded_2.png',
  stump_fresh:    'assets/vegetation/stump_fresh.png',
  stump_old:      'assets/vegetation/stump_old.png',
  log_fresh:      'assets/vegetation/log_fresh.png',
  log_decayed:    'assets/vegetation/log_decayed.png',
  bush_1:         'assets/vegetation/bush_1.png',
  bush_2:         'assets/vegetation/bush_2.png',
  bush_calafate:  'assets/vegetation/bush_calafate.png',
  moss_1:         'assets/vegetation/moss_1.png',
  moss_2:         'assets/vegetation/moss_2.png',
  moss_3:         'assets/vegetation/moss_3.png',

  // Beavers & Characters
  beaver_idle:      'assets/characters/beaver_idle.png',
  beaver_walk:      'assets/characters/beaver_walk.png',
  beaver_cut:       'assets/characters/beaver_cut.png',
  beaver_carry:     'assets/characters/beaver_carry.png',
  beaver_build:     'assets/characters/beaver_build.png',
  beaver_celebrate: 'assets/characters/beaver_celebrate.png',

  beaver_small_idle:  'assets/characters/beaver_small_idle.png',
  beaver_small_walk:  'assets/characters/beaver_small_walk.png',
  beaver_small_carry: 'assets/characters/beaver_small_carry.png',

  ranger_idle: 'assets/characters/ranger_idle.png',
  ranger_walk: 'assets/characters/ranger_walk.png',
  ranger_trap: 'assets/characters/ranger_trap.png',

  scientist_idle:      'assets/characters/scientist_idle.png',
  scientist_walk:      'assets/characters/scientist_walk.png',
  scientist_sample:    'assets/characters/scientist_sample.png',
  scientist_clipboard: 'assets/characters/scientist_clipboard.png',
};

const IMAGE_CACHE = {};
const IMAGE_LOADED = {};

// Asynchronously load all PNG assets into memory
Object.keys(ASSET_MANIFEST).forEach(key => {
  const img = new Image();
  img.src = ASSET_MANIFEST[key];
  img.onload = () => {
    IMAGE_CACHE[key] = img;
    IMAGE_LOADED[key] = true;
  };
  img.onerror = () => {
    IMAGE_LOADED[key] = false;
  };
});

// Helper to retrieve loaded HTMLImageElement or null
function getLoadedImg(key) {
  return IMAGE_LOADED[key] ? IMAGE_CACHE[key] : null;
}

// ──────────────────────────────────────────────────────────────
// SPRITE PAINTER — Renders Real PNG Sprites with Fallback
// ──────────────────────────────────────────────────────────────
class SpritePainter {
  static _oc(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h; return c;
  }

  static _shadow(x, cx, cy, rx, ry) {
    x.save(); x.globalAlpha = 0.28;
    x.fillStyle = '#000';
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  }

  // ── BEAVER ADULT ──────────────────────────────────────────
  static beaver(size = 96, action = 'idle') {
    const key = `beaver_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('beaver_idle');
    if (realImg) {
      const W = size, H = Math.round(size * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.92, W * 0.35, H * 0.08);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralBeaver(size, action);
  }

  // ── BEAVER SMALL ──────────────────────────────────────────
  static beaver_small(size = 64) {
    const realImg = getLoadedImg('beaver_small_idle');
    if (realImg) {
      const W = size, H = Math.round(size * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.92, W * 0.35, H * 0.08);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralBeaverSmall(size);
  }

  // ── RANGER ────────────────────────────────────────────────
  static ranger(size = 96, action = 'idle') {
    const key = `ranger_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('ranger_idle');
    if (realImg) {
      const W = Math.round(size * 0.8), H = Math.round(size * 1.35);
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.96, W * 0.3, H * 0.06);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralRanger(size, action);
  }

  // ── SCIENTIST ──────────────────────────────────────────────
  static scientist(size = 96, action = 'idle') {
    const key = `scientist_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('scientist_idle');
    if (realImg) {
      const W = Math.round(size * 0.8), H = Math.round(size * 1.35);
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.96, W * 0.3, H * 0.06);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralScientist(size, action);
  }

  // ── HEALTHY TREE (8 real variants) ────────────────────────
  static tree_healthy(variant = 0) {
    const idx = (variant % 8) + 1;
    const key = `tree_healthy_${idx}`;
    const realImg = getLoadedImg(key) || getLoadedImg('tree_healthy_1');
    if (realImg) {
      const W = 130, H = Math.round(130 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.95, W * 0.32, H * 0.07);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralTreeHealthy(variant);
  }

  // ── DEAD TREE ─────────────────────────────────────────────
  static tree_dead() {
    const realImg = getLoadedImg('tree_dead_1') || getLoadedImg('tree_dead_2');
    if (realImg) {
      const W = 110, H = Math.round(110 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.95, W * 0.28, H * 0.06);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralTreeDead();
  }

  // ── FLOODED TREE ──────────────────────────────────────────
  static tree_flooded() {
    const realImg = getLoadedImg('tree_flooded_1') || getLoadedImg('tree_flooded_2');
    if (realImg) {
      const W = 110, H = Math.round(110 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      // Water ripple shadow
      ctx.fillStyle = 'rgba(40,110,150,0.6)';
      ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.92, W * 0.38, H * 0.09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralTreeFlooded();
  }

  // ── STUMP ─────────────────────────────────────────────────
  static stump(age = 'fresh') {
    const key = age === 'fresh' ? 'stump_fresh' : 'stump_old';
    const realImg = getLoadedImg(key);
    if (realImg) {
      const W = 75, H = Math.round(75 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.92, W * 0.38, H * 0.09);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralStump(age);
  }

  // ── LOG ───────────────────────────────────────────────────
  static log(decayed = false) {
    const key = decayed ? 'log_decayed' : 'log_fresh';
    const realImg = getLoadedImg(key);
    if (realImg) {
      const W = 100, H = Math.round(100 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.9, W * 0.42, H * 0.12);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralLog(decayed);
  }

  // ── BUSH ──────────────────────────────────────────────────
  static bush() {
    const realImg = getLoadedImg('bush_calafate') || getLoadedImg('bush_1');
    if (realImg) {
      const W = 88, H = Math.round(88 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      this._shadow(ctx, W * 0.5, H * 0.9, W * 0.38, H * 0.1);
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralBush();
  }

  // ── MOSS ──────────────────────────────────────────────────
  static moss() {
    const realImg = getLoadedImg('moss_1') || getLoadedImg('moss_2');
    if (realImg) {
      const W = 85, H = Math.round(85 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._proceduralMoss();
  }

  static rock() {
    return this._proceduralRock();
  }

  static dam(level = 1) {
    return this._proceduralDam(level);
  }

  static cage_sprite() {
    return this._proceduralCage();
  }

  static seedling_sprite() {
    return this._proceduralSeedling();
  }

  static leaf_particle(col = '#4a8c2a') {
    return this._proceduralLeaf(col);
  }

  static wood_chip() {
    return this._proceduralWoodChip();
  }

  // ────────────────────────────────────────────────────────────
  // PROCEDURAL FALLBACKS (Used if image is loading or unavailable)
  // ────────────────────────────────────────────────────────────
  static _proceduralBeaver(size, action) {
    const W = size, H = size, c = this._oc(W, H), ctx = c.getContext('2d'), s = size / 96;
    this._shadow(ctx, W*0.5, H*0.9, W*0.28, H*0.06);
    ctx.save();
    ctx.fillStyle = '#8a5020'; ctx.beginPath(); ctx.ellipse(W*0.5, H*0.6, 24*s, 16*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c88040'; ctx.beginPath(); ctx.arc(W*0.65, H*0.4, 14*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffcc40'; ctx.fillRect(W*0.75, H*0.42, 4*s, 6*s);
    ctx.restore(); return c;
  }

  static _proceduralBeaverSmall(size) {
    const W = size, H = size, c = this._oc(W, H), ctx = c.getContext('2d'), s = size / 64;
    this._shadow(ctx, W*0.5, H*0.88, 16*s, 5*s);
    ctx.fillStyle = '#a07030'; ctx.beginPath(); ctx.ellipse(W*0.5, H*0.6, 16*s, 12*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#d09848'; ctx.beginPath(); ctx.arc(W*0.62, H*0.4, 11*s, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralRanger(size, action) {
    const W = Math.round(size*0.8), H = Math.round(size*1.35), c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, W*0.5, H*0.96, 18, 5);
    ctx.fillStyle = '#4a5030'; ctx.fillRect(W*0.3, H*0.6, 12, 24); ctx.fillRect(W*0.5, H*0.6, 12, 24);
    ctx.fillStyle = '#6e6e42'; ctx.fillRect(W*0.2, H*0.3, 30, 26);
    ctx.fillStyle = '#f0c89a'; ctx.beginPath(); ctx.arc(W*0.5, H*0.18, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#5a4a28'; ctx.beginPath(); ctx.ellipse(W*0.5, H*0.08, 16, 4, 0, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralScientist(size, action) {
    const W = Math.round(size*0.8), H = Math.round(size*1.35), c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, W*0.5, H*0.96, 18, 5);
    ctx.fillStyle = '#3a4050'; ctx.fillRect(W*0.3, H*0.6, 12, 24); ctx.fillRect(W*0.5, H*0.6, 12, 24);
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(W*0.2, H*0.28, 30, 28);
    ctx.fillStyle = '#f5c8a0'; ctx.beginPath(); ctx.arc(W*0.5, H*0.17, 12, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralTreeHealthy(variant) {
    const W = 130, H = 180, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, 65, 170, 38, 10);
    ctx.fillStyle = '#6a4020'; ctx.fillRect(56, 90, 18, 78);
    ctx.fillStyle = '#2e6a1e'; ctx.beginPath(); ctx.ellipse(65, 80, 48, 34, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a8a2a'; ctx.beginPath(); ctx.ellipse(65, 50, 38, 28, 0, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralTreeDead() {
    const W = 110, H = 180, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, 55, 170, 28, 8);
    ctx.fillStyle = '#8a9898'; ctx.fillRect(48, 55, 14, 113);
    return c;
  }

  static _proceduralTreeFlooded() {
    const W = 110, H = 180, c = this._oc(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(50,120,160,0.8)'; ctx.beginPath(); ctx.ellipse(55, 162, 40, 12, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7a8888'; ctx.fillRect(48, 55, 14, 100);
    return c;
  }

  static _proceduralStump(age) {
    const W = 75, H = 85, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, 37, 78, 28, 8);
    ctx.fillStyle = age==='fresh'?'#7a5030':'#6a7878'; ctx.fillRect(20, 40, 35, 38);
    ctx.fillStyle = age==='fresh'?'#e0b870':'#b0bcbc'; ctx.beginPath(); ctx.ellipse(37, 40, 17, 7, 0, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralLog(decayed) {
    const W = 100, H = 50, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, 50, 44, 42, 7);
    ctx.fillStyle = decayed?'#6a6060':'#c49a6c'; ctx.beginPath(); ctx.roundRect(10, 12, 80, 26, 6); ctx.fill();
    return c;
  }

  static _proceduralBush() {
    const W = 88, H = 70, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, 44, 62, 34, 9);
    ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.ellipse(44, 40, 34, 22, 0, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralMoss() {
    const W = 85, H = 50, c = this._oc(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#3a6a28'; ctx.beginPath(); ctx.ellipse(42, 25, 36, 18, 0, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralRock() {
    const W = 95, H = 65, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, 38, 57, 28, 8);
    ctx.fillStyle = '#909898'; ctx.beginPath(); ctx.ellipse(38, 35, 28, 20, 0, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralDam(level) {
    const W = 80 + level*40, H = 50 + level*15, c = this._oc(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#4a3528'; ctx.beginPath(); ctx.ellipse(W/2, H*0.82, W*0.44, H*0.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#9a7060'; ctx.fillRect(W*0.2, H*0.3, W*0.6, H*0.3);
    return c;
  }

  static _proceduralCage() {
    const W = 90, H = 65, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, W/2, H*.9, 38, 8);
    ctx.fillStyle = '#8a9a9a'; ctx.strokeStyle = '#4a5a5a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(8, 12, 74, 44, 4); ctx.fill(); ctx.stroke();
    return c;
  }

  static _proceduralSeedling() {
    const W = 28, H = 38, c = this._oc(W, H), ctx = c.getContext('2d');
    this._shadow(ctx, 14, 35, 8, 3);
    ctx.fillStyle = '#3a8a28'; ctx.beginPath(); ctx.ellipse(14, 14, 9, 8, 0, 0, Math.PI*2); ctx.fill();
    return c;
  }

  static _proceduralLeaf(col) {
    const c = this._oc(14, 14), x = c.getContext('2d');
    x.fillStyle = col; x.beginPath(); x.arc(7, 7, 5, 0, Math.PI*2); x.fill();
    return c;
  }

  static _proceduralWoodChip() {
    const c = this._oc(12, 8), x = c.getContext('2d');
    x.fillStyle = '#d4b06c'; x.fillRect(0, 0, 12, 8);
    return c;
  }
}

// ──────────────────────────────────────────────────────────────
// ENTITY BASE CLASS
// ──────────────────────────────────────────────────────────────
class Entity {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.baseY = y;
    this.alpha = 1;
    this.visible = true;
    this.dead = false;
    this.sprite = null;
    this.id = Entity._nextId++;
  }

  update(dt, game) { /* override */ }

  draw(ctx) {
    if (!this.visible || !this.sprite) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height);
    ctx.restore();
  }

  distanceTo(other) {
    const dx = other.x - this.x, dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
Entity._nextId = 0;

// ──────────────────────────────────────────────────────────────
// TREE ENTITY
// ──────────────────────────────────────────────────────────────
class Tree extends Entity {
  constructor(x, y, variant = 0) {
    super(x, y);
    this.variant = variant;
    this.state = 'healthy'; // healthy | stump_fresh | stump_old | flooded | dead
    this.being_cut = false;
    this._refreshSprite();
    this.baseY = y + (this.sprite ? this.sprite.height * 0.05 : 0);
  }

  _refreshSprite() {
    switch (this.state) {
      case 'healthy':     this.sprite = SpritePainter.tree_healthy(this.variant); break;
      case 'dead':        this.sprite = SpritePainter.tree_dead(); break;
      case 'flooded':     this.sprite = SpritePainter.tree_flooded(); break;
      case 'stump_fresh': this.sprite = SpritePainter.stump('fresh'); break;
      case 'stump_old':   this.sprite = SpritePainter.stump('old'); break;
    }
  }

  setState(state) {
    this.state = state;
    this.being_cut = false;
    this._refreshSprite();
  }

  get isHealthy() { return this.state === 'healthy' && !this.being_cut; }

  update(dt, game) {
    if (this.state === 'stump_fresh') {
      this._ageTimer = (this._ageTimer || 0) + dt;
      if (this._ageTimer > 120) {
        this.setState('stump_old');
        this._ageTimer = 0;
      }
    }
    // Re-check sprite if image finished loading asynchronously
    if (Math.random() < 0.05) this._refreshSprite();
    this.baseY = this.y + (this.sprite ? this.sprite.height * 0.05 : 0);
  }

  draw(ctx) {
    if (!this.visible || !this.sprite) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// DAM ENTITY
// ──────────────────────────────────────────────────────────────
class Dam extends Entity {
  constructor(x, y) {
    super(x, y);
    this.level = 1;
    this.active = true;
    this._refreshSprite();
  }

  _refreshSprite() {
    this.sprite = SpritePainter.dam(this.level);
    this.baseY = this.y;
  }

  grow() {
    if (this.level < 3) {
      this.level++;
      this._refreshSprite();
    }
  }

  remove() {
    this.dead = true;
    this.active = false;
  }

  draw(ctx) {
    if (!this.visible || !this.sprite) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// CAGE ENTITY — placed by player, captures beavers
// ──────────────────────────────────────────────────────────────
class Cage extends Entity {
  constructor(x, y) {
    super(x, y);
    this.sprite = SpritePainter.cage_sprite();
    this.captureRadius = 55;
    this.captured = false;
    this.captureFlash = 0;
    this.baseY = y;
  }

  update(dt, game) {
    if (this.captured) { this.captureFlash = Math.max(0, this.captureFlash - dt); return; }
    const beavers = game.entities.filter(e => e instanceof Beaver && !e.dead && !e.captured);
    for (const b of beavers) {
      if (this.distanceTo(b) < this.captureRadius) {
        b.captured = true;
        b.state = 'captured';
        b.alpha = 0;
        b.dead = true;
        this.captured = true;
        this.captureFlash = 1.0;
        game.onBeaverCaptured(this);
        break;
      }
    }
  }

  draw(ctx) {
    if (!this.sprite) return;
    ctx.save();
    ctx.globalAlpha = this.captured ? 0.5 + this.captureFlash * 0.5 : 0.92;
    ctx.translate(this.x, this.y);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);
    if (this.captureFlash > 0) {
      ctx.globalAlpha = this.captureFlash * 0.4;
      ctx.fillStyle = '#ffff44';
      ctx.beginPath(); ctx.ellipse(0, 0, 50, 20, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// SEEDLING — planted by player, grows into tree
// ──────────────────────────────────────────────────────────────
class Seedling extends Entity {
  constructor(x, y) {
    super(x, y);
    this.sprite = SpritePainter.seedling_sprite();
    this.growTimer = 45;
    this.grown = false;
    this.baseY = y;
    this.growProgress = 0;
  }

  update(dt, game) {
    if (this.grown) return;
    this.growTimer -= dt;
    this.growProgress = 1 - Math.max(0, this.growTimer / 45);
    this.alpha = 0.6 + this.growProgress * 0.4;
    if (this.growTimer <= 0) {
      this.grown = true;
      const tree = new Tree(this.x, this.y, Math.floor(Math.random() * 8));
      game.entities.push(tree);
      game.stats.trees = Math.min(100, game.stats.trees + 2);
      this.dead = true;
    }
  }

  draw(ctx) {
    if (!this.sprite) return;
    const scale = 0.5 + this.growProgress * 0.7;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// LOG ENTITY — spawned when beaver cuts a tree
// ──────────────────────────────────────────────────────────────
class LogEntity extends Entity {
  constructor(x, y) {
    super(x, y);
    this.sprite = SpritePainter.log(false);
    this.decayTimer = 90;
    this.claimed = false;
    this.baseY = y;
  }

  update(dt, game) {
    this.decayTimer -= dt;
    if (this.decayTimer < 20) this.alpha = this.decayTimer / 20;
    if (this.decayTimer <= 0) this.dead = true;
  }

  draw(ctx) {
    if (!this.sprite) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 3);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// BEAVER ADULT — AI State Machine
// ──────────────────────────────────────────────────────────────
class Beaver extends Entity {
  constructor(x, y, isSmall = false) {
    super(x, y);
    this.isSmall = isSmall;
    this.captured = false;
    this.state = 'idle';
    this.action = 'idle';
    this.speed = isSmall ? 32 : 52;
    this.targetX = x; this.targetY = y;
    this.targetTree = null;
    this.targetLog = null;
    this.carryingLog = false;
    this.cutTimer = 0;
    this.buildTimer = 0;
    this.idleTimer = 1 + Math.random() * 3;
    this.wanderTimer = 0;
    this.facingLeft = Math.random() > 0.5;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.celebrateTimer = 0;
    this.treesChopped = 0;
    this.damsBuilt = 0;
    this._refreshSprite();
    this.baseY = y;
  }

  _refreshSprite() {
    if (this.isSmall) {
      this.sprite = SpritePainter.beaver_small(56);
    } else {
      this.sprite = SpritePainter.beaver(88, this.action);
    }
  }

  update(dt, game) {
    if (this.dead || this.captured) return;
    this.bobPhase += dt * 3.2;
    if (this.celebrateTimer > 0) {
      this.celebrateTimer -= dt;
      this.action = 'celebrate';
      this._refreshSprite();
      return;
    }

    switch (this.state) {
      case 'idle':       this._doIdle(dt, game); break;
      case 'search':     this._doSearch(dt, game); break;
      case 'walk_tree':  this._doWalkTo(dt, this.targetX, this.targetY, 'cut'); break;
      case 'cut':        this._doCut(dt, game); break;
      case 'walk_log':   this._doWalkTo(dt, this.targetX, this.targetY, 'carry_log'); break;
      case 'carry_log':  this._doCarryLog(dt, game); break;
      case 'walk_river': this._doWalkTo(dt, this.targetX, this.targetY, 'build'); break;
      case 'build':      this._doBuild(dt, game); break;
    }

    this._refreshSprite();
    this.baseY = this.y;
  }

  _doIdle(dt, game) {
    this.action = 'idle';
    this.idleTimer -= dt;
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.targetX = this.x + (Math.random() - 0.5) * 100;
      this.targetY = this.y + (Math.random() - 0.5) * 60;
      this.targetX = Math.max(80, Math.min(game.canvas.width - 80, this.targetX));
      this.targetY = Math.max(80, Math.min(game.canvas.height - 160, this.targetY));
      this.wanderTimer = 2 + Math.random() * 3;
      this.action = 'walk';
    }
    this._moveTo(this.targetX, this.targetY, dt, 22);
    if (this.idleTimer <= 0) {
      this.state = 'search';
      this.idleTimer = 2 + Math.random() * 3;
    }
  }

  _doSearch(dt, game) {
    let best = null, bestDist = Infinity;
    for (const e of game.entities) {
      if (e instanceof Tree && e.isHealthy) {
        const d = this.distanceTo(e);
        if (d < bestDist) { bestDist = d; best = e; }
      }
    }

    if (best) {
      best.being_cut = true;
      this.targetTree = best;
      this.targetX = best.x + (Math.random() - 0.5) * 20;
      this.targetY = best.y + 10 + Math.random() * 15;
      this.state = 'walk_tree';
      this.action = 'walk';
    } else {
      this.state = 'idle';
    }
  }

  _doWalkTo(dt, tx, ty, nextState) {
    this.action = 'walk';
    const arrived = this._moveTo(tx, ty, dt, this.speed);
    if (arrived) {
      this.state = nextState;
      this.cutTimer = 3 + Math.random();
      this.buildTimer = 3.5 + Math.random();
    }
  }

  _doCut(dt, game) {
    this.action = 'cut';
    this.cutTimer -= dt;
    if (Math.random() < 0.15 && game.particles) {
      game.particles.burst(this.x, this.y - 30, 'wood', 3);
    }
    if (this.cutTimer <= 0) {
      if (this.targetTree) {
        this.targetTree.setState('stump_fresh');
        this.treesChopped++;
        game.stats.trees = Math.max(0, game.stats.trees - (this.isSmall ? 1 : 2));
        game.stats.stumps = (game.stats.stumps || 0) + 1;
        game.onTreeFelled(this.targetTree, this);
        const log = new LogEntity(this.targetTree.x + (Math.random()-0.5)*20, this.targetTree.y);
        game.entities.push(log);
        this.targetLog = log;
        this.state = 'walk_log';
        this.targetX = log.x; this.targetY = log.y;
        this.targetTree = null;
      } else {
        this.state = 'idle';
      }
    }
  }

  _doCarryLog(dt, game) {
    if (this.targetLog && !this.targetLog.claimed) {
      this.targetLog.claimed = true;
      this.carryingLog = true;
      this.action = 'carry';
      const river = game.getNearestRiverPoint(this.x, this.y);
      this.targetX = river.x; this.targetY = river.y;
      this.state = 'walk_river';
    } else {
      this.carryingLog = false;
      this.state = 'idle';
    }
  }

  _doBuild(dt, game) {
    this.action = 'build';
    this.buildTimer -= dt;
    if (this.buildTimer <= 0) {
      this.carryingLog = false;
      if (this.targetLog) { this.targetLog.dead = true; this.targetLog = null; }
      this.damsBuilt++;
      game.onBeaverBuiltDam(this);
      this.state = 'idle';
      this.celebrateTimer = 1.2;
    }
  }

  _moveTo(tx, ty, dt, speed) {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) return true;
    this.x += (dx / dist) * speed * dt;
    this.y += (dy / dist) * speed * dt;
    this.facingLeft = dx < 0;
    return false;
  }

  draw(ctx) {
    if (!this.sprite || !this.visible) return;
    const bob = Math.sin(this.bobPhase) * 1.5;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y + bob);
    if (this.facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// RANGER
// ──────────────────────────────────────────────────────────────
class Ranger extends Entity {
  constructor(x, y) {
    super(x, y);
    this.state = 'patrol';
    this.action = 'idle';
    this.speed = 38;
    this.targetX = x; this.targetY = y;
    this.patrolPoints = [];
    this.patrolIdx = 0;
    this.facingLeft = false;
    this.bobPhase = Math.random() * Math.PI * 2;
    this._refreshSprite();
  }

  setPatrol(points) {
    this.patrolPoints = points;
    if (points.length > 0) {
      this.targetX = points[0].x; this.targetY = points[0].y;
    }
  }

  _refreshSprite() {
    this.sprite = SpritePainter.ranger(88, this.action);
  }

  update(dt, game) {
    this.bobPhase += dt * 2.5;
    if (this.patrolPoints.length > 0) {
      const arrived = this._moveTo(this.targetX, this.targetY, dt);
      this.action = arrived ? 'idle' : 'walk';
      if (arrived) {
        this.patrolIdx = (this.patrolIdx + 1) % this.patrolPoints.length;
        this.targetX = this.patrolPoints[this.patrolIdx].x;
        this.targetY = this.patrolPoints[this.patrolIdx].y;
      }
    } else {
      this.action = 'idle';
    }
    this._refreshSprite();
    this.baseY = this.y;
  }

  _moveTo(tx, ty, dt) {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) return true;
    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
    this.facingLeft = dx < 0;
    return false;
  }

  draw(ctx) {
    if (!this.sprite) return;
    const bob = Math.sin(this.bobPhase) * 1.2;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y + bob);
    if (this.facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// SCIENTIST
// ──────────────────────────────────────────────────────────────
class Scientist extends Entity {
  constructor(x, y) {
    super(x, y);
    this.state = 'idle';
    this.action = 'idle';
    this.speed = 34;
    this.targetX = x; this.targetY = y;
    this.actionTimer = 4 + Math.random() * 4;
    this.facingLeft = true;
    this.bobPhase = Math.random() * Math.PI * 2;
    this._refreshSprite();
  }

  _refreshSprite() {
    this.sprite = SpritePainter.scientist(88, this.action);
  }

  update(dt, game) {
    this.bobPhase += dt * 2.2;
    this.actionTimer -= dt;

    if (this.actionTimer <= 0) {
      const actions = ['idle', 'walk', 'sample', 'clipboard'];
      this.action = actions[Math.floor(Math.random() * actions.length)];
      this.actionTimer = 3 + Math.random() * 4;
      if (this.action === 'walk') {
        this.targetX = this.x + (Math.random() - 0.5) * 160;
        this.targetY = this.y + (Math.random() - 0.5) * 80;
        this.targetX = Math.max(80, Math.min(game.canvas.width - 80, this.targetX));
        this.targetY = Math.max(80, Math.min(game.canvas.height - 160, this.targetY));
      }
    }

    if (this.action === 'walk') {
      const dx = this.targetX - this.x, dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        this.facingLeft = dx < 0;
      } else { this.action = 'idle'; }
    }

    this._refreshSprite();
    this.baseY = this.y;
  }

  draw(ctx) {
    if (!this.sprite) return;
    const bob = Math.sin(this.bobPhase) * 1.1;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y + bob);
    if (this.facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// PARTICLE POOL
// ──────────────────────────────────────────────────────────────
class ParticlePool {
  constructor(maxCount = 300) {
    this.pool = [];
    this.maxCount = maxCount;
    this.leafSprites = [
      SpritePainter.leaf_particle('#3a7020'),
      SpritePainter.leaf_particle('#d4a020'),
      SpritePainter.leaf_particle('#c04010'),
      SpritePainter.leaf_particle('#7a9830'),
    ];
    this.woodChip = SpritePainter.wood_chip();
    this._seedAmbient(60);
  }

  _seedAmbient(n) {
    for (let i = 0; i < n; i++) {
      this.pool.push({
        x: Math.random() * 1920, y: Math.random() * 1080,
        vx: (Math.random() - 0.5) * 0.8, vy: Math.random() * 0.5 + 0.1,
        rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.05,
        alpha: Math.random() * 0.7 + 0.2, decay: 0, life: 1,
        kind: 'leaf', leafIdx: Math.floor(Math.random() * 4),
        scale: 0.5 + Math.random() * 0.8
      });
    }
  }

  burst(x, y, kind = 'leaf', count = 12) {
    for (let i = 0; i < count; i++) {
      if (this.pool.length >= this.maxCount) break;
      const speed = 0.8 + Math.random() * 2.5;
      const angle = Math.random() * Math.PI * 2;
      this.pool.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5,
        rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.12,
        alpha: 0.9, decay: 0.008 + Math.random() * 0.006,
        life: 1, kind, leafIdx: Math.floor(Math.random() * 4),
        scale: 0.6 + Math.random() * 0.8
      });
    }
  }

  update(dt) {
    const fps60 = dt * 60;
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.x += p.vx * fps60; p.y += p.vy * fps60;
      p.vy += 0.04 * fps60; p.rot += p.rotV * fps60;
      if (p.decay > 0) {
        p.alpha -= p.decay * fps60;
        if (p.alpha <= 0) { this.pool.splice(i, 1); continue; }
      } else {
        if (p.y > 1200) p.y = -10;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    this.pool.forEach(p => {
      const sp = p.kind === 'wood' ? this.woodChip : this.leafSprites[p.leafIdx];
      if (!sp) return;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(p.scale, p.scale);
      ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
