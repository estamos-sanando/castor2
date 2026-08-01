'use strict';
/* ============================================================
  UI.JS — Interfaz de Usuario con Minijuego Arcade de 60 FPS y High Scores Globales en Tiempo Real
  - Movimiento de aguja por requestAnimationFrame para máxima fluidez a 60 FPS
  - Captura de iniciales (3 letras, ej. ARG) como los juegos retro arcade de antes
  - Tabla de Clasificación Global High Scores en Tiempo Real
  ============================================================ */

class GameUI {
 constructor(game) {
  this.game = game;
  this.newsQueue = [];
  this.activeNews = null;
  this.tutorialVisible = true;
  this.arcadeScore = 0;
  this.timeLeft = 30;
  this.needlePos = 0;
  this.needleSpeed = 1.4; // velocidad de aguja
  this.needleDir = 1;
  this.animFrameId = null;
  this._initHUD();
  this._initTutorial();
  this._bindEvents();
 }

 _initHUD() {
  const hudHtml = `
   <div id="hud-right-sidebar">
    <div class="sidebar-top-brand">
     <h3 class="sidebar-game-title">PROYECTO CASTOR</h3>
    </div>

    <div class="sidebar-guide-box" id="sidebar-guide-box">
     <div class="guide-title">GUÍA DE JUEGO</div>
     <p class="guide-step">Presiona el botón <strong>LIBERAR CASTORES</strong> para comenzar la simulación.</p>
    </div>

    <div class="sidebar-section-title" id="sidebar-controls-title">CONTROLES</div>
    <div id="hud-controls-vertical">
     <button class="hud-speed-btn" id="btn-speed-toggle" title="Cambiar Velocidad (1x / 2x)">
      <span class="speed-icon">VELOCIDAD:</span>
      <span class="speed-val" id="speed-val">1x</span>
     </button>
     
     <div class="central-beaver-btn-wrapper" id="beaver-btn-wrapper">
      <button class="pure-image-btn" id="btn-add-beaver" title="LIBERAR 20 CASTORES (1946)">
       <img src="assets/BOTON.png" alt="Agregar Castores" />
      </button>
     </div>
    </div>
   </div>
  `;

  const hudContainer = document.createElement('div');
  hudContainer.id = 'hud-container';
  hudContainer.innerHTML = hudHtml;
  document.getElementById('game-container').appendChild(hudContainer);

  this.newsContainer = document.createElement('div');
  this.newsContainer.id = 'news-container';
  document.getElementById('game-container').appendChild(this.newsContainer);
 }

 onBeaversReleased() {
  const sidebar = document.getElementById('hud-right-sidebar');
  if (sidebar) {
   sidebar.classList.add('beavers-released');
  }
 }

 _initTutorial() {
  this.tutorialEl = document.createElement('div');
  this.tutorialEl.id = 'tutorial-overlay';
  this.tutorialEl.innerHTML = `
   <div class="game-popup-modal centered-welcome-window initial-start-modal">
    <div class="initial-start-logo-wrapper">
     <img src="assets/LOGO.png" class="welcome-start-logo-large" alt="Logo Proyecto Castor" />
    </div>
    <div class="popup-modal-header">
     <span class="popup-year-badge">1946 — Tierra del Fuego</span>
    </div>
    
    <div class="popup-modal-body">
     <h2 class="popup-headline">¿Cómo una decisión tomada hace 80 años transformó un ecosistema?</h2>
     
     <div class="popup-text-content">
      <p class="popup-lead">En 1946 se introdujeron veinte castores provenientes de Canadá en Tierra del Fuego con el objetivo de impulsar una industria peletera. Lo que parecía una iniciativa económica terminó generando cambios ambientales que aún hoy siguen presentes.</p>
     </div>

     <div class="popup-footer center-footer">
      <button class="popup-start-btn start-game-btn-large" id="btn-start-game">COMENZAR A JUGAR ➔</button>
     </div>
    </div>
   </div>
  `;
  document.getElementById('game-container').appendChild(this.tutorialEl);
 }

 _bindEvents() {
  document.getElementById('btn-start-game')?.addEventListener('click', () => {
   this.tutorialEl.classList.add('fade-out');
   setTimeout(() => {
    this.tutorialEl.style.display = 'none';
    this.tutorialVisible = false;
    this.game.start();
   }, 400);
  });

  document.getElementById('btn-add-beaver')?.addEventListener('click', () => {
   this.game.releaseAll20BeaversAtOnce();
  });

  document.getElementById('btn-speed-toggle')?.addEventListener('click', (e) => {
   const btn = e.currentTarget;
   const speed = this.game.toggleSpeed();
   const txt = document.getElementById('speed-val');
   if (txt) txt.textContent = `${speed}x`;
   btn.classList.remove('active-2x', 'active-4x');
   if (speed === 2.0) {
    btn.classList.add('active-2x');
   } else if (speed === 4.0) {
    btn.classList.add('active-4x');
   }
  });

  // Tecla Espacio para el minijuego de zona verde
  window.addEventListener('keydown', (e) => {
   if (e.code === 'Space' && this.game.minigameActive) {
    e.preventDefault();
    this._triggerTimingCatch();
   }
  });
 }

