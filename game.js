'use strict';
/* ============================================================
   GAME.JS — Motor Principal del Newsgame ENEEI
   Basado en la noticia oficial de Argentina.gob.ar / Proyecto Castor
   ============================================================ */

const STAGES = [
  {
    id:0, year:1946, src:'assets/maps/map_01_inicial.jpg',
    beavers:20, dams:0, trees:100, flood:0,
    news:{ title:'1946: Introducción del Castor', text:'20 ejemplares de Castor canadensis liberados en Tierra del Fuego para crear una industria peletera. Sin predadores (lobos/osos), se adaptan rápidamente.', type:'info' }
  },
  {
    id:1, year:1965, src:'assets/maps/map_02_primer_deterioro.jpg',
    beavers:50, dams:8, trees:85, flood:10,
    news:{ title:'1965: Proliferación sin predadores', text:'Sin predadores naturales en América del Sur, la población explota. Aparecen los primeros diques y tala de árboles centenarios.', type:'warning' }
  },
  {
    id:2, year:1985, src:'assets/maps/map_03_bosque_parcial.jpg',
    beavers:90, dams:25, trees:65, flood:30,
    news:{ title:'1985: Invasión a Isla Navarino', text:'El castor cruza el Canal Beagle conquistando Chile. La Lenga (Nothofagus pumilio) no rebrota del tocón y tarda 200 años en recuperarse.', type:'warning' }
  },
  {
    id:3, year:2005, src:'assets/maps/map_04_bosque_inundado.jpg',
    beavers:130, dams:55, trees:40, flood:60,
    news:{ title:'2005: 100.000 Castores y Bosques Fantasma', text:'Más de 30.000 ha (dos veces CABA) destruidas. Pérdida económica anual estimada en USD 66.556.975 en Tierra del Fuego.', type:'danger' }
  },
  {
    id:4, year:2016, src:'assets/maps/map_05_bosque_devastado.jpg',
    beavers:160, dams:90, trees:20, flood:85,
    news:{ title:'2016: Acuerdo Binacional Argentina-Chile', text:'Se crea el Proyecto ENEEI. 8 áreas piloto implementadas para captura humanitaria y prevención de invasión hacia Neuquén.', type:'danger' }
  },
  {
    id:5, year:2026, src:'assets/maps/map_06_restauracion_parcial.jpg',
    beavers:40, dams:15, trees:60, flood:30,
    news:{ title:'2026: Restauración y Control ENEEI', text:'Con trampas en áreas piloto y remoción de diques, las cuencas comienzan a drenarse y los primeros renuevos de Lenga reaparecen.', type:'success' }
  }
];

