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
    this.cagePlaced = false;
    this.playerCage = null;
    this.speedMultiplier = 1.0;

    this._lastTime = 0;
    this._fixedDt  = 1 / 60;
    this._accumulator = 0;

    this._preloadMaps();
    this._populateInitialForest();
    this._startLoop();

    setTimeout(() => {
      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.addEventListener('click', (e) => {
          const rect = canvas.getBoundingClientRect();
          const scaleX = 1280 / rect.width;
          const scaleY = 720 / rect.height;
          const clickX = (e.clientX - rect.left) * scaleX;
          const clickY = (e.clientY - rect.top) * scaleY;

          if (this.playerCage && this.playerCage.glowing) {
            if (Math.hypot(clickX - this.playerCage.x, clickY - (this.playerCage.y - 10)) < 55) {
              this.playerCage.glowing = false;
              this.onPlayerCageClicked();
              return;
            }
          }

          // Clics para desmantelar diques en el mapa inundado
          const targetDam = this.entities.find(el => el instanceof Dam && el.active && !el.dead && Math.hypot(clickX - el.x, clickY - el.y) < 70);
          if (targetDam) {
            targetDam.hp = (targetDam.hp !== undefined ? targetDam.hp : 5) - 1;
            this.particles.burst(targetDam.x, targetDam.y - 10, 'wood', 14);

            if (targetDam.hp <= 0) {
              targetDam.remove();
              const remainingDams = this.entities.filter(el => el instanceof Dam && el.active && !el.dead && el !== targetDam).length;

              if (remainingDams <= 1 && this.currentMap === 1) {
                this._transitionToMap(2); // Transición progresiva a drenado parcial
              }

              if (remainingDams <= 0) {
                this.restoreEcosystem();
              } else {
                this.ui.showEditorialNewsCard({
                  title: '🪵 DIQUE DESMANTELADO',
                  subtitle: `Quedan ${remainingDams} diques en la cuenca por desarmar.`,
                  text: 'Al remover los troncos estancados, el flujo del agua vuelve a circular libremente y el nivel de inundación desciende.',
                  fact: 'La desobstrucción manual de represas permite la recuperación de la cuenca.',
                  year: '2026',
                  onAccept: () => {}
                });
              }
            }
            return;
          }

          if (!this.reforestMinigamePlayed) {
            const targetSeedling = this.entities.find(el => el instanceof Seedling && !el.dead && !el.reforested && Math.hypot(clickX - el.x, clickY - (el.y - 6)) < 32);
            if (targetSeedling) {
              this.ui.openReforestationMinigame(targetSeedling);
            }
          }
        });

        canvas.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          const scaleX = 1280 / rect.width;
          const scaleY = 720 / rect.height;
          const mouseX = (e.clientX - rect.left) * scaleX;
          const mouseY = (e.clientY - rect.top) * scaleY;

          let isHovered = false;
          if (this.playerCage && this.playerCage.glowing) {
            if (Math.hypot(mouseX - this.playerCage.x, mouseY - (this.playerCage.y - 10)) < 55) {
              isHovered = true;
            }
          }

          this.entities.forEach(el => {
            if (el instanceof Dam) {
              el.hovered = el.active && !el.dead && Math.hypot(mouseX - el.x, mouseY - el.y) < 70;
              if (el.hovered) isHovered = true;
            } else if (el instanceof Seedling && !el.dead && !el.reforested) {
              const d = Math.hypot(mouseX - el.x, mouseY - (el.y - 6));
              if (d < 32) {
                el.glowing = true;
                isHovered = true;
              } else {
                el.glowing = false;
              }
            }
          });

          if (isHovered) {
            canvas.style.cursor = 'pointer';
          } else if (!window.ISO_ENGINE || !window.ISO_ENGINE.camera || !window.ISO_ENGINE.camera.isDragging) {
            canvas.style.cursor = 'default';
          }
        });
      }
    }, 100);
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
    const targetX = isUpper ? 640 : 645;
    const targetY = isUpper ? 260 : 440;
    return {
      x: targetX + (Math.random() - 0.5) * 20,
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

    // Margen Derecho (x: 750 - 1240, y: 110 - 650) -> 110 árboles (con claro despejado en x: 820..980, y: 450..600)
    for (let i = 0; i < 110; i++) {
      let attempts = 0;
      while (attempts < 100) {
        attempts++;
        const x = 750 + Math.random() * 490;
        const y = 110 + Math.random() * 540;
        // Excluir zona despejada inferior derecha
        if (x >= 820 && x <= 980 && y >= 450 && y <= 600) continue;
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

  prepareClearingForCabin() {
    this.showPlacementArrow = true;
    this.entities.forEach(e => {
      if (e instanceof Tree && e.x >= 800 && e.x <= 1000 && e.y >= 440 && e.y <= 620) {
        e.dead = true;
      }
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

    this.ui.onBeaversReleased();

    this.ui.showEditorialNewsCard({
      title: 'EXPANSIÓN IMPARABLE Y ALTERACIÓN DEL 95% DE LAS CUENCAS',
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
        title: 'LA BIOLOGÍA DE LA LENGA: 200 AÑOS EN CRECER Y NO REBROTA DEL TOCÓN',
        subtitle: 'A diferencia de los bosques del Hemisferio Norte, la flora fueguina no evolucionó con el castor.',
        text: 'Cuando un bosque nativo de Canadá o Estados Unidos es talado, los árboles rebrotan de sus raíces. Nothofagus pumilio carece de esta propiedad biológica: cada Lenga caída muere definitivamente.',
        quote: 'Un castor derriba en pocas horas un árbol centenario que tardó dos siglos en alcanzar la madurez.',
        fact: 'Cada árbol perdido en Tierra del Fuego es irrecuperable a escala humana.',
        theme: 'warning',
        year: '1980'
      });
    }
  }

  // ── Evento: Entrega de Madera al Río ──
  onBeaverDeliveredWood(beaver) {
    this.stats.woodDelivered++;

    const isUpper = (beaver.id % 2 === 0);
    const damX = isUpper ? 640 : 645;
    const damY = isUpper ? 260 : 440;

    let dam = this.entities.find(e => e instanceof Dam && e.active && !e.dead && Math.hypot(e.x - damX, e.y - damY) < 60);
    if (!dam) {
      dam = new Dam(damX, damY);
      dam.woodCount = 0;
      this.entities.push(dam);
    }

    dam.woodCount = (dam.woodCount || 0) + 1;
    this.stats.dams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead).length;

    // Progresión por dique: 6 maderas = Dique Chico (1), 14 = Dique Mediano (2), 22 = Dique Grande (3)
    if (dam.woodCount >= 22) {
      if (dam.level < 3) {
        dam.level = 3;
        dam._refreshSprite();
      }
    } else if (dam.woodCount >= 14) {
      if (dam.level < 2) {
        dam.level = 2;
        dam._refreshSprite();
      }
    } else if (dam.woodCount >= 6) {
      if (dam.level < 1) {
        dam.level = 1;
        dam._refreshSprite();
      }
    }

    // SOLO CUANDO LOS DOS DIQUES ESTÁN TERMINADOS EN DIQUEGRANDE (NIVEL 3) SE ABRE LA VENTANA EMERGENTE
    const activeDams = this.entities.filter(e => e instanceof Dam && e.active && !e.dead);
    const damsLevel3 = activeDams.filter(e => e.level === 3);

    // Al completar el primer Dique Chico (nivel 1), multiplicar x1 castores (solo recorren)
    if (activeDams.some(d => d.level >= 1) && !this.diqueChicoTriggered) {
      this.diqueChicoTriggered = true;

      // Multiplicar x1 todos los castores actuales (los nuevos solo recorren el mapa)
      const currentBeavers = this.entities.filter(e => e instanceof Beaver && !e.dead && !e.captured);
      currentBeavers.forEach(b => {
        const bNew = new Beaver(b.x + (Math.random() - 0.5) * 40, b.y + (Math.random() - 0.5) * 40, b.isSmall);
        bNew.wanderOnly = true; // No talan árboles, solo recorren el mapa
        this.entities.push(bNew);
      });

      this.stats.beavers = this.entities.filter(e => e instanceof Beaver && !e.dead && !e.captured).length;
    }

    // Cambio progresivo de mapa al formar el Dique Mediano (nivel >= 2)
    if (activeDams.some(d => d.level >= 2) && this.currentMap === 0) {
      this._transitionToMap(1); // Transición suave a map_02_primer_deterioro.jpg
    }

    if (activeDams.length >= 2 && damsLevel3.length >= 2 && !this.floodedTriggered) {
      this.floodedTriggered = true;
      this.triggerFloodedCrisis();
    }
  }

  // ── Inundación y Transformación a Árboles Fantasma ──
  triggerFloodedCrisis() {
    // Ventana central con overlay azulado que resalta el impacto ecológico
    this.ui.showEditorialNewsCard({
      title: '60.000 HECTÁREAS DE BOSQUES FANTASMA Y USD $66.5 MILLONES EN DAÑOS ANUALES',
      subtitle: 'Las represas anegan el suelo, ahogan las raíces de las lengas y destruyen las turberas.',
      text: 'El agua estancada priva de oxígeno a las raíces de los árboles en pie, secándolos y convirtiéndolos en "bosques fantasma" grises e inertes. Además, destruye las turberas patagónicas, principales captadoras de carbono del planeta.',
      quote: 'Las pérdidas económicas anuales superan los 66.5 millones de dólares en infraestructura, ganadería y conservación.',
      fact: 'Las inundaciones anegan puentes, carreteras y sistemas de agua potable en toda la Isla Grande.',
      year: '2005',
      centered: true,
      bluish: true,
      onAccept: () => {
        // AL DAR ACEPTAR SE CAMBIA EL MAPA PROGRESIVAMENTE Y SE DISTRIBUYEN ÁRBOLES FANTASMAS POR TODO EL MAPA
        this._transitionToMap(2); // map_04_bosque_inundado.jpg
        this.stats.hectaresFlooded = 60000;

        // Eliminar tocones y árboles existentes para redistribuir un bosque fantasma completo
        this.entities.forEach(e => {
          if (e instanceof Tree) {
            e.dead = true;
          }
        });

        // Crear una distribución amplia y pareja de Árboles Fantasmas a ambos lados del mapa
        const ghostSpots = [];
        const minDistance = 35;

        // Margen Izquierdo: 18-22 árboles fantasmas distribuidos (x: 50..520, y: 110..650)
        const targetLeftCount = 18 + Math.floor(Math.random() * 5);
        for (let i = 0; i < targetLeftCount; i++) {
          let attempts = 0;
          while (attempts < 100) {
            attempts++;
            const x = 50 + Math.random() * 470;
            const y = 110 + Math.random() * 540;
            if (!ghostSpots.some(p => Math.hypot(p.x - x, p.y - y) < minDistance)) {
              ghostSpots.push({ x, y });
              break;
            }
          }
        }

        // Margen Derecho: 18-22 árboles fantasmas distribuidos (x: 750..1230, y: 110..650)
        const targetRightCount = 18 + Math.floor(Math.random() * 5);
        for (let i = 0; i < targetRightCount; i++) {
          let attempts = 0;
          while (attempts < 100) {
            attempts++;
            const x = 750 + Math.random() * 480;
            const y = 110 + Math.random() * 540;
            if (x >= 820 && x <= 980 && y >= 450 && y <= 600) continue; // Zona de la cabaña
            if (!ghostSpots.some(p => Math.hypot(p.x - x, p.y - y) < minDistance)) {
              ghostSpots.push({ x, y });
              break;
            }
          }
        }

        // Instanciar los Árboles Fantasmas distribuidos usando las 5 variantes
        ghostSpots.forEach((spot, idx) => {
          const ghostTree = new Tree(spot.x, spot.y, idx % 9);
          ghostTree.ghostVariant = idx % 5;
          ghostTree.scale = 0.8 + Math.random() * 0.45;
          ghostTree.setState('flooded');
          this.entities.push(ghostTree);
        });

        // Mostrar la ventana de la Estrategia Binacional ANTES de abrir el inventario
        setTimeout(() => {
          this.showBinationalStrategyNews();
        }, 1200);
      }
    });
  }

  showBinationalStrategyNews() {
    this.ui.showEditorialNewsCard({
      title: 'ESTRATEGIA BINACIONAL ENEEI: ARGENTINA Y CHILE UNIDOS POR LA BIODIVERSIDAD',
      subtitle: 'Con apoyo del Fondo para el Medio Ambiente Mundial (FMAM) y la FAO, se activan áreas piloto.',
      text: 'Técnicos y guardaparques especializados instalan puestos de monitoreo y trampas jaula para erradicar focos invasores y evitar que el castor cruce a la Patagonia continental.',
      fact: 'Es una de las iniciativas binacionales de control de especies exóticas invasoras más ambiciosas del planeta.',
      year: '2016',
      onAccept: () => {
        // AL DAR ACEPTAR SE DESPEJA LA ZONA INFERIOR DERECHA Y SE MUESTRA LA FLECHA Y EL INVENTARIO
        this.prepareClearingForCabin();
        this.ui.showCabinInventory();
      }
    });
  }

  // ── Colocación de Cabaña, Cartel y Trampa Jaula -> Proyecto Binacional ENEEI ──
  placeCabin(x, y) {
    if (this.cabinPlaced) return;
    this.cabinPlaced = true;
    this.cabinPos = { x, y };
    const cabin = new Rock(x, y, 1); // cabana.png
    cabin.scale = 1.4;
    this.entities.push(cabin);
    this.particles.burst(x, y - 20, 'wood', 14);

    // Colocar SOLAMENTE UN guardabosques estático al lado de la cabaña
    const ranger = new Ranger(x - 55, y + 10);
    ranger.stationary = true;
    this.entities.push(ranger);

    this.checkAllThreeItemsInstalled();
  }

  placeSign(x, y) {
    if (this.signPlaced) return;
    this.signPlaced = true;
    const sign = new Rock(x, y, 0); // cartel.png
    sign.scale = 1.2;
    this.entities.push(sign);
    this.particles.burst(x, y - 15, 'wood', 10);
    this.checkAllThreeItemsInstalled();
  }

  placeCage(x, y) {
    if (this.cagePlaced) return;
    this.cagePlaced = true;
    const cage = new Cage(x, y);
    cage.glowing = false;
    this.playerCage = cage;
    this.entities.push(cage);
    this.particles.burst(x, y - 10, 'wood', 12);
    this.checkAllThreeItemsInstalled();
  }

  checkAllThreeItemsInstalled() {
    if (this.cabinPlaced && this.signPlaced && this.cagePlaced) {
      this.showPlacementArrow = false;
      this.ui.closeSidebarPanel();

      if (this.playerCage) {
        this.playerCage.glowing = true;
      }

      this.ui.showEditorialNewsCard({
        title: '¡PUESTO DE CONTROL ENEEI INSTALADO!',
        subtitle: 'Cabaña, Cartel y Trampa Jaula desplegados en el área de monitoreo.',
        text: 'Haz clic sobre la <strong>Trampa Jaula</strong> (que parpadea en verde/dorado en el terreno) para iniciar las labores de captura y monitoreo de castores.',
        theme: 'info',
        year: '2016'
      });
    }
  }

  onPlayerCageClicked() {
    const cx = this.cabinPos ? this.cabinPos.x : 900;
    const cy = this.cabinPos ? this.cabinPos.y : 500;

    this.particles.burst(cx, cy - 10, 'leaf', 18);
    if (this.playerCage) {
      this.particles.burst(this.playerCage.x, this.playerCage.y - 10, 'wood', 18);
    }

    this.startRangerSimulation();
    this.ui.openBeaverCatcherMinigame();
  }

  // ── Simulación de Guardaparques y Captura Interactiva ──
  startRangerSimulation() {
    this.act = 3;
    if (this._rangerCaptureInterval) {
      clearInterval(this._rangerCaptureInterval);
      this._rangerCaptureInterval = null;
    }
  }

  restoreEcosystem() {
    if (this._rangerCaptureInterval) {
      clearInterval(this._rangerCaptureInterval);
      this._rangerCaptureInterval = null;
    }

    this.stats.health = 85;
    this.stats.hectaresFlooded = 0;

    this.entities.forEach(e => {
      if (e instanceof Dam) e.remove();
    });

    // Ventana central con overlay que obliga a leer antes del cambio de escena final
    this.ui.showEditorialNewsCard({
      title: '🌱 DESMANTELAMIENTO DE DIQUES Y REAPARICIÓN DE LOS PRIMEROS RENUEVOS NATIVOS',
      subtitle: 'La remoción manual de represas permite que los ríos recuperen su escurrimiento natural.',
      text: 'Al drenarse el agua estancada, los biólogos y guardaparques reforestan activamente con plantines de Lenga nativa, frenando la invasión de pastos exóticos y devolviendo el equilibrio a la cuenca fueguina.',
      quote: 'La restauración de un ecosistema devastado por 80 años toma décadas, pero los primeros brotes verdes marcan el retorno del equilibrio.',
      fact: 'La recuperación de las cuencas de agua dulce permite el retorno de la fauna nativa y la fijación de carbono.',
      year: '2026',
      centered: true, // VENTANA CENTRAL DE CAMBIO DE ESCENA
      onAccept: () => {
        // AL DAR ACEPTAR SE CAMBIA LA ESCENA AL MAPA DE RESTAURACIÓN Y SE ABRE EL INVENTARIO DE REFORESTACIÓN!
        this._transitionToMap(3); // map_06_restauracion_parcial.jpg
        this.prepareReforestationStage();
      }
    });
  }

  prepareReforestationStage() {
    // 1. Quitar del mapa todas las lengas y árboles fantasmas preexistentes
    this.entities.forEach(e => {
      if (e instanceof Tree || e instanceof Seedling) {
        e.dead = true;
      }
    });

    // 2. Reiniciar contador y abrir el inventario con el plantín brote1.png
    this.placedSeedlingsCount = 0;
    this.ui.showReforestSeedlingInventory();
  }

  placeSeedlingFromInventory(x, y) {
    if ((this.placedSeedlingsCount || 0) >= 10) return;

    // Plantar brote en el terreno usando el asset assets/brote.png (variant 0)
    const seedling = new Seedling(x, y, 0);
    this.entities.push(seedling);
    this.particles.burst(x, y - 10, 'leaf', 16);
    this.particles.burst(x, y - 5, 'wood', 10);

    this.placedSeedlingsCount = (this.placedSeedlingsCount || 0) + 1;
    this.ui.onSeedlingPlacedFromInventory(this.placedSeedlingsCount);

    if (this.placedSeedlingsCount >= 10) {
      setTimeout(() => {
        this.ui.closeSidebarPanel();
        this.ui.showEditorialNewsCard({
          title: '🌱 PLANTACIÓN DE 10 BROTES COMPLETADA',
          subtitle: 'Los 10 plantines de Lenga nativa han sido distribuidos en la cuenca.',
          text: 'Haz clic en cualquiera de los brotes colocados en el terreno para iniciar el minijuego de <strong>Reforestación de Lenga</strong> y asegurar su crecimiento.',
          theme: 'info',
          year: '2026',
          onAccept: () => {
            const firstSeedling = this.entities.find(e => e instanceof Seedling && !e.dead && !e.reforested);
            if (firstSeedling) {
              this.ui.openReforestationMinigame(firstSeedling);
            }
          }
        });
      }, 500);
    }
  }

  _transitionToMap(targetIdx) {
    if (this.currentMap === targetIdx) return;
    this.targetMap = targetIdx;
    this.crossfading = true;
    this.mapAlpha = 1;
  }

  _updateMapTransition(dt) {
    if (!this.crossfading) return;
    this.mapAlpha -= dt * 0.28; // Transición progresiva y suave de ~3.5s
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

  toggleSpeed() {
    this.speedMultiplier = (this.speedMultiplier === 2.0) ? 1.0 : 2.0;
    return this.speedMultiplier === 2.0;
  }

  _update(dt) {
    if (!this.started) return;
    const effectiveDt = dt * (this.speedMultiplier || 1.0);

    this.year += effectiveDt * 0.5;
    this.timelinePct = Math.min(1, (this.year - 1946) / 80);

    this._updateMapTransition(effectiveDt);
    this.particles.update(effectiveDt);

    for (const e of this.entities) {
      e.update(effectiveDt, this);
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

    // Flecha animada de señalización (SOLO FLECHA SIN TEXTO)
    if (this.showPlacementArrow && (!this.cabinPlaced || !this.signPlaced)) {
      const targetX = 900, targetY = 500;
      const bounceY = targetY - 30 + Math.sin(Date.now() * 0.006) * 12;

      ctx.save();
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = 'rgba(34, 197, 94, 0.95)';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⬇️', targetX, bounceY);
      ctx.restore();
    }
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
