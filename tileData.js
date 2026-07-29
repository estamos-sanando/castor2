'use strict';
/* ============================================================
   TILEDATA.JS — Estados Visuales Dinámicos de Casillas (Tiles 2:1)
   - TERRENO_SANO: Pasto/suelo patagónico limpio.
   - AGUA_RIO: Casilla del río central en flujo normal.
   - DIQUE: Casilla del río bloqueada por madera acumulada.
   - INUNDADO_BARRO: Casilla terrestre adyacente que cambia a tono lodoso/pantano.
   ============================================================ */

const TileState = Object.freeze({
  TERRENO_SANO:    'TERRENO_SANO',
  AGUA_RIO:        'AGUA_RIO',
  DIQUE:           'DIQUE',
  INUNDADO_BARRO:  'INUNDADO_BARRO'
});

const TILE_CONFIG = Object.freeze({
  [TileState.TERRENO_SANO]: {
    name: 'Terreno Sano (Pasto Patagónico)',
    baseColor: '#2e7d32',
    accentColor: '#388e3c',
    borderColor: '#1b5e20',
    walkable: true,
    water: false,
    buildable: true
  },
  [TileState.AGUA_RIO]: {
    name: 'Cauce del Río (Agua)',
    baseColor: '#1976d2',
    accentColor: '#0288d1',
    borderColor: '#0d47a1',
    walkable: false,
    water: true,
    buildable: true
  },
  [TileState.DIQUE]: {
    name: 'Dique de Castor (Represa)',
    baseColor: '#795548',
    accentColor: '#5d4037',
    borderColor: '#3e2723',
    walkable: true,
    water: false,
    buildable: false
  },
  [TileState.INUNDADO_BARRO]: {
    name: 'Suelo Inundado (Barro / Pantano)',
    baseColor: '#4e342e',
    accentColor: '#3e2723',
    borderColor: '#261712',
    walkable: true,
    water: true,
    buildable: false
  }
});

class TileTextureGenerator {
  static createDiamondCanvas(state, tileW = 64, tileH = 32) {
    const config = TILE_CONFIG[state] || TILE_CONFIG[TileState.TERRENO_SANO];
    const canvas = document.createElement('canvas');
    canvas.width = tileW;
    canvas.height = tileH;
    const ctx = canvas.getContext('2d');

    const halfW = tileW / 2;
    const halfH = tileH / 2;

    // Dibujar rombo isométrico 2:1
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(tileW, halfH);
    ctx.lineTo(halfW, tileH);
    ctx.lineTo(0, halfH);
    ctx.closePath();

    // Relleno de gradiente suave estilo AoE2
    const grad = ctx.createRadialGradient(halfW, halfH, 2, halfW, halfH, halfW);
    grad.addColorStop(0, config.accentColor);
    grad.addColorStop(1, config.baseColor);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    return canvas;
  }
}
