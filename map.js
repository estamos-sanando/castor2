'use strict';
/* ============================================================
   MAP.JS — Isometric Map Grid & Tile Properties (Data Model)
   ============================================================ */

const EnvironmentalState = Object.freeze({
  PRISTINE: 'PRISTINE',
  DEGRADED: 'DEGRADED',
  CRISIS: 'CRISIS',
  RESTORED: 'RESTORED'
});

class Tile {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.walkable = true;
    this.water = false;
    this.buildable = true;
    this.occupiedBy = null;
    this.environmentalState = EnvironmentalState.PRISTINE;
  }
}

class IsometricMap {
  constructor(cols = 24, rows = 24, tileW = 64, tileH = 32) {
    this.cols = cols;
    this.rows = rows;
    this.tileW = tileW;
    this.tileH = tileH;
    this.originX = 640;
    this.originY = 120;

    this.grid = [];
    this.engine = new IsoEngine(tileW, tileH);
    this.tileEngine = new TileMapEngine(this);

    this.mode = 'static'; // 'static' | 'tile'
    this.showGridLines = true;
    this.showCoords = false;

    this._initGrid();
    ScenarioLoader.loadPristineForestScenario(this.tileEngine);
  }

  _initGrid() {
    this.grid = [];
    for (let c = 0; c < this.cols; c++) {
      this.grid[c] = [];
      for (let r = 0; r < this.rows; r++) {
        const tile = new Tile(c, r);
        tile.type = TerrainType.GRASS_PRISTINE;
        if (c >= 10 && c <= 13) {
          tile.type = TerrainType.WATER_RIVER;
          tile.water = true;
        }
        this.grid[c][r] = tile;
      }
    }
  }

  getTile(col, row) {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      return this.grid[col][row];
    }
    return null;
  }

  isWalkable(col, row) {
    const tile = this.getTile(col, row);
    return tile ? tile.walkable : false;
  }

  setTileState(col, row, state) {
    const tile = this.getTile(col, row);
    if (tile) {
      tile.environmentalState = state;
    }
  }

  renderTiles(ctx) {
    this.tileEngine.renderTilemap(ctx);
  }

  renderGridOverlay(ctx) {
    if (!this.showGridLines && !this.showCoords) return;

    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const pos = this.engine.gridToScreen(c, r, this.originX, this.originY);
        if (this.showGridLines) {
          this.engine.drawIsoDiamond(ctx, pos.x, pos.y, 'rgba(255, 255, 255, 0.18)');
        }
        if (this.showCoords) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '8px monospace';
          ctx.fillText(`${c},${r}`, pos.x - 8, pos.y + 3);
        }
      }
    }
  }
}
