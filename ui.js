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

    const defaultList = [
      { name: 'ENE', score: 1400 },
      { name: 'FAO', score: 1100 },
      { name: 'FMA', score: 850 },
      { name: 'TDF', score: 600 }
    ];

    const loadAndRenderLeaderboard = () => {
      let saved = localStorage.getItem('castor_arcade_highscores_v2');
      let scores = saved ? JSON.parse(saved) : defaultList;

      scores.sort((a, b) => b.score - a.score);
      const top5 = scores.slice(0, 5);

      const tableEl = document.getElementById('leaderboard-table-content');
      if (tableEl) {
        tableEl.innerHTML = top5.map((entry, idx) => {
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

    document.getElementById('btn-save-score')?.addEventListener('click', () => {
      const inputEl = document.getElementById('arcade-initials-input');
      const initials = (inputEl?.value || 'AAA').toUpperCase().slice(0, 3);

      let saved = localStorage.getItem('castor_arcade_highscores_v2');
      let scores = saved ? JSON.parse(saved) : defaultList;

      scores.push({ name: initials, score: finalScore });
      scores.sort((a, b) => b.score - a.score);

      try {
        localStorage.setItem('castor_arcade_highscores_v2', JSON.stringify(scores));
      } catch(e) {}

      loadAndRenderLeaderboard();

      const entryBox = document.querySelector('.arcade-name-entry-box');
      if (entryBox) {
        entryBox.innerHTML = `<div class="score-saved-badge">¡HIGH SCORE REGISTRADO COMO <strong>${initials}</strong>!</div>`;
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
}
