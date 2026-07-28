'use strict';
/* ============================================================
   TILEDATA.JS — Terrain Types & AoE2-Style Diamond Tile Textures
   ============================================================ */

const TerrainType = Object.freeze({
  GRASS_PRISTINE: 'GRASS_PRISTINE',
  DIRT_MUD:       'DIRT_MUD',
  WATER_RIVER:    'WATER_RIVER',
  WATER_SWAMP:    'WATER_SWAMP',
  SHORELINE:      'SHORELINE'
});

const TERRAIN_CONFIG = Object.freeze({
  [TerrainType.GRASS_PRISTINE]: {
    baseColor: '#2e7d32',
    accentColor: '#388e3c',
    borderColor: '#1b5e20',
    walkable: true,
    water: false,
    buildable: true
  },
  [TerrainType.DIRT_MUD]: {
    baseColor: '#6d4c41',
    accentColor: '#5d4037',
    borderColor: '#3e2723',
    walkable: true,
    water: false,
    buildable: true
  },
  [TerrainType.WATER_RIVER]: {
    baseColor: '#1976d2',
    accentColor: '#0288d1',
    borderColor: '#0d47a1',
    walkable: false,
    water: true,
    buildable: true
  },
  [TerrainType.WATER_SWAMP]: {
    baseColor: '#00695c',
    accentColor: '#004d40',
    borderColor: '#00251a',
    walkable: false,
    water: true,
    buildable: false
  },
  [TerrainType.SHORELINE]: {
    baseColor: '#8d6e63',
    accentColor: '#4e342e',
    borderColor: '#3e2723',
    walkable: true,
    water: false,
    buildable: true
  }
});

class TileTextureGenerator {
  static createDiamondCanvas(type, tileW = 64, tileH = 32) {
    const config = TERRAIN_CONFIG[type] || TERRAIN_CONFIG[TerrainType.GRASS_PRISTINE];
    const canvas = document.createElement('canvas');
    canvas.width = tileW;
    canvas.height = tileH;
    const ctx = canvas.getContext('2d');

    const halfW = tileW / 2;
    const halfH = tileH / 2;

    // Draw base isometric diamond
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(tileW, halfH);
    ctx.lineTo(halfW, tileH);
    ctx.lineTo(0, halfH);
    ctx.closePath();

    // Radial gradient fill styled like AoE2 terrain tiles
    const grad = ctx.createRadialGradient(halfW, halfH, 2, halfW, halfH, halfW);
    grad.addColorStop(0, config.accentColor);
    grad.addColorStop(1, config.baseColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle edge highlight
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    return canvas;
  }
}
