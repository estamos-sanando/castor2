'use strict';
/* ============================================================
   MAPENGINE.JS — AOE2-Style 2D Isometric Background Tilemap Engine
   ============================================================ */

class TileMapEngine {
  constructor(gameMap) {
    this.map = gameMap;
    this.textureCache = {};
    this.showAoE2Grid = true;
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

  renderTilemap(ctx) {
    const map = this.map;
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
  }
}
