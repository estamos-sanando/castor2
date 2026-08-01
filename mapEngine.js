'use strict';
/* ============================================================
  MAPENGINE.JS — AOE2-Style 2D Isometric Background Tilemap Engine
  Performance Optimized with Offscreen Double-Buffering
  ============================================================ */

class TileMapEngine {
 constructor(gameMap) {
  this.map = gameMap;
  this.textureCache = {};
  this.showAoE2Grid = true;
  this.offscreenCanvas = document.createElement('canvas');
  this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  this.isDirty = true;
  this._preloadTextures();
 }

 _preloadTextures() {
  Object.values(TerrainType).forEach(type => {
   this.textureCache[type] = TileTextureGenerator.createDiamondCanvas(
    type,
    this.map.tileW,
    this.map.tileH
   );
  });
 }

 markDirty() {
  this.isDirty = true;
 }

 _updateOffscreenBuffer() {
  const map = this.map;
  // Map dimensions in screen space
  const totalW = (map.cols + map.rows) * (map.tileW / 2) + 200;
  const totalH = (map.cols + map.rows) * (map.tileH / 2) + 200;

  if (this.offscreenCanvas.width !== totalW || this.offscreenCanvas.height !== totalH) {
   this.offscreenCanvas.width = totalW;
   this.offscreenCanvas.height = totalH;
  }

  const ctx = this.offscreenCtx;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, totalW, totalH);

  const originX = map.originX;
  const originY = map.originY;

  // Draw diamond terrain tiles in isometric order
  for (let c = 0; c < map.cols; c++) {
   for (let r = 0; r < map.rows; r++) {
    const tile = map.getTile(c, r);
    if (!tile) continue;

    const pos = map.engine.gridToScreen(c, r, originX, originY);
    const tileType = tile.type || TerrainType.GRASS_PRISTINE;
    const texture = this.textureCache[tileType];

    if (texture) {
     ctx.drawImage(
      texture,
      Math.round(pos.x - map.tileW / 2),
      Math.round(pos.y - map.tileH / 2)
     );
    }

    // AoE2 Style Grid Overlay (Ctrl+G)
    if (this.showAoE2Grid) {
     map.engine.drawIsoDiamond(ctx, pos.x, pos.y, 'rgba(255, 255, 255, 0.12)', 1);
    }
   }
  }

  this.isDirty = false;
 }

 renderTilemap(ctx) {
  if (this.isDirty) {
   this._updateOffscreenBuffer();
  }
  ctx.drawImage(this.offscreenCanvas, 0, 0);
 }
}
