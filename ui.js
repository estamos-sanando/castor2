'use strict';
/* ============================================================
   UI.JS — Interfaz de Usuario con Minijuego de Captura de 30 Segundos
   - Minijuego emergente del lado izquierdo durante la simulación de captura de castores
   - Contador regresivo de 30 segundos y score de castores capturados
   ============================================================ */

class GameUI {
  constructor(game) {
    this.game = game;
    this.newsQueue = [];
    this.activeNews = null;
    this.tutorialVisible = true;
    this.capturedCount = 0;
    this.timeLeft = 30;
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
      }
    });

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

  // ── Minijuego de Captura de Castores de 30 Segundos (Lado Izquierdo) ──
  openBeaverCatcherMinigame() {
    if (document.getElementById('beaver-catcher-panel')) return;

    this.capturedCount = 0;
    this.timeLeft = 30;

    const panel = document.createElement('div');
    panel.id = 'beaver-catcher-panel';
    panel.innerHTML = `
      <div class="sidebar-card catcher-card">
        <div class="sidebar-header">
          <h4>OPERACIONES DE CONTROL Y CAPTURA</h4>
        </div>
        <p class="sidebar-desc">Presiona el botón o haz clic directamente sobre los castores en el mapa para acelerar la erradicación antes de 0:30s.</p>
        
        <div class="catcher-stats-grid">
          <div class="catcher-stat-box">
            <span class="stat-lbl">TIEMPO RESTANTE</span>
            <span class="stat-val timer-val" id="minigame-timer">0:30</span>
          </div>

          <div class="catcher-stat-box">
            <span class="stat-lbl">CAPTURADOS</span>
            <span class="stat-val score-val" id="minigame-score">0 / 20</span>
          </div>
        </div>

        <button class="popup-action-btn" id="btn-manual-catch-action" style="margin-top: 14px; width: 100%;">
          CAPTURAR CASTOR
        </button>
      </div>
    `;
    document.getElementById('game-container').appendChild(panel);

    this.game.minigameActive = true;

    if (this._minigameTimerInt) clearInterval(this._minigameTimerInt);

    this._minigameTimerInt = setInterval(() => {
      this.timeLeft--;
      const timerEl = document.getElementById('minigame-timer');
      if (timerEl) {
        const secs = this.timeLeft < 10 ? `0${this.timeLeft}` : `${this.timeLeft}`;
        timerEl.textContent = `0:${secs}`;
      }

      if (this.timeLeft <= 0 || this.game.stats.beavers <= 0) {
        this.finishBeaverCatcherMinigame();
      }
    }, 1000);

    document.getElementById('btn-manual-catch-action')?.addEventListener('click', () => {
      const beaver = this.game.entities.find(b => b instanceof Beaver && !b.dead);
      if (beaver) {
        beaver.dead = true;
        this.game.particles.burst(beaver.x, beaver.y - 15, 'leaf', 16);
        this.game.stats.beavers = Math.max(0, this.game.stats.beavers - 1);
        this.onBeaverCapturedByPlayer();

        const dam = this.game.entities.find(d => d instanceof Dam && d.active && !d.dead);
        if (dam) {
          if (dam.level > 1) {
            dam.level--;
            dam._refreshSprite();
          } else {
            dam.remove();
          }
        }
      }
    });
  }

  onBeaverCapturedByPlayer() {
    this.capturedCount++;
    const scoreEl = document.getElementById('minigame-score');
    if (scoreEl) {
      scoreEl.textContent = `${this.capturedCount} / 20`;
    }
  }

  finishBeaverCatcherMinigame() {
    if (this._minigameTimerInt) {
      clearInterval(this._minigameTimerInt);
      this._minigameTimerInt = null;
    }

    this.game.minigameActive = false;

    const panel = document.getElementById('beaver-catcher-panel');
    if (panel) {
      panel.classList.add('fade-out');
      setTimeout(() => panel.remove(), 400);
    }

    // Eliminar castores restantes y pasar a la restauración del ecosistema
    this.game.entities.forEach(e => {
      if (e instanceof Beaver) e.dead = true;
    });

    this.game.restoreEcosystem();
  }

  update(stats, year, timelinePct) {}

  showNews(opts) {
    this.showEditorialNewsCard(opts);
  }
}
