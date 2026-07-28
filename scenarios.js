'use strict';
/* ============================================================
   SCENARIOS.JS — Predefined Map Generator Scenario Loaders
   ============================================================ */

class ScenarioLoader {
  /**
   * Scenario 1: Pristine Native Forest (1946)
   * Clean central river with lush green pasture tiles on both banks.
   */
  static loadPristineForestScenario(mapEngine) {
    const map = mapEngine.map;
    for (let c = 0; c < map.cols; c++) {
      for (let r = 0; r < map.rows; r++) {
        const tile = map.getTile(c, r);
        if (!tile) continue;

        if (c >= 10 && c <= 13) {
          tile.type = TerrainType.WATER_RIVER;
          tile.water = true;
          tile.walkable = false;
        } else if (c === 9 || c === 14) {
          tile.type = TerrainType.SHORELINE;
          tile.water = false;
          tile.walkable = true;
        } else {
          tile.type = TerrainType.GRASS_PRISTINE;
          tile.water = false;
          tile.walkable = true;
        }
        tile.environmentalState = EnvironmentalState.PRISTINE;
      }
    }
  }

  /**
   * Scenario 2: Early Degradation & Beaver Gnawing (1965)
   * Patches of DIRT_MUD tiles spreading outward from riverbank.
   */
  static loadDegradedForestScenario(mapEngine) {
    this.loadPristineForestScenario(mapEngine);
    const map = mapEngine.map;
    
    // Spread mud patches around riverbanks
    [[8,6],[8,7],[9,6],[14,8],[15,8],[15,9],[7,14],[8,14],[15,16],[16,16]].forEach(([c,r]) => {
      const tile = map.getTile(c, r);
      if (tile) {
        tile.type = TerrainType.DIRT_MUD;
        tile.environmentalState = EnvironmentalState.DEGRADED;
      }
    });
  }

  /**
   * Scenario 3: Flooded Crisis & Beaver Dams (2005)
   * Central dam backs up water, submerging 4x4 land tiles into WATER_SWAMP and DIRT_MUD.
   */
  static loadFloodedCrisisScenario(mapEngine) {
    this.loadDegradedForestScenario(mapEngine);
    const map = mapEngine.map;

    // Expand swamp and flooded soil 4x4 around river dam center
    for (let c = 7; c <= 16; c++) {
      for (let r = 8; r <= 15; r++) {
        const tile = map.getTile(c, r);
        if (!tile) continue;
        if (c >= 9 && c <= 14) {
          tile.type = TerrainType.WATER_SWAMP;
          tile.water = true;
          tile.walkable = false;
        } else {
          tile.type = TerrainType.DIRT_MUD;
          tile.walkable = true;
        }
        tile.environmentalState = EnvironmentalState.CRISIS;
      }
    }
  }

  /**
   * Scenario 4: ENEEI Restoration & Sapling Reforestation (2026)
   * Swamp tiles dry up back to GRASS_PRISTINE, with clean soil ready for reforested saplings.
   */
  static loadRestoredEcosystemScenario(mapEngine) {
    this.loadPristineForestScenario(mapEngine);
    const map = mapEngine.map;

    // Small controlled soil patches ready for Lenga saplings
    [[8,10],[9,10],[14,12],[15,12]].forEach(([c,r]) => {
      const tile = map.getTile(c, r);
      if (tile) {
        tile.type = TerrainType.SHORELINE;
        tile.environmentalState = EnvironmentalState.RESTORED;
      }
    });
  }
}
