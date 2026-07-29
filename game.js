'use strict';
/* ============================================================
   GAME.JS — Sistema Completo de Jugabilidad Narrativa Noticiosa
   - Inicio: Bosque puro de Lenga alrededor del río.
   - Acto I: Liberación de 20 Castores -> Tala -> Caída de Ramas (rama.png) -> Carga (castormadera.png) -> Diques (diquechico -> diquemedio -> diquegrande).
   - Inundación Dinámica: Transición a map_04_bosque_inundado.jpg + Árboles Fantasma (arbolfantasma1..4.png).
   - Acto II: Inventario y Drag-and-Drop de Cabaña (cabana.png) + Acuerdo Binacional Argentina-Chile.
   - Acto III: Minijuego de Precisión + Simulación de Guardaparques (guardaparque.png, guardaparquejaula.png).
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
    this.minigameActive = false;

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
      title: '1946: 20 CASTORES EN EL FIN DEL MUNDO PARA UNA INDUSTRIA PELETERA',
      subtitle: 'La Marina Argentina importó 20 ejemplares de Castor canadensis desde Canadá.',
      text: 'El plan original buscaba crear un mercado de pieles en Tierra del Fuego. Sin depredadores naturales (osos/lobos) y con abundante agua pura, la especie comenzó su multiplicación imparable.',
      fact: '80 años después, 20 castores se convirtieron en más de 100.000 a 150.000 ejemplares.',
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

  // ── INICIO: Bosque nativo denso y frondoso (160+ árboles) a ambos lados del río central ──
  _populateInitialForest() {
    this.entities = [];
    const treePositions = [];
    const minDistance = 22; // Espaciado estrecho para formar un bosque tupido realista

    // Margen Izquierdo (x: 50 - 520, y: 120 - 640) -> 80 árboles
    for (let i = 0; i < 80; i++) {
      let attempts = 0;
      while (attempts < 80) {
        attempts++;
        const x = 50 + Math.random() * 470;
        const y = 120 + Math.random() * 520;
        if (!treePositions.some(p => Math.hypot(p.x - x, p.y - y) < minDistance)) {
          treePositions.push({ x, y });
          break;
        }
      }
    }

    // Margen Derecho (x: 760 - 1230, y: 120 - 640) -> 80 árboles
    for (let i = 0; i < 80; i++) {
      let attempts = 0;
      while (attempts < 80) {
        attempts++;
        const x = 760 + Math.random() * 470;
        const y = 120 + Math.random() * 520;
        if (!treePositions.some(p => Math.hypot(p.x - x, p.y - y) < minDistance)) {
          treePositions.push({ x, y });
          break;
        }
      }
    }

    // Instanciar árboles con variantes y escalas aleatorias para solapamiento de copas
    treePositions.forEach((spot, idx) => {
      const tree = new Tree(spot.x, spot.y, idx % 9);
      tree.scale = 0.8 + Math.random() * 0.5;
      this.entities.push(tree);
    });
  }

  // ── Liberación de los 20 Castores ──
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
      title: '🚨 INVASIÓN EN CURSO Y TALA MASIVA DE LA LENGA',
      subtitle: 'Los castores avanzan en 2 equipos construyendo represas colaborativas.',
      text: 'Los roedores cortan la madera nativa con sus incisivos y arrastran las ramas hacia el cauce central. La especie alteró más del 95% de las cuencas de la isla.',
      fact: 'El castor no tiene oponentes naturales en la Patagonia.',
      theme: 'warning',
      year: '1965'
    });
  }

  // ── Evento: Árbol Talado -> Caen Ramas (rama.png) y se convierte en Tocón (toconjoven.png) ──
  onTreeFelled(tree, beaver) {
    tree.setState('stump_fresh');
    this.particles.burst(tree.x, tree.y - 25, 'wood', 15);

    // Soltar rama en el suelo
    const log = new LogEntity(tree.x + (Math.random() - 0.5) * 15, tree.y + 5);
    this.entities.push(log);
    beaver.targetLog = log;

    this.stats.forestLoss = Math.min(100, this.stats.forestLoss + 2);
    this.stats.health = Math.max(0, 100 - this.stats.forestLoss);

    if (!this._lengaWarnShown) {
      this._lengaWarnShown = true;
      this.ui.showEditorialNewsCard({
        title: '⚠️ LA TRAGEDIA DE LA LENGA: 200 AÑOS EN CRECER',
        subtitle: 'A diferencia de los árboles del hemisferio norte, la Lenga NO rebota del tocón.',
        text: 'Nothofagus pumilio tardó dos siglos en alcanzar la madurez. Al ser talada por el castor, la Lenga muere definitivamente a escala humana.',
        quote: 'Cada árbol caído en Tierra del Fuego representa una pérdida irrecuperable para la biodiversidad.',
        fact: 'No hubo coevolución entre los árboles patagónicos y el castor.',
        theme: 'warning',
        year: '1980'
      });
    }
  }

  // ── Evento: Entrega de Madera al Río -> 2 Diques Colectivos (10 Castores por Dique) ──
  onBeaverDeliveredWood(beaver) {
    this.stats.woodDelivered++;

    // Asignación de Dique según el equipo del castor (Par: Dique Norte, Impar: Dique Sur)
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

    // Acumulación colectiva de madera por dique: 3 entregas = Chico (1), 7 = Mediano (2), 12 = Grande (3)
    if (dam.woodCount >= 12) {
      dam.level = 3;
      dam._refreshSprite();
      this.triggerFloodedCrisis(); // El mapa cambia ÚNICAMENTE cuando el dique es GRANDE!
    } else if (dam.woodCount >= 7) {
      dam.level = 2;
      dam._refreshSprite();
    } else if (dam.woodCount >= 3) {
      dam.level = 1;
      dam._refreshSprite();
    }
  }

  // ── Inundación del Mapa y Transformación de Árboles en Árboles Fantasma ──
  triggerFloodedCrisis() {
    this._transitionToMap(2);
    this.stats.hectaresFlooded = 350;

    // Transformar árboles sanos restantes sin talar en Árboles Fantasma (arbolfantasma1..4.png)
    this.entities.forEach(e => {
      if (e instanceof Tree && e.isHealthy) {
        e.setState('flooded');
      }
    });

    this.ui.showEditorialNewsCard({
      title: '🌊 BOSQUES FANTASMA Y USD $66.5 MILLONES EN DAÑOS ANUALES',
      subtitle: 'Las represas inundan el suelo, ahogan las raíces y destruyen las turberas.',
      text: 'Más de 30.000 hectáreas de bosque nativo se han convertido en cementerios de árboles de pie. Las pérdidas económicas superan los 66.5 millones de dólares al año.',
      fact: 'El castor inundó cuencas enteras y cruzó el Canal Beagle colonizando Chile.',
      theme: 'danger',
      year: '2005'
    });

    // Abrir ventana lateral de inventario ENEEI
    setTimeout(() => {
      this.ui.showCabinInventory();
    }, 2500);
  }

  // ── Colocación de Cabaña y Cartel -> Requisito de Ambos para Iniciar Minijuego ──
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

      this.ui.showNews({
        title: '📜 ACUERDO BINACIONAL ARGENTINA-CHILE (ENEEI 2016)',
        text: 'Se instalaron la Cabaña de Control y el Cartel Informativo. Se inicia la estrategia de erradicación humanitaria con trampas jaula y restauración de cuencas.',
        type: 'info'
      });

      // Abrir Minijuego de Precisión tras 1.5 segundos
      setTimeout(() => {
        this.ui.openPrecisionMinigame();
      }, 1500);
    }
  }

  // ── Éxito del Minijuego -> Simulación de Guardaparques Capturando Castores ──
  startRangerSimulation() {
    this.act = 3;

    // Simulación progresiva de captura y remoción gradual de diques
    let captureInterval = setInterval(() => {
      const beavers = this.entities.filter(e => e instanceof Beaver && !e.dead);
      if (beavers.length > 0) {
        const b = beavers.pop();
        b.dead = true;
        this.particles.burst(b.x, b.y - 15, 'leaf', 16);
        this.stats.beavers = Math.max(0, this.stats.beavers - 1);

        // Deterioro progresivo del dique
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

    // Desmantelar todos los diques restantes
    this.entities.forEach(e => {
      if (e instanceof Dam) e.remove();
    });

    this.ui.showNews({
      title: '🌱 CUENCA RESTAURADA Y RENUEVOS DE LENGA',
      text: 'Con el desmantelamiento de los diques y el control de la especie invasora, el río vuelve a fluir y el bosque patagónico comienza su recuperación.',
      type: 'success'
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
