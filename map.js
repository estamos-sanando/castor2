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

    this.mode = 'static'; // 'static' | 'tile'
    this.showGridLines = true;
    this.showCoords = false;

    this._initGrid();
  }

  _initGrid() {
    this.grid = [];
    for (let c = 0; c < this.cols; c++) {
      this.grid[c] = [];
      for (let r = 0; r < this.rows; r++) {
        const tile = new Tile(c, r);
        // Define central river zone as water
        if (c >= 10 && c <= 13) {
          tile.water = true;
          tile.buildable = true;
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
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const tile = this.grid[c][r];
        const pos = this.engine.gridToScreen(c, r, this.originX, this.originY);

        let color = 'rgba(46, 125, 50, 0.4)'; // Grass
        if (tile.water) color = 'rgba(41, 128, 185, 0.6)'; // Water
        if (tile.environmentalState === EnvironmentalState.CRISIS) color = 'rgba(121, 85, 72, 0.6)'; // Mud

        this.engine.fillIsoDiamond(ctx, pos.x, pos.y, color);

        if (this.showGridLines) {
          this.engine.drawIsoDiamond(ctx, pos.x, pos.y, 'rgba(255,255,255,0.15)');
        }

        if (this.showCoords) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '9px monospace';
          ctx.fillText(`${c},${r}`, pos.x - 8, pos.y + 3);
        }
      }
    }
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
