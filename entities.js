'use strict';
/* ============================================================
   ENTITIES.JS — 100% Real Image Sprite Engine & Pivot Anchor System
   Clean asset mapping directly from user assets in assets/
   - Beavers: castor1..4.png, castormadera.png, castordique.png
   - Trees: arbol1..9.png, arbolfantasma..4.png, toconjoven.png, toconviejo.png
   - Dams: diquechico.png, diquemedio.png, diquegrande.png
   - Rangers: guardaparque.png, guardaparquejaula.png
   - UI: BOTON.png
   ============================================================ */

const ASSET_MANIFEST = {
  // Healthy Lenga Trees
  tree_healthy_1: 'assets/arbol1.png',
  tree_healthy_2: 'assets/arbol2.png',
  tree_healthy_3: 'assets/arbol3.png',
  tree_healthy_4: 'assets/arbol4.png',
  tree_healthy_5: 'assets/arbol5.png',
  tree_healthy_6: 'assets/arbol6.png',
  tree_healthy_7: 'assets/arbol7.png',
  tree_healthy_8: 'assets/arbol8.png',
  tree_healthy_9: 'assets/arbol9.png',

  // Ghost & Dead Trees
  tree_dead_1:    'assets/arbolfantasma.png',
  tree_dead_2:    'assets/arbolfantasma1.png',
  tree_dead_3:    'assets/arbolfantasma2.png',
  tree_flooded_1: 'assets/arbolfantasma3.png',
  tree_flooded_2: 'assets/arbolfantasma4.png',

  // Stumps & Wood
  stump_fresh:    'assets/toconjoven.png',
  stump_old:      'assets/toconviejo.png',
  log_fresh:      'assets/rama.png',
  log_decayed:    'assets/rama1.png',

  // Props
  rock_1:          'assets/cartel.png',
  rock_2:          'assets/cabana.png',
  bush_1:          'assets/toconviejo.png',
  bush_2:          'assets/rama1.png',

  // Beaver Dams
  dique_real:    'assets/diquegrande.png',
  dique_nivel_1: 'assets/diquechico.png',
  dique_nivel_2: 'assets/diquemedio.png',
  dique_nivel_3: 'assets/diquegrande.png',

  // Beavers & Characters
  beaver_idle:      'assets/castor1.png',
  beaver_walk:      'assets/castor2.png',
  beaver_cut:       'assets/castor3.png',
  beaver_carry:     'assets/castormadera.png',
  beaver_build:     'assets/castordique.png',
  beaver_celebrate: 'assets/castor4.png',

  beaver_small_idle:  'assets/castor1.png',
  beaver_small_walk:  'assets/castor2.png',
  beaver_small_carry: 'assets/castormadera.png',

  ranger_idle: 'assets/guardaparque.png',
  ranger_walk: 'assets/guardaparque.png',
  ranger_trap: 'assets/guardaparquejaula.png',

  scientist_idle:      'assets/guardaparque.png',
  scientist_walk:      'assets/guardaparque.png',

  // UI
  button_add_beaver:  'assets/BOTON.png'
};

