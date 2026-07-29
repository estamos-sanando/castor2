'use strict';
/* ============================================================
   UI.JS — Interfaz de Usuario, Panel Lateral ENEEI y Minijuegos
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
          <span class="brand-icon">🦫</span>
          <span class="brand-title">PROYECTO CASTOR — TIERRA DEL FUEGO</span>
        </div>
        <div class="hud-stats">
          <div class="stat-pill"><span class="pill-label">🦫 CASTORES</span><span class="pill-val" id="val-beavers">0</span></div>
          <div class="stat-pill"><span class="pill-label">🔥 PÉRDIDA BOSQUE</span><span class="pill-val" id="val-loss">0%</span></div>
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
            <span class="t-label active">1946 (LIBERACIÓN)</span>
            <span class="t-label">1965 (INVASIÓN)</span>
            <span class="t-label">2005 (CRISIS)</span>
            <span class="t-label">2016 (ENEEI)</span>
            <span class="t-label">2026 (RESTAURACIÓN)</span>
          </div>
        </div>

        <div id="hud-controls">
          <button class="pure-image-btn" id="btn-add-beaver" title="LIBERAR 20 CASTORES">
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
      <div class="tutorial-card">
        <h2>🦫 PROYECTO CASTOR: INVASIÓN Y RESTAURACIÓN</h2>
        <p class="tut-subtitle">Noticia Interactiva sobre el Control de Especies Exóticas Invasoras en Tierra del Fuego</p>
        <div class="tut-body">
          <p>En 1946, 20 castores canadienses fueron liberados en Tierra del Fuego. Sin predadores naturales, su tala y represas destruyeron miles de hectáreas de Lenga nativa.</p>
        </div>
        <button class="tutorial-start-btn" id="btn-start-game">¡COMENZAR EXPERIENCIA!</button>
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
  }

  // ── Ventana Lateral Izquierda de Inventario ENEEI: Cabaña + Cartel ──
  showCabinInventory() {
    if (document.getElementById('eneei-sidebar-panel')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'eneei-sidebar-panel';
    sidebar.innerHTML = `
      <div class="sidebar-card">
        <div class="sidebar-header">
          <span class="sidebar-icon">📜</span>
          <h4>INVENTARIO DE CONTROL ENEEI</h4>
        </div>
        <p class="sidebar-desc">Tratado Binacional Argentina-Chile. Haz clic o arrastra los <strong>2 elementos</strong> al mapa para instalarlos:</p>
        
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

  // ── Minijuego de Precisión: Captura Humanitaria de Castor ──
  openPrecisionMinigame() {
    const miniEl = document.createElement('div');
    miniEl.id = 'precision-minigame-modal';
    miniEl.innerHTML = `
      <div class="modal-card precision-card">
        <h3>🪤 MINIJUEGO DE CAPTURA PRECISA ENEEI</h3>
        <p>Haz clic cuando la aguja indicadora pase por la <strong>ZONA VERDE</strong> para asegurar la captura del castor.</p>
        <div class="meter-bar-container">
          <div class="meter-bar">
            <div class="meter-zone-green"></div>
            <div class="meter-indicator" id="meter-indicator"></div>
          </div>
        </div>
        <button class="news-btn btn-success" id="btn-precision-click" style="margin-top: 15px;">
          🎯 Capturar Castor
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
      this.showNews({
        title: '🎯 ¡CAPTURA EXITOSA!',
        text: 'Los guardaparques inician la patrulla continua con trampa jaula y desmantelamiento de represas.',
        type: 'success'
      });
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

    this._processNews();
  }

  showNews(opts) {
    this.newsQueue.push(opts);
  }

  _processNews() {
    if (this.activeNews || this.newsQueue.length === 0) return;
    const opts = this.newsQueue.shift();

    const card = document.createElement('div');
    card.className = `news-card news-${opts.type || 'info'}`;
    card.innerHTML = `
      <div class="news-header">
        <span class="news-badge">${opts.type === 'danger' ? '🔴 ALERTA' : opts.type === 'warning' ? '⚠️ ADVERTENCIA' : '📰 NOTICIA'}</span>
        <h4>${opts.title}</h4>
      </div>
      <p>${opts.text}</p>
      <button class="news-close-btn">ENTENDIDO</button>
    `;

    this.newsContainer.appendChild(card);
    this.activeNews = card;

    card.querySelector('.news-close-btn').addEventListener('click', () => {
      card.classList.add('fade-out');
      setTimeout(() => {
        card.remove();
        this.activeNews = null;
      }, 300);
    });
  }
}