 // ── Tarjeta Emergente Periodística ──
 showEditorialNewsCard(opts) {
  if (document.querySelector('.left-center-news-popup') || document.querySelector('.centered-news-overlay') || document.querySelector('.game-instruction-notification-wrapper')) {
   this.newsQueue.push(opts);
   return;
  }

  if (opts && opts.fact && opts.fact.includes('100.000')) {
   if (this.game && typeof this.game.addExtra20Beavers === 'function') {
    this.game.addExtra20Beavers();
   }
  }

  // 1. Tarjeta Final de Cierre del Juego ("80 AÑOS DESPUÉS")
  if (opts && (opts.isFinal || (opts.title && opts.title.includes('80 AÑOS DESPUÉS')))) {
   const overlayEl = document.createElement('div');
   overlayEl.className = 'centered-news-overlay theme-victory';
   overlayEl.innerHTML = `
    <div class="game-popup-modal centered-welcome-window final-victory-modal theme-success">
     <div class="initial-start-logo-wrapper" style="margin-bottom: 8px;">
      <img src="assets/LOGO.png" class="welcome-start-logo-large" style="height: 85px;" alt="Logo Proyecto Castor" />
     </div>

     <div class="popup-modal-header">
      <span class="popup-category-stamp" style="background: rgba(16, 185, 129, 0.25); color: #6ee7b7; border-color: #10b981;">FIN DEL JUEGO</span>
      <span class="popup-year-badge">1946 — 2026</span>
     </div>
     
     <div class="popup-modal-body">
      <h2 class="popup-headline" style="color: #6ee7b7; font-size: clamp(17px, 2.8vw, 21px);">${opts.title}</h2>
      ${opts.subtitle ? `<div class="popup-subhead">${opts.subtitle}</div>` : ''}
      
      <div class="popup-text-content">
       <p class="popup-lead">${opts.text}</p>
       ${opts.quote ? `<blockquote class="popup-quote final-reflection-quote"><span class="quote-mark">“</span>${opts.quote}<span class="quote-mark">”</span></blockquote>` : ''}
      </div>

      <div class="popup-footer center-footer" style="margin-top: 20px;">
       <button class="popup-action-btn start-game-btn-large restart-game-btn" id="btn-restart-game">
        REINICIAR JUEGO ↻
       </button>
      </div>
     </div>
    </div>
   `;
   document.getElementById('game-container').appendChild(overlayEl);

   if (this.game) this.game.running = false;

   overlayEl.querySelector('#btn-restart-game')?.addEventListener('click', () => {
    window.location.reload();
   });
   return;
  }

  // 2. Notificación Flotante Superior (Instrucciones)
  const isInstruction = opts && (opts.isInstruction || opts.type === 'instruction' || (opts.text && (opts.text.toLowerCase().includes('haz clic') || opts.text.toLowerCase().includes('toca o haz clic'))));

  if (isInstruction && !opts.centered) {
   const notifEl = document.createElement('div');
   notifEl.className = 'game-instruction-notification-wrapper';
   notifEl.innerHTML = `
    <div class="game-instruction-notification-card">
     <div class="instruction-badge-bar">
      <span class="instruction-pill-badge"><span class="badge-icon"></span> TIERRA DEL FUEGO — ${opts.year || 'ENEEI'}</span>
     </div>
     <div class="instruction-content">
      <h3 class="instruction-title">${opts.title}</h3>
      ${opts.subtitle ? `<div class="instruction-subtitle">${opts.subtitle}</div>` : ''}
      <div class="instruction-text">${opts.text}</div>
     </div>
     <div class="instruction-footer">
      <button class="instruction-action-btn" id="btn-close-instruction">ACEPTAR ➔</button>
     </div>
    </div>
   `;
   document.getElementById('game-container').appendChild(notifEl);

   if (this.game) this.game.running = true;

   const closeFn = () => {
    notifEl.classList.add('slide-out-top');
    setTimeout(() => {
     if (notifEl.parentNode) notifEl.remove();
     if (typeof opts.onAccept === 'function') {
      opts.onAccept();
     }
     if (this.newsQueue.length > 0) {
      const nextOpts = this.newsQueue.shift();
      this.showEditorialNewsCard(nextOpts);
     }
    }, 300);
   };

   notifEl.querySelector('#btn-close-instruction')?.addEventListener('click', closeFn);
   return;
  }

  // 3. Ventana Emergente Centrada (Ej: Introducción 1946, Inundación, Restauración)
  if (opts && opts.centered) {
   let themeClass = opts.theme ? `theme-${opts.theme}` : (opts.bluish ? 'theme-danger' : 'theme-info');
   let categoryStamp = ' REPORTE HISTÓRICO';
   if (themeClass.includes('danger') || opts.bluish) categoryStamp = ' CATÁSTROFE AMBIENTAL';
   else if (themeClass.includes('warning')) categoryStamp = ' IMPACTO ECOLÓGICO';
   else if (themeClass.includes('success')) categoryStamp = ' RESTAURACIÓN NATIVA';

   const overlayEl = document.createElement('div');
   overlayEl.className = `centered-news-overlay ${themeClass}`;
   overlayEl.innerHTML = `
    <div class="game-popup-modal centered-welcome-window ${themeClass}">
     <div class="popup-modal-header">
      <span class="popup-category-stamp">${categoryStamp}</span>
      <span class="popup-year-badge">TIERRA DEL FUEGO — ${opts.year || '2005'}</span>
     </div>
     
     <div class="popup-modal-body">
      <h2 class="popup-headline">${opts.title}</h2>
      ${opts.subtitle ? `<div class="popup-subhead">${opts.subtitle}</div>` : ''}
      
      <div class="popup-text-content">
       <p class="popup-lead">${opts.text}</p>
       ${opts.quote ? `<blockquote class="popup-quote"><span class="quote-mark">“</span>${opts.quote}<span class="quote-mark">”</span></blockquote>` : ''}
       ${opts.fact ? `<div class="popup-fact-box"><div class="fact-box-title"> DATO DESTACADO</div><div class="fact-box-body">${opts.fact}</div></div>` : ''}
      </div>

      <div class="popup-footer">
       <button class="popup-action-btn" id="btn-close-journal">ACEPTAR ➔</button>
      </div>
     </div>
    </div>
   `;
   document.getElementById('game-container').appendChild(overlayEl);

   if (this.game) this.game.running = true;

   const closeFn = () => {
    overlayEl.classList.add('fade-out');
    setTimeout(() => {
     if (overlayEl.parentNode) overlayEl.remove();
     if (typeof opts.onAccept === 'function') {
      opts.onAccept();
     }
     if (this.newsQueue.length > 0) {
      const nextOpts = this.newsQueue.shift();
      this.showEditorialNewsCard(nextOpts);
     }
    }, 350);
   };

   overlayEl.querySelector('#btn-close-journal')?.addEventListener('click', closeFn);
   return;
  }

  // 4. Tarjeta Lateral (Default)
  let themeClass = opts.theme ? `theme-${opts.theme}` : 'theme-info';
  let categoryStamp = ' REPORTE HISTÓRICO';
  if (themeClass.includes('danger')) categoryStamp = ' CATÁSTROFE AMBIENTAL';
  else if (themeClass.includes('warning')) categoryStamp = ' IMPACTO ECOLÓGICO';
  else if (themeClass.includes('success')) categoryStamp = ' RESTAURACIÓN NATIVA';

  const cardEl = document.createElement('div');
  cardEl.className = `left-center-news-popup ${themeClass}`;
  cardEl.innerHTML = `
   <div class="game-popup-modal left-center-card ${themeClass}">
    <div class="popup-modal-header">
     <span class="popup-category-stamp">${categoryStamp}</span>
     <span class="popup-year-badge">TIERRA DEL FUEGO — ${opts.year || '1946'}</span>
    </div>
    
    <div class="popup-modal-body">
     <h2 class="popup-headline">${opts.title}</h2>
     ${opts.subtitle ? `<div class="popup-subhead">${opts.subtitle}</div>` : ''}
     
     <div class="popup-text-content">
      <p class="popup-lead">${opts.text}</p>
      ${opts.quote ? `<blockquote class="popup-quote"><span class="quote-mark">“</span>${opts.quote}<span class="quote-mark">”</span></blockquote>` : ''}
      ${opts.fact ? `<div class="popup-fact-box"><div class="fact-box-title"> DATO DESTACADO</div><div class="fact-box-body">${opts.fact}</div></div>` : ''}
     </div>

     <div class="popup-footer">
      <button class="popup-action-btn" id="btn-close-journal">ACEPTAR ➔</button>
     </div>
    </div>
   </div>
  `;
  document.getElementById('game-container').appendChild(cardEl);

  if (this.game) this.game.running = true;

  const closeFn = () => {
   cardEl.classList.add('slide-out-left');
   setTimeout(() => {
    if (cardEl.parentNode) cardEl.remove();
    if (typeof opts.onAccept === 'function') {
     opts.onAccept();
    }
    if (this.newsQueue.length > 0) {
     const nextOpts = this.newsQueue.shift();
     this.showEditorialNewsCard(nextOpts);
    }
   }, 350);
  };

  cardEl.querySelector('#btn-close-journal')?.addEventListener('click', closeFn);
 }

