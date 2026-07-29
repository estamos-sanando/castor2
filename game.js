'use strict';
/* ============================================================
   GAME.JS — Simulación Ecológica y Periodismo Representativo 100% Real
   Basado en el reportaje especial de Vistazo & Proyecto ENEEI
   ============================================================ */

const STAGES = [
  { id: 0, year: 1946, src: 'assets/maps/map_01_inicial.jpg' },
  { id: 1, year: 1965, src: 'assets/maps/map_02_primer_deterioro.jpg' },
  { id: 2, year: 2005, src: 'assets/maps/map_04_bosque_inundado.jpg' },
  { id: 3, year: 2026, src: 'assets/maps/map_06_restauracion_parcial.jpg' }
];

class BeaverGame {
  constructor() {
    this.canvas  = document.getElementById('game-canvas');
    this.ctx     = this.canvas.getContext('2d');
    this.running = false;
    this.started = false;
    this.act     = 1;

    this.W = 1280; this.H = 720;
    this.canvas.width = this.W; this.canvas.height = this.H;

    this.stats = {
      beavers: 0,
      dams: 0,
      woodDelivered: 0,
      forestLoss: 0,
      hectaresFlooded: 0,
      health: 100
    };

    this.year = 1946;
    this.timelinePct = 0;

    this.entities = [];
    this.maps = [];
    this.mapLoaded = [];
    this.currentMap = 0;
    this.targetMap  = 0;
    this.mapAlpha   = 1;
    this.crossfading = false;

    this.particles = new ParticlePool(250);
    this.ui = new GameUI(this);

    this.beaversInventory = 20;
    this.beaversReleased = 0;
    this.cabinPlaced = false;
    this.signPlaced = false;

    this._lastTime = 0;
    this._fixedDt  = 1 / 60;
    this._accumulator = 0;

    this._preloadMaps();
    this._populateInitialForest();
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

  start() {
    this.started = true;
    this.running = true;
    this.ui.showEditorialNewsCard({
      title: 'EN 1946, ARGENTINA INTRODUJO 20 CASTORES PARA CREAR UNA INDUSTRIA PELETERA',
      subtitle: 'La Marina de Guerra Argentina importó 10 parejas de Castor canadensis desde Canadá.',
      text: 'El plan oficial buscaba desarrollar el comercio de pieles en la Patagonia. La industria nunca fructificó y los roedores fueron abandonados. Sin depredadores naturales (osos pardos o lobos), la especie comenzó su multiplicación imparable.',
      quote: 'Lo que comenzó como un experimento económico se transformó en la mayor catástrofe biológica de los bosques subantárticos.',
      fact: 'De 20 ejemplares en 1946 a una invasión de más de 100.000 a 150.000 castores.',
      theme: 'info',
      year: '1946'
    });
  }

  getNearestRiverPoint(x, y, beaver) {
    const isUpper = beaver ? (beaver.id % 2 === 0) : (y < 380);
    const targetY = isUpper ? 260 : 440;
    return {
      x: 640 + (Math.random() - 0.5) * 20,
      y: targetY + (Math.random() - 0.5) * 20
    };
  }

  // ── INICIO: Bosque nativo denso (220+ árboles) a ambos lados del río ──
  _populateInitialForest() {
    this.entities = [];
    const treePositions = [];
    const minDistance = 18;

    // Margen Izquierdo (x: 40 - 530, y: 110 - 650) -> 110 árboles
    for (let i = 0; i < 110; i++) {
      let attempts = 0;
      while (attempts < 100) {
        attempts++;
        const x = 40 + Math.random() * 490;
        const y = 110 + Math.random() * 540;
        if (!treePositions.some(p => Math.hypot(p.x - x, p.y - y) < minDistance)) {
          treePositions.push({ x, y });
          break;
        }
      }
    }

    // Margen Derecho (x: 750 - 1240, y: 110 - 650) -> 110 árboles
    for (let i = 0; i < 110; i++) {
      let attempts = 0;
      while (attempts < 100) {
        attempts++;
        const x = 750 + Math.random() * 490;
        const y = 110 + Math.random() * 540;
        if (!treePositions.some(p => Math.hypot(p.x - x, p.y - y) < minDistance)) {
          treePositions.push({ x, y });
          break;
        }
      }
    }

    treePositions.forEach((spot, idx) => {
      const tree = new Tree(spot.x, spot.y, idx % 9);
      tree.scale = 0.8 + Math.random() * 0.5;
      this.entities.push(tree);
    });
  }

  // ── Liberación de los 20 Castores (1965) ──
  releaseAll20BeaversAtOnce() {
    if (this.beaversReleased >= 20) return;

    for (let i = 0; i < 20; i++) {
      const rx = 600 + (Math.random() - 0.5) * 80;
      const ry = 180 + Math.random() * 400;
      const b = new Beaver(rx, ry);
      this.entities.push(b);
    }
    this.beaversReleased = 20;
    this.stats.beavers = 20;
    this.act = 2;

    this.ui.showEditorialNewsCard({
      title: '🚨 EXPANSIÓN IMPARABLE Y ALTERACIÓN DEL 95% DE LAS CUENCAS',
      subtitle: 'Los castores construyen represas alterando la red hidrográfica de Tierra del Fuego.',
      text: 'Los roedores talan la madera nativa con sus potentes incisivos y arrastran los troncos hacia los ríos. Sus represas detienen el flujo natural de las aguas, cruzando el Canal Beagle hasta la Isla Navarino en Chile.',
      fact: 'El castor no tiene oponentes naturales ni depredadores en toda la Patagonia austral.',
      theme: 'warning',
      year: '1965'
    });
  }

  // ── Evento: Árbol Talado -> Soltar Rama (rama.png) y Tocón (toconjoven.png) ──
  onTreeFelled(tree, beaver) {
    tree.setState('stump_fresh');
    this.particles.burst(tree.x, tree.y - 25, 'wood', 15);

    const log = new LogEntity(tree.x + (Math.random() - 0.5) * 15, tree.y + 5);
    this.entities.push(log);
    beaver.targetLog = log;

    this.stats.forestLoss = Math.min(100, this.stats.forestLoss + 1);
    this.stats.health = Math.max(0, 100 - this.stats.forestLoss);

    if (!this._lengaWarnShown) {
      this._lengaWarnShown = true;
      this.ui.showEditorialNewsCard({
        title: '⚠️ LA BIOLOGÍA DE LA LENGA: 200 AÑOS EN CRECER Y NO REBROTA DEL TOCÓN',
        subtitle: 'A diferencia de los bosques del Hemisferio Norte, la flora fueguina no evolucionó con el castor.',
        text: 'Cuando un bosque nativo de Canadá o Estados Unidos es talado, los árboles rebrotan de sus raíces. Nothofagus pumilio carece de esta propiedad biológica: cada Lenga caída muere definitivamente.',
        quote: 'Un castor derriba en pocas horas un árbol centenario que tardó dos siglos en alcanzar la madurez.',
        fact: 'Cada árbol perdido en Tierra del Fuego es irrecuperable a escala humana.',
        theme: 'warning',
        year: '1980'
      });
    }
  }

  // ── Evento: Entrega de Madera al Río -> 10 = Dique Chico, 20 = Dique Mediano, 30 = Dique Grande + Inundación ──
  onBeaverDeliveredWood(beaver) {
    this.stats.woodDelivered++;

    const isUpper = (beaver.id % 2 === 0);
    const damX = 640;
    const damY = isUpper ? 260 : 440;

    let dam = this.entities.find(e => e instanceof Dam && e.active && !e.dead && Math.hypot(e.x - damX, e.y - damY) < 60);
    if (!dam) {
      dam = new Dam(damX, damY);
      dam.woodCount = 0;
      this.entities.push(dam);
    }

    dam.woodCount = (dam.woodCount || 0) + 1;
    this.stats.dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead).length;

    // Progresión exacta: 10 maderas = Dique Chico (1), 20 = Dique Mediano (2), 30 = Dique Grande (3) + Inundación
    if (dam.woodCount >= 30) {
      if (dam.level < 3) {
        dam.level = 3;
        dam._refreshSprite();
        this.triggerFloodedCrisis(); // EL MAPA SE INUNDA ÚNICAMENTE CON EL DIQUE GRANDE!
      }
    } else if (dam.woodCount >= 20) {
      if (dam.level < 2) {
        dam.level = 2;
        dam._refreshSprite();
      }
    } else if (dam.woodCount >= 10) {
      if (dam.level < 1) {
        dam.level = 1;
        dam._refreshSprite();
      }
    }
  }

