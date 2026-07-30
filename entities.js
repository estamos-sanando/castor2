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
  beaver_swim:      'assets/castornadando.png',

  beaver_small_idle:  'assets/castor1.png',
  beaver_small_walk:  'assets/castor2.png',
  beaver_small_carry: 'assets/castormadera.png',
  beaver_small_swim:  'assets/castornadando.png',

  ranger_idle: 'assets/guardaparque.png',
  ranger_walk: 'assets/guardaparque.png',
  ranger_trap: 'assets/guardaparquejaula.png',
  cage_trap:   'assets/Jaulacastor.png',

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

  static beaver_small(size = 18, action = 'idle') {
    const key = action === 'swim' ? 'beaver_small_swim' : `beaver_small_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('beaver_small_idle');
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
  // Beaver: 0.35x Tile Height (~28x20px)
  static beaver(size = 28, action = 'idle') {
    const key = `beaver_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('beaver_idle');
    return realImg || this._emptyCanvas(size, size);
  }

  static beaver_small(size = 18, action = 'idle') {
    const key = action === 'swim' ? 'beaver_small_swim' : `beaver_small_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('beaver_small_idle');
    return realImg || this._emptyCanvas(size, size);
  }

  // Ranger / Scientist: 1.0x - 1.2x Tile Height (~24x36px)
  static ranger(size = 36, action = 'idle') {
    const key = `ranger_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('ranger_idle');
    return realImg || this._emptyCanvas(size, size);
  }

  static scientist(size = 36, action = 'idle') {
    const key = `scientist_${action}`;
    const realImg = getLoadedImg(key) || getLoadedImg('scientist_idle');
    return realImg || this._emptyCanvas(size, size);
  }

  // Trees: High-definition native defringed sprites
  static tree_healthy(variant = 0) {
    const idx = (variant % 9) + 1;
    const key = `tree_healthy_${idx}`;
    const realImg = getLoadedImg(key) || getLoadedImg('tree_healthy_1');
    return realImg || this._emptyCanvas(75, 85);
  }

  static tree_chewed(variant = 0) {
    const idx = (variant % 9) + 1;
    const key = `tree_healthy_${idx}`;
    const realImg = getLoadedImg(key) || getLoadedImg('tree_healthy_1');
    return realImg || this.tree_healthy(variant);
  }

  static tree_dead(variant = 0) {
    const keys = ['tree_dead_1', 'tree_dead_2', 'tree_dead_3', 'tree_flooded_1', 'tree_flooded_2'];
    const key = keys[variant % keys.length];
    const realImg = getLoadedImg(key) || getLoadedImg('tree_dead_1');
    return realImg || this._emptyCanvas(60, 75);
  }

  static tree_flooded(variant = 0) {
    return this.tree_dead(variant);
  }

  static stump(age = 'fresh') {
    const key = age === 'fresh' ? 'stump_fresh' : 'stump_old';
    const realImg = getLoadedImg(key) || getLoadedImg('stump_fresh');
    return realImg || this._emptyCanvas(28, 20);
  }

  static log(decayed = false) {
    const key = decayed ? 'log_decayed' : 'log_fresh';
    const realImg = getLoadedImg(key) || getLoadedImg('log_fresh');
    return realImg || this._emptyCanvas(36, 20);
  }

  static rock(variant = 0) {
    const key = (variant === 1 || variant === 2) ? 'rock_2' : 'rock_1';
    const realImg = getLoadedImg(key) || getLoadedImg('rock_1');
    return realImg || this._emptyCanvas(36, 24);
  }

  static bush(variant = 0) {
    const realImg = getLoadedImg('bush_1') || getLoadedImg('bush_2');
    return realImg || this._emptyCanvas(32, 24);
  }

  static dam(level = 1, state = 'active') {
    const lvl = Math.max(1, Math.min(3, level));
    const key = `dique_nivel_${lvl}`;
    const realImg = getLoadedImg(key) || getLoadedImg('dique_real') || getLoadedImg('log_fresh');
    return realImg || this._emptyCanvas(140 + level * 35, 50 + level * 15);
  }

  static cage_sprite() {
    const realImg = getLoadedImg('cage_trap') || getLoadedImg('ranger_trap') || getLoadedImg('ranger_idle');
    return realImg || this._emptyCanvas(32, 24);
  }

  static seedling_sprite() {
    const realImg = getLoadedImg('tree_healthy_1');
    return realImg || this._emptyCanvas(22, 24);
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

    const imgW = this.sprite.naturalWidth || this.sprite.width || 32;
    const imgH = this.sprite.naturalHeight || this.sprite.height || 32;

    let w = 32;
    let h = 32;

    if (this instanceof Tree) {
      if (this.state === 'stump_fresh' || this.state === 'stump_old') {
        const targetH = 14; // Tocón: escala reducida ajustada al grosor real del tronco (~14px)
        const s = Math.min(1.0, this.scale || 1.0);
        h = Math.round(targetH * s);
        w = Math.round(targetH * (imgW / imgH) * s);
      } else if (this.state === 'dead' || this.state === 'flooded') {
        const targetH = 84; // Árbol muerto / fantasma: altura alineada a copa sana (~84px)
        h = Math.round(targetH * (this.scale || 1.0));
        w = Math.round(targetH * (imgW / imgH) * (this.scale || 1.0));
      } else {
        const targetH = 92; // Árbol sano: altura estándar de copa nativa (~92px)
        h = Math.round(targetH * (this.scale || 1.0));
        w = Math.round(targetH * (imgW / imgH) * (this.scale || 1.0));
      }
    } else {
      let targetW = 32;
      if (this instanceof Beaver) {
        if (this.action === 'swim' || (this.sprite && this.sprite.src && this.sprite.src.includes('castornadando'))) {
          targetW = this.isSmall ? 26 : 41;
        } else {
          targetW = this.isSmall ? 18 : 28;
        }
      } else if (this instanceof Ranger) {
        targetW = 24;
      } else if (this instanceof Dam) {
        const lvl = Math.max(1, Math.min(3, this.level));
        const isLowerDam = (this.y > 350);
        targetW = isLowerDam 
          ? (lvl === 1 ? 160 : (lvl === 2 ? 190 : 230)) // Dique inferior extendido al meandro ancho del río
          : (lvl === 1 ? 140 : (lvl === 2 ? 165 : 190)); // Dique superior
      } else if (this instanceof LogEntity) {
        targetW = 28;
      } else if (this instanceof Rock) {
        targetW = (this.variant === 1 || this.variant === 2) ? 64 : 36;
      } else if (this instanceof Bush) {
        targetW = 26;
      } else if (this instanceof Cage) {
        targetW = 30;
      } else if (this instanceof Seedling) {
        targetW = 16;
      } else {
        targetW = (this.sprite.width && this.sprite.width !== imgW) ? this.sprite.width : 32;
      }

      const scaleFactor = (this.scale || 1.0);
      w = Math.round(targetW * scaleFactor);
      h = Math.round(targetW * (imgH / imgW) * scaleFactor);
    }

    // ── SOMBRAS ISOMÉTRICAS REALISTAS CON PROYECCIÓN SOLAR Y OCLUSIÓN DE RAÍZ ──
    const isTree = (this instanceof Tree);
    const isStump = isTree && (this.state === 'stump_fresh' || this.state === 'stump_old');
    const yOffset = (isTree && !isStump) ? Math.round(h * 0.04) : 0;
    const shadowBaseY = Math.round(this.y - yOffset);
    const centerX = Math.round(this.x);

    if (isTree) {
      const isDead = this.state === 'dead' || this.state === 'flooded';

      if (!isStump) {
        // 1. SOMBRA DE COPA EXTENDIDA
        const canopyScale = isDead ? 0.75 : 1.10;
        const cW = Math.max(16, Math.round(w * canopyScale));
        const cH = Math.max(8, Math.round(h * (isDead ? 0.22 : 0.32)));
        
        const projX = centerX + Math.round(w * 0.30);
        const projY = shadowBaseY + Math.round(cH * 0.22);

        ctx.save();
        ctx.translate(projX, projY);
        ctx.rotate(0.26);
        
        const grad = ctx.createRadialGradient(0, 0, cW * 0.05, 0, 0, cW * 0.5);
        const maxOpacity = isDead ? 0.16 : 0.32;
        grad.addColorStop(0, `rgba(8, 28, 10, ${maxOpacity})`);
        grad.addColorStop(0.5, `rgba(10, 32, 12, ${maxOpacity * 0.55})`);
        grad.addColorStop(0.85, `rgba(12, 38, 15, ${maxOpacity * 0.20})`);
        grad.addColorStop(1, 'rgba(12, 38, 15, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, cW * 0.5, cH * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. OCLUSIÓN AMBIENTAL DE LA RAÍZ / TRONCO (Contacto con la tierra)
      const rootW = Math.max(8, Math.round(w * (isStump ? 0.85 : 0.40)));
      const rootH = Math.max(4, Math.round(rootW * 0.38));
      
      const rootGrad = ctx.createRadialGradient(centerX, shadowBaseY - 1, rootW * 0.05, centerX, shadowBaseY - 1, rootW * 0.5);
      rootGrad.addColorStop(0, 'rgba(2, 14, 4, 0.60)');
      rootGrad.addColorStop(0.7, 'rgba(4, 18, 6, 0.25)');
      rootGrad.addColorStop(1, 'rgba(4, 18, 6, 0)');

      ctx.fillStyle = rootGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, shadowBaseY - 1, rootW * 0.5, rootH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Sombras adaptativas para castores, guardaparques, diques y objetos
      const shadowW = Math.max(10, Math.round(w * 0.48));
      const shadowH = Math.max(4, Math.round(shadowW * 0.32));
      
      const grad = ctx.createRadialGradient(centerX, shadowBaseY - 1, shadowW * 0.05, centerX, shadowBaseY - 1, shadowW * 0.5);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.20)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(centerX, shadowBaseY - 1, shadowW * 0.5, shadowH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

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
      case 'dead':        this.sprite = SpritePainter.tree_dead(this.ghostVariant !== undefined ? this.ghostVariant : this.variant); break;
      case 'flooded':     this.sprite = SpritePainter.tree_flooded(this.ghostVariant !== undefined ? this.ghostVariant : this.variant); break;
      case 'stump_fresh': this.sprite = SpritePainter.stump('fresh'); break;
      case 'stump_old':   this.sprite = SpritePainter.stump('old'); break;
    }
  }

  setState(state) {
    this.state = state;
    this.being_cut = false;
    if (state === 'stump_fresh' || state === 'stump_old') {
      this.scale = Math.min(1.0, this.scale || 1.0);
    }
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

    const imgW = this.sprite.naturalWidth || this.sprite.width || 300;
    const imgH = this.sprite.naturalHeight || this.sprite.height || 150;
    const lvl = Math.max(1, Math.min(3, this.level));
    const isLowerDam = (this.y > 350);

    // Dimensiones de orilla a orilla según la anchura de la cuenca (inferior más ancha)
    const targetW = isLowerDam 
      ? (lvl === 1 ? 160 : (lvl === 2 ? 190 : 230))
      : (lvl === 1 ? 140 : (lvl === 2 ? 165 : 190));
    const w = Math.round(targetW * (this.scale || 1.0));
    const h = Math.round(targetW * (imgH / imgW) * (this.scale || 1.0));

    const grad = ctx.createRadialGradient(Math.round(this.x), Math.round(this.y), w * 0.05, Math.round(this.x), Math.round(this.y), w * 0.45);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(Math.round(this.x), Math.round(this.y + h * 0.1), w * 0.45, Math.max(4, h * 0.25), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(this.sprite, Math.round(this.x - w * 0.5), Math.round(this.y - h * 0.45), w, h);
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
    this.glowing = false;
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
    if (this.glowing) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
      ctx.save();
      
      const grad = ctx.createRadialGradient(this.x, this.y - 10, 2, this.x, this.y - 10, 32 + pulse * 12);
      grad.addColorStop(0, `rgba(34, 197, 94, ${0.75 + pulse * 0.25})`);
      grad.addColorStop(0.5, `rgba(34, 197, 94, ${0.35 + pulse * 0.2})`);
      grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 10, 34 + pulse * 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 215, 0, ${0.7 + pulse * 0.3})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12 + pulse * 10;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 10, 24 + pulse * 4, 15 + pulse * 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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
    this.wanderOnly = false;
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
      this.sprite = SpritePainter.beaver_small(18, this.action);
    } else {
      this.sprite = SpritePainter.beaver(28, this.action);
    }
  }

  isInWater(game) {
    const map = (game && game.map) || (window.ISO_ENGINE && window.ISO_ENGINE.map);
    if (map && map.mode === 'tile' && map.engine && map.getTile) {
      const originX = map.originX !== undefined ? map.originX : 640;
      const originY = map.originY !== undefined ? map.originY : 100;
      const gridPos = map.engine.isoToGrid(this.x, this.y, originX, originY);
      const tile = map.getTile(gridPos.col, gridPos.row);
      if (tile && (tile.isWater || tile.water)) {
        return true;
      }
    }

    // El cauce de agua azul del río se ubica strictly entre x = 612 y x = 668
    return (this.x >= 612 && this.x <= 668 && this.y >= 70 && this.y <= 680);
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

    if (game && game.act >= 2) {
      if (this.wanderOnly) {
        this._doIdle(dt, game);
      } else {
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
    }

    if (this.action !== 'build' && this.isInWater(game)) {
      this.action = 'swim';
    }

    this._refreshSprite();
    this.baseY = this.y;
  }

  _doIdle(dt, game) {
    this.action = 'idle';
    this.idleTimer -= dt;
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.targetX = Math.max(50, Math.min(1230, this.x + (Math.random() - 0.5) * 120));
      this.targetY = Math.max(100, Math.min(660, this.y + (Math.random() - 0.5) * 80));
      this.wanderTimer = 2 + Math.random() * 2;
      this.action = 'walk';
    }
    this._moveTo(this.targetX, this.targetY, dt, 18);
    if (this.idleTimer <= 0) {
      if (this.wanderOnly) {
        this.idleTimer = 1 + Math.random() * 2;
        this.state = 'idle';
      } else {
        this.state = 'search';
        this.idleTimer = 2 + Math.random() * 2;
      }
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
