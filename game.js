'use strict';
/* ============================================================
   GAME.JS — Simulación Ecológica Dinámica de Bosque de Lenga
   Masa Forestal Densidad Nativa Patagónica & Tala en Tiempo Real
   Basado en la noticia oficial de Argentina.gob.ar
   ============================================================ */

const STAGES = [
  {
    id: 0, year: 1946, src: 'assets/maps/map_01_inicial.jpg',
    beavers: 2, dams: 0, health: 100, flood: 0,
    news: {
      title: '1946: INTRODUCCIÓN DEL CASTOR',
      text: 'El gobierno argentino liberó 20 ejemplares de Castor canadensis en Tierra del Fuego. Sin predadores naturales (osos/lobos), la especie invasora encuentra el hábitat ideal.',
      type: 'info'
    }
  },
  {
    id: 1, year: 1965, src: 'assets/maps/map_02_primer_deterioro.jpg',
    beavers: 12, dams: 4, health: 80, flood: 15,
    news: {
      title: '1965: PRIMEROS DIQUES Y TALA EN TIEMPO REAL',
      text: 'Los castores roen la Lenga (Nothofagus pumilio). A diferencia de los árboles del hemisferio norte, LA LENGA TARDA 200 AÑOS EN CRECER Y NO REBROTA DEL TOCÓN.',
      type: 'warning'
    }
  },
  {
    id: 2, year: 1985, src: 'assets/maps/map_03_bosque_parcial.jpg',
    beavers: 28, dams: 10, health: 60, flood: 35,
    news: {
      title: '1985: INVASIÓN A ISLA NAVARINO',
      text: 'El castor cruza el Canal Beagle conquistando Chile. Las represas alteran el 95% de las cuencas de Tierra del Fuego, anegando el bosque nativo.',
      type: 'warning'
    }
  },
  {
    id: 3, year: 2005, src: 'assets/maps/map_04_bosque_inundado.jpg',
    beavers: 50, dams: 20, health: 35, flood: 65,
    news: {
      title: '2005: 100.000 CASTORES Y BOSQUES FANTASMA',
      text: 'Más de 30.000 hectáreas (dos veces CABA) convertidas en cementerios de árboles sumergidos. El daño económico supera los 66.5 MILLONES DE DÓLARES ANUALES.',
      type: 'danger'
    }
  },
  {
    id: 4, year: 2016, src: 'assets/maps/map_05_bosque_devastado.jpg',
    beavers: 80, dams: 35, health: 15, flood: 85,
    news: {
      title: '2016: PROYECTO BINACIONAL ENEEI',
      text: 'Argentina y Chile firman el acuerdo binacional. Se implementan 8 áreas piloto con captura humanitaria para frenar la invasión hacia Neuquén y la Cordillera.',
      type: 'danger'
    }
  },
  {
    id: 5, year: 2026, src: 'assets/maps/map_06_restauracion_parcial.jpg',
    beavers: 10, dams: 3, health: 75, flood: 20,
    news: {
      title: '2026: RESTAURACIÓN Y RENUEVOS DE LENGA',
      text: 'Con la remoción de diques y el control en áreas piloto, el río vuelve a su cauce. Reaparecen los primeros renuevos de Lenga y se recupera la turbera.',
      type: 'success'
    }
  }
];

const RIVER_POINTS = [
  { x: 440, y: 490 }, { x: 520, y: 515 }, { x: 600, y: 535 },
  { x: 670, y: 515 }, { x: 740, y: 495 }, { x: 810, y: 505 }
];

class BeaverGame {
  constructor() {
    this.canvas  = document.getElementById('game-canvas');
    this.ctx     = this.canvas.getContext('2d');
    this.running = false;
    this.started = false;
    this.gameOver = false;

    this.W = 1280; this.H = 720;
    this.canvas.width = this.W; this.canvas.height = this.H;

    this.stats = {
      beavers: 2,
      dams: 0,
      health: 100,
      economicLoss: 0,
      stumps: 0,
    };

    this.year = 1946;
    this.timelinePct = 0;
    this.stageIdx = 0;

    this.entities = [];
    this.maps = [];
    this.mapLoaded = [];
    this.currentMap = 0;
    this.targetMap  = 0;
    this.mapAlpha   = 1;
    this.crossfading = false;

    this.particles = new ParticlePool(200);
    this.ui = new GameUI(this);

    this._lastTime = 0;
    this._fixedDt  = 1 / 60;
    this._accumulator = 0;
    this.newsThrottles = {};

    this._preloadMaps();
    this._populateDenseForest();
    this._startLoop();
  }

