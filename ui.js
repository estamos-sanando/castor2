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
    if (document.querySelector('.left-center-news-popup') || document.querySelector('.centered-news-overlay')) {
      this.newsQueue.push(opts);
      return;
    }

    if (opts.centered) {
      const overlayEl = document.createElement('div');
      overlayEl.className = 'centered-news-overlay' + (opts.bluish ? ' bluish-theme' : '');
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
        <div class="sidebar-header">
          <h4>CONTROL PRECISO EN ZONA VERDE</h4>
        </div>
        <p class="sidebar-desc">Presiona <strong>ESPACIO</strong> o el botón cuando la aguja esté en la <strong>ZONA VERDE</strong> para sumar puntos y erradicar castores.</p>
        
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

      if (this.timeLeft <= 0 || this.game.stats.beavers <= 0) {
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

      const beaver = this.game.entities.find(b => b instanceof Beaver && !b.dead);
      if (beaver) {
        beaver.dead = true;
        this.game.particles.burst(beaver.x, beaver.y - 15, 'leaf', 18);
        this.game.stats.beavers = Math.max(0, this.game.stats.beavers - 1);

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

    this.game.entities.forEach(e => {
      if (e instanceof Beaver) e.dead = true;
    });

    setTimeout(() => {
      this.showArcadeLeaderboard(this.arcadeScore);
    }, 500);
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
        this.game.restoreEcosystem();
      }, 400);
    });
  }

  update(stats, year, timelinePct) {}

  showNews(opts) {
    this.showEditorialNewsCard(opts);
  }

  // ── MINIJUEGO "REFORESTACIÓN DE LENGA" (4 PASOS INTERACTIVOS) ──
  openReforestationMinigame(targetSeedling) {
    if (document.getElementById('reforestation-minigame-panel')) return;

    this.reforestSeedling = targetSeedling;
    this.survivalProbability = 100;
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
            <span class="stat-lbl">ESTADO DE SUPERVIVENCIA</span>
            <span class="stat-val survival-pct" id="reforest-survival-val">100%</span>
          </div>
          <div class="survival-bar-track">
            <div class="survival-bar-fill" id="reforest-survival-bar" style="width: 100%;"></div>
          </div>
        </div>

        <div class="reforest-canvas-container" id="reforest-graphic-box">
          <canvas id="reforest-inner-canvas" width="344" height="170"></canvas>
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

  _updateReforestSurvivalUI() {
    this.survivalProbability = Math.max(0, Math.min(100, Math.round(this.survivalProbability)));
    const valEl = document.getElementById('reforest-survival-val');
    const barEl = document.getElementById('reforest-survival-bar');
    if (valEl) valEl.textContent = `${this.survivalProbability}%`;
    if (barEl) {
      barEl.style.width = `${this.survivalProbability}%`;
      if (this.survivalProbability >= 80) barEl.style.background = '#00C853';
      else if (this.survivalProbability >= 50) barEl.style.background = '#eab308';
      else barEl.style.background = '#ef4444';
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
    const imgPlanta = getLoadedImg('lenga_planta_sprite') || getLoadedImg('maceta_brote_sprite');
    const imgMalla = getLoadedImg('malla_sprite');
    const imgMallaBrote = getLoadedImg('brote_4') || getLoadedImg('malla_sprite');

    // Partículas internas del minijuego
    let particles = [];
    const addBurst = (x, y, color = '#8d6e63', count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 3.5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1,
          size: 2 + Math.random() * 4,
          alpha: 1.0,
          color
        });
      }
    };

    const updateParticles = (ctx) => {
      particles.forEach((p, idx) => {
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

    const drawBackgroundAndHoyo = (ctx, stepNum) => {
      ctx.clearRect(0, 0, 344, 170);

      // 1. Tiled Soil Background
      if (imgSuelo && imgSuelo.width > 0) {
        for (let x = 0; x < 344; x += imgSuelo.width) {
          for (let y = 0; y < 170; y += imgSuelo.height) {
            ctx.drawImage(imgSuelo, x, y);
          }
        }
      } else {
        ctx.fillStyle = '#21130d';
        ctx.fillRect(0, 0, 344, 170);
      }

      // Vignette effect around edges
      const grad = ctx.createRadialGradient(172, 85, 80, 172, 85, 180);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 344, 170);

      // 2. Hoyo excavado (Pit Hole) for steps >= 2
      if (stepNum >= 2) {
        if (imgHoyo && imgHoyo.width > 0) {
          ctx.drawImage(imgHoyo, 92, 60, 160, 100);
        } else {
          ctx.fillStyle = '#0a0504';
          ctx.beginPath();
          ctx.ellipse(172, 110, 50, 25, 0, 0, Math.PI * 2);
          ctx.fill();
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
      const innerCanvas = document.getElementById('reforest-inner-canvas');
      const ctx = innerCanvas?.getContext('2d');

      const loopStep1 = () => {
        if (!this.reforestActive || this.reforestStep !== 1) return;
        needlePos += speed * needleDir;
        if (needlePos >= 100) { needlePos = 100; needleDir = -1; }
        else if (needlePos <= 0) { needlePos = 0; needleDir = 1; }
        this.step1NeedlePos = needlePos;

        if (ctx) {
          drawBackgroundAndHoyo(ctx, 1);

          // Animación de inclinación ligera de la pala al oscilar
          const palaTilt = Math.sin(Date.now() * 0.008) * 0.15;
          ctx.save();
          ctx.translate(172, 55);
          ctx.rotate(palaTilt);
          if (imgPala) {
            ctx.drawImage(imgPala, -30, -30, 60, 60);
          } else {
            ctx.fillStyle = '#d4af37'; ctx.fillRect(-7, -25, 14, 50);
          }
          ctx.restore();

          // Barra de medidor
          const imgMedidor = getLoadedImg('medidor_potencia_sprite');
          if (imgMedidor) {
            ctx.drawImage(imgMedidor, 28, 124, 288, 28);
          } else {
            ctx.fillStyle = '#ef4444'; ctx.fillRect(30, 130, 284, 20);
            ctx.fillStyle = '#00C853'; ctx.fillRect(115, 130, 114, 20);
            ctx.strokeStyle = '#d4af37'; ctx.strokeRect(30, 130, 284, 20);
          }

          // Aguja brillante
          const nx = 30 + (needlePos / 100) * 284;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00C853'; ctx.shadowBlur = 10;
          ctx.fillRect(nx - 2, 120, 4, 36);
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
        const dx = Math.sin(t * 2.2) * 45;
        const dy = Math.cos(t * 2.8) * 28;
        this.step2Offset = { dx, dy };

        if (ctx) {
          drawBackgroundAndHoyo(ctx, 2);

          // Planta de Lenga flotando suavemente sobre el hoyo (SIN MACETA)
          const floatY = 25 + Math.sin(t * 4) * 4;
          if (imgPlanta) {
            ctx.drawImage(imgPlanta, 142, floatY, 60, 80);
          }

          // Mirilla orbitando
          const cx = 172 + dx, cy = 110 + dy;
          if (imgMirilla) {
            ctx.drawImage(imgMirilla, cx - 22, cy - 22, 44, 44);
          } else {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke();
          }

          updateParticles(ctx);
        }

        this._reforestRaf = requestAnimationFrame(loopStep2);
      };
      loopStep2();

    } else if (step === 3) {
      if (tagEl) tagEl.textContent = 'PASO 3 DE 4';
      controlsEl.innerHTML = `
        <p class="reforest-instruction-text">Paso 3: Presiona en el ritmo justo a medida que los anillos se cierran alrededor del brote.</p>
        <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">APISONAR ( ESPACIO )</button>
      `;

      this.step3RingCycle = 1;
      this.step3RingRadius = 60;
      let radius = 60;
      const innerCanvas = document.getElementById('reforest-inner-canvas');
      const ctx = innerCanvas?.getContext('2d');

      const loopStep3 = () => {
        if (!this.reforestActive || this.reforestStep !== 3) return;
        radius -= 0.85;
        if (radius <= 5) {
          radius = 60;
          this.survivalProbability -= 10;
          this._updateReforestSurvivalUI();
          this.step3RingCycle++;
          if (this.step3RingCycle > 3) {
            this._setupReforestStep(4);
            return;
          }
        }
        this.step3RingRadius = radius;

        if (ctx) {
          drawBackgroundAndHoyo(ctx, 3);

          // Planta de Lenga directamente plantada en el hoyo (SIN MACETA)
          if (imgPlanta) ctx.drawImage(imgPlanta, 142, 35, 60, 80);

          // Anillos concéntricos de ritmo con pulso y sombra brillante
          const color = this.step3RingCycle === 1 ? '#00C853' : (this.step3RingCycle === 2 ? '#eab308' : '#ff9800');
          ctx.save();
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(172, 110, radius, radius * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();

          updateParticles(ctx);
        }

        this._reforestRaf = requestAnimationFrame(loopStep3);
      };
      loopStep3();

    } else if (step === 4) {
      if (tagEl) tagEl.textContent = 'PASO 4 DE 4';
      controlsEl.innerHTML = `
        <p class="reforest-instruction-text">Paso 4: <strong>¡ALERTA!</strong> Haz clic para instalar la <strong>Malla Protectora</strong> sobre el brote.</p>
        <div class="malla-equip-box" id="btn-equip-malla" style="background: rgba(212, 175, 55, 0.15); border: 1.5px dashed var(--gold); border-radius: 10px; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; margin-bottom: 12px; animation: pulseGlow 1.5s infinite alternate;">
          <img src="assets/malla.png" style="height: 38px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));" />
          <span style="font-weight: 700; font-size: 12px; color: var(--gold-light);">${this.mallaInstalled ? '✓ MALLA DE PROTECCIÓN INSTALADA' : 'EQUIPAR MALLA PROTECTORA'}</span>
        </div>
        <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">FINALIZAR REFORESTACIÓN ➔</button>
      `;

      const innerCanvas = document.getElementById('reforest-inner-canvas');
      const ctx = innerCanvas?.getContext('2d');

      let animMallaY = -60;

      const loopStep4 = () => {
        if (!this.reforestActive || this.reforestStep !== 4) return;
        if (this.mallaInstalled && animMallaY < 35) {
          animMallaY += (35 - animMallaY) * 0.18;
          if (Math.abs(35 - animMallaY) < 1) {
            animMallaY = 35;
            addBurst(172, 100, '#00C853', 15);
          }
        }

        if (ctx) {
          drawBackgroundAndHoyo(ctx, 4);

          if (imgPlanta) ctx.drawImage(imgPlanta, 142, 35, 60, 80);

          if (this.mallaInstalled) {
            if (imgMalla) ctx.drawImage(imgMalla, 136, animMallaY, 72, 85);
            else { ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 2; ctx.strokeRect(158, 55, 28, 55); }
          }

          updateParticles(ctx);
        }

        this._reforestRaf = requestAnimationFrame(loopStep4);
      };
      loopStep4();

      document.getElementById('btn-equip-malla')?.addEventListener('click', () => {
        this.mallaInstalled = true;
        const box = document.getElementById('btn-equip-malla');
        if (box) box.innerHTML = '<img src="assets/malla.png" style="height: 38px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));" /> <span style="font-weight: 700; font-size: 12px; color: #00C853;">✓ MALLA DE PROTECCIÓN INSTALADA</span>';
      });

    } else if (step === 5) {
      if (tagEl) tagEl.textContent = 'RESULTADO';
      const isSuccess = this.survivalProbability >= 80;

      controlsEl.innerHTML = `
        <div class="${isSuccess ? 'reforest-success-badge' : 'reforest-fail-badge'}">
          ${isSuccess ? `¡REFORESTACIÓN EXITOSA! (+100 PTS)` : `REFORESTACIÓN INSUFICIENTE (${this.survivalProbability}%)`}
        </div>
        <p class="reforest-instruction-text">
          ${isSuccess 
            ? 'El brote de Lenga nativa ha sido plantado con éxito y protegido contra herbívoros.' 
            : 'La probabilidad de supervivencia fue menor al 80%. La casilla requiere replantación.'}
        </p>
        <button class="popup-action-btn arcade-action-btn green-btn" id="btn-reforest-action">CONTINUAR ( ESPACIO )</button>
      `;

      if (this.reforestSeedling) {
        this.reforestSeedling.setReforested(isSuccess, this.mallaInstalled);
        if (isSuccess) {
          this.game.stats.health = Math.min(100, this.game.stats.health + 2);
        }
      }
    }

    document.getElementById('btn-reforest-action')?.addEventListener('click', () => {
      this._triggerReforestAction();
    });
  }

  _triggerReforestAction() {
    if (this.reforestStep === 1) {
      const pos = this.step1NeedlePos || 50;
      if (pos >= 40 && pos <= 60) {
      } else {
        this.survivalProbability -= 15;
        this._updateReforestSurvivalUI();
      }
      this._setupReforestStep(2);
    } else if (this.reforestStep === 2) {
      const off = this.step2Offset || { dx: 0, dy: 0 };
      const dist = Math.hypot(off.dx, off.dy);
      if (dist <= 18) {
      } else {
        this.survivalProbability -= 15;
        this._updateReforestSurvivalUI();
      }
      this._setupReforestStep(3);
    } else if (this.reforestStep === 3) {
      const radius = this.step3RingRadius || 60;
      if (radius <= 25 && radius >= 10) {
      } else {
        this.survivalProbability -= 10;
        this._updateReforestSurvivalUI();
      }
      this.step3RingCycle = (this.step3RingCycle || 1) + 1;
      if (this.step3RingCycle > 3) {
        this._setupReforestStep(4);
      }
    } else if (this.reforestStep === 4) {
      if (!this.mallaInstalled) {
        this.survivalProbability = Math.round(this.survivalProbability * 0.2);
        this._updateReforestSurvivalUI();
      }
      this._setupReforestStep(5);
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
  }
}
