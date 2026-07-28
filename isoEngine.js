'use strict';
/* ============================================================
   ISOENGINE.JS — 2:1 Isometric Projection Math & Camera System
   ============================================================ */

class IsoEngine {
  constructor(tileWidth = 64, tileHeight = 32) {
    this.tileW = tileWidth;
    this.tileH = tileHeight;
    this.halfW = tileWidth / 2;
    this.halfH = tileHeight / 2;
  }

  /**
   * Convert logical grid coordinates (col, row) to world screen coordinates (x, y)
   */
  gridToScreen(col, row, originX = 0, originY = 0) {
    const x = (col - row) * this.halfW + originX;
    const y = (col + row) * this.halfH + originY;
    return { x, y };
  }

  /**
   * Convert world screen coordinates (x, y) to logical grid coordinates (col, row)
   */
  screenToGrid(screenX, screenY, originX = 0, originY = 0) {
    const dx = screenX - originX;
    const dy = screenY - originY;

    const col = Math.floor((dy / this.halfH + dx / this.halfW) / 2);
    const row = Math.floor((dy / this.halfH - dx / this.halfW) / 2);
    return { col, row };
  }

  /**
   * Draw isometric diamond tile outline
   */
  drawIsoDiamond(ctx, x, y, color = 'rgba(255, 255, 255, 0.4)', lineWidth = 1) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, y - this.halfH);
    ctx.lineTo(x + this.halfW, y);
    ctx.lineTo(x, y + this.halfH);
    ctx.lineTo(x - this.halfW, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Fill isometric diamond tile
   */
  fillIsoDiamond(ctx, x, y, color = 'rgba(46, 204, 113, 0.3)') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - this.halfH);
    ctx.lineTo(x + this.halfW, y);
    ctx.lineTo(x, y + this.halfH);
    ctx.lineTo(x - this.halfW, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 2.5;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
  }

  applyTransform(ctx) {
    ctx.translate(this.x, this.y);
    ctx.scale(this.zoom, this.zoom);
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    return {
      x: (px - this.x) / this.zoom,
      y: (py - this.y) / this.zoom
    };
  }

  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  zoomAt(clientX, clientY, delta) {
    const factor = delta > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
    
    const worldBefore = this.screenToWorld(clientX, clientY);
    this.zoom = newZoom;
    const worldAfter = this.screenToWorld(clientX, clientY);

    this.x += (worldAfter.x - worldBefore.x) * this.zoom;
    this.y += (worldAfter.y - worldBefore.y) * this.zoom;
  }
}