  _preloadMaps() {
    STAGES.forEach((stage, i) => {
      const img = new Image();
      img.src = stage.src;
      img.onload = () => { this.mapLoaded[i] = true; };
      img.onerror = () => { this.mapLoaded[i] = false; };
      this.maps.push(img);
    });
  }

  // ── Distribución Armónica de Masas Boscosas Nativas de Lenga ──
  _populateDenseForest() {
    this.entities = [];

    // 1. Masa Boscosa Izquierda (Ladera densa)
    const leftCluster = [
      { x:60, y:280 }, { x:110, y:250 }, { x:150, y:310 }, { x:80, y:360 },
      { x:190, y:270 }, { x:230, y:330 }, { x:140, y:410 }, { x:70, y:450 },
      { x:260, y:280 }, { x:170, y:480 }, { x:100, y:520 }, { x:220, y:420 }
    ];

    // 2. Masa Boscosa Norte / Fondo (Cresta de la montaña)
    const northCluster = [
      { x:340, y:200 }, { x:410, y:180 }, { x:480, y:210 }, { x:550, y:190 },
      { x:620, y:210 }, { x:690, y:190 }, { x:760, y:220 }, { x:830, y:190 }
    ];

    // 3. Masa Boscosa Derecha (Ribera alta)
    const rightCluster = [
      { x:920, y:240 }, { x:980, y:220 }, { x:1040, y:270 }, { x:950, y:320 },
      { x:1080, y:310 }, { x:1140, y:260 }, { x:1010, y:380 }, { x:1100, y:390 },
      { x:940, y:440 }, { x:1040, y:460 }, { x:1160, y:360 }, { x:880, y:300 }
    ];

    let v = 0;
    [...leftCluster, ...northCluster, ...rightCluster].forEach(spot => {
      const tree = new Tree(spot.x, spot.y, v % 8);
      v++;
      this.entities.push(tree);
    });

    // Rocas y arbustos nativos bordeando los senderos
    [[280,480],[340,460],[820,440],[900,480]].forEach(([rx,ry], i) => {
      this.entities.push(new Rock(rx, ry, i));
    });
    [[220,500],[380,440],[760,460],[860,520]].forEach(([bx,by], i) => {
      this.entities.push(new Bush(bx, by, i));
    });

    // Castores iniciales posicionados cerca del cauce del río
    this.spawnBeaver(480, 490);
    this.spawnBeaver(620, 510);

    // Personal ENEEI en escala humana real (proporcionada al mapa)
    const scientist = new Scientist(780, 340);
    this.entities.push(scientist);

    const ranger = new Ranger(340, 310);
    ranger.setPatrol([
      { x: 300, y: 290 },
      { x: 440, y: 290 },
      { x: 440, y: 350 },
      { x: 300, y: 350 }
    ]);
    this.entities.push(ranger);
  }

  spawnBeaver(x, y, small = false) {
    const b = new Beaver(
      x || (380 + Math.random()*450),
      y || (440 + Math.random()*100),
      small
    );
    this.entities.push(b);
    this._syncEcologyState();
  }

  removeBeaver() {
    const beavers = this.entities.filter(e => e instanceof Beaver && !e.dead);
    if (beavers.length > 0) {
      const b = beavers[beavers.length - 1];
      b.dead = true;
      this.ui.showNews({
        title: '🪤 CAPTURA HUMANITARIA ENEEI',
        text: 'Castor capturado en área piloto. La presión sobre la masa forestal de Lenga disminuye.',
        type: 'success'
      });
      this._syncEcologyState();
    }
  }

  onTreeFelled(tree, beaver) {
    this.stats.stumps = (this.stats.stumps || 0) + 1;
    this.particles.burst(tree.x, tree.y - 20, 'wood', 12);

    if (!this.newsThrottles['lenga_warn']) {
      this.newsThrottles['lenga_warn'] = true;
      this.ui.showNews({
        title: '⚠️ ¡LA LENGA NO REBROTA DEL TOCÓN!',
        text: 'Nothofagus pumilio tarda 200 años en alcanzar la madurez. Cada árbol talado se pierde permanentemente a escala humana.',
        type: 'warning'
      });
    }
    this._syncEcologyState();
  }

  onBeaverBuiltDam(beaver) {
    this.stats.dams++;
    this._floodNearbyTrees();
    this._syncEcologyState();
  }

