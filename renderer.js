'use strict';
/* ============================================================
   RENDERER.JS — Dynamic Layering & Depth Sorting (Y-Sorting Pipeline)
   ============================================================ */

class IsoRenderer {
  constructor(canvas, gameMap, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = gameMap;
    this.camera = camera;
    this.hoverTile = null;
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
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    this.camera.applyTransform(ctx);

    // ── 1. BASE LAYER: Background Map Illustration or Tile System ──
    if (this.map.mode === 'static') {
      gameState.drawBackground(ctx);
      this.map.renderGridOverlay(ctx);
    } else {
      this.map.renderTiles(ctx);
    }

    // ── 2. HOVER TILE HIGHLIGHT LAYER ──
    if (this.hoverTile) {
      const pos = this.map.engine.gridToScreen(
        this.hoverTile.col,
        this.hoverTile.row,
        this.map.originX,
        this.map.originY
      );
      this.map.engine.fillIsoDiamond(ctx, pos.x, pos.y, 'rgba(46, 204, 113, 0.45)');
      this.map.engine.drawIsoDiamond(ctx, pos.x, pos.y, 'rgba(255, 255, 255, 0.9)', 2);
    }

    // ── 3. ENTITY & PROP LAYER (Strict Y-Sorting Pipeline) ──
    const renderableEntities = [...gameState.entities];

    // Sort dynamically based on baseline Y position (screenY + height_offset)
    renderableEntities.sort((a, b) => a.baseY - b.baseY);

    for (const entity of renderableEntities) {
      entity.draw(ctx);
    }

    // Render particle effects
    if (gameState.particles) {
      gameState.particles.draw(ctx);
    }

    ctx.restore();
  }
}
