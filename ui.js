'use strict';
/* ============================================================
   UI.JS — Newsgame HUD Periodístico & Sistema de Gestión ENEEI
   Basado en datos oficiales de Argentina.gob.ar / Proyecto Castor
   ============================================================ */

class GameUI {
  constructor(game) {
    this.game = game;
    this.newsQueue = [];
    this.activeNews = null;
    this.newsTimer = 0;
    this.tutorialVisible = true;
    this.endVisible = false;
    this.endType = null;
    this._buildDOM();
    this._bindEvents();
  }

  // ── DOM Construction ────────────────────────────────────
  _buildDOM() {
    this.hud = document.getElementById('hud');
    if (!this.hud) {
      this.hud = document.createElement('div');
      this.hud.id = 'hud';
      document.getElementById('game-container').appendChild(this.hud);
    }
    this.hud.innerHTML = `
      <div id="hud-top">
        <div class="hud-panel" id="hud-header">
          <div class="hud-title-box">
            <span class="hud-logo">🇦🇷🇨🇱</span>
            <div>
              <h1 id="hud-main-title">PROYECTO ENEEI — CONTROL DEL CASTOR</h1>
              <span id="hud-year-label">AÑO 1946</span>
            </div>
          </div>
          <div id="hud-budget-box" title="Presupuesto de Gestión Ambiental">
            <span class="budget-label">PRESUPUESTO AMBIENTAL</span>
            <span id="val-budget">$ 100</span>
          </div>
        </div>

        <div class="hud-stats-row">
          <div class="hud-stat" id="stat-beavers" title="Población estimada de castores">
            <div class="stat-icon">🦫</div>
            <div class="stat-value" id="val-beavers">20</div>
            <div class="stat-label">Castores</div>
          </div>
          <div class="hud-stat" id="stat-trees" title="Superficie de Lenga protegida">
            <div class="stat-icon">🌲</div>
            <div class="stat-value" id="val-trees">100%</div>
            <div class="stat-label">Bosque Lenga</div>
          </div>
          <div class="hud-stat" id="stat-loss" title="Pérdida económica anual estimada (USD)">
            <div class="stat-icon">💵</div>
            <div class="stat-value" id="val-loss">$0M</div>
            <div class="stat-label">Pérdida/Año</div>
          </div>
          <div class="hud-stat" id="stat-risk" title="Riesgo de avance hacia Neuquén y Chile continental">
            <div class="stat-icon">🏔️</div>
            <div class="stat-value" id="val-risk">0%</div>
            <div class="stat-label">Riesgo Continental</div>
          </div>
          <div class="hud-stat" id="stat-dams" title="Diques activos en la cuenca">
            <div class="stat-icon">🪵</div>
            <div class="stat-value" id="val-dams">0</div>
            <div class="stat-label">Diques</div>
          </div>
        </div>
      </div>

      <div id="hud-timeline">
        <div id="timeline-bar">
          <div id="timeline-fill"></div>
          <div id="timeline-thumb"></div>
        </div>
        <div id="timeline-labels">
          <span>1946 (Liberación)</span><span>1985 (Canal Beagle)</span><span>2005 (Crisis 100k)</span><span>2016 (ENEEI)</span><span>2046 (Meta 200 años)</span>
        </div>
      </div>

      <div id="hud-actions">
        <button class="action-btn" id="btn-trap" title="Instalar Trampa Humanitaria en Área Piloto (-$15)">
          <span class="btn-icon">🪤</span>
          <span class="btn-label">Área Piloto</span>
          <span class="btn-cost">-$15</span>
        </button>
        <button class="action-btn" id="btn-dam-remove" title="Desmantelar Dique (-$20)">
          <span class="btn-icon">⛏️</span>
          <span class="btn-label">Remover Dique</span>
          <span class="btn-cost">-$20</span>
        </button>
        <button class="action-btn" id="btn-plant" title="Plantar Renuevo de Lenga (-$10)">
          <span class="btn-icon">🌱</span>
          <span class="btn-label">Reforestar Lenga</span>
          <span class="btn-cost">-$10</span>
        </button>
        <button class="action-btn" id="btn-barrier" title="Barrera Continental Estrecho de Magallanes (-$35)">
          <span class="btn-icon">🛡️</span>
          <span class="btn-label">Barrera Estrecho</span>
          <span class="btn-cost">-$35</span>
        </button>
        <button class="action-btn action-danger" id="btn-beaver-add" title="Simular liberación histórica de castores (Educativo)">
          <span class="btn-icon">⚠️</span>
          <span class="btn-label">+Castor (Sim)</span>
          <span class="btn-cost">Simular</span>
        </button>
      </div>

      <div id="hud-mode-indicator" class="mode-none">
        <span id="mode-text">Selecciona una estrategia de intervención</span>
        <button id="btn-cancel-mode" title="Cancelar">✕</button>
      </div>
    `;

    // News card container
    this.newsContainer = document.createElement('div');
    this.newsContainer.id = 'news-container';
    document.getElementById('game-container').appendChild(this.newsContainer);

    // Tutorial overlay - Periodístico oficial
    this.tutorialEl = document.createElement('div');
    this.tutorialEl.id = 'tutorial-overlay';
    this.tutorialEl.innerHTML = `
      <div class="tutorial-box">
        <div class="tutorial-header">
          <span class="tutorial-logo">🇦🇷🇨🇱</span>
          <h2>PROYECTO ENEEI: Especies Exóticas Invasoras</h2>
          <p class="tutorial-subtitle">Ministerio de Ambiente de la Nación · Estrategia Binacional</p>
        </div>
        <div class="tutorial-body">
          <p>En <strong>1946</strong>, se liberaron apenas <strong>20 castores</strong> en Tierra del Fuego. Sin predadores naturales (como los osos y lobos de Canadá), la población superó los <strong>100.000 animales</strong>.</p>
          <p>El castor afecta el <strong>95% de las cuencas</strong> y ha destruido <strong>30.000 hectáreas</strong> de bosque de Lenga, una especie que <em>tarda 200 años en recuperarse y no rebrota del tocón</em>. El daño económico supera los <strong>USD 66.5 millones anuales</strong>.</p>
          <div class="tutorial-controls">
            <div class="ctrl">🪤 <strong>Áreas Piloto</strong> — Instala trampas de captura humanitaria en ríos.</div>
            <div class="ctrl">⛏️ <strong>Remover Diques</strong> — Drena estanques artificiales para secar los bosques inundados.</div>
            <div class="ctrl">🌱 <strong>Reforestar Lenga</strong> — Siembras renuevos antes de que ingresen gramíneas exóticas.</div>
            <div class="ctrl">🛡️ <strong>Barrera Continental</strong> — Evita la invasión hacia la Cordillera y Neuquén.</div>
          </div>
        </div>
        <button class="tutorial-start-btn" id="btn-start-game">¡ASUMIR DIRECCIÓN DEL PROYECTO!</button>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.tutorialEl);

    // End screen
    this.endEl = document.createElement('div');
    this.endEl.id = 'end-overlay';
    this.endEl.style.display = 'none';
    document.getElementById('game-container').appendChild(this.endEl);
  }

  _bindEvents() {
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      this.tutorialEl.classList.add('fade-out');
      setTimeout(() => {
        this.tutorialEl.style.display = 'none';
        this.tutorialVisible = false;
        this.game.start();
      }, 600);
    });

    document.getElementById('btn-cancel-mode')?.addEventListener('click', () => {
      this.game.setMode('none');
    });

    ['trap','dam-remove','plant','barrier','beaver-add'].forEach(id => {
      document.getElementById(`btn-${id}`)?.addEventListener('click', () => {
        this.game.setMode(id);
      });
    });

    // Timeline slider
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

  // ── Update HUD ──────────────────────────────────────────
  update(stats, year, timelinePct, mode, budget) {
    const el = id => document.getElementById(id);
    if (el('val-beavers')) el('val-beavers').textContent = stats.beavers;
    if (el('val-trees')) el('val-trees').textContent = Math.round(stats.trees) + '%';
    if (el('val-loss')) el('val-loss').textContent = '$' + (stats.economicLoss || 0).toFixed(1) + 'M';
    if (el('val-risk')) el('val-risk').textContent = Math.round(stats.continentalRisk || 0) + '%';
    if (el('val-dams')) el('val-dams').textContent = stats.dams;
    if (el('val-budget')) el('val-budget').textContent = '$ ' + Math.round(budget);
    if (el('hud-year-label')) el('hud-year-label').textContent = 'AÑO ' + Math.round(year);

    // Color indicators
    const riskEl = el('stat-risk');
    if (riskEl) {
      riskEl.className = 'hud-stat' + (stats.continentalRisk > 60 ? ' danger' : stats.continentalRisk > 30 ? ' warning' : '');
    }
    const lossEl = el('stat-loss');
    if (lossEl) {
      lossEl.className = 'hud-stat' + (stats.economicLoss > 40 ? ' danger' : stats.economicLoss > 15 ? ' warning' : '');
    }

    // Timeline fill
    const tFill = el('timeline-fill'), tThumb = el('timeline-thumb');
    if (tFill) tFill.style.width = (timelinePct * 100) + '%';
    if (tThumb) tThumb.style.left = (timelinePct * 100) + '%';

    // Mode text
    const modeEl = el('hud-mode-indicator');
    const modeText = el('mode-text');
    if (modeEl && modeText) {
      const labels = {
        none: 'Selecciona una estrategia de intervención',
        trap: '🪤 Haz clic en el río para instalar una trampa de captura humanitaria (-$15)',
        'dam-remove': '⛏️ Haz clic en un dique para desplegar una cuadrilla de desmantelamiento (-$20)',
        plant: '🌱 Haz clic en el área secada para sembrar renuevos de Lenga (-$10)',
        barrier: '🛡️ Haz clic en el límite del mapa para colocar la barrera continental (-$35)',
        'beaver-add': '⚠️ Simular proliferación histórica de castores (+1 castor)',
      };
      modeEl.className = mode === 'none' ? 'mode-none' : 'mode-active';
      modeText.textContent = labels[mode] || '';
    }

    // Active button styling
    ['trap','dam-remove','plant','barrier','beaver-add'].forEach(id => {
      const btn = el(`btn-${id}`);
      if (btn) btn.classList.toggle('active', mode === id);
    });

    this._processNews();
  }

  // ── News Cards ──────────────────────────────────────────
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
        }, 500);
      }
      return;
    }
    if (this.newsQueue.length === 0) return;
    const news = this.newsQueue.shift();
    const card = document.createElement('div');
    card.className = `news-card news-${news.type || 'info'}`;
    card.innerHTML = `
      <div class="news-header">
        <span class="news-icon">${news.type === 'danger' ? '🚨' : news.type === 'success' ? '✅' : news.type === 'warning' ? '⚠️' : '📰'}</span>
        <span class="news-title">${news.title}</span>
      </div>
      <p class="news-text">${news.text}</p>
      <div class="news-progress">
        <div class="news-progress-fill"></div>
      </div>
    `;
    card.addEventListener('click', () => {
      card.classList.add('news-exit');
      setTimeout(() => card.remove(), 500);
      if (this.activeNews === card) { this.activeNews = null; }
    });
    this.newsContainer.appendChild(card);
    this.activeNews = card;
    this.newsTimer = 5.5;
    const fill = card.querySelector('.news-progress-fill');
    if (fill) {
      fill.style.transition = 'width 5.5s linear';
      requestAnimationFrame(() => { fill.style.width = '0%'; });
    }
  }

  // ── End Screen ──────────────────────────────────────────
  showEndScreen(type, stats) {
    if (this.endVisible) return;
    this.endVisible = true;
    this.endType = type;
    const isCollapse = type === 'collapse';

    this.endEl.style.display = 'flex';
    this.endEl.innerHTML = `
      <div class="end-box end-${type}">
        <div class="end-header">
          <span class="end-icon">${isCollapse ? '⚠️' : '🌿'}</span>
          <h2>${isCollapse ? 'INVASIÓN EN EL CONTINENTE' : 'RESTAURACIÓN Y CONTROL ENEEI'}</h2>
          <p class="end-year">REPORTE OFICIAL - AÑO 2046</p>
        </div>
        <div class="end-stats">
          <div class="end-stat"><span>Población Castores</span><strong>${stats.beavers}</strong></div>
          <div class="end-stat"><span>Bosque Lenga Protegido</span><strong>${Math.round(stats.trees)}%</strong></div>
          <div class="end-stat"><span>Pérdida Económica</span><strong>$${(stats.economicLoss||0).toFixed(1)}M/año</strong></div>
          <div class="end-stat"><span>Riesgo Continental</span><strong>${Math.round(stats.continentalRisk||0)}%</strong></div>
        </div>
        <p class="end-message">${isCollapse
          ? 'El castor cruzó el Estrecho de Magallanes y avanzó por la Cordillera de los Andes hacia la Provincia del Neuquén. El daño económico supera los 66.5 millones de dólares anuales y más de 30.000 ha de Lenga fueron destruidas sin posibilidad de rebrote.'
          : '¡Estrategia ENEEI exitosa! Mediante las 8 áreas piloto de captura humanitaria, el desmantelamiento de diques y la reforestación activa de Lenga, se logró frenar la invasión continental y recuperar la biodiversidad nativa de Tierra del Fuego.'
        }</p>
        <div class="end-data">
          <strong>Fuente Oficial:</strong> Proyecto ENEEI — Ministerio de Ambiente de la Nación Argentina / Chile (Acuerdo Binacional).
        </div>
        <div class="end-actions">
          <button class="end-btn" id="btn-restart">REINICIAR GESTIÓN AMBIENTAL</button>
          <a class="end-btn end-btn-secondary" href="https://www.argentina.gob.ar/ambiente/biodiversidad/exoticas-invasoras/proyecto/castor" target="_blank">Informe Completo</a>
        </div>
      </div>
    `;

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      location.reload();
    });
  }
}