const IMAGE_CACHE = {};
const IMAGE_LOADED = {};

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
// SPRITE PAINTER — Standard Scale Standards for 32px Tile Height
// ──────────────────────────────────────────────────────────────
class SpritePainter {
  static _oc(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w); c.height = Math.max(1, h); return c;
  }

  // Beaver: 0.35x Tile Height (~28x20px)
  static beaver(size = 28, action = 'idle') {
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

  static beaver_small(size = 20) {
    const realImg = getLoadedImg('beaver_small_idle');
    if (realImg) {
      const W = size, H = Math.round(size * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(size, size);
  }

  // Ranger / Scientist: 1.0x - 1.2x Tile Height (~24x36px)
  static ranger(size = 36, action = 'idle') {
    const key = `ranger_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('ranger_idle');
    if (realImg) {
      const W = Math.round(size * 0.65), H = size;
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(size, size);
  }

  static scientist(size = 36, action = 'idle') {
    const key = `scientist_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('scientist_idle');
    if (realImg) {
      const W = Math.round(size * 0.65), H = size;
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(size, size);
  }

  // Trees: 2.2x - 2.8x Tile Height (~75x85px)
  static tree_healthy(variant = 0) {
    const idx = (variant % 9) + 1;
    const key = `tree_healthy_${idx}`;
    const realImg = getLoadedImg(key) || getLoadedImg('tree_healthy_1');
    if (realImg) {
      const W = 75, H = Math.round(75 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(75, 85);
  }

  static tree_chewed(variant = 0) {
    const idx = (variant % 9) + 1;
    const key = `tree_healthy_${idx}`;
    const realImg = getLoadedImg(key) || getLoadedImg('tree_healthy_1');
    if (realImg) {
      const W = 75, H = Math.round(75 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this.tree_healthy(variant);
  }

  static tree_dead() {
    const realImg = getLoadedImg('tree_dead_1') || getLoadedImg('tree_dead_2') || getLoadedImg('tree_dead_3');
    if (realImg) {
      const W = 60, H = Math.round(60 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(60, 75);
  }

  static tree_flooded() {
    const realImg = getLoadedImg('tree_flooded_1') || getLoadedImg('tree_flooded_2');
    if (realImg) {
      const W = 64, H = Math.round(64 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(64, 78);
  }

  static stump(age = 'fresh') {
    const key = age === 'fresh' ? 'stump_fresh' : 'stump_old';
    const realImg = getLoadedImg(key) || getLoadedImg('stump_fresh');
    if (realImg) {
      const W = 28, H = Math.round(28 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(28, 20);
  }

  static log(decayed = false) {
    const key = decayed ? 'log_decayed' : 'log_fresh';
    const realImg = getLoadedImg(key) || getLoadedImg('log_fresh');
    if (realImg) {
      const W = 36, H = Math.round(36 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(36, 20);
  }

  static rock(variant = 0) {
    const key = (variant === 1 || variant === 2) ? 'rock_2' : 'rock_1';
    const realImg = getLoadedImg(key) || getLoadedImg('rock_1');
    if (realImg) {
      const W = (variant === 1 || variant === 2) ? 68 : 44;
      const H = Math.round(W * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(36, 24);
  }

  static bush(variant = 0) {
    const realImg = getLoadedImg('bush_1') || getLoadedImg('bush_2');
    if (realImg) {
      const W = 32, H = Math.round(32 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(32, 24);
  }

  static dam(level = 1, state = 'active') {
    if (state === 'dismantled' || state === 'broken') {
      const realImg = getLoadedImg('log_decayed') || getLoadedImg('log_fresh');
      if (realImg) {
        const W = 54, H = Math.round(54 * (realImg.height / realImg.width));
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
      // Dimensiones ampliadas proporcionales al cauce del río (140px, 180px, 230px)
      const W = lvl === 1 ? 140 : (lvl === 2 ? 180 : 230);
      const H = Math.round(W * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      if (state === 'constructing') ctx.globalAlpha = 0.8;
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    const W = 140 + level * 35, H = 50 + level * 15;
    return this._oc(W, H);
  }

  static cage_sprite() {
    const realImg = getLoadedImg('ranger_trap') || getLoadedImg('ranger_idle');
    if (realImg) {
      const W = 32, H = Math.round(32 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(32, 24);
  }

  static seedling_sprite() {
    const realImg = getLoadedImg('tree_healthy_1');
    if (realImg) {
      const W = 22, H = Math.round(22 * (realImg.height / realImg.width));
      const c = this._oc(W, H), ctx = c.getContext('2d');
      ctx.drawImage(realImg, 0, 0, W, H);
      return c;
    }
    return this._emptyCanvas(22, 24);
  }

  static leaf_particle() {
    const c = this._oc(8, 8), x = c.getContext('2d');
    x.fillStyle = '#4a8c2a'; x.beginPath(); x.arc(4, 4, 3, 0, Math.PI * 2); x.fill();
    return c;
  }

  static wood_chip() {
    const c = this._oc(8, 5), x = c.getContext('2d');
    x.fillStyle = '#d4b06c'; x.fillRect(0, 0, 8, 5);
    return c;
  }

  static _emptyCanvas(w, h) {
    return this._oc(w, h);
  }
}

// ──────────────────────────────────────────────────────────────
// ENTITY BASE CLASS (Bottom-Center 0.5, 1.0 Pivot Anchor Alignment)
// ──────────────────────────────────────────────────────────────
class Entity {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.baseY = y;
    this.col = 0; this.row = 0;
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

    // Punto de contacto directo del tronco con el suelo (elimina efecto flotante)
    const isTree = (this instanceof Tree);
    const yOffset = isTree ? Math.round(h * 0.07) : 0;
    const shadowY = Math.round(this.y - yOffset);

    // Sombra sutil directamente adherida a las raíces del árbol
    const shadowW = Math.max(8, Math.round(w * (isTree ? 0.32 : 0.42)));
    const shadowH = Math.max(3, Math.round(shadowW * 0.28));
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(Math.round(this.x), shadowY - 2, shadowW * 0.5, shadowH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawY = Math.round(this.y - h + yOffset);

    // Renderizado con punto de anclaje ajustado a la raíz
    if (this.facingLeft) {
      ctx.translate(Math.round(this.x), drawY + h);
      ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, -Math.round(w * 0.5), -h, w, h);
    } else {
      ctx.drawImage(this.sprite, Math.round(this.x - w * 0.5), drawY, w, h);
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
// TREE ENTITY (Healthy, Chewed, Stump, Dead/Flooded)
// ──────────────────────────────────────────────────────────────
class Tree extends Entity {
  constructor(x, y, variant = 0, col = 0, row = 0) {
    super(x, y);
    this.variant = variant;
    this.col = col; this.row = row;
    this.state = 'healthy';
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
// ROCK, BUSH & MOSS ENTITIES
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

// ──────────────────────────────────────────────────────────────
// DAM ENTITY (Centered over river channel)
// ──────────────────────────────────────────────────────────────
class Dam extends Entity {
  constructor(x, y, col = 7, row = 7) {
    super(x, y);
    this.col = col; this.row = row;
    this.level = 1;
    this.state = 'active';
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
    setTimeout(() => { this.dead = true; }, 6000);
  }

  update(dt, game) {
    if (Math.random() < 0.05) this._refreshSprite();
    this.baseY = this.y;
  }

  draw(ctx) {
    if (!this.visible || !this.sprite) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const w = Math.round(this.sprite.width * (this.scale || 1.0));
    const h = Math.round(this.sprite.height * (this.scale || 1.0));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(Math.round(this.x), Math.round(this.y), w * 0.45, Math.max(4, h * 0.25), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(this.sprite, Math.round(this.x - w * 0.5), Math.round(this.y - h * 0.5), w, h);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────────────
// CAGE TRAP ENTITY
// ──────────────────────────────────────────────────────────────
class Cage extends Entity {
  constructor(x, y) {
    super(x, y);
    this.sprite = SpritePainter.cage_sprite();
    this.captureRadius = 45;
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
// SEEDLING (LENGA REFORESTATION)
// ──────────────────────────────────────────────────────────────
class Seedling extends Entity {
  constructor(x, y, col = 0, row = 0) {
    super(x, y);
    this.col = col; this.row = row;
    this.sprite = SpritePainter.seedling_sprite();
    this.growTimer = 15;
    this.grown = false;
    this.baseY = y;
    this.growProgress = 0;
  }

  update(dt, game) {
    if (this.grown) return;
    this.growTimer -= dt;
    this.growProgress = 1 - Math.max(0, this.growTimer / 15);
    this.scale = 0.7 + this.growProgress * 0.3;
    if (this.growTimer <= 0) {
      this.grown = true;
      const tree = new Tree(this.x, this.y, Math.floor(Math.random() * 9), this.col, this.row);
      game.entities.push(tree);
      game.stats.intactTrees = Math.min(100, game.stats.intactTrees + 2);
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
    this.decayTimer = 60;
    this.claimed = false;
    this.baseY = y;
  }

  update(dt, game) {
    this.decayTimer -= dt;
    if (this.decayTimer < 15) this.alpha = this.decayTimer / 15;
    if (this.decayTimer <= 0) this.dead = true;
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

// ──────────────────────────────────────────────────────────────
// BEAVER ADULT — AI State Machine & Reproduction
// ──────────────────────────────────────────────────────────────
class Beaver extends Entity {
  constructor(x, y, isSmall = false) {
    super(x, y);
    this.isSmall = isSmall;
    this.captured = false;
    this.state = 'idle';
    this.action = 'idle';
    this.speed = isSmall ? 16 : 22;
    this.targetX = x; this.targetY = y;
    this.targetTree = null;
    this.targetLog = null;
    this.carryingLog = false;
    this.cutTimer = 0;
    this.buildTimer = 0;
    this.idleTimer = 1 + Math.random() * 2;
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
      this.sprite = SpritePainter.beaver_small(20);
    } else {
      this.sprite = SpritePainter.beaver(28, this.action);
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

    if (game.act >= 2) {
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
    }

    this._refreshSprite();
    this.baseY = this.y;
  }

  _doIdle(dt, game) {
    this.action = 'idle';
    this.idleTimer -= dt;
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.targetX = this.x + (Math.random() - 0.5) * 80;
      this.targetY = this.y + (Math.random() - 0.5) * 50;
      this.wanderTimer = 2 + Math.random() * 2;
      this.action = 'walk';
    }
    this._moveTo(this.targetX, this.targetY, dt, 18);
    if (this.idleTimer <= 0) {
      this.state = 'search';
      this.idleTimer = 2 + Math.random() * 2;
    }
  }

  _doSearch(dt, game) {
    this.action = 'walk';
    const g = (game && game.entities) ? game : dt;
    const trees = (g && g.entities) ? g.entities.filter(e => e instanceof Tree && e.isHealthy && !e.being_cut) : [];
    if (trees.length === 0) {
      this.state = 'idle';
      return;
    }

    // Seleccionar aleatoriamente en toda la extensión del bosque (cercanos, medios y lejanos)
    const chosen = trees[Math.floor(Math.random() * trees.length)];

    chosen.being_cut = true;
    this.targetTree = chosen;
    this.targetX = chosen.x + (Math.random() - 0.5) * 10;
    this.targetY = chosen.y + 4;
    this.state = 'walk_tree';
  }

  _doWalkTo(dt, tx, ty, nextState) {
    this.action = this.carryingLog ? 'carry' : 'walk';
    const arrived = this._moveTo(tx, ty, dt, this.speed);
    if (arrived) {
      this.state = nextState;
      this.cutTimer = 6.0 + Math.random() * 4.0;
      this.buildTimer = 5.0 + Math.random() * 3.0;
    }
  }

  _doCut(dt, game) {
    this.action = 'cut';
    this.cutTimer -= dt;
    if (Math.random() < 0.25 && game.particles) {
      game.particles.burst(this.x, this.y - 10, 'wood', 4);
    }
    if (this.cutTimer <= 0) {
      if (this.targetTree) {
        this.targetTree.setState('stump_fresh');
        this.treesChopped++;
        game.onTreeFelled(this.targetTree, this);
        const log = new LogEntity(this.targetTree.x + (Math.random()-0.5)*15, this.targetTree.y);
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
    if (this.targetLog) {
      this.targetLog.claimed = true;
      this.targetLog.dead = true; // Desaparece del suelo al ser recogida!
      this.targetLog = null;
    }
    this.carryingLog = true;
    this.action = 'carry';
    const river = game.getNearestRiverPoint(this.x, this.y, this);
    this.targetX = river.x; this.targetY = river.y;
    this.state = 'walk_river';
  }

  _doBuild(dt, game) {
    this.action = 'build';
    this.buildTimer -= dt;
    if (this.buildTimer <= 0) {
      this.carryingLog = false;
      if (this.targetLog) { this.targetLog.dead = true; this.targetLog = null; }
      this.damsBuilt++;
      game.onBeaverDeliveredWood(this);
      this.state = 'idle';
      this.celebrateTimer = 1.0;
    }
  }

  _moveTo(tx, ty, dt, speed) {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 6) return true;
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
    this.speed = 36;
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
    this.sprite = SpritePainter.ranger(36, this.action);
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
    if (dist < 6) return true;
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
    this.speed = 30;
    this.targetX = x; this.targetY = y;
    this.actionTimer = 4 + Math.random() * 4;
    this.facingLeft = true;
    this.bobPhase = Math.random() * Math.PI * 2;
    this._refreshSprite();
  }

  _refreshSprite() {
    this.sprite = SpritePainter.scientist(36, this.action);
  }

  update(dt, game) {
    this.bobPhase += dt * 2.2;
    this.actionTimer -= dt;

    if (this.actionTimer <= 0) {
      const actions = ['idle', 'walk', 'sample', 'clipboard'];
      this.action = actions[Math.floor(Math.random() * actions.length)];
      this.actionTimer = 3 + Math.random() * 4;
      if (this.action === 'walk') {
        this.targetX = this.x + (Math.random() - 0.5) * 120;
        this.targetY = this.y + (Math.random() - 0.5) * 60;
      }
    }

    if (this.action === 'walk') {
      const dx = this.targetX - this.x, dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 6) {
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
  constructor(maxCount = 250) {
    this.pool = [];
    this.maxCount = maxCount;
    this.leafSprites = [
      SpritePainter.leaf_particle(),
      SpritePainter.leaf_particle(),
    ];
    this.woodChip = SpritePainter.wood_chip();
  }

  burst(x, y, kind = 'leaf', count = 10) {
    for (let i = 0; i < count; i++) {
      if (this.pool.length >= this.maxCount) break;
      const speed = 0.8 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      this.pool.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.2,
        rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.1,
        alpha: 0.9, decay: 0.01 + Math.random() * 0.01,
        life: 1, kind,
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
      }
    }
  }

  draw(ctx) {
    ctx.save();
    this.pool.forEach(p => {
      const sp = p.kind === 'wood' ? this.woodChip : this.leafSprites[0];
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