const RIVER_POINTS = [
  { x: 420, y: 480 }, { x: 480, y: 510 }, { x: 560, y: 540 },
  { x: 640, y: 520 }, { x: 700, y: 490 }, { x: 780, y: 500 },
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

    // Presupuesto ambiental y métricas reales de la noticia
    this.budget = 100; // Puntos de Presupuesto ENEEI ($)
    this.stats = {
      beavers: 20,
      trees: 100,
      flood: 0,
      dams: 0,
      economicLoss: 0, // En millones de USD (máx 66.5M)
      continentalRisk: 0, // % de riesgo de cruzar a Neuquén/Chile
    };

    this.year = 1946;
    this.timelinePct = 0;
    this.stageIdx = 0;
    this.mode = 'none';
    this.beaverBirthTimer = 10;
    this.budgetIncomeTimer = 5;
    this.barrierActive = false;
    this.newsThrottles = {};

    this.entities = [];
    this.pendingAdd = [];

    this.maps = [];
    this.mapLoaded = [];
    this.currentMap = 0;
    this.targetMap  = 0;
    this.mapAlpha   = 1;
    this.crossfading = false;

    this.particles = new ParticlePool(300);
    this.ui = new GameUI(this);

    this._lastTime = 0;
    this._fixedDt  = 1 / 60;
    this._accumulator = 0;

    this._preloadMaps();
    this._bindCanvas();
    this._populateInitialEntities();
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

  _populateInitialEntities() {
    const treeZones = [
      { x:80,  y:120, w:280, h:280, count:12 },
      { x:850, y:100, w:300, h:300, count:12 },
      { x:200, y:80,  w:600, h:100, count:8 },
    ];

    let treeVariant = 0;
    treeZones.forEach(zone => {
      for (let i = 0; i < zone.count; i++) {
        const x = zone.x + Math.random() * zone.w;
        const y = zone.y + Math.random() * zone.h;
        const tree = new Tree(x, y, treeVariant % 8);
        treeVariant++;
        this.entities.push(tree);
      }
    });

    for (let i = 0; i < 6; i++) {
      const x = 60 + Math.random() * (this.W - 120);
      const y = 100 + Math.random() * 250;
      const rock = new Rock(x, y, i);
      this.entities.push(rock);
    }

    for (let i = 0; i < 8; i++) {
      const x = 60 + Math.random() * (this.W - 120);
      const y = 80 + Math.random() * 320;
      const bush = new Bush(x, y, i);
      this.entities.push(bush);
    }

    for (let i = 0; i < 8; i++) {
      const x = 60 + Math.random() * (this.W - 120);
      const y = 60 + Math.random() * 300;
      const moss = new Moss(x, y, i);
      this.entities.push(moss);
    }

    // Castores iniciales de la simulación
    for (let i = 0; i < 4; i++) {
      this._spawnBeaver(350 + Math.random()*500, 320 + Math.random()*150);
    }

    // Personal del Proyecto ENEEI
    const scientist = new Scientist(780, 320);
    this.entities.push(scientist);
    this._spawnRanger(320, 240);
  }

  _spawnBeaver(x, y, small = false) {
    const b = new Beaver(x, y, small);
    this.entities.push(b);
  }

  _spawnRanger(x, y) {
    const r = new Ranger(x, y);
    r.setPatrol([
      { x: x - 80, y: y - 30 },
      { x: x + 80, y: y - 30 },
      { x: x + 80, y: y + 50 },
      { x: x - 80, y: y + 50 },
    ]);
    this.entities.push(r);
  }

  _bindCanvas() {
    const handlePointer = (e) => {
      if (!this.started || this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.W / rect.width;
      const scaleY = this.H / rect.height;
      const px = ((e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left) * scaleX;
      const py = ((e.clientY || (e.touches && e.touches[0].clientY) || 0) - rect.top)  * scaleY;
      this._handleClick(px, py);
    };
    this.canvas.addEventListener('click', handlePointer);
    this.canvas.addEventListener('touchend', e => { e.preventDefault(); handlePointer(e); }, { passive: false });
  }

  _handleClick(px, py) {
    switch (this.mode) {
      case 'trap':
        if (this.budget >= 15) {
          this.budget -= 15;
          const cage = new Cage(px, py);
          this.entities.push(cage);
          this.ui.showNews({ title:'Área Piloto ENEEI instalada', text:'Trampa de captura humanitaria colocada (-$15). Reduciendo la densidad de castores.', type:'success' });
          this.setMode('none');
        } else {
          this.ui.showNews({ title:'Presupuesto Insuficiente', text:'Necesitas $15 para instalar un área piloto de captura.', type:'warning' });
        }
        break;

      case 'dam-remove':
        if (this.budget >= 20) {
          const dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead);
          let nearest = null, nearestDist = 90;
          for (const d of dams) {
            const dist = Math.hypot(d.x - px, d.y - py);
            if (dist < nearestDist) { nearestDist = dist; nearest = d; }
          }
          if (nearest) {
            this.budget -= 20;
            nearest.remove();
            this.stats.dams = Math.max(0, this.stats.dams - 1);
            this.stats.flood = Math.max(0, this.stats.flood - 8);
            this.ui.showNews({ title:'Dique Desmantelado', text:'Cuadrilla ENEEI removió el dique (-$20). El agua comienza a drenarse de la turbera.', type:'success' });
            this.setMode('none');
          } else {
            this.ui.showNews({ title:'Selecciona un Dique', text:'Haz clic directamente sobre una represa de troncos para desmantelarla.', type:'info' });
          }
        } else {
          this.ui.showNews({ title:'Presupuesto Insuficiente', text:'Desmantelar un dique requiere $20 para la cuadrilla especializada.', type:'warning' });
        }
        break;

      case 'plant':
        if (this.budget >= 10) {
          this.budget -= 10;
          const seedling = new Seedling(px, py);
          this.entities.push(seedling);
          this.ui.showNews({ title:'Reforestación de Lenga', text:'Renuevo de Nothofagus pumilio plantado (-$10). Protegiendo el suelo de gramíneas exóticas.', type:'success' });
          this.setMode('none');
        } else {
          this.ui.showNews({ title:'Presupuesto Insuficiente', text:'Sembrar un renuevo de Lenga requiere $10.', type:'warning' });
        }
        break;

      case 'barrier':
        if (this.budget >= 35) {
          this.budget -= 35;
          this.barrierActive = true;
          this.stats.continentalRisk = Math.max(0, this.stats.continentalRisk - 25);
          this.ui.showNews({ title:'Barrera Estrecho de Magallanes', text:'Puesto binacional instalado (-$35). Bloqueando el avance del castor hacia el territorio continental (Neuquén/Chile).', type:'success' });
          this.setMode('none');
        } else {
          this.ui.showNews({ title:'Presupuesto Insuficiente', text:'La barrera de contención continental requiere $35.', type:'warning' });
        }
        break;

      case 'beaver-add':
        this._spawnBeaver(px, py);
        this.ui.showNews({ title:'Simulación Histórica (+1 Castor)', text:'Simulando la proliferación sin control de la especie exótica invasora.', type:'danger' });
        break;
    }
  }

  start() {
    this.started = true;
    this.running = true;
    this.ui.showNews(STAGES[0].news);
  }

  setMode(mode) { this.mode = mode; }

  setTimelinePct(pct) {
    this.timelinePct = pct;
    const newYear = 1946 + pct * 100;
    this.year = newYear;
    if (newYear > STAGES[this.stageIdx].year && this.stageIdx < STAGES.length - 1) {
      this._advanceStage();
    }
  }

  _advanceStage() {
    if (this.stageIdx >= STAGES.length - 1) return;
    this.stageIdx++;
    const stage = STAGES[this.stageIdx];
    this._crossfadeToMap(this.stageIdx);
    this.ui.showNews(stage.news);
    // Presupuesto otorgado por Fondos GEF/FAO al avanzar etapa
    this.budget += 25;
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

  onTreeFelled(tree, beaver) {
    this._growOrAddDam(beaver.x, beaver.y);
    if (!this.newsThrottles['lenga_warn'] && this.stats.trees < 80) {
      this.newsThrottles['lenga_warn'] = true;
      this.ui.showNews({
        title: '⚠️ La Lenga NO rebrota del tocón',
        text: 'Diferencia clave con árboles del hemisferio norte: Nothofagus pumilio requiere 200 años para recuperarse. Su tala causa deforestación permanente.',
        type: 'warning'
      });
    }
  }

  onBeaverBuiltDam(beaver) {
    this.stats.flood = Math.min(100, this.stats.flood + 4);
    this.stats.dams++;
    if (this.stats.flood > 35) this._floodNearbyTrees();
  }

  onBeaverCaptured(cage) {
    this.stats.beavers = Math.max(0, this.stats.beavers - 1);
    this.budget += 5; // Recompensa ENEEI por captura exitosa
  }

  _growOrAddDam(bx, by) {
    const existingDams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead);
    const nearby = existingDams.find(d => Math.hypot(d.x - bx, d.y - by) < 180);
    if (nearby) {
      nearby.grow();
    } else {
      const rp = this.getNearestRiverPoint(bx, by);
      const dam = new Dam(rp.x + (Math.random()-0.5)*40, rp.y + (Math.random()-0.5)*20);
      this.entities.push(dam);
    }
  }

  _floodNearbyTrees() {
    const trees = this.entities.filter(e => e instanceof Tree && e.state === 'healthy');
    let count = 0;
    for (const t of trees) {
      if (count >= 2) break;
      if (Math.hypot(t.x - 600, t.y - 500) < 350 + this.stats.flood * 4) {
        t.setState(this.stats.flood > 65 ? 'flooded' : 'dead');
        this.stats.trees = Math.max(0, this.stats.trees - 1.5);
        count++;
      }
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

  _updateBeaverBreeding(dt) {
    if (!this.started) return;
    this.beaverBirthTimer -= dt;
    if (this.beaverBirthTimer <= 0) {
      const currentBeavers = this.entities.filter(e => e instanceof Beaver && !e.dead).length;
      if (currentBeavers < 160) {
        const parent = this.entities.find(e => e instanceof Beaver && !e.dead);
        if (parent) {
          this._spawnBeaver(
            parent.x + (Math.random() - 0.5) * 60,
            parent.y + (Math.random() - 0.5) * 40,
            Math.random() < 0.5
          );
        }
      }
      this.beaverBirthTimer = 10 + Math.random() * 8;
    }

    // Financiamiento periódico ENEEI
    this.budgetIncomeTimer -= dt;
    if (this.budgetIncomeTimer <= 0) {
      this.budget = Math.min(200, this.budget + 2);
      this.budgetIncomeTimer = 6;
    }
  }

  _updateYear(dt) {
    if (!this.started) return;
    this.year += dt * 0.6;
    this.timelinePct = Math.min(1, (this.year - 1946) / 100);

    // Métricas del informe periodístico oficial
    const currentBeavers = this.entities.filter(e => e instanceof Beaver && !e.dead).length;
    this.stats.beavers = currentBeavers;

    // Pérdida Económica (Prorrateo de USD 66.556.975 anuales del informe)
    const damageFactor = (currentBeavers / 100) + (this.stats.dams * 0.5) + ((100 - this.stats.trees) / 20);
    this.stats.economicLoss = Math.min(66.5, damageFactor * 3.5);

    // Riesgo de Invasión Continental (Neuquén/Chile)
    let risk = (currentBeavers * 0.45) + (this.stats.dams * 0.8);
    if (this.barrierActive) risk *= 0.35;
    this.stats.continentalRisk = Math.min(100, risk);

    // Noticia de Alerta Continental al superar 50% de riesgo
    if (this.stats.continentalRisk > 50 && !this.newsThrottles['risk_50']) {
      this.newsThrottles['risk_50'] = true;
      this.ui.showNews({
        title: '🚨 Amenaza Continental: Neuquén y Chile',
        text: 'El castor cruzó el Estrecho de Magallanes. Si no se frena con barreras y áreas piloto, alcanzará la Cordillera hasta Neuquén.',
        type: 'danger'
      });
    }

    if (this.year >= 2046 && !this.gameOver) {
      this._triggerEndGame();
    }
  }

  _triggerEndGame() {
    this.gameOver = true;
    this.running = false;
    const type = (this.stats.continentalRisk >= 60 || this.stats.trees <= 25) ? 'collapse' : 'restoration';
    this.ui.showEndScreen(type, this.stats);
  }

  _update(dt) {
    if (!this.started) return;
    this._updateYear(dt);
    this._updateBeaverBreeding(dt);
    this._updateMapTransition(dt);
    this.particles.update(dt);

    if (this.pendingAdd.length > 0) {
      this.entities.push(...this.pendingAdd);
      this.pendingAdd = [];
    }

    for (const e of this.entities) {
      e.update(dt, this);
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (this.entities[i].dead) this.entities.splice(i, 1);
    }

    this.entities.sort((a, b) => a.baseY - b.baseY);
    this.stats.dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead).length;

    this.ui.update(this.stats, this.year, this.timelinePct, this.mode, this.budget);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    this._drawBackground();

    if (this.stats.flood > 15) {
      this._drawFloodOverlay(ctx);
    }

    for (const e of this.entities) {
      e.draw(ctx);
    }

    this.particles.draw(ctx);
    this._drawModeCursor(ctx);
  }

  _drawFloodOverlay(ctx) {
    const pct = Math.min(1, this.stats.flood / 100);
    const y0 = this.H * (0.85 - pct * 0.55);
    const grd = ctx.createLinearGradient(0, y0, 0, this.H);
    grd.addColorStop(0, `rgba(20,80,130,0)`);
    grd.addColorStop(0.2, `rgba(20,80,130,${0.25 * pct})`);
    grd.addColorStop(1,   `rgba(10,40,80,${0.55 * pct})`);
    ctx.fillStyle = grd; ctx.fillRect(0, y0, this.W, this.H - y0);

    if (pct > 0.2) {
      const t = performance.now() / 1000;
      ctx.strokeStyle = `rgba(100,180,255,${0.25 * pct})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const cy = y0 + (this.H - y0) * (0.2 + i * 0.22);
        const wave = Math.sin(t * 1.2 + i * 1.3) * 4;
        ctx.beginPath();
        ctx.moveTo(0, cy + wave);
        for (let xi = 0; xi <= this.W; xi += 40) {
          ctx.lineTo(xi, cy + Math.sin(t * 1.5 + xi * 0.015 + i * 0.8) * 5);
        }
        ctx.stroke();
      }
    }
  }

  _drawModeCursor(ctx) {
    if (this.mode === 'none' || !this._cursorX) return;
    ctx.save();
    ctx.globalAlpha = 0.45;
    const icons = {
      trap: SpritePainter.cage_sprite(),
      plant: SpritePainter.seedling_sprite(),
    };
    const sp = icons[this.mode];
    if (sp) {
      ctx.drawImage(sp, this._cursorX - sp.width/2, this._cursorY - sp.height/2);
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(this._cursorX, this._cursorY, 18, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  _startLoop() {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this._cursorX = (e.clientX - rect.left) * (this.W / rect.width);
      this._cursorY = (e.clientY - rect.top) * (this.H / rect.height);
    });

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