  // ── Inundación y Transformación a Árboles Fantasma (2005) ──
  triggerFloodedCrisis() {
    this._transitionToMap(2);
    this.stats.hectaresFlooded = 350;

    this.entities.forEach(e => {
      if (e instanceof Tree && e.isHealthy) {
        e.setState('flooded');
      }
    });

    this.ui.showEditorialNewsCard({
      title: '🌊 30.000 HECTÁREAS DE BOSQUES FANTASMA Y USD $66.5 MILLONES EN DAÑOS ANUALES',
      subtitle: 'Las represas anegan el suelo, ahogan las raíces de los árboles en pie y destruyen las turberas.',
      text: 'El agua estancada priva de oxígeno a las raíces de los árboles que quedan en pie, secándolos y convirtiéndolos en "bosques fantasma" grises e inertes. Además, destruye las turberas patagónicas, principales captadoras de carbono del planeta.',
      quote: 'Las pérdidas económicas anuales superan los 66.5 millones de dólares en infraestructura, ganadería y conservación.',
      fact: 'Las inundaciones anegan puentes, carreteras y sistemas de agua potable en toda la Isla Grande.',
      theme: 'danger',
      year: '2005'
    });

    setTimeout(() => {
      this.ui.showCabinInventory();
    }, 2500);
  }

