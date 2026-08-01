'use strict';
/* ============================================================
  MAP.JS — Arquitectura del Mapa Grid Isométrico (16x16)
  - Restricción del Río: Columnas centrales de arriba a abajo.
  - Tres Zonas Fijas:
   * Margen Izquierdo (Bosque/Tierra): Columnas 0 a 6
   * Cauce del Río (Agua): Columnas 7 y 8 (Centro)
   * Margen Derecho (Bosque/Tierra): Columnas 9 a 15
  ============================================================ */

class Tile {
 constructor(col, row, state = TileState.TERRENO_SANO) {
  this.col = col;
  this.row = row;
  this.state = state;
  this.occupiedBy = null;
 }

 get config() {
  return TILE_CONFIG[this.state] || TILE_CONFIG[TileState.TERRENO_SANO];
 }

 get isWater() {
  return this.water === true ||
      this.state === TileState.AGUA_RIO ||
      this.state === TileState.INUNDADO_BARRO ||
      this.type === 'WATER_RIVER' ||
      this.type === 'WATER_SWAMP';
 }

 get isWalkable() {
  return this.config.walkable;
 }
}

class IsometricMap {
 constructor(cols = 16, rows = 16, tileW = 64, tileH = 32) {
  this.cols = cols;
  this.rows = rows;
  this.tileW = tileW;
  this.tileH = tileH;
  this.originX = 640;
  this.originY = 100;

  this.grid = [];
  this.engine = new IsoEngine(tileW, tileH);
  this.showGridLines = false;
  this.showCoords = false;

  this._initGrid();
 }

 _initGrid() {
  this.grid = [];
  const centerStart = Math.floor(this.cols / 2) - 1; // ej: 7
  const centerEnd = Math.floor(this.cols / 2);   // ej: 8

  for (let c = 0; c < this.cols; c++) {
   this.grid[c] = [];
   for (let r = 0; r < this.rows; r++) {
    let initialState = TileState.TERRENO_SANO;
    
    // Asignación de Zonas Fijas: Cauce del Río en las columnas centrales de arriba a abajo
    if (c >= centerStart && c <= centerEnd) {
     initialState = TileState.AGUA_RIO;
    }

    this.grid[c][r] = new Tile(c, r, initialState);
   }
  }
 }

 getTile(col, row) {
  if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
   return this.grid[col][row];
  }
  return null;
 }

 /**
  * Cambia dinámicamente el estado visual de una casilla
  */
 setTileState(col, row, newState) {
  const tile = this.getTile(col, row);
  if (tile) {
   tile.state = newState;
  }
 }

 /**
  * Acción: Construir Dique en Casilla del Río e Inundar casillas adyacentes a INUNDADO_BARRO
  */
 buildDam(col, row) {
  const tile = this.getTile(col, row);
  if (!tile) return;

  tile.state = TileState.DIQUE;

  // Inundar casillas adyacentes (3x3) a INUNDADO_BARRO
  for (let dc = -1; dc <= 1; dc++) {
   for (let dr = -1; dr <= 1; dr++) {
    if (dc === 0 && dr === 0) continue;
    const adj = this.getTile(col + dc, row + dr);
    if (adj && adj.state === TileState.TERRENO_SANO) {
     adj.state = TileState.INUNDADO_BARRO;
    }
   }
  }
 }

 /**
  * Acción: Desmantelar Dique y Drenar terreno adyacente a TERRENO_SANO
  */
 dismantleDam(col, row) {
  const tile = this.getTile(col, row);
  if (!tile) return;

  const centerStart = Math.floor(this.cols / 2) - 1;
  const centerEnd = Math.floor(this.cols / 2);
  tile.state = (col >= centerStart && col <= centerEnd) ? TileState.AGUA_RIO : TileState.TERRENO_SANO;

  // Drenar casillas adyacentes
  for (let dc = -1; dc <= 1; dc++) {
   for (let dr = -1; dr <= 1; dr++) {
    if (dc === 0 && dr === 0) continue;
    const adj = this.getTile(col + dc, row + dr);
    if (adj && adj.state === TileState.INUNDADO_BARRO) {
     adj.state = (adj.col >= centerStart && adj.col <= centerEnd) ? TileState.AGUA_RIO : TileState.TERRENO_SANO;
    }
   }
  }
 }

 renderTiles(ctx) {
  for (let c = 0; c < this.cols; c++) {
   for (let r = 0; r < this.rows; r++) {
    const tile = this.grid[c][r];
    const pos = this.engine.gridToIso(c, r, this.originX, this.originY);
    const tileCanvas = TileTextureGenerator.createDiamondCanvas(tile.state, this.tileW, this.tileH);
    ctx.drawImage(tileCanvas, pos.x - this.tileW / 2, pos.y - this.tileH / 2);
   }
  }
 }

 renderGridOverlay(ctx) {
  if (!this.showGridLines && !this.showCoords) return;

  for (let c = 0; c < this.cols; c++) {
   for (let r = 0; r < this.rows; r++) {
    const pos = this.engine.gridToIso(c, r, this.originX, this.originY);
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
