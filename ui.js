'use strict';
/* ============================================================
   UI.JS — Interfaz de Usuario, Tarjetas Periodísticas y Minijuegos
   Newsgame basado 100% en la noticia real de Vistazo & Proyecto ENEEI
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
          <span class="brand-icon">📰</span>
          <span class="brand-title">VISTAZO NEWSGAME — LA DEVASTACIÓN DEL CASTOR EN TIERRA DEL FUEGO</span>
        </div>
        <div class="hud-stats">
          <div class="stat-pill"><span class="pill-label">🦫 EST. POBLACIÓN</span><span class="pill-val" id="val-beavers">0</span></div>
          <div class="stat-pill"><span class="pill-label">🔥 BOSQUE PERDIDO</span><span class="pill-val" id="val-loss">0%</span></div>
          <div class="stat-pill"><span class="pill-label">🌊 HECTÁREAS ANEGADAS</span><span class="pill-val" id="val-flooded">0 ha</span></div>
          <div class="stat-pill"><span class="pill-label">🪵 DIQUES EN CUENCA</span><span class="pill-val" id="val-dams">0</span></div>
        </div>
      </div>

      <div id="hud-bottom-bar">
        <div id="hud-timeline">
          <div class="timeline-track" id="timeline-bar">
            <div class="timeline-fill" id="timeline-fill"></div>
            <div class="timeline-thumb" id="timeline-thumb"></div>
          </div>
          <div class="timeline-labels">
            <span class="t-label active">1946 (INTRODUCCIÓN)</span>
            <span class="t-label">1965 (EXPANSIÓN)</span>
            <span class="t-label">2005 (BOSQUES FANTASMA)</span>
            <span class="t-label">2016 (PROYECTO ENEEI)</span>
            <span class="t-label">2026 (RESTAURACIÓN)</span>
          </div>
        </div>

        <div id="hud-controls">
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
      <div class="tutorial-card">
        <span class="journal-tag">📰 VISTAZO INVESTIGA / REPORTAJE ESPECIAL AMBIENTAL</span>
        <h2>EN 1946, ARGENTINA INTRODUJO 20 CASTORES PARA CREAR UNA INDUSTRIA PELETERA: 80 AÑOS DESPUÉS, HAN DEVASTADO LOS BOSQUES</h2>
        <p class="tut-subtitle">Investigación periodística interactiva sobre el mayor desastre biológico en los bosques subantárticos de Tierra del Fuego.</p>
        <div class="tut-body">
          <p>La Marina de Guerra Argentina introdujo 10 parejas de <em>Castor canadensis</em> importadas de Canadá. La industria peletera nunca se concretó y los ejemplares fueron abandonados. Sin depredadores naturales en la Patagonia, la especie colonizó la Isla Grande alterando el 95% de las cuencas hídricas.</p>
        </div>
        <button class="tutorial-start-btn" id="btn-start-game">¡COMENZAR REPORTAJE INTERACTIVO!</button>
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

  // ── Tarjetas Periodísticas Editoriales 100% Periodismo Real (Vistazo / Proyecto ENEEI) ──
  showEditorialNewsCard(opts) {
    const cardEl = document.createElement('div');
    cardEl.className = 'news-journal-overlay';
    cardEl.innerHTML = `
      <div class="journal-card journal-theme-${opts.theme || 'info'}">
        <div class="journal-top-meta">
          <span class="journal-tag">📰 VISTAZO / INVESTIGACIÓN AMBIENTAL</span>
          <span class="journal-date">TIERRA DEL FUEGO — ${opts.year || '1946-2026'}</span>
        </div>
        
        <h2 class="journal-headline">${opts.title}</h2>
        ${opts.subtitle ? `<div class="journal-subhead">${opts.subtitle}</div>` : ''}
        
        <div class="journal-body">
          <p class="journal-lead">${opts.text}</p>
          ${opts.quote ? `<blockquote class="journal-quote">"${opts.quote}"</blockquote>` : ''}
          ${opts.fact ? `<div class="journal-fact-box"><strong>📊 DATO OFICIAL:</strong> ${opts.fact}</div>` : ''}
        </div>

        <div class="journal-footer">
          <button class="journal-action-btn" id="btn-close-journal">CONTINUAR LECTURA ➔</button>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(cardEl);

    // Pausar simulación durante la lectura del reportaje
    if (this.game) this.game.running = false;

    cardEl.querySelector('#btn-close-journal').addEventListener('click', () => {
      cardEl.classList.add('fade-out');
      setTimeout(() => {
        cardEl.remove();
        if (this.game) this.game.running = true;
      }, 350);
    });
  }

  // ── Ventana Lateral Izquierda de Puesto ENEEI ──
  showCabinInventory() {
    if (document.getElementById('eneei-sidebar-panel')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'eneei-sidebar-panel';
    sidebar.innerHTML = `
      <div class="sidebar-card">
        <div class="sidebar-header">
          <span class="sidebar-icon">📜</span>
          <h4>ESTRATEGIA ENEEI (ARGENTINA-CHILE)</h4>
        </div>
        <p class="sidebar-desc">Puesto de Control Binacional. Selecciona e instala la Cabaña y el Cartel Informativo en el terreno:</p>
        
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
              <span class="item-title">2. Cartel Informativo ENEEI</span>
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

  // ── Minijuego de Precisión ENEEI ──
  openPrecisionMinigame() {
    const miniEl = document.createElement('div');
    miniEl.id = 'precision-minigame-modal';
    miniEl.innerHTML = `
      <div class="modal-card precision-card">
        <h3>🪤 MINIJUEGO DE CONTROL PRECISO ENEEI</h3>
        <p>Ajusta el indicador de la trampa jaula en la <strong>ZONA VERDE</strong> para iniciar las operaciones de erradicación humanitaria.</p>
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
