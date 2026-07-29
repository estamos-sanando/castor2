'use strict';
/* ============================================================
   UI.JS — Interfaz de Usuario Limpia
   - Removidas línea de tiempo y estadísticas
   - Menú lateral derecho compacto solo con Controles
   - Tarjeta estilo recorte de diario vintage con callback onAccept
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
          <img src="assets/diario.png" alt="Diario" class="brand-newspaper-img" />
          <h3 class="sidebar-game-title">EL CASTOR EN TIERRA DEL FUEGO</h3>
        </div>

        <div class="sidebar-section-title">🎮 CONTROLES</div>
        <div id="hud-controls-vertical">
          <button class="hud-speed-btn" id="btn-speed-toggle" title="Cambiar Velocidad (1x / 2x)">
            <span class="speed-icon">⏩ VELOCIDAD:</span>
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
      <div class="newspaper-clipping-card centered-welcome-window">
        <div class="newspaper-masthead">
          <div class="masthead-left">
            <img src="assets/diario.png" alt="Diario" class="masthead-img" />
            <span class="masthead-name">EL DIARIO DE TIERRA DEL FUEGO</span>
          </div>
          <span class="masthead-date">1946</span>
        </div>
        
        <div class="newspaper-content">
          <h2 class="newspaper-headline">EN 1946, ARGENTINA INTRODUJO 20 CASTORES PARA CREAR UNA INDUSTRIA PELETERA: 80 AÑOS DESPUÉS, HAN DEVASTADO LOS BOSQUES</h2>
          <div class="newspaper-subhead">Impacto de la especie exótica en la Isla Grande de Tierra del Fuego.</div>
          
          <div class="newspaper-body">
            <p class="newspaper-lead">La Marina de Guerra Argentina introdujo 10 parejas de <em>Castor canadensis</em> importadas de Canadá. La industria peletera nunca se concretó y los ejemplares fueron abandonados. Sin depredadores naturales en la Patagonia, la especie colonizó la isla alterando el 95% de las cuencas hídricas.</p>
          </div>

          <div class="newspaper-footer">
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

  // ── Tarjeta Emergente Izquierda Centrada (con callback onAccept) ──
  showEditorialNewsCard(opts) {
    const oldCard = document.querySelector('.left-center-news-popup');
    if (oldCard) oldCard.remove();

    const cardEl = document.createElement('div');
    cardEl.className = 'left-center-news-popup';
    cardEl.innerHTML = `
      <div class="newspaper-clipping-card">
        <div class="newspaper-masthead">
          <div class="masthead-left">
            <img src="assets/diario.png" alt="Diario" class="masthead-img" />
            <span class="masthead-name">EL DIARIO DE TIERRA DEL FUEGO</span>
          </div>
          <span class="masthead-date">${opts.year || '1946'}</span>
        </div>
        
        <div class="newspaper-content">
          <h2 class="newspaper-headline">${opts.title}</h2>
          ${opts.subtitle ? `<div class="newspaper-subhead">${opts.subtitle}</div>` : ''}
          
          <div class="newspaper-body">
            <p class="newspaper-lead">${opts.text}</p>
            ${opts.quote ? `<blockquote class="newspaper-quote">"${opts.quote}"</blockquote>` : ''}
            ${opts.fact ? `<div class="newspaper-fact-box"><strong>DATO DESTACADO:</strong> ${opts.fact}</div>` : ''}
          </div>

          <div class="newspaper-footer">
            <button class="newspaper-action-btn" id="btn-close-journal">ACEPTAR ➔</button>
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
      }, 350);
    };

    cardEl.querySelector('#btn-close-journal')?.addEventListener('click', closeFn);
  }

  // ── Ventana Lateral Izquierda de Puesto ENEEI ──
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

  update(stats, year, timelinePct) {}

  showNews(opts) {
    this.showEditorialNewsCard(opts);
  }
}