  removeDam() {
    const dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead);
    if (dams.length > 0) {
      dams[dams.length - 1].remove();
      this.stats.dams = Math.max(0, this.stats.dams - 1);
      this.ui.showNews({
        title: '⛏️ DIQUE DESMANTELADO POR CUADRILLA',
        text: 'Se desmanteló una represa artificial. El agua drena y el bosque inundado comienza a recuperarse.',
        type: 'success'
      });
      this._syncEcologyState();
    }
  }

  _floodNearbyTrees() {
    const healthyTrees = this.entities.filter(e => e instanceof Tree && e.isHealthy);
    let count = 0;
    for (const t of healthyTrees) {
      if (count >= 2) break;
      if (Math.hypot(t.x - 600, t.y - 480) < 320 + this.stats.dams * 40) {
        t.setState('flooded');
        count++;
      }
    }
  }

  _syncEcologyState() {
    const beavers = this.entities.filter(e => e instanceof Beaver && !e.dead).length;
    const dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead).length;
    const healthyTrees = this.entities.filter(e => e instanceof Tree && e.isHealthy).length;
    const totalTrees = 32;

    this.stats.beavers = beavers;
    this.stats.dams = dams;
    this.stats.health = Math.round((healthyTrees / totalTrees) * 100);
    this.stats.economicLoss = Math.min(66.5, (beavers * 1.2) + (dams * 2.8) + (this.stats.stumps * 1.5));

    let targetStage = 0;
    if (beavers >= 18 || dams >= 6) targetStage = 4;
    else if (beavers >= 12 || dams >= 4) targetStage = 3;
    else if (beavers >= 7  || dams >= 2) targetStage = 2;
    else if (beavers >= 4)  targetStage = 1;

    if (beavers <= 2 && dams <= 1 && this.stageIdx > 0) {
      targetStage = 5;
    }

    if (targetStage !== this.stageIdx) {
      this.stageIdx = targetStage;
      this._crossfadeToMap(targetStage);
      this.ui.showNews(STAGES[targetStage].news);
    }
  }

  getNearestRiverPoint(x, y) {
    let best = RIVER_POINTS[0], bestDist = Infinity;
    for (const rp of RIVER_POINTS) {
      const d = Math.hypot(rp.x - x, rp.y - y);
      if (d < bestDist) { bestDist = d; best = rp; }
    }
    return best;
  }

  start() {
    this.started = true;
    this.running = true;
    this.ui.showNews(STAGES[0].news);
  }

  setTimelinePct(pct) {
    this.timelinePct = pct;
    this.year = 1946 + pct * 100;
  }

  _crossfadeToMap(idx) {
    if (idx === this.currentMap) return;
    this.targetMap = idx;
    this.mapAlpha = 1;
    this.crossfading = true;
  }

  _updateMapTransition(dt) {
    if (!this.crossfading) return;
    this.mapAlpha -= dt * 1.2;
    if (this.mapAlpha <= 0) {
      this.currentMap = this.targetMap;
      this.mapAlpha = 0;
      this.crossfading = false;
    }
  }

  _drawBackground() {
    const ctx = this.ctx;
    const drawMap = (idx, alpha) => {
      if (!this.mapLoaded[idx] || !this.maps[idx]) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#2a4030'; ctx.fillRect(0, 0, this.W, this.H);
        ctx.globalAlpha = 1;
        return;
      }
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.maps[idx], 0, 0, this.W, this.H);
      ctx.globalAlpha = 1;
    };

    if (this.crossfading) {
      drawMap(this.targetMap, 1);
      drawMap(this.currentMap, Math.max(0, this.mapAlpha));
    } else {
      drawMap(this.currentMap, 1);
    }
  }

  _update(dt) {
    if (!this.started) return;

    this.year += dt * 0.4;
    this.timelinePct = Math.min(1, (this.year - 1946) / 100);

    this._updateMapTransition(dt);
    this.particles.update(dt);

    for (const e of this.entities) {
      e.update(dt, this);
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (this.entities[i].dead) this.entities.splice(i, 1);
    }

    this.entities.sort((a, b) => a.baseY - b.baseY);
    this.ui.update(this.stats, this.year, this.timelinePct);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    this._drawBackground();

    for (const e of this.entities) {
      e.draw(ctx);
    }

    this.particles.draw(ctx);
  }

  _startLoop() {
    const loop = (timestamp) => {
      requestAnimationFrame(loop);
      let dt = (timestamp - this._lastTime) / 1000;
      this._lastTime = timestamp;
      if (dt > 0.1) dt = 0.1;

      if (this.running) {
        this._accumulator += dt;
        while (this._accumulator >= this._fixedDt) {
          this._update(this._fixedDt);
          this._accumulator -= this._fixedDt;
        }
      }
      this._draw();
    };

    requestAnimationFrame(ts => {
      this._lastTime = ts;
      requestAnimationFrame(loop);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.GAME = new BeaverGame();
});
