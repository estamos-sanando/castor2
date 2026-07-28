'use strict';
/* ============================================================
   ENTITIES.JS — 100% Real Image Sprite Engine & Asset System
   Age of Empires RTS Scale Proportions & Bottom-Center (0.5, 1.0) Anchor
   ============================================================ */

const ASSET_MANIFEST = {
  // Trees & Flora (All extracted from user sheets)
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

  // Rocks, Bushes, Moss & Understory
  rock_1:          'assets/vegetation/rock_1.png',
  rock_2:          'assets/vegetation/rock_2.png',
  rock_3:          'assets/vegetation/rock_3.png',
  bush_1:          'assets/vegetation/bush_1.png',
  bush_2:          'assets/vegetation/bush_2.png',
  bush_calafate:   'assets/vegetation/bush_calafate.png',
  bush_notro:      'assets/vegetation/bush_notro.png',
  bush_flowering:  'assets/vegetation/bush_flowering.png',
  grass_1:         'assets/vegetation/grass_1.png',
  grass_2:         'assets/vegetation/grass_2.png',
  flower_1:        'assets/vegetation/flower_1.png',
  moss_1:          'assets/vegetation/moss_1.png',
  moss_2:          'assets/vegetation/moss_2.png',
  moss_3:          'assets/vegetation/moss_3.png',
  moss_4:          'assets/vegetation/moss_4.png',

  // Real Beaver Dam Sprites (Stages: Constructing, Active, Dismantled)
  dique_real:    'assets/objects/dique_real.png',
  dique_nivel_1: 'assets/objects/dique_nivel_1.png',
  dique_nivel_2: 'assets/objects/dique_nivel_2.png',
  dique_nivel_3: 'assets/objects/dique_nivel_3.png',

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

// Asynchronously load all PNG assets into memory with caching
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

function getLoadedImg(key) {
  return IMAGE_LOADED[key] ? IMAGE_CACHE[key] : null;
}

// ──────────────────────────────────────────────────────────────
// SPRITE PAINTER — Pure Real PNG Renderer & AoE2 Realistic Proportions
// ──────────────────────────────────────────────────────────────
class SpritePainter {
  static _oc(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w); c.height = Math.max(1, h); return c;
  }

  // ── BEAVER ADULT (Realistic RTS Scale ~0.35x of Human: ~36x28px) ──────
  static beaver(size = 36, action = 'idle') {
    const key = `beaver_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('beaver_idle');
    if (realImg) {
      const W = size, H = Math.round(size * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(size, size);
  }

  // ── BEAVER SMALL (Realistic RTS Scale: ~24x18px) ──────────────────────
  static beaver_small(size = 24) {
    const realImg = getLoadedImg('beaver_small_idle');
    if (realImg) {
      const W = size, H = Math.round(size * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(size, size);
  }

  // ── RANGER (Human Base Scale 1.0: Height ~68-75px) ───────────────────
  static ranger(size = 64, action = 'idle') {
    const key = `ranger_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('ranger_idle');
    if (realImg) {
      const W = Math.round(size * 0.75), H = Math.round(size * 1.25);
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(size, size);
  }

  // ── SCIENTIST (Human Base Scale 1.0: Height ~68-75px) ────────────────
  static scientist(size = 64, action = 'idle') {
    const key = `scientist_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('scientist_idle');
    if (realImg) {
      const W = Math.round(size * 0.75), H = Math.round(size * 1.25);
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(size, size);
  }

  // ── HEALTHY LENGA TREE (Adult Lenga Scale 2.5-3.0x: ~185x240px) ─────
  static tree_healthy(variant = 0) {
    const idx = (variant % 8) + 1;
    const key = `tree_healthy_${idx}`;
    const realImg = getLoadedImg(key) || getLoadedImg('tree_healthy_1');
    if (realImg) {
      const W = 185, H = Math.round(185 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(185, 240);
  }

  // ── CHEWED / DAMAGED TREE STATE ────────────────────────────────────
  static tree_chewed(variant = 0) {
    const idx = (variant % 8) + 1;
    const key = `tree_healthy_${idx}`;
    const realImg = getLoadedImg(key) || getLoadedImg('tree_healthy_1');
    if (realImg) {
      const W = 185, H = Math.round(185 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      // Chewed bark mark at trunk base
      ctx.fillStyle = '#d4b06c';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.88, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      return c;
    }
    return this.tree_healthy(variant);
  }

  // ── DEAD / GHOST TREE ─────────────────────────────────────────────
  static tree_dead() {
    const realImg = getLoadedImg('tree_dead_1') || getLoadedImg('tree_dead_2') || getLoadedImg('tree_dead_3');
    if (realImg) {
      const W = 130, H = Math.round(130 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(130, 180);
  }

  // ── FLOODED TREE ──────────────────────────────────────────
  static tree_flooded() {
    const realImg = getLoadedImg('tree_flooded_1') || getLoadedImg('tree_flooded_2');
    if (realImg) {
      const W = 140, H = Math.round(140 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(140, 190);
  }

  // ── STUMP ─────────────────────────────────────────────────
  static stump(age = 'fresh') {
    const key = age === 'fresh' ? 'stump_fresh' : 'stump_old';
    const realImg = getLoadedImg(key) || getLoadedImg('stump_fresh');
    if (realImg) {
      const W = 45, H = Math.round(45 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(45, 35);
  }

  // ── LOG ───────────────────────────────────────────────────
  static log(decayed = false) {
    const key = decayed ? 'log_decayed' : 'log_fresh';
    const realImg = getLoadedImg(key) || getLoadedImg('log_fresh');
    if (realImg) {
      const W = 65, H = Math.round(65 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(65, 35);
  }

  // ── ROCKS (Real extracted PNGs) ───────────────────────────
  static rock(variant = 0) {
    const idx = (variant % 3) + 1;
    const realImg = getLoadedImg(`rock_${idx}`) || getLoadedImg('rock_1');
    if (realImg) {
      const W = 50, H = Math.round(50 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(50, 30);
  }

  // ── BUSHES (Scale 0.5-0.7x) ───────────────────────────────
  static bush(variant = 0) {
    const bushes = ['bush_calafate', 'bush_notro', 'bush_flowering', 'bush_1', 'bush_2'];
    const key = bushes[variant % bushes.length];
    const realImg = getLoadedImg(key) || getLoadedImg('bush_calafate');
    if (realImg) {
      const W = 60, H = Math.round(60 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(60, 45);
  }

  // ── MOSS & UNDERSTORY ──────────────────────────────────────
  static moss(variant = 0) {
    const idx = (variant % 4) + 1;
    const realImg = getLoadedImg(`moss_${idx}`) || getLoadedImg('moss_1');
    if (realImg) {
      const W = 55, H = Math.round(55 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(55, 35);
  }

  // ── BEAVER DAM (Stages: Constructing, Active, Dismantled/Broken) ────
  static dam(level = 1, state = 'active') {
    if (state === 'dismantled' || state === 'broken') {
      const realImg = getLoadedImg('log_decayed') || getLoadedImg('log_fresh');
      if (realImg) {
        const W = 140, H = Math.round(140 * (realImg.height / realImg.width));
        const c = this._oc(W, H), ctx = c.getContext('2d');
        ctx.globalAlpha = 0.65;
        ctx.drawImage(realImg, 0, 0, W, H);
        return c;
      }
    }

    const lvl = Math.max(1, Math.min(3, level));
    const key = `dique_nivel_${lvl}`;
    const realImg = getLoadedImg(key) || getLoadedImg('dique_real') || getLoadedImg('log_fresh');
    if (realImg) {
      const W = 160 + lvl * 30;
      const H = Math.round(W * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      if (state === 'constructing') ctx.globalAlpha = 0.8;
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    const W = 160 + level * 30, H = 60 + level * 15;
    return this._oc(W, H);
  }

  static cage_sprite() {
    const realImg = getLoadedImg('ranger_trap');
    if (realImg) {
      const W = 55, H = Math.round(55 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(55, 45);
  }

  static seedling_sprite() {
    const realImg = getLoadedImg('tree_young_1');
    if (realImg) {
      const W = 32, H = Math.round(32 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(32, 40);
  }

  static leaf_particle() {
    const c = this._oc(10, 10), x = c.getContext('2d');
    x.fillStyle = '#4a8c2a'; x.beginPath(); x.arc(5, 5, 4, 0, Math.PI * 2); x.fill();
    return c;
  }

  static wood_chip() {
    const c = this._oc(10, 6), x = c.getContext('2d');
    x.fillStyle = '#d4b06c'; x.fillRect(0, 0, 10, 6);
    return c;
  }

  static _emptyCanvas(w, h) {
    return this._oc(w, h);
  }
}

// ──────────────────────────────────────────────────────────────
// ENTITY BASE CLASS (Bottom-Center 0.5, 1.0 Anchor Alignment)
// ──────────────────────────────────────────────────────────────
class Entity {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.baseY = y;
    this.alpha = 1;
    this.visible = true;
    this.dead = false;
    this.sprite = null;
    this.scale = 1.0;
    this.facingLeft = false;
    this.id = Entity._nextId++;
  }

  update(dt, game) { /* override */ }

  draw(ctx) {
    if (!this.visible || !this.sprite) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const w = Math.round(this.sprite.width * (this.scale || 1.0));
    const h = Math.round(this.sprite.height * (this.scale || 1.0));

    // ── 1. Soft Elliptical Base Shadow (Anchored to terrain at baseline) ──
    const shadowW = Math.max(12, Math.round(w * 0.45));
    const shadowH = Math.max(5, Math.round(shadowW * 0.35));
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(Math.round(this.x), Math.round(this.y), shadowW * 0.5, shadowH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── 2. Sprite Rendering with Bottom-Center (0.5, 1.0) Anchor Point ──
    if (this.facingLeft) {
      ctx.translate(Math.round(this.x), Math.round(this.y));
      ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, -Math.round(w * 0.5), -h, w, h);
    } else {
      ctx.drawImage(this.sprite, Math.round(this.x - w * 0.5), Math.round(this.y - h), w, h);
    }
    ctx.restore();
  }

  distanceTo(other) {
    const dx = other.x - this.x, dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
Entity._nextId = 0;

// ──────────────────────────────────────────────────────────────
// TREE ENTITY (Healthy, Chewed, Falling, Stump, Dead/Flooded)
// ──────────────────────────────────────────────────────────────
class Tree extends Entity {
  constructor(x, y, variant = 0) {
    super(x, y);
    this.variant = variant;
    this.state = 'healthy'; // 'healthy', 'chewed', 'dead', 'flooded', 'stump_fresh', 'stump_old'
    this.being_cut = false;
    this._refreshSprite();
    this.baseY = y;
  }

  _refreshSprite() {
    switch (this.state) {
      case 'healthy':
        this.sprite = this.being_cut ? SpritePainter.tree_chewed(this.variant) : SpritePainter.tree_healthy(this.variant);
        break;
      case 'chewed':      this.sprite = SpritePainter.tree_chewed(this.variant); break;
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

  get isHealthy() { return (this.state === 'healthy' || this.state === 'chewed') && !this.being_cut; }

  update(dt, game) {
    if (this.state === 'stump_fresh') {
      this._ageTimer = (this._ageTimer || 0) + dt;
      if (this._ageTimer > 120) {
        this.setState('stump_old');
        this._ageTimer = 0;
      }
    }
    if (Math.random() < 0.05) this._refreshSprite();
    this.baseY = this.y;
  }
}

// ──────────────────────────────────────────────────────────────
// ROCK & BUSH & MOSS ENTITIES
// ──────────────────────────────────────────────────────────────
class Rock extends Entity {
  constructor(x, y, variant = 0) {
    super(x, y);
    this.variant = variant;
    this._refreshSprite();
    this.baseY = y;
  }
  _refreshSprite() {
    this.sprite = SpritePainter.rock(this.variant);
  }
  update(dt, game) {
    if (Math.random() < 0.03) this._refreshSprite();
  }
}

class Bush extends Entity {
  constructor(x, y, variant = 0) {
    super(x, y);
    this.variant = variant;
    this._refreshSprite();
    this.baseY = y;
  }
  _refreshSprite() {
    this.sprite = SpritePainter.bush(this.variant);
  }
  update(dt, game) {
    if (Math.random() < 0.03) this._refreshSprite();
  }
}

class Moss extends Entity {
  constructor(x, y, variant = 0) {
    super(x, y);
    this.variant = variant;
    this._refreshSprite();
    this.baseY = y;
  }
  _refreshSprite() {
    this.sprite = SpritePainter.moss(this.variant);
  }
  update(dt, game) {
    if (Math.random() < 0.03) this._refreshSprite();
  }
}

// ──────────────────────────────────────────────────────────────
// DAM ENTITY (Constructing, Active, Dismantled/Broken)
// ──────────────────────────────────────────────────────────────
class Dam extends Entity {
  constructor(x, y) {
    super(x, y);
    this.level = 1;
    this.state = 'active'; // 'constructing', 'active', 'dismantled'
    this.active = true;
    this._refreshSprite();
  }

  _refreshSprite() {
    this.sprite = SpritePainter.dam(this.level, this.state);
    this.baseY = this.y;
  }

  grow() {
    if (this.level < 3) {
      this.level++;
      this._refreshSprite();
    }
  }

  remove() {
    this.state = 'dismantled';
    this.active = false;
    this._refreshSprite();
    setTimeout(() => { this.dead = true; }, 8000);
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

// ──────────────────────────────────────────────────────────────
// CAGE TRAP ENTITY
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
    super.draw(ctx);
  }
}

// ──────────────────────────────────────────────────────────────
// SEEDLING (LENGA REFORESTATION PLACEABLE)
// ──────────────────────────────────────────────────────────────
class Seedling extends Entity {
  constructor(x, y) {
    super(x, y);
    this.sprite = SpritePainter.seedling_sprite();
    this.growTimer = 30;
    this.grown = false;
    this.baseY = y;
    this.growProgress = 0;
  }

  update(dt, game) {
    if (this.grown) return;
    this.growTimer -= dt;
    this.growProgress = 1 - Math.max(0, this.growTimer / 30);
    this.scale = 0.6 + this.growProgress * 0.4;
    if (this.growTimer <= 0) {
      this.grown = true;
      const tree = new Tree(this.x, this.y, Math.floor(Math.random() * 8));
      game.entities.push(tree);
      game.stats.trees = Math.min(100, game.stats.trees + 2);
      this.dead = true;
    }
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

// ──────────────────────────────────────────────────────────────
// LOG ENTITY
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
    super.draw(ctx);
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
    this.speed = isSmall ? 28 : 45;
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
      this.sprite = SpritePainter.beaver_small(24);
    } else {
      this.sprite = SpritePainter.beaver(36, this.action);
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
      this.targetX = best.x + (Math.random() - 0.5) * 15;
      this.targetY = best.y + 5;
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
    if (Math.random() < 0.2 && game.particles) {
      game.particles.burst(this.x, this.y - 15, 'wood', 4);
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
    super.draw(ctx);
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
    this.sprite = SpritePainter.ranger(64, this.action);
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
    super.draw(ctx);
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
    this.sprite = SpritePainter.scientist(64, this.action);
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
    super.draw(ctx);
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
        kind: 'leaf', leafIdx: Math.floor(Math.random() * 3),
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
        life: 1, kind, leafIdx: Math.floor(Math.random() * 3),
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