 // ── Ventana Lateral Izquierda de Inventario con Drag & Drop ──
 showCabinInventory() {
  if (document.getElementById('eneei-sidebar-panel')) return;

  const sidebar = document.createElement('div');
  sidebar.id = 'eneei-sidebar-panel';
  sidebar.innerHTML = `
   <div class="sidebar-card">
    <div class="sidebar-header">
     <h4>PUESTO DE CONTROL ENEEI</h4>
    </div>
    <p class="sidebar-desc"><strong>ARRASTRA Y SUELTA</strong> los 3 elementos en el terreno para instalarlos:</p>
    
    <div class="sidebar-items">
     <div class="sidebar-item draggable-item" id="item-cabin" draggable="true" data-type="cabin">
      <div class="item-preview">
       <img src="assets/cabana.png" alt="Cabaña" class="sidebar-img" />
      </div>
      <div class="item-info">
       <span class="item-title">1. Cabaña Guardaparques</span>
       <span class="item-status" id="status-cabin">Arrastrar o Clic</span>
      </div>
     </div>

     <div class="sidebar-item draggable-item" id="item-sign" draggable="true" data-type="sign">
      <div class="item-preview">
       <img src="assets/cartel.png" alt="Cartel" class="sidebar-img" />
      </div>
      <div class="item-info">
       <span class="item-title">2. Cartel Informativo</span>
       <span class="item-status" id="status-sign">Arrastrar o Clic</span>
      </div>
     </div>

     <div class="sidebar-item draggable-item" id="item-cage" draggable="true" data-type="cage">
      <div class="item-preview">
       <img src="assets/Jaulacastor.png" alt="Trampa Jaula" class="sidebar-img" />
      </div>
      <div class="item-info">
       <span class="item-title">3. Trampa Jaula</span>
       <span class="item-status" id="status-cage">Arrastrar o Clic</span>
      </div>
     </div>
    </div>
   </div>
  `;
  document.getElementById('game-container').appendChild(sidebar);

  this._setupDragAndDrop();
 }

 showReforestSeedlingInventory() {
  this.closeSidebarPanel();

  const sidebar = document.createElement('div');
  sidebar.id = 'eneei-sidebar-panel';
  sidebar.innerHTML = `
   <div class="sidebar-card">
    <div class="sidebar-header">
     <h4>REFORESTACIÓN NATIVA</h4>
    </div>
    <p class="sidebar-desc"><strong>ARRASTRA Y SUELTA</strong> los 10 plantines de Lenga en el terreno para iniciar la reforestación:</p>

    <div class="sidebar-items">
     <div class="sidebar-item draggable-item" id="item-seedling-brote" draggable="true" data-type="seedling">
      <div class="item-preview">
       <img src="assets/brote1.png" alt="Brote de Lenga" class="sidebar-img" style="max-height: 48px;" />
      </div>
      <div class="item-info">
       <span class="item-title">Plantín de Lenga Nativa</span>
       <span class="item-status" id="status-seedling-count" style="color: #69f0ae; font-weight: 700;">0 / 10 Colocados</span>
      </div>
     </div>
    </div>
   </div>
  `;
  document.getElementById('game-container').appendChild(sidebar);

  this._setupReforestSeedlingDragAndDrop();
 }

 onSeedlingPlacedFromInventory(placedCount) {
  const statusEl = document.getElementById('status-seedling-count');
  if (statusEl) {
   statusEl.textContent = `${placedCount} / 10 Colocados`;
   statusEl.style.color = placedCount >= 10 ? '#22c55e' : '#69f0ae';
  }
 }

 _setupReforestSeedlingDragAndDrop() {
  const canvas = document.getElementById('game-canvas');
  const seedlingItem = document.getElementById('item-seedling-brote');
  if (!canvas || !seedlingItem) return;

  const getCanvasCoords = (clientX, clientY) => {
   const rect = canvas.getBoundingClientRect();
   const scaleX = 1280 / rect.width;
   const scaleY = 720 / rect.height;
   const x = Math.round((clientX - rect.left) * scaleX);
   const y = Math.round((clientY - rect.top) * scaleY);
   return { x: Math.max(60, Math.min(1220, x)), y: Math.max(100, Math.min(670, y)) };
  };

  seedlingItem.addEventListener('dragstart', (e) => {
   if ((this.game.placedSeedlingsCount || 0) >= 10) {
    e.preventDefault();
    return;
   }
   e.dataTransfer.setData('text/plain', 'seedling');
  });

  const onDragOver = (e) => {
   if ((this.game.placedSeedlingsCount || 0) < 10) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
   }
  };
  canvas.addEventListener('dragover', onDragOver);

  const onDrop = (e) => {
   const type = e.dataTransfer.getData('text/plain');
   if (type === 'seedling' && (this.game.placedSeedlingsCount || 0) < 10) {
    e.preventDefault();
    const coords = getCanvasCoords(e.clientX, e.clientY);
    this.game.placeSeedlingFromInventory(coords.x, coords.y);
   }
  };
  canvas.addEventListener('drop', onDrop);

  let activePlacement = false;
  seedlingItem.addEventListener('click', () => {
   if ((this.game.placedSeedlingsCount || 0) >= 10) return;
   activePlacement = true;
   canvas.style.cursor = 'crosshair';
  });

