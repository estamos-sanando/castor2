'use strict';
/* ============================================================
   ISOENGINE.JS — 2:1 Isometric Projection Math & Camera System
   Convenciones de Proyección Isométrica 2:1 (TILE_W = 64, TILE_H = 32)
   ============================================================ */

class IsoEngine {
  constructor(tileWidth = 64, tileHeight = 32) {
    this.tileW = tileWidth;
    this.tileH = tileHeight;
    this.halfW = tileWidth / 2;
    this.halfH = tileHeight / 2;
  }

  /**
   * Convierte coordenadas de grilla (col, row) a coordenadas de pantalla (x, y)
   * @param {number} col - Columna lógica
   * @param {number} row - Fila lógica
   * @param {number} originX - Desplazamiento X del origen
   * @param {number} originY - Desplazamiento Y del origen
   * @returns {{x: number, y: number}} Coordenada de pantalla (centro del rombo)
   */
  gridToIso(col, row, originX = 640, originY = 120) {
    const x = (col - row) * this.halfW + originX;
    const y = (col + row) * this.halfH + originY;
    return { x, y };
  }

  /**
   * Convierte coordenadas de pantalla (screenX, screenY) a coordenadas de grilla (col, row)
   * @param {number} screenX - Posición X en mundo
   * @param {number} screenY - Posición Y en mundo
   * @param {number} originX - Desplazamiento X del origen
   * @param {number} originY - Desplazamiento Y del origen
   * @returns {{col: number, row: number}} Casilla lógica seleccionada
   */
  isoToGrid(screenX, screenY, originX = 640, originY = 120) {
    const dx = screenX - originX;
    const dy = screenY - originY;

    const col = Math.floor((dy / this.halfH + dx / this.halfW) / 2);
    const row = Math.floor((dy / this.halfH - dx / this.halfW) / 2);
    return { col, row };
  }

  /**
   * Dibuja el contorno de un rombo isométrico 2:1
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
   * Rellena un rombo isométrico 2:1
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
