'use strict';
/* ============================================================
   RENDERER.JS — Dynamic Layering & Depth Sorting (Y-Sorting Pipeline)
   - Punto de Anclaje (Anchor Point): Bottom-Center (0.5, 1.0)
   - Y-Sorting: Ordenamiento dinámico según la coordenada Y base
   ============================================================ */

class IsoRenderer {
  constructor(canvas, gameMap, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = gameMap;
    this.camera = camera;
    this.hoverTile = null;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  setHoverTile(col, row) {
    if (col >= 0 && col < this.map.cols && row >= 0 && row < this.map.rows) {
      this.hoverTile = { col, row };
    } else {
      this.hoverTile = null;
    }
  }

  render(gameState) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#040c04';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    this.camera.applyTransform(ctx);

    // ── 1. RENDERIZADO DEL TERRENO ISOMÉTRICO (BASE LAYER) ──
    if (this.map.mode === 'tile' || !gameState.maps || !gameState.mapLoaded || !gameState.mapLoaded[gameState.currentMap]) {
      this.map.renderTiles(ctx);
    } else {
      gameState.drawBackground(ctx);
    }
    this.map.renderGridOverlay(ctx);

    // ── 2. HOVER Y SELECCIÓN DE CASILLA (INTERACTIVO) ──
    if (this.hoverTile) {
      const pos = this.map.engine.gridToIso(
        this.hoverTile.col,
        this.hoverTile.row,
        this.map.originX,
        this.map.originY
      );
      this.map.engine.fillIsoDiamond(ctx, pos.x, pos.y, 'rgba(46, 204, 113, 0.45)');
      this.map.engine.drawIsoDiamond(ctx, pos.x, pos.y, 'rgba(255, 255, 255, 0.9)', 2);
    }

    // ── 3. RENDERIZADO DE ENTIDADES CON Y-SORTING (PROFUNDIDAD) ──
    const renderableEntities = [...gameState.entities];

    // Y-Sorting: Ordenamiento en profundidad por la base Y del objeto
    renderableEntities.sort((a, b) => a.baseY - b.baseY);

    for (const entity of renderableEntities) {
      entity.draw(ctx);
    }

    // Sistema de partículas
    if (gameState.particles) {
      gameState.particles.draw(ctx);
    }

    ctx.restore();
  }
}
