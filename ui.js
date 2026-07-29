'use strict';
/* ============================================================
   UI.JS — Interfaz Newsgame Táctica
   Barra Táctica Inferior con Botones de Invasión, Captura y Reforestación
   ============================================================ */

class GameUI {
  constructor(game) {
    this.game = game;
    this.newsQueue = [];
    this.activeNews = null;
    this.newsTimer = 0;
    this.tutorialVisible = true;
    this.endVisible = false;
    this._buildDOM();
    this._bindEvents();
  }

  _buildDOM() {
    this.hud = document.getElementById('hud');
    if (!this.hud) {
      this.hud = document.createElement('div');
      this.hud.id = 'hud';
      document.getElementById('game-container').appendChild(this.hud);
    }
    this.hud.innerHTML = `
      <!-- HUD Superior: Marca e Indicadores Ecologicos -->
      <div id="hud-top">
        <div class="hud-brand">
          <div class="brand-titles">
            <h1 class="game-title">PROYECTO CASTOR — TIERRA DEL FUEGO</h1>
            <span id="hud-year-label" class="year-badge">1946</span>
          </div>
        </div>

        <div class="hud-stats-grid">
          <div class="hud-stat-card" id="stat-beavers">
            <span class="stat-icon">🦫</span>
            <span class="stat-val" id="val-beavers">2</span>
            <span class="stat-lbl">Castores</span>
          </div>
          <div class="hud-stat-card" id="stat-trees">
            <span class="stat-icon">🌲</span>
            <span class="stat-val" id="val-trees">100%</span>
            <span class="stat-lbl">Bosque Lenga</span>
          </div>
          <div class="hud-stat-card" id="stat-loss">
            <span class="stat-icon">💵</span>
            <span class="stat-val" id="val-loss">$0M</span>
            <span class="stat-lbl">Pérdida USD/Año</span>
          </div>
          <div class="hud-stat-card" id="stat-dams">
            <span class="stat-icon">🪵</span>
            <span class="stat-val" id="val-dams">0</span>
            <span class="stat-lbl">Diques</span>
          </div>
        </div>
      </div>

      <!-- Barra Táctica Inferior (Fija en la parte inferior de la pantalla) -->
      <div id="hud-bottom-bar">
        <!-- Línea de Tiempo Histórica -->
        <div id="hud-timeline">
          <div id="timeline-bar">
            <div id="timeline-fill"></div>
            <div id="timeline-thumb"></div>
          </div>
          <div id="timeline-labels">
            <span>1946 (Liberación)</span><span>1985 (Canal Beagle)</span><span>2005 (Crisis 100k)</span><span>2016 (ENEEI)</span><span>2046</span>
          </div>
        </div>

        <!-- Panel de Control (Invasión, Captura y Reforestación) -->
        <div id="hud-controls">
          <button class="pure-image-btn" id="btn-add-beaver" title="Agregar Castor">
            <img src="assets/BOTON.png" alt="Agregar Castor" />
          </button>

          <button class="news-btn btn-success" id="btn-capture-beaver">
            <span class="btn-icon">🟢</span>
            <span class="btn-text">🪤 CAPTURAR / DESMANTELAR</span>
          </button>

          <button class="news-btn btn-plant" id="btn-plant-tree">
            <span class="btn-icon">🌱</span>
            <span class="btn-text">PLANTAR LENGA</span>
          </button>
        </div>
      </div>
    `;

    // Contenedor de Tarjetas Periodísticas Modales
    this.newsContainer = document.createElement('div');
    this.newsContainer.id = 'news-container';
    document.getElementById('game-container').appendChild(this.newsContainer);

    // Pantalla de Tutorial Inicial Periodístico
    this.tutorialEl = document.createElement('div');
    this.tutorialEl.id = 'tutorial-overlay';
    this.tutorialEl.innerHTML = `
      <div class="tutorial-box">
        <div class="tutorial-header">
          <h2>PROYECTO CASTOR — TIERRA DEL FUEGO</h2>
          <p class="tutorial-subtitle">Ministerio de Ambiente de la Nación Argentina / Chile</p>
        </div>
        <div class="tutorial-body">
          <p>En <strong>1946</strong>, se introdujeron <strong>20 castores</strong> en Tierra del Fuego. Sin predadores (como los osos o lobos de Canadá), la población superó los <strong>100.000 animales</strong>.</p>
          <p>El castor altera el <strong>95% de las cuencas</strong> y ha destruido <strong>30.000 hectáreas</strong> de bosque de Lenga, una especie nativa que <em>tarda 200 años en recuperarse y no rebrota del tocón</em>. El daño económico supera los <strong>USD 66.5 millones de dólares anuales</strong>.</p>
          <div class="tutorial-instructions">
            <div class="ins-item">🔴 <strong>+ AGREGAR CASTOR</strong>: El castor busca la Lenga, la tala en vivo y lleva la madera al río central construyendo diques e inundando la zona.</div>
            <div class="ins-item">🟢 <strong>🪤 CAPTURAR / DESMANTELAR</strong>: Captura castores con el guardaparque para deteriorar los diques y recuperar el cauce natural.</div>
            <div class="ins-item">🌱 <strong>PLANTAR LENGA</strong>: Reforesta activamente el terreno secado con renuevos de Lenga nativa.</div>
          </div>
        </div>
        <button class="tutorial-start-btn" id="btn-start-game">¡COMENZAR!</button>
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
      }, 500);
    });

    document.getElementById('btn-add-beaver')?.addEventListener('click', () => {
      this.game.spawnBeaver();
    });

    document.getElementById('btn-capture-beaver')?.addEventListener('click', () => {
      this.game.removeBeaver();
    });

    document.getElementById('btn-plant-tree')?.addEventListener('click', () => {
      this.game.plantTree();
    });

    const tlBar = document.getElementById('timeline-bar');
    if (tlBar) {
      let dragging = false;
      const updateTimeline = (e) => {
        const rect = tlBar.getBoundingClientRect();
        const cx = (e.touches ? e.touches[0].clientX : e.clientX);
        const pct = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
        this.game.setTimelinePct(pct);
      };
      tlBar.addEventListener('mousedown', e => { dragging = true; updateTimeline(e); });
      document.addEventListener('mousemove', e => { if (dragging) updateTimeline(e); });
      document.addEventListener('mouseup', () => { dragging = false; });
      tlBar.addEventListener('touchstart', e => updateTimeline(e), { passive: true });
      tlBar.addEventListener('touchmove', e => updateTimeline(e), { passive: true });
    }
  }

  update(stats, year, timelinePct) {
    const el = id => document.getElementById(id);
    if (el('val-beavers')) el('val-beavers').textContent = stats.beavers;
    if (el('val-trees')) el('val-trees').textContent = Math.round(stats.health) + '%';
    if (el('val-loss')) el('val-loss').textContent = '$' + (stats.economicLoss || 0).toFixed(1) + 'M';
    if (el('val-dams')) el('val-dams').textContent = stats.dams;
    if (el('hud-year-label')) el('hud-year-label').textContent = Math.round(year);

    const tFill = el('timeline-fill'), tThumb = el('timeline-thumb');
    if (tFill) tFill.style.width = (timelinePct * 100) + '%';
    if (tThumb) tThumb.style.left = (timelinePct * 100) + '%';

    this._processNews();
  }

  showNews(opts) {
    this.newsQueue.push(opts);
  }

  _processNews() {
    if (this.activeNews) {
      this.newsTimer -= 1 / 60;
      if (this.newsTimer <= 0) {
        this.activeNews.classList.add('news-exit');
        setTimeout(() => {
          this.activeNews?.remove();
          this.activeNews = null;
        }, 400);
      }
      return;
    }
    if (this.newsQueue.length === 0) return;

    const news = this.newsQueue.shift();
    const card = document.createElement('div');
    card.className = `news-card news-${news.type || 'info'}`;
    card.innerHTML = `
      <div class="news-badge">${news.type === 'danger' ? '🚨 ALERTA ECOLÓGICA' : news.type === 'success' ? '✅ RESTAURACIÓN ENEEI' : news.type === 'warning' ? '⚠️ NOTICIA DE IMPACTO' : '📰 DATOS DE LA NOTICIA'}</div>
      <h3 class="news-title">${news.title}</h3>
      <p class="news-text">${news.text}</p>
      <div class="news-footer">Haz clic para continuar leyendo</div>
    `;
    card.addEventListener('click', () => {
      card.classList.add('news-exit');
      setTimeout(() => {
        card.remove();
        this.activeNews = null;
      }, 400);
    });
    this.newsContainer.appendChild(card);
    this.activeNews = card;
    this.newsTimer = 7.0;
  }
}
