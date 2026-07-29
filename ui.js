'use strict';
/* ============================================================
   UI.JS — Interfaz de Usuario y Ventanas Emergentes Abajo a la Izquierda
   - Ventanas emergentes abajo a la izquierda que NO frenan la simulación
   - Con asset assets/diario.png y auto-cierre
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
      <div id="hud-top-bar">
        <div class="hud-brand">
          <img src="assets/diario.png" alt="Diario" class="brand-newspaper-img" />
          <span class="brand-title">TIERRA DEL FUEGO — EL CASTOR EN LA PATAGONIA</span>
        </div>
        <div class="hud-stats">
          <div class="stat-pill"><span class="pill-label">🦫 CASTORES</span><span class="pill-val" id="val-beavers">0</span></div>
          <div class="stat-pill"><span class="pill-label">🔥 BOSQUE PERDIDO</span><span class="pill-val" id="val-loss">0%</span></div>
          <div class="stat-pill"><span class="pill-label">🌊 INUNDACIÓN</span><span class="pill-val" id="val-flooded">0 ha</span></div>
          <div class="stat-pill"><span class="pill-label">🪵 DIQUES</span><span class="pill-val" id="val-dams">0</span></div>
        </div>
      </div>

      <div id="hud-bottom-bar">
        <div id="hud-timeline">
          <div class="timeline-track" id="timeline-bar">
            <div class="timeline-fill" id="timeline-fill"></div>
            <div class="timeline-thumb" id="timeline-thumb"></div>
          </div>
          <div class="timeline-labels">
            <span class="t-label active">1946</span>
            <span class="t-label">1965</span>
            <span class="t-label">2005</span>
            <span class="t-label">2016</span>
            <span class="t-label">2026</span>
          </div>
        </div>

        <div id="hud-controls">
          <button class="hud-speed-btn" id="btn-speed-toggle" title="Cambiar Velocidad (1x / 2x)">
            <span class="speed-icon">⏩</span>
            <span class="speed-val" id="speed-val">1x</span>
          </button>
          <button class="pure-image-btn" id="btn-add-beaver" title="LIBERAR 20 CASTORES (1946)">
            <img src="assets/BOTON.png" alt="Agregar Castores" />
          </button>
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
      <div class="journal-popup-window centered-welcome-window">
        <div class="popup-window-bar">
          <div class="window-bar-left">
            <img src="assets/diario.png" alt="Diario" class="newspaper-icon-img" />
            <span class="popup-window-title">1946 — TIERRA DEL FUEGO</span>
          </div>
        </div>
        
        <div class="popup-window-body">
          <h2 class="journal-headline">EN 1946, ARGENTINA INTRODUJO 20 CASTORES PARA CREAR UNA INDUSTRIA PELETERA: 80 AÑOS DESPUÉS, HAN DEVASTADO LOS BOSQUES</h2>
          <div class="journal-subhead">Impacto de la especie exótica en la Isla Grande de Tierra del Fuego.</div>
          
          <div class="journal-text-content">
            <p class="journal-lead">La Marina de Guerra Argentina introdujo 10 parejas de <em>Castor canadensis</em> importadas de Canadá. La industria peletera nunca se concretó y los ejemplares fueron abandonados. Sin depredadores naturales en la Patagonia, la especie colonizó la isla alterando el 95% de las cuencas hídricas.</p>
          </div>

          <div class="journal-footer">
            <button class="tutorial-start-btn" id="btn-start-game">¡COMENZAR! ➔</button>
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

  // ── Ventana Emergente Abajo a la Izquierda — NO frena la simulación ──
  showEditorialNewsCard(opts) {
    // Si ya hay una tarjeta activa, removerla suavemente
    const oldCard = document.querySelector('.bottom-left-news-popup');
    if (oldCard) oldCard.remove();

    const cardEl = document.createElement('div');
    cardEl.className = 'bottom-left-news-popup';
    cardEl.innerHTML = `
      <div class="journal-popup-window bottom-left-card">
        <div class="popup-window-bar">
          <div class="window-bar-left">
            <img src="assets/diario.png" alt="Diario" class="newspaper-icon-img" />
            <span class="popup-window-title">TIERRA DEL FUEGO — ${opts.year || '1946-2026'}</span>
          </div>
          <button class="popup-close-x" id="btn-close-journal-x">✕</button>
        </div>
        
        <div class="popup-window-body">
          <h2 class="journal-headline">${opts.title}</h2>
          ${opts.subtitle ? `<div class="journal-subhead">${opts.subtitle}</div>` : ''}
          
          <div class="journal-text-content">
            <p class="journal-lead">${opts.text}</p>
            ${opts.quote ? `<blockquote class="journal-quote">"${opts.quote}"</blockquote>` : ''}
            ${opts.fact ? `<div class="journal-fact-box"><strong>DATO:</strong> ${opts.fact}</div>` : ''}
          </div>

          <div class="journal-footer">
            <button class="journal-action-btn" id="btn-close-journal">ENTENDIDO ➔</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(cardEl);

    // LA SIMULACIÓN CONTINÚA CORRIENDO SIN FRENARSE!
    if (this.game) this.game.running = true;

    const closeFn = () => {
      cardEl.classList.add('slide-out-bottom');
      setTimeout(() => {
        if (cardEl.parentNode) cardEl.remove();
      }, 350);
    };

    // SOLO SE CIERRA CUANDO EL JUGADOR HACE CLIC EN 'ENTENDIDO ➔' O EN '✕'
    cardEl.querySelector('#btn-close-journal')?.addEventListener('click', closeFn);
    cardEl.querySelector('#btn-close-journal-x')?.addEventListener('click', closeFn);
  }

  // ── Ventana Lateral Izquierda ──
  showCabinInventory() {
    if (document.getElementById('eneei-sidebar-panel')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'eneei-sidebar-panel';
    sidebar.innerHTML = `
      <div class="sidebar-card">
        <div class="sidebar-header">
          <img src="assets/diario.png" alt="Diario" class="sidebar-icon-img" />
          <h4>PUESTO DE CONTROL ENEEI</h4>
        </div>
        <p class="sidebar-desc">Selecciona e instala la Cabaña y el Cartel Informativo en el terreno:</p>
        
        <div class="sidebar-items">
          <div class="sidebar-item" id="btn-place-cabin">
            <div class="item-preview">
              <img src="assets/cabana.png" alt="Cabaña" class="sidebar-img" />
            </div>
            <div class="item-info">
              <span class="item-title">1. Cabaña Guardaparques</span>
              <span class="item-status" id="status-cabin">⚪ Pendiente</span>
            </div>
          </div>

          <div class="sidebar-item" id="btn-place-sign">
            <div class="item-preview">
              <img src="assets/cartel.png" alt="Cartel" class="sidebar-img" />
            </div>
            <div class="item-info">
              <span class="item-title">2. Cartel Informativo</span>
              <span class="item-status" id="status-sign">⚪ Pendiente</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(sidebar);

    document.getElementById('btn-place-cabin')?.addEventListener('click', () => {
      if (this.game.cabinPlaced) return;
      this.game.placeCabin(480, 320);
      document.getElementById('status-cabin').textContent = '🟢 Instalado';
      document.getElementById('status-cabin').style.color = '#22c55e';
      document.getElementById('btn-place-cabin').classList.add('installed');
    });

    document.getElementById('btn-place-sign')?.addEventListener('click', () => {
      if (this.game.signPlaced) return;
      this.game.placeSign(410, 360);
      document.getElementById('status-sign').textContent = '🟢 Instalado';
      document.getElementById('status-sign').style.color = '#22c55e';
      document.getElementById('btn-place-sign').classList.add('installed');
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

  update(stats, year, timelinePct) {
    const el = id => document.getElementById(id);
    if (el('val-beavers')) el('val-beavers').textContent = stats.beavers;
    if (el('val-loss')) el('val-loss').textContent = stats.forestLoss + '%';
    if (el('val-flooded')) el('val-flooded').textContent = Math.round(stats.hectaresFlooded) + ' ha';
    if (el('val-dams')) el('val-dams').textContent = stats.dams;

    const tFill = el('timeline-fill'), tThumb = el('timeline-thumb');
    if (tFill) tFill.style.width = (timelinePct * 100) + '%';
    if (tThumb) tThumb.style.left = (timelinePct * 100) + '%';
  }

  showNews(opts) {
    this.showEditorialNewsCard(opts);
  }
}
