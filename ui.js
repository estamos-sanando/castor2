'use strict';
/* ============================================================
   UI.JS — Interfaz de Usuario, Tarjetas Periodísticas y Minijuegos
   Noticia Interactiva basada en Vistazo / Proyecto Castor ENEEI
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
          <span class="brand-title">NEWSGAME — LA INVASIÓN DEL CASTOR EN TIERRA DEL FUEGO</span>
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
        <span class="journal-tag">📰 VISTAZO INVESTIGA / REPORTAJE ESPECIAL</span>
        <h2>1946: 20 CASTORES PARA CREAR UNA INDUSTRIA PELETERA EN TIERRA DEL FUEGO</h2>
        <p class="tut-subtitle">80 años después, más de 100.000 ejemplares han devastado miles de hectáreas de bosque patagónico.</p>
        <div class="tut-body">
          <p>En 1946, la Marina Argentina introdujo 20 ejemplares de <em>Castor canadensis</em> importados de Canadá. Sin predadores naturales (osos o lobos), la especie colonizó el fin del mundo alterando las cuencas para siempre.</p>
        </div>
        <button class="tutorial-start-btn" id="btn-start-game">¡COMENZAR INVESTIGACIÓN INTERACTIVA!</button>
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

  // ── Tarjetas Periodísticas Editoriales de Gran Impacto (Newsgame Overlay) ──
  showEditorialNewsCard(opts) {
    const cardEl = document.createElement('div');
    cardEl.className = 'news-journal-overlay';
    cardEl.innerHTML = `
      <div class="journal-card journal-theme-${opts.theme || 'danger'}">
        <div class="journal-top-meta">
          <span class="journal-tag">📰 VISTAZO / NOTICIA EN DESARROLLO</span>
          <span class="journal-date">TIERRA DEL FUEGO — ${opts.year || '1946-2026'}</span>
        </div>
        
        <h2 class="journal-headline">${opts.title}</h2>
        ${opts.subtitle ? `<div class="journal-subhead">${opts.subtitle}</div>` : ''}
        
        <div class="journal-body">
          <p class="journal-lead">${opts.text}</p>
          ${opts.quote ? `<blockquote class="journal-quote">"${opts.quote}"</blockquote>` : ''}
          ${opts.fact ? `<div class="journal-fact-box"><strong>📊 DATO CLAVE:</strong> ${opts.fact}</div>` : ''}
        </div>

        <div class="journal-footer">
          <button class="journal-action-btn" id="btn-close-journal">CONTINUAR JUGANDO ➔</button>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(cardEl);

    // Pausar simulación mientras lee la noticia
    if (this.game) this.game.running = false;

    cardEl.querySelector('#btn-close-journal').addEventListener('click', () => {
      cardEl.classList.add('fade-out');
      setTimeout(() => {
        cardEl.remove();
        if (this.game) this.game.running = true;
      }, 350);
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
        <p class="sidebar-desc">Tratado Binacional Argentina-Chile. Haz clic en los <strong>2 elementos</strong> para instalarlos en el mapa:</p>
        
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
      this.showEditorialNewsCard({
        title: '🎯 ¡CAPTURA EXITOSA EN ÁREAS PILOTO!',
        subtitle: 'Comienza la estrategia binacional de patrulla con trampas jaula y restauración de cuencas.',
        text: 'Los guardaparques especializados inician el retiro de represas y la captura humanitaria para frenar la migración del castor hacia la Patagonia continental.',
        fact: 'Se protegen las cuencas del río Lapataia y la Isla Navarino en Chile.',
        theme: 'success',
        year: '2016'
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
    this.showEditorialNewsCard(opts);
  }

  _processNews() {}
}
