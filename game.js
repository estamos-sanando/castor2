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
  this.canvas = document.getElementById('game-canvas');
  this.ctx   = this.canvas.getContext('2d');
  this.running = false;
  this.started = false;
  this.act   = 1;

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
  this.targetMap = 0;
  this.mapAlpha  = 1;
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
  this._fixedDt = 1 / 60;
  this._accumulator = 0;

  this._preloadMaps();
  this._populateInitialForest();
  this._startLoop();

  setTimeout(() => {
   const canvas = document.getElementById('game-canvas');
   if (canvas) {
    const handleCanvasPointer = (clientX, clientY) => {
     const rect = canvas.getBoundingClientRect();
     const scaleX = 1280 / rect.width;
     const scaleY = 720 / rect.height;
     const clickX = (clientX - rect.left) * scaleX;
     const clickY = (clientY - rect.top) * scaleY;

     // Paso 1: Clic en la cabaña brillante para que aparezca el guardaparques
     if (this.placedCabinEntity && this.placedCabinEntity.glowing) {
      if (Math.hypot(clickX - this.placedCabinEntity.x, clickY - (this.placedCabinEntity.y - 15)) < 75) {
       this.placedCabinEntity.glowing = false;

       // Aparece el guardaparques parado del lado derecho de la casa y un poco más alejado
       const ranger = new Ranger(this.placedCabinEntity.x + 72, this.placedCabinEntity.y + 14);
       ranger.stationary = true;
       this.entities.push(ranger);
       this.particles.burst(ranger.x, ranger.y - 10, 'leaf', 16);

       // Paso 2: La jaula empieza a brillar para activar el minijuego
       if (this.playerCage) {
        this.playerCage.glowing = true;
       }

       this.ui.showEditorialNewsCard({
        title: ' GUARDAPARQUES POSICIONADO',
        subtitle: 'Estación de monitoreo activada.',
        text: 'El guardaparques se ha ubicado junto a la cabaña. Haz clic sobre la <strong>Trampa Jaula</strong> (que parpadea en verde/dorado) para abrir el minijuego de captura.',
        theme: 'info',
        year: '2016'
       });
       return;
      }
     }

     // Paso 2: Clic en la jaula brillante para abrir el minijuego
     if (this.playerCage && this.playerCage.glowing) {
      if (Math.hypot(clickX - this.playerCage.x, clickY - (this.playerCage.y - 10)) < 55) {
       this.playerCage.glowing = false;
       this.ui.openBeaverCatcherMinigame();
       return;
      }
     }

     // Clics/Toques para desmantelar diques brillantes en el mapa inundado
     const isDamClicked = (dam) => {
      if (!dam.active || dam.dead) return false;
      const dx = Math.abs(clickX - dam.x);
      const dy = Math.abs(clickY - dam.y);
      return (dx < 145 && dy < 90) || Math.hypot(clickX - dam.x, clickY - dam.y) < 145;
     };

     const targetDam = this.entities.find(el => el instanceof Dam && isDamClicked(el));
     if (targetDam && (targetDam.glowing || this.damsCanBeDismantled || this.beaversCaptured || this.currentMap >= 2)) {
      targetDam.hp = (targetDam.hp !== undefined ? targetDam.hp : 5) - 1;
      targetDam._refreshSprite();
      this.particles.burst(targetDam.x, targetDam.y - 10, 'wood', 18);

      if (targetDam.hp <= 0) {
       targetDam.remove();
       const remainingDams = this.entities.filter(el => el instanceof Dam && el.active && !el.dead && el !== targetDam).length;

       if (remainingDams === 0) {
        // El mapa cambia cuando el jugador termina de romper todos los diques
        this._transitionToMap(3); // map_06_restauracion_parcial.jpg

        // 1. Colocar el Puente centrado sobre el río (cruza de orilla a orilla x: 500 a 780)
        if (!this.bridgeEntity) {
         const bridge = new Bridge(640, 310);
         this.bridgeEntity = bridge;
         this.entities.push(bridge);
        }

        // 2. Colocar a la Bióloga a la izquierda del río en la zona de pasto
        if (!this.biologistEntity) {
         const biologist = new Biologist(410, 410);
         biologist.glowing = true;
         this.biologistEntity = biologist;
         this.entities.push(biologist);
        }

        this.ui.showEditorialNewsCard({
         title: 'PROYECTO DE REFORESTACIÓN NATIVA',
         subtitle: 'Haz clic sobre la Bióloga (a la izquierda del río) para iniciar.',
         text: 'Se ha instalado el puente sobre el río y la Bióloga de campo está lista en la orilla izquierda. Haz clic sobre ella para recibir los 10 brotes de Lenga e iniciar la reforestación nativa.',
         fact: 'La desobstrucción del río y la restitución del bosque nativo aseguran el equilibrio ecológico de Tierra del Fuego.',
         year: '2026',
         centered: true,
         onAccept: () => {}
        });
       }
       return;
      }

      // Clic en la Bióloga (a la izquierda del río) para iniciar la reforestación nativa
      if (this.biologistEntity && !this.reforestationStarted) {
       if (Math.hypot(clickX - this.biologistEntity.x, clickY - (this.biologistEntity.y - 15)) < 60) {
        this.biologistEntity.glowing = false;
        this.reforestationStarted = true;
        this.prepareReforestationStage();

        this.ui.showEditorialNewsCard({
         title: 'REFORESTACIÓN NATIVA INICIADA',
         subtitle: 'Arrastra los 10 brotes de Lenga para plantarlos en el terreno.',
         text: 'La Bióloga de campo ha desplegado los brotes nativos. Arrastra cada uno de los 10 brotes con el mouse o la pantalla táctil para restituir el bosque de Lenga.',
         year: '2026'
        });
        return;
       }
      }
     }

     // Clic en brotes florecidos (broteplanta.png) tras el minijuego para madurar progresivamente todos los árboles
     const targetGlowingSeedling = this.entities.find(el => el instanceof Seedling && !el.dead && (el.canGrowToTree || (el.reforested && el.glowing)));
     if (targetGlowingSeedling) {
      const dx = Math.abs(clickX - targetGlowingSeedling.x);
      const dy = Math.abs(clickY - targetGlowingSeedling.y);
      if (Math.hypot(clickX - targetGlowingSeedling.x, clickY - (targetGlowingSeedling.y - 8)) < 80 || (dx < 80 && dy < 80)) {
       this.growAllSeedlingsToFullTrees();
       return;
      }
     }

     if (!this.reforestMinigamePlayed) {
      const targetSeedling = this.entities.find(el => el instanceof Seedling && !el.dead && !el.reforested && Math.hypot(clickX - el.x, clickY - (el.y - 6)) < 55);
      if (targetSeedling) {
       this.ui.openReforestationMinigame(targetSeedling);
      }
     }
    };

    canvas.addEventListener('click', (e) => {
     handleCanvasPointer(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
     if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      handleCanvasPointer(touch.clientX, touch.clientY);
     }
    }, { passive: true });

    canvas.addEventListener('mousemove', (e) => {
     const rect = canvas.getBoundingClientRect();
     const scaleX = 1280 / rect.width;
     const scaleY = 720 / rect.height;
     const mouseX = (e.clientX - rect.left) * scaleX;
     const mouseY = (e.clientY - rect.top) * scaleY;

     let isHovered = false;
     if (this.placedCabinEntity) {
      const dx = Math.abs(mouseX - this.placedCabinEntity.x);
      const dy = Math.abs(mouseY - (this.placedCabinEntity.y - 15));
      if (Math.hypot(mouseX - this.placedCabinEntity.x, mouseY - (this.placedCabinEntity.y - 15)) < 80 || (dx < 70 && dy < 55)) {
       isHovered = true;
      }
     }

     if (this.playerCage && (this.playerCage.glowing || this.cagePlaced)) {
      if (Math.hypot(mouseX - this.playerCage.x, mouseY - (this.playerCage.y - 10)) < 55) {
       isHovered = true;
      }
     }

     if (this.biologistEntity && (this.biologistEntity.glowing || !this.reforestationStarted)) {
      if (Math.hypot(mouseX - this.biologistEntity.x, mouseY - (this.biologistEntity.y - 15)) < 55) {
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
   title: '¿Cómo una decisión tomada hace 80 años transformó un ecosistema?',
   subtitle: '',
   text: 'En 1946 se introdujeron veinte castores provenientes de Canadá en Tierra del Fuego con el objetivo de impulsar una industria peletera. Lo que parecía una iniciativa económica terminó generando cambios ambientales que aún hoy siguen presentes.',
   quote: 'Lo que comenzó como una iniciativa económica se transformó en uno de los mayores desafíos ecológicos de la región.',
   fact: 'Al no existir depredadores naturales en la Patagonia, la población de castores se expandió por toda la Isla Grande.',
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
   if (idx % 4 === 0) {
    tree.willBecomeGhost = true;
   }
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

 addExtra20Beavers() {
  if (this._extra20BeaversAdded) return;
  this._extra20BeaversAdded = true;

  for (let k = 0; k < 20; k++) {
   const rand = Math.random();
   let rx, ry;
   if (rand < 0.45) {
    rx = 60 + Math.random() * 460;
   } else if (rand < 0.90) {
    rx = 760 + Math.random() * 460;
   } else {
    rx = 580 + Math.random() * 120;
   }
   ry = 110 + Math.random() * 540;

   const bNew = new Beaver(rx, ry, Math.random() < 0.35);
   bNew.wanderOnly = true;
   bNew.targetX = Math.max(60, Math.min(1220, rx + (Math.random() - 0.5) * 300));
   bNew.targetY = Math.max(110, Math.min(650, ry + (Math.random() - 0.5) * 200));
   bNew.wanderTimer = 1 + Math.random() * 3;
   this.entities.push(bNew);
  }

  this.stats.beavers = this.entities.filter(e => e instanceof Beaver && !e.dead && !e.captured).length;
 }

 // ── Liberación de los 20 Castores (1965) ──
 releaseAll20BeaversAtOnce() {
  if (this.beaversReleased >= 20) return;

  for (let i = 0; i < 20; i++) {
   const rand = Math.random();
   let rx = rand < 0.5 ? (80 + Math.random() * 440) : (760 + Math.random() * 440);
   let ry = 140 + Math.random() * 480;
   const b = new Beaver(rx, ry);
   b.targetX = Math.max(60, Math.min(1220, rx + (Math.random() - 0.5) * 240));
   b.targetY = Math.max(110, Math.min(650, ry + (Math.random() - 0.5) * 180));
   b.wanderTimer = 1 + Math.random() * 3;
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
   fact: 'Al no existir depredadores naturales (como lobos u osos en la Patagonia), la población explotó exponencialmente a más de 100.000 ejemplares.',
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
   title: 'DEVASTACIÓN DEL BOSQUE NATIVO DE LENGA Y GUINDO',
   subtitle: 'Las represas de madera sofocan las raíces de los árboles ancestrales.',
   text: 'El agua estancada priva de oxígeno a las raíces de los árboles en pie. A diferencia de las especies del hemisferio norte, <strong>la Lenga y el Guindo patagónico NO rebrotan del tocón</strong> ni toleran raíces sumergidas, convirtiéndose en "bosques fantasma" grises e inertes.',
   quote: 'Los castores alteran la cuenca hidrográfica modificando los ríos y facilitando la invasión de plantas exóticas.',
   fact: 'Se estima que más de 60.000 hectáreas de bosque nativo han sido severamente destruidas en toda la Isla Grande.',
   year: '2005',
   centered: true,
   bluish: true,
   onAccept: () => {
    // AL DAR ACEPTAR SE CAMBIA EL MAPA PROGRESIVAMENTE Y SE DISTRIBUYEN ÁRBOLES FANTASMAS POR TODO EL MAPA
    this._transitionToMap(2); // map_04_bosque_inundado.jpg
    this.stats.hectaresFlooded = 60000;

    // Transformar los árboles que quedaron en pie (willBecomeGhost) en Árboles Fantasmas
    // Todos los tocones jóvenes y viejos desaparecen en el mapa inundado.
    let ghostIdx = 0;
    this.entities.forEach(e => {
     if (e instanceof Tree) {
      if (e.willBecomeGhost && !e.dead && e.state !== 'stump_fresh' && e.state !== 'stump_old') {
       e.ghostVariant = ghostIdx % 5;
       ghostIdx++;
       e.setState('flooded');
      } else {
       e.dead = true;
      }
     }
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
   subtitle: 'Iniciativa internacional respaldada por la FAO y el Fondo para el Medio Ambiente Mundial (FMAM).',
   text: 'Argentina y Chile activaron la <strong>Estrategia Binacional de Manejo y Erradicación del Castor (ENEEI)</strong> con apoyo internacional para monitorear áreas piloto, colocar trampas de jaula y evitar que la especie invasora cruce a la Patagonia continental.',
   fact: 'Es uno de los proyectos binacionales de control de especies exóticas invasoras más complejos del planeta.',
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
  cabin.scale = 1.0;
  cabin.glowing = false;
  this.placedCabinEntity = cabin;
  this.entities.push(cabin);
  this.particles.burst(x, y - 20, 'wood', 14);

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

   // Paso 1: Hacer brillar primero la Cabaña
   if (this.placedCabinEntity) {
    this.placedCabinEntity.glowing = true;
   }

   this.ui.showEditorialNewsCard({
    title: '¡PUESTO DE CONTROL ENEEI INSTALADO!',
    subtitle: 'Cabaña, Cartel y Trampa Jaula desplegados.',
    text: 'Haz clic sobre la <strong>Cabaña Guardaparques</strong> (que parpadea en dorado) para enviar al guardaparques a su puesto de monitoreo.',
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

  this.damsCanBeDismantled = true;

  // Hacer brillar todos los diques activos en el mapa inundado
  this.entities.forEach(e => {
   if (e instanceof Dam && e.active) {
    e.glowing = true;
    e.hp = 5;
   }
  });

  this.ui.showEditorialNewsCard({
   title: ' DESMANTELAMIENTO MANUAL DE DIQUES',
   subtitle: 'Los diques en el mapa inundado han comenzado a brillar en dorado.',
   text: 'Haz clic repetidamente (5 veces) sobre cada dique resplandeciente para romper las estructuras de madera y permitir que la cuenca se drene progresivamente.',
   fact: 'La desobstrucción manual de represas devuelve el escurrimiento natural a los ríos fueguinos.',
   year: '2026',
   onAccept: () => {}
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
     title: ' PLANTACIÓN DE 10 BROTES COMPLETADA',
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

  // Los árboles fantasmas deben desaparecer cuando cambia el mapa a la etapa de restauración
  if (targetIdx >= 3) {
   this.entities.forEach(e => {
    if (e instanceof Tree && (e.state === 'dead' || e.state === 'flooded')) {
     e.dead = true;
    }
   });
  }
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
  if (!this.speedMultiplier || this.speedMultiplier === 1.0) {
   this.speedMultiplier = 2.0;
  } else if (this.speedMultiplier === 2.0) {
   this.speedMultiplier = 4.0;
  } else {
   this.speedMultiplier = 1.0;
  }
  return this.speedMultiplier;
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

 growAllSeedlingsToFullTrees() {
  const seedlings = this.entities.filter(el => el instanceof Seedling && !el.dead);
  if (seedlings.length === 0) return;

  seedlings.forEach(s => {
   s.glowing = false;
   s.canGrowToTree = false;
  });

  // Fase 1 (0s): Todos cambian a brote2.png simultáneamente con ráfaga de hojas
  seedlings.forEach(s => {
   s.growthStage = 1;
   s._refreshSprite();
   this.particles.burst(s.x, s.y - 12, 'leaf', 18);
  });

  // Fase 2 (0.8s): Todos cambian a brote3.png simultáneamente
  setTimeout(() => {
   seedlings.forEach(s => {
    s.growthStage = 2;
    s._refreshSprite();
    this.particles.burst(s.x, s.y - 18, 'leaf', 24);
   });
  }, 800);

  // Fase 3 (1.6s): Todos se transforman en Árboles Nativos maduros completos (Tree)
  setTimeout(() => {
   seedlings.forEach((s, idx) => {
    s.dead = true;
    const fullTree = new Tree(s.x, s.y, idx % 9);
    fullTree.scale = 0.85 + Math.random() * 0.35;
    this.entities.push(fullTree);
    this.particles.burst(s.x, s.y - 25, 'leaf', 30);
   });

   // Transición final: Mostrar las 2 ventanas emergentes del Final del Juego
   setTimeout(() => {
    this.showFinalGameEndingPopups();
   }, 1000);
  }, 1600);
 }

 showFinalGameEndingPopups() {
  // Popup 1: El retorno del bosque nativo
  this.ui.showEditorialNewsCard({
   title: ' EL RETORNO DEL BOSQUE NATIVO DE LENGA',
   subtitle: 'La cuenca fueguina recupera su esplendor boscoso ancestral.',
   text: 'Gracias a la remoción de las represas y a la reforestación activa con plantines protegidos, los brotes de Lenga han madurado en árboles autóctonos. El caudal del río se ha estabilizado y la fauna autóctona (pumas, guanacos, zorros colorados y pájaros carpinteros) retorna a su hábitat natural.',
   quote: 'Un bosque de Lenga maduro tarda siglos en consolidarse, pero la interrupción de la destrucción por castores permite su regeneración continua.',
   fact: 'La vegetación nativa restaurada fija miles de toneladas de carbono y previene la erosión del suelo.',
   year: '2026',
   centered: true,
   onAccept: () => {
    // Popup 2: 80 AÑOS DESPUÉS: LA LECCIÓN ECOLÓGICA DE TIERRA DEL FUEGO (FINAL)
    this.ui.showEditorialNewsCard({
     title: ' 80 AÑOS DESPUÉS: LA LECCIÓN ECOLÓGICA DE TIERRA DEL FUEGO',
     subtitle: '1946 - 2026: De la especie exótica invasora a la restauración del bosque subantártico.',
     text: 'La historia de los 20 castores introducidos en 1946 demuestra las consecuencias irreversibles que provoca la alteración humana de los ecosistemas australes. Este newsgame celebra el esfuerzo conjunto de biólogos, guardaparques y la comunidad fueguina por devolver la vida a la Patagonia.',
     quote: 'La conservación del medio ambiente exige ciencia, rigor y compromiso permanente. El futuro de nuestros bosques está en nuestras manos.',
     fact: 'Reportaje elaborado con datos oficiales de la Estrategia Binacional ENEEI, FAO, FMAM y Vistazo.',
     year: '2026',
     centered: true,
     onAccept: () => {
      // Mostrar la Tabla de Posiciones Final / Arcade High Scores
      this.ui.showArcadeLeaderboard(this.stats.health * 25 + 500);
     }
    });
   }
  });
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
   ctx.fillText('', targetX, bounceY);
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