  // ── Colocación de Cabaña y Cartel -> Proyecto Binacional ENEEI (2016) ──
  placeCabin(x, y) {
    if (this.cabinPlaced) return;
    this.cabinPlaced = true;
    const cabin = new Rock(x, y, 1); // cabana.png
    cabin.scale = 1.4;
    this.entities.push(cabin);
    this.particles.burst(x, y - 20, 'wood', 14);
    this.checkBothItemsInstalled();
  }

  placeSign(x, y) {
    if (this.signPlaced) return;
    this.signPlaced = true;
    const sign = new Rock(x, y, 0); // cartel.png
    sign.scale = 1.2;
    this.entities.push(sign);
    this.particles.burst(x, y - 15, 'wood', 10);
    this.checkBothItemsInstalled();
  }

  checkBothItemsInstalled() {
    if (this.cabinPlaced && this.signPlaced) {
      this.ui.closeSidebarPanel();

      const cx = 480, cy = 320;
      const ranger1 = new Ranger(cx + 40, cy + 20);
      ranger1.setPatrol([{ x: cx + 40, y: cy + 20 }, { x: 620, y: 320 }, { x: cx + 40, y: cy + 20 }]);
      this.entities.push(ranger1);

      const ranger2 = new Ranger(cx - 40, cy + 30);
      ranger2.setPatrol([{ x: cx - 40, y: cy + 30 }, { x: 640, y: 440 }, { x: cx - 40, y: cy + 30 }]);
      this.entities.push(ranger2);

      const cage1 = new Cage(610, 300);
      const cage2 = new Cage(650, 420);
      this.entities.push(cage1);
      this.entities.push(cage2);

      this.ui.showEditorialNewsCard({
        title: '📜 ESTRATEGIA BINACIONAL ENEEI: ARGENTINA Y CHILE UNIDOS POR LA BIODIVERSIDAD',
        subtitle: 'Con apoyo del Fondo para el Medio Ambiente Mundial (FMAM) y la FAO, se activan áreas piloto.',
        text: 'Técnicos y guardaparques especializados instalan puestos de monitoreo y trampas jaula para erradicar focos invasores y evitar que el castor cruce a la Patagonia continental.',
        fact: 'Es una de las iniciativas binacionales de control de especies exóticas invasoras más ambiciosas del planeta.',
        theme: 'info',
        year: '2016'
      });

      setTimeout(() => {
        this.ui.openPrecisionMinigame();
      }, 1500);
    }
  }

  // ── Simulación de Guardaparques y Restauración de Cuencas (2026) ──
  startRangerSimulation() {
    this.act = 3;

    let captureInterval = setInterval(() => {
      const beavers = this.entities.filter(e => e instanceof Beaver && !e.dead);
      if (beavers.length > 0) {
        const b = beavers.pop();
        b.dead = true;
        this.particles.burst(b.x, b.y - 15, 'leaf', 16);
        this.stats.beavers = Math.max(0, this.stats.beavers - 1);

        const dam = this.entities.find(e => e instanceof Dam && e.active && !e.dead);
        if (dam) {
          if (dam.level > 1) {
            dam.level--;
            dam._refreshSprite();
          } else {
            dam.remove();
          }
        }
      } else {
        clearInterval(captureInterval);
        this.restoreEcosystem();
      }
    }, 1500);
  }

  restoreEcosystem() {
    this._transitionToMap(3);
    this.stats.health = 85;
    this.stats.hectaresFlooded = 0;

    this.entities.forEach(e => {
      if (e instanceof Dam) e.remove();
    });

    this.ui.showEditorialNewsCard({
      title: '🌱 DESMANTELAMIENTO DE DIQUES Y REAPARICIÓN DE LOS PRIMEROS RENUEVOS NATIVOS',
      subtitle: 'La remoción manual de represas permite que los ríos recuperen su escurrimiento natural.',
      text: 'Al drenarse el agua estancada, los biólogos y guardaparques reforestan activamente con plantines de Lenga nativa, frenando la invasión de pastos exóticos y devolviendo el equilibrio a la cuenca fueguina.',
      quote: 'La restauración de un ecosistema devastado por 80 años toma décadas, pero los primeros brotes verdes marcan el retorno del equilibrio.',
      fact: 'La recuperación de las cuencas de agua dulce permite el retorno de la fauna nativa y la fijación de carbono.',
      theme: 'success',
      year: '2026'
    });
  }

  _transitionToMap(targetIdx) {
    if (this.currentMap === targetIdx) return;
    this.targetMap = targetIdx;
    this.crossfading = true;
    this.mapAlpha = 1;
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

    this.year += dt * 0.5;
    this.timelinePct = Math.min(1, (this.year - 1946) / 80);

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