  const onClickCanvas = (e) => {
   if (activePlacement && (this.game.placedSeedlingsCount || 0) < 10) {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    this.game.placeSeedlingFromInventory(coords.x, coords.y);
    if ((this.game.placedSeedlingsCount || 0) >= 10) {
     activePlacement = false;
     canvas.style.cursor = 'default';
    }
   }
  };
  canvas.addEventListener('click', onClickCanvas);
 }

 _setupDragAndDrop() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const cabinItem = document.getElementById('item-cabin');
  const signItem = document.getElementById('item-sign');
  const cageItem = document.getElementById('item-cage');

  const getCanvasCoords = (clientX, clientY) => {
   const rect = canvas.getBoundingClientRect();
   const scaleX = 1280 / rect.width;
   const scaleY = 720 / rect.height;
   const x = Math.round((clientX - rect.left) * scaleX);
   const y = Math.round((clientY - rect.top) * scaleY);
   return { x: Math.max(60, Math.min(1220, x)), y: Math.max(100, Math.min(670, y)) };
  };

  [cabinItem, signItem, cageItem].forEach(item => {
   if (!item) return;

   item.addEventListener('dragstart', (e) => {
    const type = item.getAttribute('data-type');
    if ((type === 'cabin' && this.game.cabinPlaced) ||
      (type === 'sign' && this.game.signPlaced) ||
      (type === 'cage' && this.game.cagePlaced)) {
     e.preventDefault();
     return;
    }
    e.dataTransfer.setData('text/plain', type);
   });
  });

  canvas.addEventListener('dragover', (e) => {
   e.preventDefault();
   e.dataTransfer.dropEffect = 'copy';
  });

  canvas.addEventListener('drop', (e) => {
   e.preventDefault();
   const type = e.dataTransfer.getData('text/plain');
   const coords = getCanvasCoords(e.clientX, e.clientY);

   if (type === 'cabin' && !this.game.cabinPlaced) {
    this.game.placeCabin(coords.x, coords.y);
    const statusCabin = document.getElementById('status-cabin');
    if (statusCabin) {
     statusCabin.textContent = 'Instalado';
     statusCabin.style.color = '#22c55e';
    }
    cabinItem?.classList.add('installed');
   } else if (type === 'sign' && !this.game.signPlaced) {
    this.game.placeSign(coords.x, coords.y);
    const statusSign = document.getElementById('status-sign');
    if (statusSign) {
     statusSign.textContent = 'Instalado';
     statusSign.style.color = '#22c55e';
    }
    signItem?.classList.add('installed');
   } else if (type === 'cage' && !this.game.cagePlaced) {
    this.game.placeCage(coords.x, coords.y);
    const statusCage = document.getElementById('status-cage');
    if (statusCage) {
     statusCage.textContent = 'Instalado';
     statusCage.style.color = '#22c55e';
    }
    cageItem?.classList.add('installed');
   }
  });

  let activeType = null;

  [cabinItem, signItem, cageItem].forEach(item => {
   if (!item) return;

   item.addEventListener('click', () => {
    const type = item.getAttribute('data-type');
    if ((type === 'cabin' && this.game.cabinPlaced) ||
      (type === 'sign' && this.game.signPlaced) ||
      (type === 'cage' && this.game.cagePlaced)) return;

    if (activeType === type) {
     activeType = null;
     item.style.borderColor = 'rgba(212, 175, 55, 0.6)';
     item.style.background = 'rgba(255, 255, 255, 0.06)';
    } else {
     activeType = type;
     [cabinItem, signItem, cageItem].forEach(i => {
      if (i) {
       i.style.borderColor = 'rgba(212, 175, 55, 0.6)';
       i.style.background = 'rgba(255, 255, 255, 0.06)';
      }
     });

     item.style.borderColor = '#22c55e';
     item.style.background = 'rgba(34, 197, 94, 0.2)';
    }
   });
  });

  canvas.addEventListener('click', (e) => {
   if (!activeType) return;
   const coords = getCanvasCoords(e.clientX, e.clientY);

   if (activeType === 'cabin' && !this.game.cabinPlaced) {
    this.game.placeCabin(coords.x, coords.y);
    const statusCabin = document.getElementById('status-cabin');
    if (statusCabin) {
     statusCabin.textContent = 'Instalado';
     statusCabin.style.color = '#22c55e';
    }
    cabinItem?.classList.add('installed');
    activeType = null;
   } else if (activeType === 'sign' && !this.game.signPlaced) {
    this.game.placeSign(coords.x, coords.y);
    const statusSign = document.getElementById('status-sign');
    if (statusSign) {
     statusSign.textContent = 'Instalado';
     statusSign.style.color = '#22c55e';
    }
    signItem?.classList.add('installed');
    activeType = null;
   } else if (activeType === 'cage' && !this.game.cagePlaced) {
    this.game.placeCage(coords.x, coords.y);
    const statusCage = document.getElementById('status-cage');
    if (statusCage) {
     statusCage.textContent = 'Instalado';
     statusCage.style.color = '#22c55e';
    }
    cageItem?.classList.add('installed');
    activeType = null;
   }
  });
 }

 closeSidebarPanel() {
  const sidebar = document.getElementById('eneei-sidebar-panel');
  if (sidebar) {
   sidebar.classList.add('fade-out');
   setTimeout(() => sidebar.remove(), 400);
  }
 }

 // ── Minijuego Arcade de Precisión en ZONA VERDE (60 FPS) ──
 openBeaverCatcherMinigame() {
  if (document.getElementById('beaver-catcher-panel')) return;

  this.arcadeScore = 0;
  this.timeLeft = 30;
  this.needlePos = 0;
  this.needleSpeed = 1.4;
  this.needleDir = 1;

  const panel = document.createElement('div');
  panel.id = 'beaver-catcher-panel';
  panel.innerHTML = `
   <div class="sidebar-card catcher-card arcade-theme-card">
    <div class="catcher-badge-bar">
     <span class="catcher-pill-badge"> MINIJUEGO ENEEI</span>
     <span class="catcher-step-tag">2016</span>
    </div>
    <div class="sidebar-header">
     <h4>CONTROL PRECISIÓN EN ZONA VERDE</h4>
    </div>
    <p class="sidebar-desc">Presiona <strong>ESPACIO</strong> o el botón cuando la aguja esté en la <strong>ZONA VERDE</strong> para sumar puntos y capturar castores.</p>
    
    <div class="catcher-stats-grid">
     <div class="catcher-stat-box">
      <span class="stat-lbl">TIEMPO</span>
      <span class="stat-val timer-val" id="minigame-timer">0:30</span>
     </div>

     <div class="catcher-stat-box">
      <span class="stat-lbl">PUNTAJE</span>
      <span class="stat-val score-val" id="minigame-score">0 PTS</span>
     </div>
    </div>

    <div class="precision-bar-box">
     <div class="precision-bar-track">
      <div class="precision-green-zone"></div>
      <div class="precision-needle" id="precision-needle"></div>
     </div>
     <div class="precision-feedback-lbl" id="precision-feedback">¡PRESIONA EN LA ZONA VERDE!</div>
    </div>

    <button class="popup-action-btn arcade-action-btn" id="btn-timing-catch">
     CAPTURAR ( ESPACIO )
    </button>
   </div>
  `;
  document.getElementById('game-container').appendChild(panel);

  this.game.minigameActive = true;

  // Loop ultra fluido de movimiento de aguja a 60 FPS
  const updateNeedle = () => {
   if (!this.game.minigameActive) return;

   this.needlePos += this.needleSpeed * this.needleDir;
   if (this.needlePos >= 95) {
    this.needlePos = 95;
    this.needleDir = -1;
   } else if (this.needlePos <= 0) {
    this.needlePos = 0;
    this.needleDir = 1;
   }

   const needleEl = document.getElementById('precision-needle');
   if (needleEl) {
    needleEl.style.left = `${this.needlePos}%`;
   }

   this.animFrameId = requestAnimationFrame(updateNeedle);
  };
  this.animFrameId = requestAnimationFrame(updateNeedle);

  // Contador regresivo de 30s
  if (this._minigameTimerInt) clearInterval(this._minigameTimerInt);
  this._minigameTimerInt = setInterval(() => {
   this.timeLeft--;
   const timerEl = document.getElementById('minigame-timer');
   if (timerEl) {
    const secs = this.timeLeft < 10 ? `0${this.timeLeft}` : `${this.timeLeft}`;
    timerEl.textContent = `0:${secs}`;
   }

   if (this.timeLeft <= 0) {
    this.finishBeaverCatcherMinigame();
   }
  }, 1000);

  document.getElementById('btn-timing-catch')?.addEventListener('click', () => {
   this._triggerTimingCatch();
  });
 }

 _triggerTimingCatch() {
  if (!this.game.minigameActive) return;

  const pos = this.needlePos;
  const feedbackEl = document.getElementById('precision-feedback');
  const scoreEl = document.getElementById('minigame-score');
  const needleEl = document.getElementById('precision-needle');

  let ptsAdded = 0;
  if (pos >= 38 && pos <= 66) {
   ptsAdded = 100;
   if (feedbackEl) {
    feedbackEl.textContent = '¡PERFECTO! +100 PTS';
    feedbackEl.className = 'precision-feedback-lbl perfect';
   }
   if (needleEl) {
    needleEl.classList.add('hit-green');
    setTimeout(() => needleEl.classList.remove('hit-green'), 300);
   }
  } else if (pos >= 28 && pos <= 76) {
   ptsAdded = 50;
   if (feedbackEl) {
    feedbackEl.textContent = '¡BUENO! +50 PTS';
    feedbackEl.className = 'precision-feedback-lbl good';
   }
  } else {
   ptsAdded = 0;
   if (feedbackEl) {
    feedbackEl.textContent = '¡FALLO! 0 PTS';
    feedbackEl.className = 'precision-feedback-lbl miss';
   }
   if (needleEl) {
    needleEl.classList.add('hit-miss');
    setTimeout(() => needleEl.classList.remove('hit-miss'), 300);
   }
  }

  if (ptsAdded > 0) {
   this.arcadeScore += ptsAdded;
   if (scoreEl) scoreEl.textContent = `${this.arcadeScore} PTS`;

   // Los castores NO desaparecen durante el juego (se mantienen en pantalla)
   const beaver = this.game.entities.find(b => b instanceof Beaver && !b.dead);
   if (beaver) {
    this.game.particles.burst(beaver.x, beaver.y - 15, 'leaf', 18);
    this.game.stats.beavers = Math.max(0, this.game.stats.beavers - 1);
   }
  }
 }

 finishBeaverCatcherMinigame() {
  if (this._minigameTimerInt) clearInterval(this._minigameTimerInt);
  if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

  this.game.minigameActive = false;

  const panel = document.getElementById('beaver-catcher-panel');
  if (panel) {
   panel.classList.add('fade-out');
   setTimeout(() => panel.remove(), 400);
  }

  // Los castores desaparecen al finalizar el minijuego
  this.game.entities.forEach(e => {
   if (e instanceof Beaver) e.dead = true;
  });

  this.game.beaversCaptured = true;
  this.game.damsCanBeDismantled = true;

  // Activar resplandor dorado en los diques
  this.game.entities.forEach(e => {
   if (e instanceof Dam) e.glowing = true;
  });

  // Abrir la ventana con el GIF animado de captura (SIN TÍTULO)
  const gifOverlay = document.createElement('div');
  gifOverlay.id = 'capture-gif-overlay';
  gifOverlay.className = 'centered-news-overlay theme-success';
  gifOverlay.innerHTML = `
   <div class="game-popup-modal capture-gif-modal theme-success">
    <div class="capture-gif-container">
     <img src="assets/captura.gif" alt="Registro de campo" class="capture-gif-img" />
    </div>
    <div class="popup-footer center-footer">
     <button class="popup-action-btn start-game-btn-large" id="btn-close-gif-modal">
      CONTINUAR AL DESMANTELAMIENTO DE DIQUES ➔
     </button>
    </div>
   </div>
  `;
  document.getElementById('game-container').appendChild(gifOverlay);

  if (this.game) this.game.running = true;

  gifOverlay.querySelector('#btn-close-gif-modal')?.addEventListener('click', () => {
   gifOverlay.classList.add('fade-out');
   setTimeout(() => {
    if (gifOverlay.parentNode) gifOverlay.remove();
    this.showEditorialNewsCard({
     title: ' DESMANTELAMIENTO DE REPRESAS',
     subtitle: 'Haz clic o toca 5 veces sobre cada dique para desarmarlo.',
     text: 'Los diques de castores están parpadeando en la cuenca. Toca o haz clic reiteradamente sobre cada represa para desarmar los troncos acumulados y liberar el agua estancada.',
     year: '2026'
    });
   }, 300);
  });
 }

 // ── Tabla de Clasificación Retro Arcade (Ingreso de Iniciales + High Scores Globales) ──
 showArcadeLeaderboard(finalScore) {
  const overlay = document.createElement('div');
  overlay.className = 'centered-news-overlay';
  overlay.id = 'arcade-leaderboard-overlay';
  overlay.innerHTML = `
   <div class="game-popup-modal centered-welcome-window arcade-leaderboard-modal">
    <div class="popup-modal-header">
     <span class="popup-year-badge">HIGH SCORES EN TIEMPO REAL</span>
    </div>
    
    <div class="popup-modal-body">
     <h2 class="popup-headline">REGISTRA TU SCORE Y COMPITE EN VIVO</h2>
     <div class="popup-subhead">¡Tu puntaje actual es de <strong style="color: #22c55e;">${finalScore} PTS</strong>!</div>
     
     <div class="arcade-name-entry-box">
      <label class="entry-label">INGRESA TUS INICIALES (3 LETRAS):</label>
      <div class="initials-input-group">
       <input type="text" id="arcade-initials-input" maxlength="3" value="ARG" autocomplete="off" />
       <button class="popup-action-btn" id="btn-save-score">GUARDAR ➔</button>
      </div>
     </div>

     <div class="leaderboard-table-container" id="leaderboard-table-content">
      <div class="leaderboard-loading">Cargando clasificación global en tiempo real...</div>
     </div>

     <div class="popup-footer">
      <button class="popup-action-btn" id="btn-close-leaderboard" style="display: none;">CONTINUAR ➔</button>
     </div>
    </div>
   </div>
  `;
  document.getElementById('game-container').appendChild(overlay);

  const API_URL = 'https://jsonblob.com/api/jsonBlob/019fb1cb-2a65-7ffe-853b-000ca0154f88';

  const defaultList = [
   { name: 'ENE', score: 1400 },
   { name: 'FAO', score: 1100 },
   { name: 'FMA', score: 850 },
   { name: 'TDF', score: 600 }
  ];

  const loadAndRenderLeaderboard = async () => {
   const tableEl = document.getElementById('leaderboard-table-content');
   let scores = defaultList;

   try {
    const res = await fetch(API_URL);
    if (res.ok) {
     const data = await res.json();
     if (Array.isArray(data) && data.length > 0) {
      scores = data;
     }
    }
   } catch (err) {
    console.warn('Usando respaldo local para tabla global:', err);
    let saved = localStorage.getItem('castor_arcade_highscores_v2');
    if (saved) scores = JSON.parse(saved);
   }

   scores.sort((a, b) => b.score - a.score);
   const top8 = scores.slice(0, 8);

   if (tableEl) {
    tableEl.innerHTML = top8.map((entry, idx) => {
     const isPlayer = entry.score === finalScore;
     return `
      <div class="leaderboard-row ${isPlayer ? 'player-row' : ''}">
       <span class="rank-num">#${idx + 1}</span>
       <span class="player-name">${entry.name}</span>
       <span class="player-score">${entry.score} PTS</span>
      </div>
     `;
    }).join('');
   }
  };

  loadAndRenderLeaderboard();

  document.getElementById('btn-save-score')?.addEventListener('click', async () => {
   const inputEl = document.getElementById('arcade-initials-input');
   const initials = (inputEl?.value || 'AAA').toUpperCase().slice(0, 3);
   const btn = document.getElementById('btn-save-score');
   if (btn) btn.disabled = true;

   let scores = defaultList;
   try {
    const res = await fetch(API_URL);
    if (res.ok) {
     const data = await res.json();
     if (Array.isArray(data)) scores = data;
    }
   } catch (e) {}

   scores.push({ name: initials, score: finalScore });
   scores.sort((a, b) => b.score - a.score);

   try {
    await fetch(API_URL, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(scores)
    });
   } catch (e) {
    console.warn('Error publicando en la nube:', e);
   }

   try {
    localStorage.setItem('castor_arcade_highscores_v2', JSON.stringify(scores));
   } catch(e) {}

   await loadAndRenderLeaderboard();

   const entryBox = document.querySelector('.arcade-name-entry-box');
   if (entryBox) {
    entryBox.innerHTML = `<div class="score-saved-badge">¡HIGH SCORE PUBLICADO GLOBALMENTE COMO <strong>${initials}</strong>!</div>`;
   }

   const closeBtn = document.getElementById('btn-close-leaderboard');
   if (closeBtn) closeBtn.style.display = 'inline-block';
  });

  document.getElementById('btn-close-leaderboard')?.addEventListener('click', () => {
   overlay.classList.add('fade-out');
   setTimeout(() => {
    overlay.remove();
    this.playCapturaVideoOverlay(() => {
     // Dejar únicamente 4 castores en el mapa
     const activeBeavers = this.game.entities.filter(e => e instanceof Beaver && !e.dead);
     activeBeavers.forEach((b, idx) => {
      if (idx >= 4) {
       b.dead = true;
      }
     });

     this.game.restoreEcosystem();
    });
   }, 400);
  });
 }

 playCapturaVideoOverlay(onComplete) {
  const existing = document.getElementById('captura-video-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'captura-video-overlay';
  overlay.style.cssText = `
   position: fixed;
   inset: 0;
   z-index: 99999;
   background: rgba(0, 0, 0, 0.95);
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   animation: fadeIn 0.4s ease;
   backdrop-filter: blur(10px);
  `;

  overlay.innerHTML = `
   <div style="position: relative; width: 90%; max-width: 820px; border: 2.5px solid var(--gold); border-radius: 16px; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.9), 0 0 25px rgba(212,175,55,0.4); background: #000;">
    <video id="captura-mp4-video" src="assets/captura.mp4" autoplay playsinline style="width: 100%; height: auto; max-height: 75vh; object-fit: contain; display: block;"></video>
    <button id="btn-skip-captura-video" class="popup-action-btn arcade-action-btn green-btn" style="position: absolute; bottom: 20px; right: 20px; z-index: 10; padding: 10px 24px; font-weight: 700; box-shadow: 0 4px 15px rgba(0,0,0,0.8);">CONTINUAR ➔</button>
   </div>
  `;

  document.body.appendChild(overlay);

  const video = document.getElementById('captura-mp4-video');
  const closeOverlay = () => {
   overlay.style.transition = 'opacity 0.4s ease';
   overlay.style.opacity = '0';
   setTimeout(() => {
    overlay.remove();
    if (typeof onComplete === 'function') onComplete();
   }, 400);
  };

  if (video) {
   video.addEventListener('ended', closeOverlay);
  }

  document.getElementById('btn-skip-captura-video')?.addEventListener('click', closeOverlay);
 }

 update(stats, year, timelinePct) {}

 showNews(opts) {
  this.showEditorialNewsCard(opts);
 }

 // ── MINIJUEGO "REFORESTACIÓN DE LENGA" (4 PASOS INTERACTIVOS) ──
 openReforestationMinigame(targetSeedling) {
  if (this.game.reforestMinigamePlayed || document.getElementById('reforestation-minigame-panel')) return;

  this.reforestSeedling = targetSeedling;
  this.reforestProgress = 0;
  this.reforestStep = 1;
  this.mallaInstalled = false;
  this.reforestActive = true;

  const panel = document.createElement('div');
  panel.id = 'reforestation-minigame-panel';
  panel.innerHTML = `
   <div class="sidebar-card reforest-card arcade-theme-card">
    <div class="sidebar-header reforest-header">
     <h4>REFORESTACIÓN NATIVA</h4>
     <span class="reforest-step-tag" id="reforest-step-tag">PASO 1 DE 4</span>
    </div>

    <div class="survival-status-box">
     <div class="survival-info">
      <span class="stat-lbl">PROGRESO DE REFORESTACIÓN</span>
      <span class="stat-val survival-pct" id="reforest-survival-val">0%</span>
     </div>
     <div class="survival-bar-track">
      <div class="survival-bar-fill" id="reforest-survival-bar" style="width: 0%;"></div>
     </div>
    </div>

    <div class="reforest-canvas-container" id="reforest-graphic-box">
     <canvas id="reforest-inner-canvas" width="500" height="240"></canvas>
    </div>

    <div class="reforest-controls-box" id="reforest-controls-content">
    </div>
   </div>
  `;
  document.getElementById('game-container').appendChild(panel);

  this._setupReforestStep(1);

  this._reforestKeyHandler = (e) => {
   if (e.code === 'Space' && this.reforestActive) {
    e.preventDefault();
    this._triggerReforestAction();
   }
  };
  window.addEventListener('keydown', this._reforestKeyHandler);
 }

 _updateReforestProgressUI() {
  this.reforestProgress = Math.max(0, Math.min(100, Math.round(this.reforestProgress || 0)));
  const valEl = document.getElementById('reforest-survival-val');
  const barEl = document.getElementById('reforest-survival-bar');
  if (valEl) valEl.textContent = `${this.reforestProgress}%`;
  if (barEl) {
   barEl.style.width = `${this.reforestProgress}%`;
   if (this.reforestProgress >= 100) barEl.style.background = '#00C853';
   else if (this.reforestProgress >= 50) barEl.style.background = '#22c55e';
   else barEl.style.background = '#eab308';
  }
 }

 _setupReforestStep(step) {
  this.reforestStep = step;
  const tagEl = document.getElementById('reforest-step-tag');
  const controlsEl = document.getElementById('reforest-controls-content');
  if (!controlsEl) return;

  if (this._reforestRaf) cancelAnimationFrame(this._reforestRaf);

  const imgSuelo = getLoadedImg('suelo_degradado_sprite');
  const imgHoyo = getLoadedImg('hoyo_tierra_sprite');
  const imgPala = getLoadedImg('pala_sprite');
  const imgPlanta = getLoadedImg('brotelenga_sprite') || getLoadedImg('lenga_planta_sprite') || getLoadedImg('broteplanta_sprite');
  const imgMalla = getLoadedImg('malla_sprite');
  const imgMallaBrote = getLoadedImg('brote_4') || getLoadedImg('malla_sprite');

  // Partículas internas del minijuego
  let particles = [];
  const addBurst = (x, y, color = '#8d6e63', count = 16) => {
   for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 1.5 + Math.random() * 4.0;
    particles.push({
     x, y,
     vx: Math.cos(angle) * spd,
     vy: Math.sin(angle) * spd - 1,
     size: 2 + Math.random() * 4.5,
     alpha: 1.0,
     color
    });
   }
  };

  const updateParticles = (ctx) => {
   particles.forEach((p) => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.15; // Gravedad
    p.alpha -= 0.03;
    if (p.alpha > 0) {
     ctx.save();
     ctx.globalAlpha = p.alpha;
     ctx.fillStyle = p.color;
     ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
     ctx.restore();
    }
   });
   particles = particles.filter(p => p.alpha > 0);
  };

  const drawBackgroundAndHoyo = (ctx, stepNum, fillPct = 0) => {
   ctx.clearRect(0, 0, 500, 240);

   // 1. Tiled Soil Background
   if (imgSuelo && imgSuelo.width > 0) {
    for (let x = 0; x < 500; x += imgSuelo.width) {
     for (let y = 0; y < 240; y += imgSuelo.height) {
      ctx.drawImage(imgSuelo, x, y);
     }
    }
   } else {
    ctx.fillStyle = '#21130d';
    ctx.fillRect(0, 0, 500, 240);
   }

   // Vignette effect around edges
   const grad = ctx.createRadialGradient(250, 120, 90, 250, 120, 270);
   grad.addColorStop(0, 'rgba(0,0,0,0)');
   grad.addColorStop(1, 'rgba(0,0,0,0.65)');
   ctx.fillStyle = grad;
   ctx.fillRect(0, 0, 500, 240);

   // 2. Hoyo excavado (Pit Hole) for steps >= 2
   if (stepNum >= 2) {
    const holeAlpha = Math.max(0, 1.0 - fillPct * 1.15);
    if (holeAlpha > 0) {
     ctx.save();
     ctx.globalAlpha = holeAlpha;
     if (imgHoyo && imgHoyo.width > 0) {
      ctx.drawImage(imgHoyo, 250 - 100, 160 - 55, 200, 110);
     } else {
      ctx.fillStyle = '#0a0504';
      ctx.beginPath();
      ctx.ellipse(250, 160, 65, 32, 0, 0, Math.PI * 2);
      ctx.fill();
     }
     ctx.restore();
    }

    // 3. Tierra apisonada que va rellenando el agujero progresivamente
    if (fillPct > 0) {
     ctx.save();
     ctx.translate(250, 160);
     ctx.globalAlpha = Math.min(1.0, fillPct * 1.25);

     const moundGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 60 * fillPct);
     moundGrad.addColorStop(0, '#5d4037');
     moundGrad.addColorStop(0.7, '#3e2723');
     moundGrad.addColorStop(1, 'rgba(33, 19, 13, 0)');

     ctx.fillStyle = moundGrad;
     ctx.beginPath();
     ctx.ellipse(0, 0, 68 * fillPct, 34 * fillPct, 0, 0, Math.PI * 2);
     ctx.fill();

     ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
     ctx.lineWidth = 1.5;
     ctx.stroke();
     ctx.restore();
    }
   }
  };

  if (step === 1) {
   if (tagEl) tagEl.textContent = 'PASO 1 DE 4';
   controlsEl.innerHTML = `
    <p class="reforest-instruction-text">Paso 1: Presiona <strong>ESPACIO</strong> o haz clic para cavar en la <strong>ZONA VERDE</strong>.</p>
    <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">CAVAR ( ESPACIO )</button>
   `;

   let needlePos = 0, needleDir = 1, speed = 2.4;
   this.isDiggingAnim = false;
   this.digProgress = 0;
   this.digHoyoScale = 0;

   const innerCanvas = document.getElementById('reforest-inner-canvas');
   const ctx = innerCanvas?.getContext('2d');

   const loopStep1 = () => {
    if (!this.reforestActive || this.reforestStep !== 1) return;

    if (!this.isDiggingAnim) {
     needlePos += speed * needleDir;
     if (needlePos >= 100) { needlePos = 100; needleDir = -1; }
     else if (needlePos <= 0) { needlePos = 0; needleDir = 1; }
     this.step1NeedlePos = needlePos;
    } else {
     this.digProgress += 0.032;
     if (this.digProgress >= 1.0) {
      this.digProgress = 1.0;
      this.isDiggingAnim = false;
      this._setupReforestStep(2);
      return;
     }
    }

    if (ctx) {
     drawBackgroundAndHoyo(ctx, 1);

     if (this.isDiggingAnim) {
      const p = this.digProgress;
      let palaX = 250, palaY = 70, palaAngle = 0;

      if (p < 0.25) {
       const t = p / 0.25;
       palaY = 70 - t * 30;
       palaAngle = -t * 0.4;
      } else if (p < 0.5) {
       const t = (p - 0.25) / 0.25;
       palaY = 40 + t * 75;
       palaAngle = -0.4 + t * 0.85;
       this.digHoyoScale = Math.min(1.0, t * 1.25);
       if (t > 0.5 && !this._digBurstDone) {
        this._digBurstDone = true;
        addBurst(250, 140, '#5d4037', 24);
        addBurst(250, 140, '#21130d', 16);
       }
      } else if (p < 0.8) {
       const t = (p - 0.5) / 0.3;
       palaY = 115 - t * 55;
       palaX = 250 + t * 25;
       palaAngle = 0.45 - t * 0.35;
       this.digHoyoScale = 1.0;
      } else {
       const t = (p - 0.8) / 0.2;
       palaY = 60 + t * 20;
       palaX = 275 - t * 25;
       this.digHoyoScale = 1.0;
      }

      if (this.digHoyoScale > 0) {
       ctx.save();
       ctx.translate(250, 160);
       ctx.scale(this.digHoyoScale, this.digHoyoScale);
       if (imgHoyo && imgHoyo.width > 0) {
        ctx.drawImage(imgHoyo, -100, -55, 200, 110);
       }
       ctx.restore();
      }

      ctx.save();
      ctx.translate(palaX, palaY);
      ctx.rotate(palaAngle);
      if (imgPala) {
       ctx.drawImage(imgPala, -35, -35, 70, 70);
      }
      ctx.restore();

     } else {
      const palaTilt = Math.sin(Date.now() * 0.008) * 0.18;
      ctx.save();
      ctx.translate(250, 75);
      ctx.rotate(palaTilt);
      if (imgPala) {
       ctx.drawImage(imgPala, -35, -35, 70, 70);
      }
      ctx.restore();
     }

     const imgMedidor = getLoadedImg('medidor_potencia_sprite');
     if (imgMedidor) {
      ctx.drawImage(imgMedidor, 100, 192, 300, 30);
     } else {
      ctx.fillStyle = '#ef4444'; ctx.fillRect(100, 195, 300, 22);
      ctx.fillStyle = '#00C853'; ctx.fillRect(190, 195, 120, 22);
      ctx.strokeStyle = '#d4af37'; ctx.strokeRect(100, 195, 300, 22);
     }

     const nx = 100 + (needlePos / 100) * 300;
     ctx.fillStyle = '#ffffff';
     ctx.shadowColor = '#00C853'; ctx.shadowBlur = 12;
     ctx.fillRect(nx - 2.5, 185, 5, 40);
     ctx.shadowBlur = 0;

     updateParticles(ctx);
    }

    this._reforestRaf = requestAnimationFrame(loopStep1);
   };
   loopStep1();

  } else if (step === 2) {
   if (tagEl) tagEl.textContent = 'PASO 2 DE 4';
   controlsEl.innerHTML = `
    <p class="reforest-instruction-text">Paso 2: Presiona <strong>ESPACIO</strong> o haz clic cuando la retícula esté centrada sobre el agujero.</p>
    <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">COLOCAR BROTE ( ESPACIO )</button>
   `;

   let t = 0;
   const innerCanvas = document.getElementById('reforest-inner-canvas');
   const ctx = innerCanvas?.getContext('2d');
   const imgMirilla = getLoadedImg('mirilla_sprite');

   const loopStep2 = () => {
    if (!this.reforestActive || this.reforestStep !== 2) return;
    t += 0.05;
    const dx = Math.sin(t * 2.2) * 55;
    const dy = Math.cos(t * 2.8) * 32;
    this.step2Offset = { dx, dy };

    if (ctx) {
     drawBackgroundAndHoyo(ctx, 2);

     // Planta de Lenga flotando suavemente sobre el hoyo (SIN MACETA)
     const floatY = 40 + Math.sin(t * 4) * 5;
     if (imgPlanta) {
      ctx.drawImage(imgPlanta, 250 - 45, floatY, 90, 120);
     }

     // Mirilla orbitando
     const cx = 250 + dx, cy = 160 + dy;
     if (imgMirilla) {
      ctx.drawImage(imgMirilla, cx - 26, cy - 26, 52, 52);
     } else {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
     }

     updateParticles(ctx);
    }

    this._reforestRaf = requestAnimationFrame(loopStep2);
   };
   loopStep2();

  } else if (step === 3) {
   if (tagEl) tagEl.textContent = 'PASO 3 DE 4';
   controlsEl.innerHTML = `
    <p class="reforest-instruction-text">Paso 3: Presiona <strong>ESPACIO</strong> o haz clic para <strong>RELLENAR Y APISONAR TIERRA</strong> en el agujero.</p>
    <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">APISONAR TIERRA ( ESPACIO )</button>
   `;

   this.step3RingCycle = 1;
   this.step3RingRadius = 75;
   this.step3FillProgress = 0;
   let radius = 75;
   const innerCanvas = document.getElementById('reforest-inner-canvas');
   const ctx = innerCanvas?.getContext('2d');

   const loopStep3 = () => {
    if (!this.reforestActive || this.reforestStep !== 3) return;
    radius -= 0.95;
    if (radius <= 6) {
     radius = 75;
     this.survivalProbability -= 10;
     this._updateReforestSurvivalUI();
     this.step3RingCycle++;
     if (this.step3RingCycle > 3) {
      this.step3FillProgress = 1.0;
      this._setupReforestStep(4);
      return;
     }
    }
    this.step3RingRadius = radius;

    if (ctx) {
     drawBackgroundAndHoyo(ctx, 3, this.step3FillProgress || 0);

     // Planta de Lenga directamente plantada en el hoyo (SIN MACETA)
     if (imgPlanta) ctx.drawImage(imgPlanta, 250 - 45, 160 - 110, 90, 120);

     // Anillos concéntricos de ritmo con pulso y sombra brillante
     const color = this.step3RingCycle === 1 ? '#00C853' : (this.step3RingCycle === 2 ? '#eab308' : '#ff9800');
     ctx.save();
     ctx.strokeStyle = color;
     ctx.shadowColor = color;
     ctx.shadowBlur = 14;
     ctx.lineWidth = 3.5;
     ctx.beginPath(); ctx.ellipse(250, 160, radius * 1.2, radius * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
     ctx.restore();

     updateParticles(ctx);
    }

    this._reforestRaf = requestAnimationFrame(loopStep3);
   };
   loopStep3();

  } else if (step === 4) {
   if (tagEl) tagEl.textContent = 'PASO 4 DE 4';
   const isInstalled = !!this.mallaInstalled;
   controlsEl.innerHTML = `
    <p class="reforest-instruction-text">Paso 4: <strong>¡ALERTA!</strong> Haz clic para instalar la <strong>Malla Protectora</strong> sobre el brote.</p>
    <div class="malla-equip-box" id="btn-equip-malla" style="background: rgba(16, 185, 129, 0.18); border: 1.5px dashed ${isInstalled ? '#00C853' : '#10b981'}; border-radius: 12px; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 14px; cursor: pointer; margin-bottom: 14px; transition: all 0.3s ease;">
     <img src="assets/malla.png" style="height: 42px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8));" />
     <span style="font-weight: 800; font-size: 13px; color: ${isInstalled ? '#6ee7b7' : '#a7f3d0'};">${isInstalled ? ' MALLA DE PROTECCIÓN INSTALADA' : 'EQUIPAR MALLA PROTECTORA ( ESPACIO )'}</span>
    </div>
    <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">${isInstalled ? 'FINALIZAR REFORESTACIÓN ➔' : 'COLOCAR MALLA PROTECTORA ( ESPACIO )'}</button>
   `;

   const innerCanvas = document.getElementById('reforest-inner-canvas');
   const ctx = innerCanvas?.getContext('2d');

   let animMallaY = -100;

   const loopStep4 = () => {
    if (!this.reforestActive || this.reforestStep !== 4) return;
    const targetY = 160 - 118; // 42px top offset
    if (this.mallaInstalled && animMallaY < targetY) {
     animMallaY += (targetY - animMallaY) * 0.20;
     if (Math.abs(targetY - animMallaY) < 1) {
      animMallaY = targetY;
      addBurst(250, 160 - 50, '#00C853', 20);
     }
    }

    if (ctx) {
     drawBackgroundAndHoyo(ctx, 4, 1.0);

     // 1. Brote de Lenga
     if (imgPlanta) ctx.drawImage(imgPlanta, 250 - 45, 160 - 110, 90, 120);

     // 2. Malla protectora / red alrededor de la Lenga
     if (this.mallaInstalled) {
      const renderY = (animMallaY > -100) ? animMallaY : targetY;
      if (imgMalla) {
       ctx.drawImage(imgMalla, 250 - 55, renderY, 110, 132);
      } else if (imgMallaBrote) {
       ctx.drawImage(imgMallaBrote, 250 - 60, renderY - 10, 120, 140);
      } else {
       ctx.strokeStyle = '#00C853'; ctx.lineWidth = 3;
       ctx.strokeRect(250 - 50, renderY, 100, 125);
      }
     }

     updateParticles(ctx);
    }

    this._reforestRaf = requestAnimationFrame(loopStep4);
   };
   loopStep4();

   const equipAction = () => {
    if (!this.mallaInstalled) {
     this.mallaInstalled = true;
     addBurst(250, 110, '#00C853', 24);
     const box = document.getElementById('btn-equip-malla');
     if (box) {
      box.style.borderColor = '#00C853';
      box.innerHTML = '<img src="assets/malla.png" style="height: 42px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8));" /> <span style="font-weight: 800; font-size: 13px; color: #6ee7b7;"> MALLA DE PROTECCIÓN INSTALADA</span>';
     }
     const btn = document.getElementById('btn-reforest-action');
     if (btn) btn.textContent = 'FINALIZAR REFORESTACIÓN ➔';
    }
   };

   document.getElementById('btn-equip-malla')?.addEventListener('click', equipAction);

  } else if (step === 5) {
   if (tagEl) tagEl.textContent = 'RESULTADO';
   this.reforestProgress = 100;
   this._updateReforestProgressUI();

   controlsEl.innerHTML = `
    <div class="reforest-success-badge">
     ¡REFORESTACIÓN AL 100% COMPLETADA!
    </div>
    <p class="reforest-instruction-text">
     El brote de Lenga nativa ha sido plantado con éxito y protegido adecuadamente. Todos los brotes del mapa han prosperado.
    </p>
    <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">CONTINUAR ( ESPACIO )</button>
   `;

   this.game.stats.health = Math.min(100, this.game.stats.health + 2);
   this.game.reforestMinigamePlayed = true;
   // Transformar todos los brotes del terreno en broteplanta.png
   this.game.entities.forEach(e => {
    if (e instanceof Seedling) {
     e.setReforested(true, this.mallaInstalled);
    }
   });
  }

  document.getElementById('btn-reforest-action')?.addEventListener('click', () => {
   this._triggerReforestAction();
  });
 }

 _triggerReforestAction() {
  if (this.reforestStep === 1) {
   if (this.isDiggingAnim) return;
   this.isDiggingAnim = true;
   this.digProgress = 0;
   this._digBurstDone = false;
  } else if (this.reforestStep === 2) {
   this._setupReforestStep(3);
  } else if (this.reforestStep === 3) {
   this.step3FillProgress = Math.min(1.0, (this.step3FillProgress || 0) + 0.34);
   this.reforestProgress = 50 + Math.round(this.step3FillProgress * 25);
   this._updateReforestProgressUI();

   this.step3RingCycle = (this.step3RingCycle || 1) + 1;
   if (this.step3RingCycle > 3) {
    this.step3FillProgress = 1.0;
    this._setupReforestStep(4);
   }
  } else if (this.reforestStep === 4) {
   if (!this.mallaInstalled) {
    this.mallaInstalled = true;
    const box = document.getElementById('btn-equip-malla');
    if (box) {
     box.style.borderColor = '#00C853';
     box.innerHTML = '<img src="assets/malla.png" style="height: 42px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8));" /> <span style="font-weight: 800; font-size: 13px; color: #6ee7b7;"> MALLA DE PROTECCIÓN INSTALADA</span>';
    }
    const btn = document.getElementById('btn-reforest-action');
    if (btn) btn.textContent = 'FINALIZAR REFORESTACIÓN ➔';
   } else {
    this._setupReforestStep(5);
   }
  } else if (this.reforestStep === 5) {
   this.closeReforestationMinigame();
  }
 }

 closeReforestationMinigame() {
  this.reforestActive = false;
  if (this._reforestRaf) cancelAnimationFrame(this._reforestRaf);
  if (this._reforestKeyHandler) window.removeEventListener('keydown', this._reforestKeyHandler);

  const panel = document.getElementById('reforestation-minigame-panel');
  if (panel) {
   panel.classList.add('fade-out');
   setTimeout(() => panel.remove(), 350);
  }
  this.game.minigameActive = false;

  // Notificar al jugador sobre la reforestación exitosa y desencadenar directamente la maduración al presionar ACEPTAR
  this.showEditorialNewsCard({
   title: ' REFORESTACIÓN EXITOSA EN LA CUENCA',
   subtitle: 'Plantines de Lenga nativa sembrados y protegidos.',
   text: 'Al presionar <strong>ACEPTAR</strong>, los plantines de Lenga nativa iniciarán su maduración acelerada hasta convertirse en un bosque autóctono frondoso.',
   fact: 'La Lenga (Nothofagus pumilio) es la especie arbórea clave para la regeneración del suelo subantártico.',
   year: '2026',
   centered: true,
   onAccept: () => {
    if (this.game && typeof this.game.growAllSeedlingsToFullTrees === 'function') {
     this.game.growAllSeedlingsToFullTrees();
    }
   }
  });
 }
}
