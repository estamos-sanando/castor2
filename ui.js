'use strict';
/* ============================================================
   UI.JS — Interfaz de Usuario Limpia con Drag and Drop de Cabaña y Cartel
   - Ventana de Estrategia Binacional mostrada ANTES del inventario
   - El jugador arrastra Cabaña y Cartel desde el inventario y elige libremente dónde soltarlos en el mapa
   ============================================================ */

class GameUI {
  constructor(game) {
    this.game = game;
    this.newsQueue = [];
    this.activeNews = null;
    this.tutorialVisible = true;
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

        <div class="sidebar-guide-box">
          <div class="guide-title">💡 GUÍA DE JUEGO</div>
          <p class="guide-step">Presiona el botón <strong>LIBERAR CASTORES</strong> para comenzar la simulación.</p>
        </div>

        <div class="sidebar-section-title">🎮 CONTROLES</div>
        <div id="hud-controls-vertical">
          <button class="hud-speed-btn" id="btn-speed-toggle" title="Cambiar Velocidad (1x / 2x)">
            <span class="speed-icon">⏩ VELOCIDAD:</span>
            <span class="speed-val" id="speed-val">1x</span>
          </button>
          
          <div class="central-beaver-btn-wrapper">
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

  _initTutorial() {
    this.tutorialEl = document.createElement('div');
    this.tutorialEl.id = 'tutorial-overlay';
    this.tutorialEl.innerHTML = `
      <div class="game-popup-modal centered-welcome-window">
        <div class="popup-modal-header">
          <span class="popup-year-badge">1946 — TIERRA DEL FUEGO</span>
        </div>
        
        <div class="popup-modal-body">
          <h2 class="popup-headline">EN 1946, ARGENTINA INTRODUJO 20 CASTORES PARA CREAR UNA INDUSTRIA PELETERA: 80 AÑOS DESPUÉS, HAN DEVASTADO LOS BOSQUES</h2>
          <div class="popup-subhead">Impacto de la especie exótica en la Isla Grande de Tierra del Fuego.</div>
          
          <div class="popup-text-content">
            <p class="popup-lead">La Marina de Guerra Argentina introdujo 10 parejas de <em>Castor canadensis</em> importadas de Canadá. La industria peletera nunca se concretó y los ejemplares fueron abandonados. Sin depredadores naturales en la Patagonia, la especie colonizó la isla alterando el 95% de las cuencas hídricas.</p>
          </div>

          <div class="popup-footer">
            <button class="popup-start-btn" id="btn-start-game">ACEPTAR ➔</button>
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
      const is2x = this.game.toggleSpeed();
      const txt = document.getElementById('speed-val');
      if (txt) txt.textContent = is2x ? '2x' : '1x';
      if (is2x) {
        btn.classList.add('active-2x');
      } else {
        btn.classList.remove('active-2x');
      }
    });
  }

  // ── Tarjeta Emergente Periodística (con opción de Modal Central) ──
  showEditorialNewsCard(opts) {
    if (document.querySelector('.left-center-news-popup') || document.querySelector('.centered-news-overlay')) {
      this.newsQueue.push(opts);
      return;
    }

    if (opts.centered) {
      const overlayEl = document.createElement('div');
      overlayEl.className = 'centered-news-overlay';
      overlayEl.innerHTML = `
        <div class="game-popup-modal centered-welcome-window">
          <div class="popup-modal-header">
            <span class="popup-year-badge">TIERRA DEL FUEGO — ${opts.year || '2005'}</span>
          </div>
          
          <div class="popup-modal-body">
            <h2 class="popup-headline">${opts.title}</h2>
            ${opts.subtitle ? `<div class="popup-subhead">${opts.subtitle}</div>` : ''}
            
            <div class="popup-text-content">
              <p class="popup-lead">${opts.text}</p>
              ${opts.quote ? `<blockquote class="popup-quote">"${opts.quote}"</blockquote>` : ''}
              ${opts.fact ? `<div class="popup-fact-box"><strong>DATO DESTACADO:</strong> ${opts.fact}</div>` : ''}
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

    const cardEl = document.createElement('div');
    cardEl.className = 'left-center-news-popup';
    cardEl.innerHTML = `
      <div class="game-popup-modal left-center-card">
        <div class="popup-modal-header">
          <span class="popup-year-badge">TIERRA DEL FUEGO — ${opts.year || '1946'}</span>
        </div>
        
        <div class="popup-modal-body">
          <h2 class="popup-headline">${opts.title}</h2>
          ${opts.subtitle ? `<div class="popup-subhead">${opts.subtitle}</div>` : ''}
          
          <div class="popup-text-content">
            <p class="popup-lead">${opts.text}</p>
            ${opts.quote ? `<blockquote class="popup-quote">"${opts.quote}"</blockquote>` : ''}
            ${opts.fact ? `<div class="popup-fact-box"><strong>DATO DESTACADO:</strong> ${opts.fact}</div>` : ''}
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
        <p class="sidebar-desc"><strong>ARRASTRA Y SUELTA</strong> la Cabaña y el Cartel en la zona del terreno donde quieras instalarlos:</p>
        
        <div class="sidebar-items">
          <div class="sidebar-item draggable-item" id="item-cabin" draggable="true" data-type="cabin">
            <div class="item-preview">
              <img src="assets/cabana.png" alt="Cabaña" class="sidebar-img" />
            </div>
            <div class="item-info">
              <span class="item-title">1. Cabaña Guardaparques</span>
              <span class="item-status" id="status-cabin">✋ Arrastrar o Clic</span>
            </div>
          </div>

          <div class="sidebar-item draggable-item" id="item-sign" draggable="true" data-type="sign">
            <div class="item-preview">
              <img src="assets/cartel.png" alt="Cartel" class="sidebar-img" />
            </div>
            <div class="item-info">
              <span class="item-title">2. Cartel Informativo</span>
              <span class="item-status" id="status-sign">✋ Arrastrar o Clic</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(sidebar);

    this._setupDragAndDrop();
  }

  _setupDragAndDrop() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const cabinItem = document.getElementById('item-cabin');
    const signItem = document.getElementById('item-sign');

    const getCanvasCoords = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = 1280 / rect.width;
      const scaleY = 720 / rect.height;
      const x = Math.round((clientX - rect.left) * scaleX);
      const y = Math.round((clientY - rect.top) * scaleY);
      return { x: Math.max(60, Math.min(1220, x)), y: Math.max(100, Math.min(670, y)) };
    };

    // 1. Drag & Drop nativo de HTML5
    [cabinItem, signItem].forEach(item => {
      if (!item) return;

      item.addEventListener('dragstart', (e) => {
        const type = item.getAttribute('data-type');
        if ((type === 'cabin' && this.game.cabinPlaced) || (type === 'sign' && this.game.signPlaced)) {
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
          statusCabin.textContent = '🟢 Instalado';
          statusCabin.style.color = '#22c55e';
        }
        cabinItem?.classList.add('installed');
      } else if (type === 'sign' && !this.game.signPlaced) {
        this.game.placeSign(coords.x, coords.y);
        const statusSign = document.getElementById('status-sign');
        if (statusSign) {
          statusSign.textContent = '🟢 Instalado';
          statusSign.style.color = '#22c55e';
        }
        signItem?.classList.add('installed');
      }
    });

    // 2. Clic & Colocar en Mapa (Fallback para pantallas táctiles y clic directo)
    let activeType = null;

    [cabinItem, signItem].forEach(item => {
      if (!item) return;

      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        if ((type === 'cabin' && this.game.cabinPlaced) || (type === 'sign' && this.game.signPlaced)) return;

        if (activeType === type) {
          activeType = null;
          item.style.borderColor = 'rgba(212, 175, 55, 0.6)';
          item.style.background = 'rgba(255, 255, 255, 0.06)';
        } else {
          activeType = type;
          cabinItem.style.borderColor = 'rgba(212, 175, 55, 0.6)';
          signItem.style.borderColor = 'rgba(212, 175, 55, 0.6)';
          cabinItem.style.background = 'rgba(255, 255, 255, 0.06)';
          signItem.style.background = 'rgba(255, 255, 255, 0.06)';

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
          statusCabin.textContent = '🟢 Instalado';
          statusCabin.style.color = '#22c55e';
        }
        cabinItem?.classList.add('installed');
        activeType = null;
      } else if (activeType === 'sign' && !this.game.signPlaced) {
        this.game.placeSign(coords.x, coords.y);
        const statusSign = document.getElementById('status-sign');
        if (statusSign) {
          statusSign.textContent = '🟢 Instalado';
          statusSign.style.color = '#22c55e';
        }
        signItem?.classList.add('installed');
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

  // ── Minijuego de Precisión ──
  openPrecisionMinigame() {
    const miniEl = document.createElement('div');
    miniEl.id = 'precision-minigame-modal';
    miniEl.innerHTML = `
      <div class="modal-card precision-card">
        <h3>🪤 CONTROL PRECISO DE CUENCAS</h3>
        <p>Ajusta el indicador de la trampa jaula en la <strong>ZONA VERDE</strong> para iniciar las operaciones de erradicación.</p>
        <div class="meter-bar-container">
          <div class="meter-bar">
            <div class="meter-zone-green"></div>
            <div class="meter-indicator" id="meter-indicator"></div>
          </div>
        </div>
        <button class="news-btn btn-success" id="btn-precision-click" style="margin-top: 15px;">
          🎯 Activar Puesto ENEEI
        </button>
      </div>
    `;
    document.getElementById('game-container').appendChild(miniEl);

    let pos = 0, dir = 2;
    const indicator = document.getElementById('meter-indicator');
    const interval = setInterval(() => {
      pos += dir;
      if (pos >= 100 || pos <= 0) dir = -dir;
      if (indicator) indicator.style.left = pos + '%';
    }, 16);

    document.getElementById('btn-precision-click')?.addEventListener('click', () => {
      clearInterval(interval);
      miniEl.remove();
      this.game.startRangerSimulation();
    });
  }

  update(stats, year, timelinePct) {}

  showNews(opts) {
    this.showEditorialNewsCard(opts);
  }
}
