'use strict';
/* ============================================================
   GAME.JS — Engine Limpio & Newsgame Directo "Proyecto Castor"
   Basado en la noticia oficial de Argentina.gob.ar
   ============================================================ */

const STAGES = [
  {
    id: 0, year: 1946, src: 'assets/maps/map_01_inicial.jpg',
    beavers: 2, dams: 0, health: 100, flood: 0,
    news: {
      title: '1946: INTRODUCCIÓN DEL CASTOR',
      text: 'El gobierno argentino liberó 20 ejemplares de Castor canadensis en Tierra del Fuego para crear una industria peletera. Sin predadores naturales (como los osos o lobos de Canadá), la especie encontró el hábitat ideal para multiplicarse.',
      type: 'info'
    }
  },
  {
    id: 1, year: 1965, src: 'assets/maps/map_02_primer_deterioro.jpg',
    beavers: 15, dams: 4, health: 80, flood: 15,
    news: {
      title: '1965: PRIMEROS DIQUES Y TALA DE LENGA',
      text: 'La población explota. Los castores construyen diques en ríos y talan árboles de Lenga (Nothofagus pumilio). A diferencia de los árboles del hemisferio norte, LA LENGA TARDA 200 AÑOS EN CRECER Y NO REBROTA DEL TOCÓN.',
      type: 'warning'
    }
  },
  {
    id: 2, year: 1985, src: 'assets/maps/map_03_bosque_parcial.jpg',
    beavers: 35, dams: 12, health: 60, flood: 35,
    news: {
      title: '1985: INVASIÓN A ISLA NAVARINO',
      text: 'El castor cruza el Canal Beagle conquistando territorio chileno. Las represas alteran el 95% de las cuencas hidrográficas de Tierra del Fuego, anegando hectáreas de bosque nativo.',
      type: 'warning'
    }
  },
  {
    id: 3, year: 2005, src: 'assets/maps/map_04_bosque_inundado.jpg',
    beavers: 65, dams: 25, health: 35, flood: 65,
    news: {
      title: '2005: 100.000 CASTORES Y BOSQUES FANTASMA',
      text: 'Más de 30.000 hectáreas (dos veces la Ciudad de Buenos Aires) convertidas en cementerios de árboles grises sumergidos. El daño económico anual supera los 66.5 MILLONES DE DÓLARES.',
      type: 'danger'
    }
  },
  {
    id: 4, year: 2016, src: 'assets/maps/map_05_bosque_devastado.jpg',
    beavers: 95, dams: 40, health: 15, flood: 85,
    news: {
      title: '2016: ACUERDO BINACIONAL Y PROYECTO ENEEI',
      text: 'Argentina y Chile firman un acuerdo binacional para crear el Proyecto ENEEI. Se implementan 8 áreas piloto con captura humanitaria para evitar la invasión hacia la Cordillera y Neuquén.',
      type: 'danger'
    }
  },
  {
    id: 5, year: 2026, src: 'assets/maps/map_06_restauracion_parcial.jpg',
    beavers: 20, dams: 5, health: 70, flood: 20,
    news: {
      title: '2026: RESTAURACIÓN Y RECUPERACIÓN NATIVA',
      text: 'Con la remoción de diques y el control en áreas piloto, el río vuelve a su cauce natural. Reaparecen los primeros brotes de Lenga y se protege la biodiversidad patagónica.',
      type: 'success'
    }
  }
];

const RIVER_POINTS = [
  { x: 420, y: 480 }, { x: 500, y: 510 }, { x: 580, y: 535 },
  { x: 650, y: 515 }, { x: 720, y: 490 }, { x: 800, y: 505 }
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

    this.particles = new ParticlePool(150);
    this.ui = new GameUI(this);

    this._lastTime = 0;
    this._fixedDt  = 1 / 60;
    this._accumulator = 0;

    this._preloadMaps();
    this._populateCleanEntities();
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

  // ── Limpieza Visual: Personajes escalados en senderos del mapa ──
  _populateCleanEntities() {
    this.entities = [];

    // Castores iniciales posicionados en el río
    this.spawnBeaver(450, 480);
    this.spawnBeaver(620, 500);

    // Científica de campo en el sendero
    const scientist = new Scientist(760, 310);
    this.entities.push(scientist);

    // Guardaparque patrullando el sendero superior
    const ranger = new Ranger(320, 240);
    ranger.setPatrol([
      { x: 260, y: 220 },
      { x: 420, y: 220 },
      { x: 420, y: 280 },
      { x: 260, y: 280 }
    ]);
    this.entities.push(ranger);
  }

  spawnBeaver(x, y, small = false) {
    const b = new Beaver(x || (300 + Math.random()*600), y || (400 + Math.random()*140), small);
    this.entities.push(b);
    this._syncStateFromEntities();
  }

  removeBeaver() {
    const beavers = this.entities.filter(e => e instanceof Beaver && !e.dead);
    if (beavers.length > 0) {
      const b = beavers[beavers.length - 1];
      b.dead = true;
      this.ui.showNews({
        title: '🪤 CAPTURA HUMANITARIA ENEEI',
        text: 'Un castor fue capturado en el área piloto. La presión sobre el bosque de Lenga disminuye.',
        type: 'success'
      });
      this._syncStateFromEntities();
    }
  }

  addDam() {
    const dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead);
    if (dams.length < 5) {
      const rp = RIVER_POINTS[dams.length % RIVER_POINTS.length];
      const dam = new Dam(rp.x, rp.y);
      this.entities.push(dam);
    }
  }

  removeDam() {
    const dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead);
    if (dams.length > 0) {
      dams[dams.length - 1].remove();
      this.ui.showNews({
        title: '⛏️ DIQUE DESMANTELADO POR CUADRILLA',
        text: 'Se removió un dique artificial. El río recupera su caudal y el área inundada comienza a secarse.',
        type: 'success'
      });
      this._syncStateFromEntities();
    }
  }

  _syncStateFromEntities() {
    const beavers = this.entities.filter(e => e instanceof Beaver && !e.dead).length;
    const dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead).length;
    this.stats.beavers = beavers;
    this.stats.dams = dams;

    // Calcular etapa según la población de castores
    let targetStage = 0;
    if (beavers >= 25) targetStage = 4;
    else if (beavers >= 16) targetStage = 3;
    else if (beavers >= 10) targetStage = 2;
    else if (beavers >= 5)  targetStage = 1;

    // Si se capturan castores y quedan menos de 5, pasa a restauración
    if (beavers <= 3 && this.stageIdx > 0) {
      targetStage = 5;
    }

    if (targetStage !== this.stageIdx) {
      this.stageIdx = targetStage;
      this._crossfadeToMap(targetStage);
      this.ui.showNews(STAGES[targetStage].news);
    }

    // Actualizar pérdida económica proporcional (máx USD 66.5M)
    this.stats.economicLoss = Math.min(66.5, (beavers * 0.6) + (dams * 1.5));
    this.stats.health = Math.max(10, 100 - (beavers * 3.5) - (dams * 5));
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

    // Y-sorting limpio
    this.entities.sort((a, b) => a.baseY - b.baseY);

    this.ui.update(this.stats, this.year, this.timelinePct);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // 1. Dibujar el mapa de fondo ilustrado (sin árboles encimados)
    this._drawBackground();

    // 2. Dibujar personajes y diques ordenados en profundidad
    for (const e of this.entities) {
      e.draw(ctx);
    }

    // 3. Partículas sutiles
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
