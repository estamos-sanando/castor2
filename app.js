'use strict';
/* =======================================================
   CASTORES EN TIERRA DEL FUEGO — High-Performance Game Engine
   60 FPS fixed-timestep loop · Canvas2D sprite cache
   Procedural fallback art · Web Audio SFX
   ======================================================= */

// ── STAGE DATA ───────────────────────────────────────────
const STAGES = [
  {
    id: 0, year: 1946, src: 'assets/maps/map_01_inicial.jpg',
    title: '1. Bosque Virgen (1946)',
    newsDate: 'NOVIEMBRE DE 1946',
    newsTitle: 'Introducción del castor en Tierra del Fuego',
    newsText: 'El gobierno argentino libera 25 parejas de Castor canadensis en la cuenca del Río Las Fosas para desarrollar una industria peletera. El bosque de lengas y guindos permanece intacto.',
    beavers: 5, dams: 0, health: 100, flooded: 0,
    palette: { sky: '#7cbfe8', ground: '#3a5c28' }
  },
  {
    id: 1, year: 1965, src: 'assets/maps/map_02_primer_deterioro.jpg',
    title: '2. Primer Deterioro (1965)',
    newsDate: 'MARZO DE 1965',
    newsTitle: 'Sin predadores: los castores se multiplican',
    newsText: 'Sin lobos ni pumas que los cacen y sin demanda de pieles, la población explota. Aparecen los primeros diques y roeduras en troncos centenarios.',
    beavers: 25, dams: 8, health: 88, flooded: 150,
    palette: { sky: '#a8c8e0', ground: '#4a6a30' }
  },
  {
    id: 2, year: 1985, src: 'assets/maps/map_03_bosque_parcial.jpg',
    title: '3. Inundación Parcial (1985)',
    newsDate: 'OCTUBRE DE 1985',
    newsTitle: 'Los castores cruzan el Canal Beagle',
    newsText: 'La especie conquista la Isla Navarino en Chile. Las represas inundan hectáreas de lenga (Nothofagus pumilio), que no tiene mecanismos de rebrote tras inundaciones.',
    beavers: 60, dams: 25, health: 65, flooded: 1200,
    palette: { sky: '#b0b8c8', ground: '#3a4f38' }
  },
  {
    id: 3, year: 2005, src: 'assets/maps/map_04_bosque_inundado.jpg',
    title: '4. Embalse Masivo (2005)',
    newsDate: 'ENERO DE 2005',
    newsTitle: 'Emergencia ecológica: bosques fantasma',
    newsText: 'Más de 100.000 castores. Más de 30.000 ha de bosque subpolar convertidas en cementerios de árboles grises en pie, sumergidos en estanques artificiales.',
    beavers: 110, dams: 55, health: 40, flooded: 8500,
    palette: { sky: '#8898a8', ground: '#2a3a32' }
  },
  {
    id: 4, year: 2016, src: 'assets/maps/map_05_bosque_devastado.jpg',
    title: '5. Devastación Total (2016)',
    newsDate: 'SEPTIEMBRE DE 2016',
    newsTitle: 'Erradicación binacional Argentina–Chile',
    newsText: 'El acuerdo FMAM/FAO financia la erradicación piloto. El daño ambiental supera los 66 millones de dólares. El paisaje es un campo de tocones y barro.',
    beavers: 150, dams: 90, health: 20, flooded: 25000,
    palette: { sky: '#6a7a88', ground: '#1e2a22' }
  },
  {
    id: 5, year: 2026, src: 'assets/maps/map_06_restauracion_parcial.jpg',
    title: '6. Restauración Parcial (2026)',
    newsDate: 'HOY — 2026',
    newsTitle: 'Monitoreo científico y recuperación vegetal',
    newsText: 'En áreas piloto, guardaparques y científicas remueven diques y protegen renuevos de lenga. La restauración tomará siglos, pero los primeros brotes aparecen en la turbera.',
    beavers: 40, dams: 20, health: 55, flooded: 11000,
    palette: { sky: '#90c4a8', ground: '#2e5030' }
  }
];

// ── AUDIO ENGINE (Web Audio API) ──────────────────────────
class AudioEngine {
  constructor() { this.ctx = null; }
  boot() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  _osc(type, freq, dur, vol = 0.12) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.4, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur);
  }
  click()   { this._osc('triangle', 660, 0.06, 0.1); }
  chop()    { this._osc('square',   140, 0.09, 0.15); }
  splash()  {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.18, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    src.buffer = buf; filt.type = 'lowpass'; filt.frequency.value = 700;
    g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    src.connect(filt); filt.connect(g); g.connect(this.ctx.destination);
    src.start();
  }
}
const SFX = new AudioEngine();

// ── SPRITE PAINTER — High-Fidelity Canvas2D Sprites ──────
// Based on reference art sheets: painted illustration style,
// rich fur textures, detailed characters, Patagonian flora
class SpritePainter {
  static _oc(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h; return c;
  }

  // ── Utility helpers ─────────────────────────────────────
  static _shadow(x, cx, cy, rx, ry) {
    x.save(); x.globalAlpha = 0.32;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    x.fillStyle = '#000'; x.fill(); x.restore();
  }

  static _furStroke(x, x1, y1, x2, y2, col, w = 1) {
    x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round';
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  }

  // ── BEAVER (Adult) — matches reference sheet exactly ─────
  // action: 'idle'|'walk'|'cut'|'carry'|'build'|'celebrate'
  static beaver(size = 96, action = 'idle') {
    const W = size, H = size;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');
    const s = size / 96;

    // Project shadow
    this._shadow(ctx, W * 0.5, H * 0.88, W * 0.28, H * 0.07);

    ctx.save();

    if (action === 'celebrate') {
      this._drawBeaverCelebrate(ctx, W, H, s);
    } else if (action === 'cut') {
      this._drawBeaverCut(ctx, W, H, s);
    } else if (action === 'carry') {
      this._drawBeaverCarry(ctx, W, H, s);
    } else if (action === 'build') {
      this._drawBeaverBuild(ctx, W, H, s);
    } else {
      // idle / walk — same base pose, slight body lean for walk
      const lean = action === 'walk' ? 0.08 : 0;
      this._drawBeaverBase(ctx, W, H, s, lean);
    }

    ctx.restore();
    return c;
  }

  static _drawBeaverBase(ctx, W, H, s, lean = 0) {
    // ── Flat scaly tail ──
    ctx.save();
    ctx.translate(W * 0.22, H * 0.68);
    ctx.rotate(lean - 0.15);
    // Tail shape (oval, flattened)
    const tg = ctx.createLinearGradient(-22*s, 0, 22*s, 0);
    tg.addColorStop(0, '#2a1a10'); tg.addColorStop(0.5, '#3d2818'); tg.addColorStop(1, '#1a0e08');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(0, 0, 22*s, 9*s, 0, 0, Math.PI*2); ctx.fill();
    // Scale texture on tail
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.6*s;
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 5; col++) {
        ctx.beginPath();
        ctx.arc(-16*s + col*8*s, -3*s + r*4*s, 3*s, 0, Math.PI);
        ctx.stroke();
      }
    }
    ctx.restore();

    // ── Body (main rounded form) ──
    ctx.save();
    ctx.translate(W * 0.5, H * 0.62);
    ctx.rotate(lean);

    // Deep shadow under body
    const bodyG = ctx.createRadialGradient(-8*s, -10*s, 2*s, 0, 0, 30*s);
    bodyG.addColorStop(0, '#c07840');  // lit side highlight
    bodyG.addColorStop(0.35, '#8a5020'); // mid fur
    bodyG.addColorStop(0.7, '#5a3010'); // dark side
    bodyG.addColorStop(1, '#2e1608');   // deep shadow
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28*s, 20*s, 0, 0, Math.PI*2);
    ctx.fill();

    // Fur texture — short radiating strokes (like reference art)
    const furDark = '#3d200c', furMid = '#7a4018', furLight = '#c07030';
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r0 = 18*s, r1 = 26*s;
      const brightness = Math.cos(a - 2.4); // light from top-left
      const col = brightness > 0.3 ? furLight : brightness > -0.2 ? furMid : furDark;
      this._furStroke(ctx,
        Math.cos(a)*r0, Math.sin(a)*r0*0.72,
        Math.cos(a)*r1, Math.sin(a)*r1*0.72,
        col, 0.8*s
      );
    }

    // Belly fur (lighter, softer)
    const bellyG = ctx.createRadialGradient(8*s, 6*s, 0, 8*s, 6*s, 18*s);
    bellyG.addColorStop(0, 'rgba(200,150,80,0.5)');
    bellyG.addColorStop(1, 'rgba(100,60,20,0)');
    ctx.fillStyle = bellyG;
    ctx.beginPath(); ctx.ellipse(8*s, 8*s, 16*s, 10*s, 0, 0, Math.PI*2); ctx.fill();

    ctx.restore();

    // ── Head ──
    ctx.save();
    ctx.translate(W * 0.65, H * 0.4);

    const headG = ctx.createRadialGradient(-6*s, -6*s, 2*s, 0, 0, 18*s);
    headG.addColorStop(0, '#c88040');
    headG.addColorStop(0.4, '#8a5020');
    headG.addColorStop(1, '#3a1c08');
    ctx.fillStyle = headG;
    ctx.beginPath(); ctx.arc(0, 0, 16*s, 0, Math.PI*2); ctx.fill();

    // Head fur strokes
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const bright = Math.cos(a - 2.4);
      const col = bright > 0.2 ? '#c07030' : bright > -0.3 ? '#7a4018' : '#3d200c';
      this._furStroke(ctx, Math.cos(a)*10*s, Math.sin(a)*10*s, Math.cos(a)*15*s, Math.sin(a)*15*s, col, 0.7*s);
    }

    // Ear (rounded, dark inside)
    ctx.fillStyle = '#3d2010';
    ctx.beginPath(); ctx.ellipse(-9*s, -12*s, 5*s, 6*s, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#6a2810';
    ctx.beginPath(); ctx.ellipse(-9*s, -11*s, 3*s, 4*s, -0.3, 0, Math.PI*2); ctx.fill();

    // Eye — dark, glossy, with highlight dot
    ctx.fillStyle = '#0a0602';
    ctx.beginPath(); ctx.arc(8*s, -5*s, 4*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2a1808'; // iris
    ctx.beginPath(); ctx.arc(8*s, -5*s, 3*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';   // highlight
    ctx.beginPath(); ctx.arc(9.5*s, -6.5*s, 1.2*s, 0, Math.PI*2); ctx.fill();

    // Nose — dark brown, small
    ctx.fillStyle = '#1a0c06';
    ctx.beginPath(); ctx.ellipse(15*s, 1*s, 4*s, 2.8*s, 0.15, 0, Math.PI*2); ctx.fill();
    // Nose highlight
    ctx.fillStyle = 'rgba(255,200,160,0.25)';
    ctx.beginPath(); ctx.ellipse(14*s, 0, 2*s, 1.2*s, 0.15, 0, Math.PI*2); ctx.fill();

    // Characteristic orange-yellow incisors (KEY identifying feature)
    ctx.fillStyle = '#e8a020';
    ctx.beginPath(); ctx.roundRect(12*s, 4*s, 4.5*s, 7*s, [1*s, 1*s, 2*s, 2*s]); ctx.fill();
    ctx.fillStyle = '#ffcc40';
    ctx.beginPath(); ctx.roundRect(13*s, 4*s, 2*s, 7*s, [1*s, 1*s, 2*s, 2*s]); ctx.fill(); // lighter left side
    ctx.fillStyle = '#c07010';
    ctx.beginPath(); ctx.roundRect(16*s, 4*s, 4*s, 7*s, [1*s, 1*s, 2*s, 2*s]); ctx.fill();
    ctx.fillStyle = '#ffcc40';
    ctx.beginPath(); ctx.roundRect(17*s, 4*s, 1.5*s, 7*s, [1*s, 1*s, 2*s, 2*s]); ctx.fill();
    // Tooth divider line
    ctx.strokeStyle = '#8a5010'; ctx.lineWidth = 0.8*s;
    ctx.beginPath(); ctx.moveTo(16*s, 4.5*s); ctx.lineTo(16*s, 11*s); ctx.stroke();

    ctx.restore();

    // ── Front paws ──
    ctx.fillStyle = '#5a3010';
    ctx.save(); ctx.translate(W*0.7, H*0.7);
    ctx.beginPath(); ctx.ellipse(0, 0, 7*s, 4.5*s, 0.3, 0, Math.PI*2); ctx.fill();
    // Claws
    ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 0.8*s;
    [-4, -1.5, 1, 3.5, 5.5].forEach(cx => {
      ctx.beginPath(); ctx.moveTo(cx*s, -2*s); ctx.lineTo(cx*s+1*s, -5*s); ctx.stroke();
    });
    ctx.restore();

    ctx.save(); ctx.translate(W*0.4, H*0.72);
    ctx.beginPath(); ctx.ellipse(0, 0, 6*s, 4*s, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  static _drawBeaverCut(ctx, W, H, s) {
    // Beaver crouched down gnawing at pointed tree stump
    // Draw stump first (behind beaver)
    ctx.save(); ctx.translate(W*0.7, H*0.55);
    const stG = ctx.createLinearGradient(-10*s, -30*s, 10*s, 0);
    stG.addColorStop(0, '#a0703a'); stG.addColorStop(1, '#5a3a18');
    ctx.fillStyle = stG;
    ctx.beginPath();
    ctx.moveTo(-10*s, 0); ctx.lineTo(-8*s, -28*s); ctx.lineTo(0, -40*s); ctx.lineTo(8*s, -28*s); ctx.lineTo(10*s, 0);
    ctx.closePath(); ctx.fill();
    // End cap (rings)
    ctx.fillStyle = '#d0a060';
    ctx.beginPath(); ctx.ellipse(0, -28*s, 8*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#9a7030'; ctx.lineWidth = 0.7*s;
    [6, 4, 2].forEach(r => { ctx.beginPath(); ctx.ellipse(0, -28*s, r*s, r*0.6*s, 0, 0, Math.PI*2); ctx.stroke(); });
    // Wood chips flying
    ['#d4a060','#b88040','#e0c080'].forEach((col, i) => {
      ctx.fillStyle = col; ctx.save();
      ctx.translate((-16+i*6)*s, (-20+i*4)*s); ctx.rotate(i * 0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, 4*s, 2*s, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // Beaver crouched, head forward gnawing
    ctx.save(); ctx.translate(-8*s, 8*s); // shift beaver slightly left
    this._drawBeaverBase(ctx, W, H, s, 0.15);
    ctx.restore();
  }

  static _drawBeaverCarry(ctx, W, H, s) {
    // Carrying a log on its back/in paws
    this._drawBeaverBase(ctx, W, H, s, 0.05);
    // Log on top/side
    ctx.save(); ctx.translate(W*0.45, H*0.42); ctx.rotate(-0.35);
    const lG = ctx.createLinearGradient(0, -6*s, 0, 6*s);
    lG.addColorStop(0, '#c49a6c'); lG.addColorStop(0.5, '#e0b870'); lG.addColorStop(1, '#7a5030');
    ctx.fillStyle = lG;
    ctx.beginPath(); ctx.roundRect(-24*s, -5.5*s, 48*s, 11*s, 5*s); ctx.fill();
    ctx.strokeStyle = '#4a2810'; ctx.lineWidth = 1*s; ctx.stroke();
    // End rings on log
    ctx.fillStyle = '#d0a060';
    ctx.beginPath(); ctx.ellipse(-24*s, 0, 5*s, 5.5*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#8a6030'; ctx.lineWidth = 0.7*s;
    [4, 2.5, 1].forEach(r => { ctx.beginPath(); ctx.ellipse(-24*s, 0, r*s, r*s*0.9, 0, 0, Math.PI*2); ctx.stroke(); });
    // Bark texture lines
    ctx.strokeStyle = '#6a4020'; ctx.lineWidth = 0.5*s;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(i*8*s, -5*s); ctx.lineTo(i*8*s+2*s, 5*s); ctx.stroke();
    }
    ctx.restore();
  }

  static _drawBeaverBuild(ctx, W, H, s) {
    // Pushing/stacking logs onto dam pile
    this._drawBeaverBase(ctx, W, H, s, 0.1);
    // Pile of logs in front
    ctx.save(); ctx.translate(W*0.2, H*0.75);
    [[0,0,32,8,'#8a6030'],[4,-8,28,7,'#a07040'],[-4,-14,24,7,'#7a5020']].forEach(([tx,ty,lw,lh,col],i) => {
      ctx.save(); ctx.translate(tx*s, ty*s); ctx.rotate(-0.1+i*0.1);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.roundRect(-lw*s/2, -lh*s/2, lw*s, lh*s, 3*s); ctx.fill();
      ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 0.8*s; ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  static _drawBeaverCelebrate(ctx, W, H, s) {
    // Standing upright, arms raised — matches reference "Celebrate" pose
    // Shadow
    this._shadow(ctx, W*0.5, H*0.9, 20*s, 7*s);
    // Tail behind
    const tg = ctx.createLinearGradient(0, 0, 20*s, 0);
    tg.addColorStop(0, '#2a1810'); tg.addColorStop(1, '#3d2818');
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(W*0.4, H*0.78, 18*s, 7*s, 0.2, 0, Math.PI*2); ctx.fill();
    // Body (upright)
    const bodyG = ctx.createRadialGradient(W*0.44, H*0.6, 2*s, W*0.5, H*0.62, 22*s);
    bodyG.addColorStop(0, '#c07840'); bodyG.addColorStop(0.5, '#8a5020'); bodyG.addColorStop(1, '#3a1c08');
    ctx.fillStyle = bodyG;
    ctx.beginPath(); ctx.ellipse(W*0.5, H*0.64, 18*s, 22*s, 0, 0, Math.PI*2); ctx.fill();
    // Arms raised! (key celebrate pose)
    const armG = ctx.createLinearGradient(0, 0, 0, 20*s);
    armG.addColorStop(0, '#7a4018'); armG.addColorStop(1, '#3a1c08');
    // Left arm up-left
    ctx.save(); ctx.translate(W*0.28, H*0.54); ctx.rotate(-1.1);
    ctx.fillStyle = armG;
    ctx.beginPath(); ctx.roundRect(-5*s, -18*s, 10*s, 20*s, 4*s); ctx.fill();
    ctx.restore();
    // Right arm up-right
    ctx.save(); ctx.translate(W*0.72, H*0.54); ctx.rotate(1.1);
    ctx.fillStyle = armG;
    ctx.beginPath(); ctx.roundRect(-5*s, -18*s, 10*s, 20*s, 4*s); ctx.fill();
    ctx.restore();
    // Head
    const headG = ctx.createRadialGradient(W*0.44, H*0.36, 2*s, W*0.5, H*0.4, 15*s);
    headG.addColorStop(0, '#c88040'); headG.addColorStop(1, '#4a2010');
    ctx.fillStyle = headG;
    ctx.beginPath(); ctx.arc(W*0.5, H*0.4, 14*s, 0, Math.PI*2); ctx.fill();
    // Wide happy eyes
    ctx.fillStyle = '#0a0602';
    ctx.beginPath(); ctx.arc(W*0.42, H*0.37, 3.5*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.58, H*0.37, 3.5*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(W*0.435, H*0.36, 1.2*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.595, H*0.36, 1.2*s, 0, Math.PI*2); ctx.fill();
    // Big smile
    ctx.strokeStyle = '#1a0a00'; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.arc(W*0.5, H*0.4, 7*s, 0.1, Math.PI-0.1); ctx.stroke();
    // Teeth
    ctx.fillStyle = '#ffcc40';
    ctx.beginPath(); ctx.roundRect(W*0.44, H*0.455, 4*s, 5*s, 1*s); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.5, H*0.455, 4*s, 5*s, 1*s); ctx.fill();
    // Sparkle star effects
    [[-18,-20,'#ffd700'],[20,-22,'#ff9944'],[0,-28,'#44ddff']].forEach(([dx,dy,col]) => {
      ctx.fillStyle = col; ctx.font = `bold ${11*s}px sans-serif`;
      ctx.textAlign = 'center'; ctx.fillText('✦', W*0.5+dx*s, H*0.3+dy*s);
    });
  }

  // ── BEAVER SMALL (juvenile) ───────────────────────────────
  // Matches reference: smaller, rounder, lighter brown fur
  static beaver_small(size = 64) {
    const W = size, H = size;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d'), s = size / 64;

    this._shadow(ctx, W*0.5, H*0.88, 18*s, 5*s);

    // Tiny tail
    ctx.fillStyle = '#3d2818';
    ctx.beginPath(); ctx.ellipse(W*0.25, H*0.7, 14*s, 5.5*s, -0.2, 0, Math.PI*2); ctx.fill();

    // Chubby juvenile body (rounder, less elongated)
    const bodyG = ctx.createRadialGradient(W*0.44, H*0.56, 2*s, W*0.5, H*0.6, 18*s);
    bodyG.addColorStop(0, '#d09050'); bodyG.addColorStop(0.4, '#a07030'); bodyG.addColorStop(1, '#4a2810');
    ctx.fillStyle = bodyG;
    ctx.beginPath(); ctx.ellipse(W*0.52, H*0.62, 18*s, 16*s, 0, 0, Math.PI*2); ctx.fill();

    // Soft belly
    ctx.fillStyle = 'rgba(210,160,80,0.45)';
    ctx.beginPath(); ctx.ellipse(W*0.56, H*0.66, 10*s, 8*s, 0, 0, Math.PI*2); ctx.fill();

    // Big juvenile head (proportionally larger, very round)
    const headG = ctx.createRadialGradient(W*0.60, H*0.34, 1*s, W*0.63, H*0.38, 14*s);
    headG.addColorStop(0, '#d09848'); headG.addColorStop(1, '#5a3010');
    ctx.fillStyle = headG;
    ctx.beginPath(); ctx.arc(W*0.62, H*0.38, 13*s, 0, Math.PI*2); ctx.fill();

    // Big innocent eyes (juvenile proportions)
    ctx.fillStyle = '#0a0602';
    ctx.beginPath(); ctx.arc(W*0.68, H*0.34, 4*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(W*0.695, H*0.325, 1.4*s, 0, Math.PI*2); ctx.fill();

    // Small ear
    ctx.fillStyle = '#4a2010';
    ctx.beginPath(); ctx.ellipse(W*0.55, H*0.26, 4*s, 5*s, -0.3, 0, Math.PI*2); ctx.fill();

    // Tiny nose
    ctx.fillStyle = '#1a0c06';
    ctx.beginPath(); ctx.ellipse(W*0.73, H*0.39, 3*s, 2*s, 0, 0, Math.PI*2); ctx.fill();

    // Nubby milk teeth (still growing)
    ctx.fillStyle = '#ffcc40';
    ctx.beginPath(); ctx.roundRect(W*0.72, H*0.43, 3*s, 4*s, 1*s); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.76, H*0.43, 2.5*s, 4*s, 1*s); ctx.fill();

    // Tiny paws
    ctx.fillStyle = '#5a3010';
    ctx.beginPath(); ctx.ellipse(W*0.68, H*0.72, 5*s, 3.5*s, 0.3, 0, Math.PI*2); ctx.fill();

    return c;
  }

  // ── GUARDAPARQUE (Park Ranger) ───────────────────────────
  // Reference: olive/khaki uniform, cap, badge, dark pants
  // actions: 'idle'|'walk'|'trap'
  static ranger(size = 96, action = 'idle') {
    const W = size, H = Math.round(size * 1.35);
    const c = this._oc(W, H);
    const ctx = c.getContext('2d'), s = size / 96;

    this._shadow(ctx, W*0.5, H*0.96, 20*s, 6*s);

    // ── Boots ──
    ctx.fillStyle = '#1a1208';
    ctx.beginPath(); ctx.roundRect(W*0.28, H*0.84, 14*s, 16*s, [0,0,4*s,4*s]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.52, H*0.84, 14*s, 16*s, [0,0,4*s,4*s]); ctx.fill();

    // ── Dark olive pants ──
    const pantsG = ctx.createLinearGradient(W*0.28, 0, W*0.72, 0);
    pantsG.addColorStop(0, '#3a4028'); pantsG.addColorStop(0.5, '#4a5030'); pantsG.addColorStop(1, '#2e3420');
    ctx.fillStyle = pantsG;
    ctx.beginPath(); ctx.roundRect(W*0.28, H*0.6, 14*s, 26*s, 3*s); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.52, H*0.6, 14*s, 26*s, 3*s); ctx.fill();

    // ── Shirt / Jacket (khaki/olive — classic Parques Nacionales) ──
    const shirtG = ctx.createLinearGradient(W*0.18, H*0.32, W*0.82, H*0.62);
    shirtG.addColorStop(0, '#8a8a58'); shirtG.addColorStop(0.5, '#6e6e42'); shirtG.addColorStop(1, '#4a4a2e');
    ctx.fillStyle = shirtG;
    ctx.beginPath();
    ctx.moveTo(W*0.22, H*0.62); ctx.lineTo(W*0.22, H*0.32);
    ctx.quadraticCurveTo(W*0.5, H*0.28, W*0.78, H*0.32);
    ctx.lineTo(W*0.78, H*0.62); ctx.closePath(); ctx.fill();

    // Shirt pockets
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.roundRect(W*0.3, H*0.38, 10*s, 10*s, 1*s); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.58, H*0.38, 10*s, 10*s, 1*s); ctx.fill();

    // Badge (Parques Nacionales emblem)
    ctx.fillStyle = '#d4af37';
    ctx.beginPath(); ctx.arc(W*0.35, H*0.37, 5*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0a3a0a'; ctx.font = `bold ${5*s}px sans-serif`;
    ctx.textAlign = 'center'; ctx.fillText('PN', W*0.35, H*0.37 + 2*s);

    // Arms
    ctx.fillStyle = '#7a7a4e';
    ctx.save(); ctx.translate(W*0.16, H*0.4); ctx.rotate(action === 'walk' ? 0.3 : 0.1);
    ctx.beginPath(); ctx.roundRect(-6*s, 0, 12*s, 24*s, 5*s); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(W*0.84, H*0.4); ctx.rotate(action === 'walk' ? -0.3 : -0.1);
    ctx.beginPath(); ctx.roundRect(-6*s, 0, 12*s, 24*s, 5*s); ctx.fill();
    ctx.restore();

    // Hands
    ctx.fillStyle = '#f0c89a';
    ctx.beginPath(); ctx.ellipse(W*0.14, H*0.65, 5*s, 4*s, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W*0.86, H*0.65, 5*s, 4*s, -0.3, 0, Math.PI*2); ctx.fill();

    // Trap (Install Cage Trap pose)
    if (action === 'trap') {
      ctx.fillStyle = '#9a9a9a'; ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2*s;
      ctx.beginPath(); ctx.roundRect(W*0.52, H*0.68, 36*s, 20*s, 2*s); ctx.fill(); ctx.stroke();
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(W*0.52+i*9*s, H*0.68); ctx.lineTo(W*0.52+i*9*s, H*0.88); ctx.stroke();
      }
      for (let j = 1; j < 3; j++) {
        ctx.beginPath(); ctx.moveTo(W*0.52, H*0.68+j*6.7*s); ctx.lineTo(W*0.52+36*s, H*0.68+j*6.7*s); ctx.stroke();
      }
    }

    // ── Belt ──
    ctx.fillStyle = '#2a200e'; ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 1*s;
    ctx.beginPath(); ctx.roundRect(W*0.24, H*0.58, 46*s, 5*s, 1*s); ctx.fill(); ctx.stroke();
    // Belt buckle
    ctx.fillStyle = '#d4af37';
    ctx.beginPath(); ctx.roundRect(W*0.46, H*0.58, 8*s, 5*s, 1*s); ctx.fill();

    // ── Neck ──
    ctx.fillStyle = '#e8b890';
    ctx.beginPath(); ctx.roundRect(W*0.44, H*0.2, 12*s, 14*s, 3*s); ctx.fill();

    // ── Head ──
    ctx.fillStyle = '#f0c89a';
    ctx.beginPath(); ctx.arc(W*0.5, H*0.18, 14*s, 0, Math.PI*2); ctx.fill();
    // Ear
    ctx.fillStyle = '#e0b888';
    ctx.beginPath(); ctx.ellipse(W*0.36, H*0.18, 3.5*s, 4.5*s, 0, 0, Math.PI*2); ctx.fill();
    // Hair (short, dark)
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath(); ctx.arc(W*0.5, H*0.15, 14*s, Math.PI, 0); ctx.fill();
    // Eyes
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.arc(W*0.44, H*0.17, 2*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.56, H*0.17, 2*s, 0, Math.PI*2); ctx.fill();

    // ── Ranger Cap (flat-brimmed) ──
    // Brim
    ctx.fillStyle = '#5a4a28';
    ctx.beginPath(); ctx.ellipse(W*0.5, H*0.08, 20*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
    // Crown
    ctx.fillStyle = '#6a5a30';
    ctx.beginPath(); ctx.roundRect(W*0.34, H*0.01, 32*s, 10*s, 4*s); ctx.fill();
    // Cap band
    ctx.fillStyle = '#d4af37'; ctx.lineWidth = 0;
    ctx.fillRect(W*0.34, H*0.085, 32*s, 2*s);

    return c;
  }

  // ── CIENTÍFICA (Field Scientist) ──────────────────────────
  // Reference: white lab coat over field clothes, backpack, gloves
  // actions: 'idle'|'walk'|'gather'|'clipboard'
  static scientist(size = 96, action = 'idle') {
    const W = size, H = Math.round(size * 1.35);
    const c = this._oc(W, H);
    const ctx = c.getContext('2d'), s = size / 96;

    this._shadow(ctx, W*0.5, H*0.96, 20*s, 6*s);

    // ── Boots / shoes (waterproof) ──
    ctx.fillStyle = '#1e2820';
    ctx.beginPath(); ctx.roundRect(W*0.3, H*0.86, 13*s, 14*s, [0,0,4*s,4*s]); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.52, H*0.86, 13*s, 14*s, [0,0,4*s,4*s]); ctx.fill();

    // ── Dark field pants ──
    ctx.fillStyle = '#3a4050';
    ctx.beginPath(); ctx.roundRect(W*0.3, H*0.62, 13*s, 26*s, 3*s); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.52, H*0.62, 13*s, 26*s, 3*s); ctx.fill();

    // ── White lab coat / field jacket ──
    const coatG = ctx.createLinearGradient(W*0.2, 0, W*0.8, 0);
    coatG.addColorStop(0, '#f0f0f0'); coatG.addColorStop(0.5, '#e8e8e8'); coatG.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = coatG;
    ctx.beginPath();
    ctx.moveTo(W*0.2, H*0.64); ctx.lineTo(W*0.2, H*0.3);
    ctx.quadraticCurveTo(W*0.5, H*0.25, W*0.8, H*0.3);
    ctx.lineTo(W*0.8, H*0.64); ctx.closePath(); ctx.fill();
    // Coat lapels / opening
    ctx.fillStyle = '#c8d0d8'; // field clothes underneath
    ctx.beginPath();
    ctx.moveTo(W*0.42, H*0.3); ctx.lineTo(W*0.5, H*0.28); ctx.lineTo(W*0.58, H*0.3);
    ctx.lineTo(W*0.55, H*0.64); ctx.lineTo(W*0.45, H*0.64); ctx.closePath(); ctx.fill();
    // Coat pocket
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1*s;
    ctx.beginPath(); ctx.roundRect(W*0.58, H*0.42, 12*s, 12*s, 2*s); ctx.stroke();

    // ── Backpack (field equipment pack) ──
    const packG = ctx.createLinearGradient(W*0.68, H*0.3, W*0.82, H*0.6);
    packG.addColorStop(0, '#5a7048'); packG.addColorStop(1, '#3a4a30');
    ctx.fillStyle = packG;
    ctx.beginPath(); ctx.roundRect(W*0.7, H*0.29, 18*s, 26*s, 4*s); ctx.fill();
    ctx.strokeStyle = '#2a3820'; ctx.lineWidth = 0.8*s; ctx.stroke();
    // Pack straps
    ctx.strokeStyle = '#4a6040'; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.moveTo(W*0.75, H*0.29); ctx.lineTo(W*0.69, H*0.38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.82, H*0.29); ctx.lineTo(W*0.78, H*0.38); ctx.stroke();

    // ── Arms ──
    ctx.fillStyle = '#e0e0e0';
    const leftRot = action === 'gather' ? 0.6 : action === 'walk' ? 0.25 : 0.1;
    const rightRot = action === 'clipboard' ? -0.8 : action === 'walk' ? -0.25 : -0.1;
    ctx.save(); ctx.translate(W*0.16, H*0.36); ctx.rotate(leftRot);
    ctx.beginPath(); ctx.roundRect(-5.5*s, 0, 11*s, 24*s, 4*s); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(W*0.84, H*0.36); ctx.rotate(rightRot);
    ctx.beginPath(); ctx.roundRect(-5.5*s, 0, 11*s, 24*s, 4*s); ctx.fill();
    ctx.restore();

    // Gloved hands (blue nitrile — field sample collection)
    ctx.fillStyle = '#5090d8';
    ctx.beginPath(); ctx.ellipse(W*0.14, H*0.62, 5.5*s, 4*s, leftRot*0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W*0.86, H*0.62, 5.5*s, 4*s, -rightRot*0.5, 0, Math.PI*2); ctx.fill();

    // Clipboard (Consult Clipboard action)
    if (action === 'clipboard' || action === 'idle') {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#888'; ctx.lineWidth = 1.2*s;
      ctx.save(); ctx.translate(W*0.78, H*0.44); ctx.rotate(-0.5);
      ctx.beginPath(); ctx.roundRect(-8*s, -12*s, 16*s, 22*s, 2*s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d0e8f0';
      ctx.fillRect(-6*s, -8*s, 12*s, 2*s); ctx.fillRect(-6*s, -4*s, 8*s, 2*s); ctx.fillRect(-6*s, 0, 10*s, 2*s);
      ctx.restore();
    }

    // Sample bag (Gather Sample action)
    if (action === 'gather') {
      ctx.fillStyle = '#a0c070'; ctx.strokeStyle = '#607040'; ctx.lineWidth = 1*s;
      ctx.save(); ctx.translate(W*0.18, H*0.7); ctx.rotate(0.5);
      ctx.beginPath(); ctx.roundRect(-6*s, -6*s, 12*s, 14*s, 2*s); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // ── Neck & Head ──
    ctx.fillStyle = '#edb890';
    ctx.beginPath(); ctx.roundRect(W*0.44, H*0.2, 12*s, 12*s, 3*s); ctx.fill();
    ctx.fillStyle = '#f5c8a0';
    ctx.beginPath(); ctx.arc(W*0.5, H*0.17, 13.5*s, 0, Math.PI*2); ctx.fill();

    // Hair (dark, pulled back in ponytail — matches reference female scientist)
    ctx.fillStyle = '#3a2010';
    ctx.beginPath(); ctx.arc(W*0.5, H*0.14, 13.5*s, Math.PI, 0); ctx.fill();
    // Ponytail
    ctx.beginPath();
    ctx.moveTo(W*0.62, H*0.12); ctx.quadraticCurveTo(W*0.72, H*0.16, W*0.68, H*0.28);
    ctx.lineWidth = 5*s; ctx.strokeStyle = '#3a2010'; ctx.stroke();

    // Safety glasses
    ctx.strokeStyle = '#2060a0'; ctx.lineWidth = 1.5*s; ctx.fillStyle = 'rgba(100,180,240,0.25)';
    ctx.beginPath(); ctx.roundRect(W*0.36, H*0.155, 9*s, 7*s, 2*s); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(W*0.5, H*0.155, 9*s, 7*s, 2*s); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2060a0'; ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.moveTo(W*0.45, H*0.18); ctx.lineTo(W*0.5, H*0.18); ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.arc(W*0.42, H*0.17, 1.8*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.56, H*0.17, 1.8*s, 0, Math.PI*2); ctx.fill();

    return c;
  }

  // ── LENGA / ÑIRE TREE (Healthy) — matches reference sheet ─
  static tree_healthy(variant = 0) {
    const W = 130, H = 180;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    // Color variants matching reference (green summer, yellow-green, warm autumn)
    const palettes = [
      { dark: '#1a4a10', mid: '#2e6a1e', light: '#4a8a2a', hi: '#7ab84a', trunk: '#6a4020' },
      { dark: '#1e4814', mid: '#336622', light: '#52892e', hi: '#88c04a', trunk: '#7a4a22' },
      { dark: '#264a10', mid: '#3a6a1a', light: '#5a8a28', hi: '#8ab840', trunk: '#6a3a1a' },
      { dark: '#1c4a18', mid: '#2e6a22', light: '#48882e', hi: '#78b84a', trunk: '#5a3818' },
      { dark: '#384020', mid: '#4a5828', light: '#6a7838', hi: '#9aaa5a', trunk: '#5a4020' }, // yellow-green
      { dark: '#4a3820', mid: '#6a5028', light: '#8a6a30', hi: '#b09050', trunk: '#6a4020' }, // autumn gold
      { dark: '#1e3810', mid: '#2c5018', light: '#446820', hi: '#70983a', trunk: '#5a3818' },
      { dark: '#203c14', mid: '#306020', light: '#4c802a', hi: '#7cb042', trunk: '#623c1a' },
      { dark: '#2a4a18', mid: '#3e6a24', light: '#5a8a30', hi: '#8cc048', trunk: '#6a4020' },
      { dark: '#163a10', mid: '#24581a', light: '#3c7422', hi: '#60a038', trunk: '#5a3818' }
    ];
    const p = palettes[variant % 10];

    // Projected shadow on ground
    this._shadow(ctx, 65, 168, 38, 10);

    // ── Trunk (detailed bark) ──
    const trunkG = ctx.createLinearGradient(52, 80, 78, 80);
    trunkG.addColorStop(0, '#2a1408'); trunkG.addColorStop(0.35, p.trunk); trunkG.addColorStop(0.7, '#8a6030'); trunkG.addColorStop(1, '#3a2010');
    ctx.fillStyle = trunkG;
    ctx.beginPath();
    ctx.moveTo(50, 168); ctx.bezierCurveTo(48, 140, 48, 110, 52, 88);
    ctx.lineTo(62, 88); ctx.bezierCurveTo(66, 110, 68, 140, 66, 168);
    ctx.closePath(); ctx.fill();

    // Bark texture
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(51 + i*3, 100 + i*2); ctx.quadraticCurveTo(53+i*2, 130, 52+i*3, 165);
      ctx.stroke();
    }

    // Root flare
    ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(51, 168); ctx.quadraticCurveTo(36, 170, 26, 174); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(65, 168); ctx.quadraticCurveTo(80, 170, 90, 174); ctx.stroke();

    // ── Foliage — 4 organic layers (matches reference stacked cloud style) ──
    const drawFoliage = (cx, cy, rx, ry, col, hiCol, opacity = 1) => {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
      // Highlight cluster on sun side (top-left)
      ctx.fillStyle = hiCol; ctx.globalAlpha = opacity * 0.45;
      ctx.beginPath(); ctx.ellipse(cx - rx*0.28, cy - ry*0.28, rx*0.45, ry*0.4, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    };

    // Back layer (darkest — fully in shadow)
    drawFoliage(65, 92, 48, 34, p.dark, p.mid, 0.9);
    drawFoliage(38, 78, 32, 25, p.dark, p.mid, 0.85);
    drawFoliage(90, 80, 28, 22, p.dark, p.mid, 0.8);

    // Mid layer
    drawFoliage(60, 72, 42, 30, p.mid, p.light);
    drawFoliage(44, 62, 30, 24, p.mid, p.light, 0.9);
    drawFoliage(82, 68, 26, 20, p.mid, p.light, 0.9);

    // Front layer (brightest)
    drawFoliage(58, 58, 36, 26, p.light, p.hi);
    drawFoliage(48, 50, 22, 18, p.light, p.hi, 0.9);
    drawFoliage(74, 54, 20, 17, p.light, p.hi, 0.85);

    // Top cluster
    drawFoliage(60, 38, 24, 20, p.light, p.hi);
    drawFoliage(62, 24, 16, 15, p.mid, p.hi);

    return c;
  }

  // ── DEAD TREE (Ghost forest) ─────────────────────────────
  static tree_dead() {
    const W = 120, H = 180;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    this._shadow(ctx, 60, 170, 28, 8);

    const tg = ctx.createLinearGradient(46, 50, 72, 50);
    tg.addColorStop(0, '#6a7878'); tg.addColorStop(0.4, '#c0cccc'); tg.addColorStop(0.7, '#9aacac'); tg.addColorStop(1, '#4a5858');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(50, 168); ctx.bezierCurveTo(48, 140, 48, 90, 52, 58);
    ctx.lineTo(60, 54); ctx.lineTo(66, 58); ctx.bezierCurveTo(70, 90, 72, 140, 68, 168);
    ctx.closePath(); ctx.fill();

    // Crack/damage marks on trunk
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(52+i*5, 80+i*10); ctx.lineTo(56+i*3, 120+i*8);
      ctx.stroke();
    }

    // Dead branches — organic, curved
    ctx.strokeStyle = '#8a9898'; ctx.lineCap = 'round';
    const branches = [
      [57, 115, 0.3, [[-35, -25], [-48, -38], [-28, -20]]],
      [57, 98, -0.2, [[38, -22], [52, -36], [30, -16]]],
      [57, 80, 0.15, [[-30, -30], [-42, -46], [-18, -22]]],
      [57, 68, -0.1, [[30, -28], [44, -44], [22, -20]]],
      [57, 58, 0.05, [[-14, -35], [-8, -55], [6, -40]]]
    ];
    branches.forEach(([sx, sy, rot, ends]) => {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
      ends.forEach(([ex, ey], i) => {
        ctx.lineWidth = 3 - i * 0.8;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(ex*0.5, ey*0.5, ex, ey);
        ctx.stroke();
        // Smaller twigs at tips
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex-4, ey-8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex+5, ey-6); ctx.stroke();
      });
      ctx.restore();
    });

    return c;
  }

  // ── FLOODED TREE ─────────────────────────────────────────
  static tree_flooded() {
    const W = 120, H = 180;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    // Water pool at base
    const wg = ctx.createRadialGradient(60, 165, 0, 60, 162, 45);
    wg.addColorStop(0, 'rgba(50,120,160,0.85)'); wg.addColorStop(0.6, 'rgba(30,80,110,0.6)'); wg.addColorStop(1, 'transparent');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.ellipse(60, 162, 45, 14, 0, 0, Math.PI*2); ctx.fill();
    // Algae ring at waterline
    ctx.strokeStyle = '#3a6030'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(60, 155, 20, 6, 0, 0, Math.PI*2); ctx.stroke();

    // Submerged base (dark, murky)
    const sg = ctx.createLinearGradient(50, 150, 70, 150);
    sg.addColorStop(0, '#2a3a30'); sg.addColorStop(0.5, '#3a4a3a'); sg.addColorStop(1, '#1a2820');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.roundRect(50, 148, 20, 20, 3); ctx.fill();

    // Above waterline trunk (weathered grey)
    const tg = ctx.createLinearGradient(50, 50, 70, 50);
    tg.addColorStop(0, '#505858'); tg.addColorStop(0.4, '#9aaaaa'); tg.addColorStop(1, '#383e3e');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(50, 152); ctx.lineTo(52, 56); ctx.lineTo(60, 52); ctx.lineTo(68, 56); ctx.lineTo(70, 152);
    ctx.closePath(); ctx.fill();

    // Dead branches (fewer than full dead tree)
    ctx.strokeStyle = '#6a8080'; ctx.lineCap = 'round';
    [[57,105,0.2,[[-32,-22],[42,-26]]],[57,82,-0.1,[[-26,-28],[36,-32]]],[57,62,0.05,[[-18,-32],[22,-30]]]].forEach(([sx,sy,rot,ends]) => {
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(rot);
      ends.forEach(([ex,ey],i) => {
        ctx.lineWidth = 2.5 - i*0.5;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(ex*0.5,ey*0.6,ex,ey); ctx.stroke();
      });
      ctx.restore();
    });

    return c;
  }

  // ── STUMP — Fresco (fresh) and Viejo (old) ───────────────
  static stump(age = 'fresh') {
    const W = 80, H = 90;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    this._shadow(ctx, 40, 82, 30, 8);

    const isOld = age === 'old';
    const trunkCol = isOld ? '#6a7878' : '#7a5030';
    const cutCol   = isOld ? '#b0bcbc' : '#e0b870';
    const ringCol  = isOld ? '#8a9898' : '#b89060';

    // Body
    const sg = ctx.createLinearGradient(14, 50, 66, 50);
    sg.addColorStop(0, isOld ? '#505858':'#5a3818'); sg.addColorStop(0.5, trunkCol); sg.addColorStop(1, isOld ? '#383e3e':'#3e2010');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(16, 80); ctx.lineTo(18, 44); ctx.lineTo(62, 44); ctx.lineTo(64, 80); ctx.closePath(); ctx.fill();

    // Beaver-chewed pointed top (pencil shape — very distinctive)
    const cg = ctx.createLinearGradient(18, 14, 62, 44);
    cg.addColorStop(0, cutCol); cg.addColorStop(1, isOld ? '#8a9898' : '#c8a060');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.moveTo(18, 44); ctx.lineTo(40, 14); ctx.lineTo(62, 44); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = isOld ? '#606868' : '#8a6030'; ctx.lineWidth = 1.2; ctx.stroke();

    // Annual growth rings on cut surface
    ctx.strokeStyle = ringCol; ctx.lineWidth = 0.8;
    [14, 9, 5, 2].forEach(r => {
      ctx.beginPath(); ctx.ellipse(40, 44, r, r*0.42, 0, 0, Math.PI*2); ctx.stroke();
    });

    // Bark texture lines on body
    ctx.strokeStyle = isOld ? '#404848' : '#3a2010'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(20+i*12, 46); ctx.lineTo(19+i*12, 78); ctx.stroke();
    }

    // Wood chips scattered at base
    if (!isOld) {
      ['#e0c080','#d0a860','#f0d090'].forEach((col, i) => {
        ctx.fillStyle = col; ctx.save();
        ctx.translate(10+i*20, 76+i%2*3); ctx.rotate(i*0.4);
        ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });
    }

    // Old stump: moss growing on top
    if (isOld) {
      ctx.fillStyle = 'rgba(50,100,40,0.6)';
      ctx.beginPath(); ctx.ellipse(40, 44, 16, 6, 0, 0, Math.PI*2); ctx.fill();
    }

    return c;
  }

  // ── LOG (fallen tree trunk) ───────────────────────────────
  static log(decayed = false) {
    const W = 100, H = 50;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    this._shadow(ctx, 50, 44, 42, 7);

    const col1 = decayed ? '#6a6060' : '#c49a6c';
    const col2 = decayed ? '#4a4040' : '#9a7040';
    const col3 = decayed ? '#3a3030' : '#6a4a20';

    // Log barrel shape (isometric perspective)
    const lg = ctx.createLinearGradient(6, 8, 94, 8);
    lg.addColorStop(0, col3); lg.addColorStop(0.3, col1); lg.addColorStop(0.7, col2); lg.addColorStop(1, col3);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(6, 20); ctx.quadraticCurveTo(6, 38, 50, 38); ctx.quadraticCurveTo(94, 38, 94, 20);
    ctx.lineTo(94, 16); ctx.quadraticCurveTo(94, 8, 50, 8); ctx.quadraticCurveTo(6, 8, 6, 16); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = col3; ctx.lineWidth = 1.2; ctx.stroke();

    // End cap with annual rings
    ctx.fillStyle = decayed ? '#7a7070' : '#d8aa70';
    ctx.beginPath(); ctx.ellipse(50, 16, 44, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = decayed ? '#505050' : '#9a7040'; ctx.lineWidth = 0.8;
    [38, 28, 18, 10, 4].forEach(r => {
      ctx.beginPath(); ctx.ellipse(50, 16, r, r*0.22, 0, 0, Math.PI*2); ctx.stroke();
    });

    // Bark texture
    ctx.strokeStyle = decayed ? 'rgba(0,0,0,0.4)' : 'rgba(60,30,0,0.3)'; ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(15+i*13, 12); ctx.quadraticCurveTo(16+i*13, 25, 15+i*13, 37); ctx.stroke();
    }

    // Moss on old log
    if (decayed) {
      ctx.fillStyle = 'rgba(40,90,30,0.5)';
      ctx.beginPath(); ctx.ellipse(50, 9, 30, 6, 0, 0, Math.PI*2); ctx.fill();
    }

    return c;
  }

  // ── BUSH (Calafate / Notro) ──────────────────────────────
  static bush() {
    const W = 90, H = 75;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    this._shadow(ctx, 45, 68, 34, 9);

    // Main foliage mass (Calafate — deep green, dense)
    const layers = [
      [45, 56, 36, 24, '#1b5e20', '#2e7d32'],
      [30, 48, 22, 17, '#1a5c1e', '#287024'],
      [60, 50, 20, 16, '#1a5c1e', '#287024'],
      [45, 42, 30, 20, '#2e7d32', '#3e8e3a'],
      [34, 36, 16, 13, '#2a7428', '#3e8e3a'],
      [58, 37, 14, 12, '#2a7428', '#3e8e3a'],
      [45, 28, 22, 16, '#3a8a30', '#52a042'],
    ];

    layers.forEach(([cx,cy,rx,ry,dark,light]) => {
      // Dark base
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
      // Light highlight on sun side
      ctx.fillStyle = light; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(cx-rx*0.25, cy-ry*0.3, rx*0.45, ry*0.4, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Calafate blue-purple berries (very distinctive for Patagonia)
    const berryPositions = [[22,44],[30,36],[40,30],[50,28],[62,34],[70,44],[38,50],[56,48],[28,52],[62,52]];
    berryPositions.forEach(([bx,by]) => {
      ctx.fillStyle = '#5c35be';
      ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; // berry highlight
      ctx.beginPath(); ctx.arc(bx-0.8, by-0.8, 0.8, 0, Math.PI*2); ctx.fill();
    });

    // Some yellow flowers (Notro)
    [[46,26],[68,38]].forEach(([fx,fy]) => {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#e67e22';
      ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, Math.PI*2); ctx.fill();
    });

    return c;
  }

  // ── MOSS / LICHEN (Patagonian peat bog) ──────────────────
  static moss() {
    const W = 80, H = 50;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    // Multiple organic blobs creating peat bog moss texture
    const blobs = [
      [16, 32, 15, 10, '#2e5a1e'],
      [38, 28, 18, 12, '#3a6a28'],
      [60, 32, 14, 10, '#2a5820'],
      [26, 22, 12, 9, '#4a7a30'],
      [50, 22, 14, 10, '#3e7028'],
      [38, 16, 16, 11, '#52882e'],
      [22, 16, 10, 8, '#4a8030'],
      [55, 17, 11, 8, '#4a8030'],
      [38, 10, 13, 9, '#5a9038'],
    ];
    blobs.forEach(([cx,cy,rx,ry,col]) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
    });

    // Highlights on moss bumps
    const highlights = [[36, 8, 4, 3], [20, 14, 3, 2], [54, 15, 3.5, 2.5]];
    highlights.forEach(([cx,cy,rx,ry]) => {
      ctx.fillStyle = '#8acc50'; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Lichen patches (pale grey-green)
    [[58, 24, 10, 5], [12, 26, 9, 4]].forEach(([cx,cy,rx,ry]) => {
      ctx.fillStyle = '#8aaa6a'; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    return c;
  }

  // ── GRASS (Pasto Patagónico) ─────────────────────────────
  static grass() {
    const W = 70, H = 55;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    // Tussock grass clusters (Festuca-style Patagonian)
    const clusters = [[15,48],[30,44],[45,42],[60,46],[22,38],[50,36]];
    clusters.forEach(([cx,cy]) => {
      const cols = ['#4a6a20','#3a5818','#5a7828','#687c2e'];
      for (let b = 0; b < 8; b++) {
        const a = (b/8)*Math.PI*2 + Math.random()*0.3;
        const len = 14 + Math.random()*8;
        ctx.strokeStyle = cols[Math.floor(Math.random()*4)];
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx+Math.cos(a)*len*0.5, cy-len*0.6, cx+Math.cos(a)*len, cy-len);
        ctx.stroke();
      }
    });

    return c;
  }

  // ── ROCK (Patagonian river stone) ────────────────────────
  static rock() {
    const W = 95, H = 65;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    this._shadow(ctx, 38, 57, 28, 8);
    this._shadow(ctx, 72, 54, 18, 6);

    // Large rock
    const rg = ctx.createRadialGradient(28, 22, 3, 36, 30, 32);
    rg.addColorStop(0, '#d0d8d0'); rg.addColorStop(0.4, '#909898'); rg.addColorStop(1, '#3c4848');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(10,48); ctx.quadraticCurveTo(8,26,26,18); ctx.quadraticCurveTo(48,10,58,24);
    ctx.quadraticCurveTo(68,38,56,48); ctx.quadraticCurveTo(42,58,24,54); ctx.closePath(); ctx.fill();
    // Highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(16,32); ctx.quadraticCurveTo(26,22,42,26); ctx.stroke();
    // Lichen patches
    [[28,34,6,3.5,'#7a9040'],[42,40,5,3,'#6a8030']].forEach(([cx,cy,rx,ry,col]) => {
      ctx.fillStyle = col; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    });

    // Smaller rock beside
    const rg2 = ctx.createRadialGradient(66,24,2,72,30,22);
    rg2.addColorStop(0,'#b8c0b8'); rg2.addColorStop(1,'#404848');
    ctx.fillStyle = rg2;
    ctx.beginPath();
    ctx.moveTo(56,46); ctx.quadraticCurveTo(54,30,64,22); ctx.quadraticCurveTo(76,16,84,28);
    ctx.quadraticCurveTo(90,38,80,46); ctx.quadraticCurveTo(70,52,56,46); ctx.closePath(); ctx.fill();

    return c;
  }

  // ── WILDFLOWERS (Flores Silvestres) ──────────────────────
  static wildflowers() {
    const W = 70, H = 55;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    // Stems
    const stems = [[18,48],[32,44],[50,46],[62,42]];
    stems.forEach(([sx,sy]) => {
      ctx.strokeStyle = '#3a6020'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx+2, sy-18); ctx.stroke();
    });

    // Flowers (variety of Patagonian species)
    const flowers = [
      { cx:20, cy:30, petals:6, pCol:'#e8a0c0', cCol:'#f1c40f' },  // pink
      { cx:34, cy:26, petals:8, pCol:'#fff',    cCol:'#f1c40f' },  // daisy
      { cx:52, cy:28, petals:6, pCol:'#c0a0e0', cCol:'#f39c12' },  // purple
      { cx:64, cy:24, petals:8, pCol:'#fff',    cCol:'#f1c40f' },  // daisy
    ];

    flowers.forEach(fl => {
      for (let p = 0; p < fl.petals; p++) {
        const a = (p / fl.petals) * Math.PI * 2;
        ctx.fillStyle = fl.pCol;
        ctx.beginPath(); ctx.ellipse(fl.cx+Math.cos(a)*5, fl.cy+Math.sin(a)*5, 3.5, 2, a, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = fl.cCol;
      ctx.beginPath(); ctx.arc(fl.cx, fl.cy, 3.5, 0, Math.PI*2); ctx.fill();
    });

    // Small leaves
    ctx.fillStyle = '#3a6020';
    [[22,38],[36,34],[48,40]].forEach(([lx,ly]) => {
      ctx.save(); ctx.translate(lx,ly); ctx.rotate(0.3);
      ctx.beginPath(); ctx.ellipse(0,0,4,2.5,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    });

    return c;
  }

  // ── PARTICLE SPRITES ─────────────────────────────────────
  static leaf_particle(color = '#4a8c2a') {
    const c = this._oc(14, 14);
    const x = c.getContext('2d');
    x.fillStyle = color;
    x.beginPath();
    x.moveTo(7, 1); x.bezierCurveTo(13, 4, 13, 10, 7, 13); x.bezierCurveTo(1, 10, 1, 4, 7, 1);
    x.closePath(); x.fill();
    // Midrib
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(7,2); x.lineTo(7,12); x.stroke();
    return c;
  }

  static wood_chip() {
    const c = this._oc(12, 8);
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 12, 0);
    g.addColorStop(0, '#d4b06c'); g.addColorStop(0.5, '#e8c880'); g.addColorStop(1, '#b89050');
    x.fillStyle = g;
    x.beginPath(); x.roundRect(0, 0, 12, 8, 2); x.fill();
    x.strokeStyle = '#8a6030'; x.lineWidth = 0.5; x.stroke();
    return c;
  }

  // ── DAM (Beaver dam, 3 sizes) ─────────────────────────────
  static dam(level = 1) {
    const W = 80 + level * 40, H = 50 + level * 15;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d');

    // Mud base
    const mg = ctx.createLinearGradient(0, H*0.55, 0, H);
    mg.addColorStop(0, '#4a3528'); mg.addColorStop(1, '#1e120a');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.ellipse(W/2, H*0.82, W*0.44, H*0.22, 0, 0, Math.PI*2); ctx.fill();

    // Logs stacked at angles (organic, messy like real beaver dam)
    const logColors = ['#9a7060','#7a5840','#8a6852','#b08870','#6a4830'];
    const logAngles = [-0.22, 0.18, -0.08, 0.25, -0.15, 0.10, -0.28, 0.05];
    const logCount = 4 + level * 2;
    for (let i = 0; i < logCount; i++) {
      const yPos = H * (0.12 + (i / logCount) * 0.55);
      const lw = W * (0.28 + Math.sin(i * 7.3) * 0.18);
      const lh = 5 + level * 1.2;
      const xOff = W * 0.1 + Math.sin(i * 3.7) * W * 0.12;

      const lg = ctx.createLinearGradient(xOff, yPos, xOff, yPos+lh);
      const col = logColors[i % logColors.length];
      lg.addColorStop(0, col); lg.addColorStop(1, '#3e2010');
      ctx.fillStyle = lg;
      ctx.save(); ctx.translate(xOff + lw/2, yPos + lh/2); ctx.rotate(logAngles[i % logAngles.length]);
      ctx.beginPath(); ctx.roundRect(-lw/2, -lh/2, lw, lh, 2); ctx.fill();
      ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.restore();
    }

    // Mud/debris fill between logs
    ctx.fillStyle = '#5a3e28'; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.ellipse(W/2, H*0.6, W*0.35, H*0.25, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // Water seeping through (animated-ready trickling lines)
    ctx.strokeStyle = 'rgba(80,160,210,0.7)'; ctx.lineWidth = 1.5;
    for (let d = 0; d < level + 1; d++) {
      const dx = W * (0.3 + d * 0.15);
      ctx.beginPath(); ctx.moveTo(dx, H*0.65); ctx.quadraticCurveTo(dx+4, H*0.75, dx-2, H*0.88); ctx.stroke();
    }

    return c;
  }

  // Aliases for celebrate / small
  static beaver_celebrate(size = 60) { return this.beaver(size, 'celebrate'); }
  static beaver_small(size = 64) { return this.beaver_small_impl(size); }
  static beaver_small_impl(size = 64) {
    // Redirect to the correct static method
    const W = size, H = size;
    const c = this._oc(W, H);
    const ctx = c.getContext('2d'), s = size / 64;
    this._shadow(ctx, W*0.5, H*0.88, 18*s, 5*s);
    ctx.fillStyle = '#3d2818';
    ctx.beginPath(); ctx.ellipse(W*0.25, H*0.7, 14*s, 5.5*s, -0.2, 0, Math.PI*2); ctx.fill();
    const bodyG = ctx.createRadialGradient(W*0.44, H*0.56, 2*s, W*0.5, H*0.6, 18*s);
    bodyG.addColorStop(0, '#d09050'); bodyG.addColorStop(0.4, '#a07030'); bodyG.addColorStop(1, '#4a2810');
    ctx.fillStyle = bodyG;
    ctx.beginPath(); ctx.ellipse(W*0.52, H*0.62, 18*s, 16*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(210,160,80,0.45)';
    ctx.beginPath(); ctx.ellipse(W*0.56, H*0.66, 10*s, 8*s, 0, 0, Math.PI*2); ctx.fill();
    const headG = ctx.createRadialGradient(W*0.60, H*0.34, 1*s, W*0.63, H*0.38, 14*s);
    headG.addColorStop(0, '#d09848'); headG.addColorStop(1, '#5a3010');
    ctx.fillStyle = headG;
    ctx.beginPath(); ctx.arc(W*0.62, H*0.38, 13*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a2010';
    ctx.beginPath(); ctx.ellipse(W*0.55, H*0.26, 4*s, 5*s, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0a0602';
    ctx.beginPath(); ctx.arc(W*0.68, H*0.34, 4*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(W*0.695, H*0.325, 1.4*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a0c06';
    ctx.beginPath(); ctx.ellipse(W*0.73, H*0.39, 3*s, 2*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffcc40';
    ctx.beginPath(); ctx.roundRect(W*0.72, H*0.43, 3*s, 4*s, 1*s); ctx.fill();
    ctx.beginPath(); ctx.roundRect(W*0.76, H*0.43, 2.5*s, 4*s, 1*s); ctx.fill();
    ctx.fillStyle = '#5a3010';
    ctx.beginPath(); ctx.ellipse(W*0.68, H*0.72, 5*s, 3.5*s, 0.3, 0, Math.PI*2); ctx.fill();
    return c;
  }
}

  static beaver(size = 80, action = 'idle') {
    const c = this._oc(size, size);
    const x = c.getContext('2d');
    const s = size / 80;

    // Shadow
    x.save(); x.globalAlpha = 0.35;
    x.beginPath(); x.ellipse(40*s, 72*s, 22*s, 8*s, 0, 0, Math.PI*2);
    x.fillStyle = '#000'; x.fill(); x.restore();

    // Tail (scaly paddle)
    x.save();
    const tg = x.createLinearGradient(0, 0, 24*s, 12*s);
    tg.addColorStop(0, '#3d2b1f'); tg.addColorStop(1, '#1a0f09');
    x.fillStyle = tg;
    x.beginPath(); x.ellipse(14*s, 54*s, 16*s, 7*s, -0.3, 0, Math.PI*2);
    x.fill();
    // scale lines on tail
    x.strokeStyle = '#2a1a10'; x.lineWidth = 0.8*s;
    for (let i = 0; i < 3; i++) {
      x.beginPath();
      x.moveTo((6+i*3)*s, (50+i)*s); x.lineTo((22+i*3)*s, (52+i)*s);
      x.stroke();
    }
    x.restore();

    // Body
    const bg = x.createRadialGradient(46*s, 42*s, 4*s, 44*s, 46*s, 28*s);
    bg.addColorStop(0, '#a36838'); bg.addColorStop(0.5, '#7a4a1e'); bg.addColorStop(1, '#3d200c');
    x.fillStyle = bg;
    x.beginPath(); x.ellipse(44*s, 50*s, 22*s, 18*s, -0.15, 0, Math.PI*2);
    x.fill();
    x.strokeStyle = '#2d1407'; x.lineWidth = 1.2*s; x.stroke();

    // Belly lighter fur
    const bvg = x.createRadialGradient(50*s, 54*s, 2*s, 50*s, 54*s, 14*s);
    bvg.addColorStop(0, 'rgba(180,140,90,0.55)'); bvg.addColorStop(1, 'transparent');
    x.fillStyle = bvg;
    x.beginPath(); x.ellipse(52*s, 54*s, 13*s, 10*s, 0, 0, Math.PI*2); x.fill();

    // Head
    const hg = x.createRadialGradient(56*s, 28*s, 2*s, 56*s, 32*s, 14*s);
    hg.addColorStop(0, '#b87840'); hg.addColorStop(1, '#6a3a14');
    x.fillStyle = hg;
    x.beginPath(); x.arc(56*s, 32*s, 14*s, 0, Math.PI*2); x.fill();
    x.strokeStyle = '#2d1407'; x.lineWidth = 1.2*s; x.stroke();

    // Ear
    x.fillStyle = '#3d200c';
    x.beginPath(); x.ellipse(50*s, 20*s, 4*s, 5*s, -0.4, 0, Math.PI*2); x.fill();
    x.fillStyle = '#7a3a14';
    x.beginPath(); x.ellipse(50*s, 21*s, 2.5*s, 3.5*s, -0.4, 0, Math.PI*2); x.fill();

    // Eye
    x.fillStyle = '#1a1008';
    x.beginPath(); x.arc(61*s, 29*s, 3*s, 0, Math.PI*2); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(62.5*s, 27.5*s, 1*s, 0, Math.PI*2); x.fill();

    // Nose
    x.fillStyle = '#1a0c06';
    x.beginPath(); x.ellipse(68*s, 34*s, 3.5*s, 2.5*s, 0, 0, Math.PI*2); x.fill();

    // Characteristic orange teeth
    x.fillStyle = '#ff8800';
    x.beginPath(); x.roundRect(66*s, 36*s, 3.5*s, 5.5*s, 1*s); x.fill();
    x.fillStyle = '#ffaa00';
    x.beginPath(); x.roundRect(70*s, 36*s, 3*s, 5.5*s, 1*s); x.fill();
    x.strokeStyle = '#cc5500'; x.lineWidth = 0.5*s;
    x.strokeRect(66*s, 36*s, 3.5*s, 5.5*s); x.strokeRect(70*s, 36*s, 3*s, 5.5*s);

    // Paws (front)
    x.fillStyle = '#5a3010';
    x.beginPath(); x.ellipse(62*s, 62*s, 6*s, 4*s, 0.3, 0, Math.PI*2); x.fill();
    x.beginPath(); x.ellipse(38*s, 64*s, 5*s, 3.5*s, -0.2, 0, Math.PI*2); x.fill();

    // If action=cut: draw log being chewed
    if (action === 'cut') {
      const lg = x.createLinearGradient(4*s, 0, 22*s, 0);
      lg.addColorStop(0, '#c49a6c'); lg.addColorStop(0.5, '#e8c88a'); lg.addColorStop(1, '#a0703a');
      x.fillStyle = lg;
      x.beginPath(); x.roundRect(2*s, 36*s, 18*s, 32*s, 3*s); x.fill();
      x.strokeStyle = '#6a4010'; x.lineWidth = 1*s; x.stroke();
      // rings
      x.strokeStyle = '#b89060'; x.lineWidth = 0.6*s;
      x.beginPath(); x.ellipse(11*s, 36*s, 7*s, 3*s, 0, 0, Math.PI*2); x.stroke();
      x.beginPath(); x.ellipse(11*s, 36*s, 3*s, 1.5*s, 0, 0, Math.PI*2); x.stroke();
    }

    // If action=carry: log on back
    if (action === 'carry') {
      const lg2 = x.createLinearGradient(20*s, 28*s, 20*s, 44*s);
      lg2.addColorStop(0, '#c49a6c'); lg2.addColorStop(1, '#7a4a1e');
      x.fillStyle = lg2;
      x.save(); x.translate(30*s, 34*s); x.rotate(-0.4);
      x.beginPath(); x.roundRect(-4*s, -5*s, 34*s, 9*s, 3*s); x.fill();
      x.strokeStyle = '#4a2a0a'; x.lineWidth = 1*s; x.stroke();
      x.restore();
    }

    return c;
  }

  static castor_small(size = 56) {
    const c = this._oc(size, size);
    const x = c.getContext('2d'), s = size / 80;
    // Same as beaver but 70% scale, lighter fur for juvenile
    x.save(); x.translate(12*s, 16*s); x.scale(0.7, 0.7);
    const parent = SpritePainter.beaver(80, 'idle').getContext('2d');
    x.drawImage(parent.canvas, 0, 0);
    x.restore();
    return c;
  }

  static ranger(size = 80) {
    const c = this._oc(size, size);
    const x = c.getContext('2d'), s = size / 80;

    // Shadow
    x.globalAlpha = 0.35; x.beginPath();
    x.ellipse(40*s, 76*s, 18*s, 7*s, 0, 0, Math.PI*2);
    x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;

    // Boots
    x.fillStyle = '#1a120a';
    x.beginPath(); x.roundRect(28*s, 62*s, 11*s, 16*s, 3*s); x.fill();
    x.beginPath(); x.roundRect(41*s, 62*s, 11*s, 16*s, 3*s); x.fill();

    // Pants (khaki)
    x.fillStyle = '#6b5a3e';
    x.beginPath(); x.roundRect(27*s, 42*s, 12*s, 22*s, 2*s); x.fill();
    x.beginPath(); x.roundRect(41*s, 42*s, 12*s, 22*s, 2*s); x.fill();

    // Jacket (Parques Nacionales green)
    const jg = x.createLinearGradient(20*s, 18*s, 60*s, 44*s);
    jg.addColorStop(0, '#3d6e34'); jg.addColorStop(1, '#1c3e18');
    x.fillStyle = jg;
    x.beginPath(); x.roundRect(22*s, 22*s, 36*s, 22*s, 4*s); x.fill();

    // Gold badge on chest
    x.fillStyle = '#d4af37';
    x.beginPath(); x.arc(32*s, 30*s, 4*s, 0, Math.PI*2); x.fill();
    x.fillStyle = '#1c3e18'; x.font = `bold ${5*s}px sans-serif`;
    x.textAlign = 'center'; x.fillText('PN', 32*s, 32*s);

    // Arms
    x.fillStyle = '#3d6e34';
    x.beginPath(); x.roundRect(14*s, 24*s, 10*s, 18*s, 4*s); x.fill();
    x.beginPath(); x.roundRect(56*s, 24*s, 10*s, 18*s, 4*s); x.fill();

    // Binoculars
    x.fillStyle = '#111'; x.strokeStyle = '#444'; x.lineWidth = 0.8*s;
    x.beginPath(); x.roundRect(28*s, 34*s, 8*s, 6*s, 2*s); x.fill(); x.stroke();
    x.beginPath(); x.roundRect(36*s, 34*s, 8*s, 6*s, 2*s); x.fill(); x.stroke();

    // Neck & head skin
    x.fillStyle = '#f5c89a';
    x.beginPath(); x.roundRect(36*s, 14*s, 8*s, 10*s, 2*s); x.fill();
    x.beginPath(); x.arc(40*s, 14*s, 10*s, 0, Math.PI*2); x.fill();

    // Ranger hat (flat-brimmed)
    x.fillStyle = '#7a5229';
    x.beginPath(); x.ellipse(40*s, 10*s, 16*s, 5*s, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = '#5a3818';
    x.beginPath(); x.roundRect(28*s, 2*s, 24*s, 10*s, 3*s); x.fill();
    x.fillStyle = '#d4af37'; x.fillRect(28*s, 10*s, 24*s, 1.5*s);

    // Face
    x.fillStyle = '#1a0a00';
    x.beginPath(); x.arc(37*s, 14*s, 1.5*s, 0, Math.PI*2); x.fill();
    x.beginPath(); x.arc(43*s, 14*s, 1.5*s, 0, Math.PI*2); x.fill();

    return c;
  }

  static scientist(size = 80) {
    const c = this._oc(size, size);
    const x = c.getContext('2d'), s = size / 80;

    // Shadow
    x.globalAlpha = 0.35; x.beginPath();
    x.ellipse(40*s, 76*s, 17*s, 7*s, 0, 0, Math.PI*2);
    x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;

    // Waterproof boots
    x.fillStyle = '#1e2a1e';
    x.beginPath(); x.roundRect(28*s, 62*s, 11*s, 16*s, 4*s); x.fill();
    x.beginPath(); x.roundRect(41*s, 62*s, 11*s, 16*s, 4*s); x.fill();

    // Pants (dark blue)
    x.fillStyle = '#1c2e48';
    x.beginPath(); x.roundRect(27*s, 42*s, 12*s, 22*s, 2*s); x.fill();
    x.beginPath(); x.roundRect(41*s, 42*s, 12*s, 22*s, 2*s); x.fill();

    // High-visibility yellow anorak
    const ag = x.createLinearGradient(20*s, 18*s, 60*s, 44*s);
    ag.addColorStop(0, '#f1c40f'); ag.addColorStop(1, '#b7950b');
    x.fillStyle = ag;
    x.beginPath(); x.roundRect(22*s, 22*s, 36*s, 22*s, 5*s); x.fill();

    // Reflective stripe
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.fillRect(22*s, 34*s, 36*s, 3*s);

    // Arms
    x.fillStyle = '#e0b008';
    x.beginPath(); x.roundRect(14*s, 24*s, 10*s, 18*s, 4*s); x.fill();
    x.beginPath(); x.roundRect(56*s, 24*s, 10*s, 18*s, 4*s); x.fill();

    // Clipboard (monitoring notebook)
    x.fillStyle = '#fff'; x.strokeStyle = '#555'; x.lineWidth = 1*s;
    x.beginPath(); x.roundRect(52*s, 32*s, 14*s, 20*s, 2*s); x.fill(); x.stroke();
    x.fillStyle = '#3498db'; x.fillRect(55*s, 37*s, 8*s, 1.5*s);
    x.fillStyle = '#7f8c8d'; x.fillRect(55*s, 40*s, 6*s, 1.5*s); x.fillRect(55*s, 43*s, 9*s, 1.5*s);

    // Neck & head
    x.fillStyle = '#f0c89a';
    x.beginPath(); x.roundRect(36*s, 14*s, 8*s, 10*s, 2*s); x.fill();
    x.beginPath(); x.arc(40*s, 14*s, 10*s, 0, Math.PI*2); x.fill();

    // Hair (dark, pulled back)
    x.fillStyle = '#4a2808';
    x.beginPath(); x.arc(40*s, 12*s, 10*s, Math.PI, 0); x.fill();
    x.beginPath(); x.arc(50*s, 16*s, 4*s, 0, Math.PI*2); x.fill(); // bun

    // Safety glasses
    x.strokeStyle = '#2980b9'; x.lineWidth = 1.2*s; x.fillStyle = 'rgba(135,206,235,0.3)';
    x.beginPath(); x.roundRect(34*s, 14*s, 6*s, 5*s, 2*s); x.fill(); x.stroke();
    x.beginPath(); x.roundRect(41*s, 14*s, 6*s, 5*s, 2*s); x.fill(); x.stroke();
    x.strokeStyle = '#2980b9'; x.lineWidth = 1*s;
    x.beginPath(); x.moveTo(40*s, 16.5*s); x.lineTo(41*s, 16.5*s); x.stroke();

    // Eyes
    x.fillStyle = '#1a0a00';
    x.beginPath(); x.arc(37*s, 16*s, 1.5*s, 0, Math.PI*2); x.fill();
    x.beginPath(); x.arc(43*s, 16*s, 1.5*s, 0, Math.PI*2); x.fill();

    return c;
  }

  static tree_healthy(variant = 0) {
    const c = this._oc(110, 160);
    const x = c.getContext('2d');
    const hues = [120, 100, 135, 115, 108, 95, 130, 118, 105, 125];
    const h = hues[variant % 10];

    // Shadow
    x.globalAlpha = 0.3; x.beginPath();
    x.ellipse(55, 148, 32, 10, 0, 0, Math.PI*2);
    x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;

    // Trunk
    const tg = x.createLinearGradient(44, 80, 66, 80);
    tg.addColorStop(0, '#6a4020'); tg.addColorStop(0.4, '#8a5630'); tg.addColorStop(1, '#3a2010');
    x.fillStyle = tg;
    x.beginPath();
    x.moveTo(44, 148); x.lineTo(46, 80); x.lineTo(64, 80); x.lineTo(66, 148);
    x.closePath(); x.fill();
    // bark texture
    x.strokeStyle = '#3a2010'; x.lineWidth = 1;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(48+i*4, 90); x.lineTo(47+i*4, 140); x.stroke(); }

    // Roots
    x.strokeStyle = '#3a2010'; x.lineWidth = 3; x.lineCap = 'round';
    x.beginPath(); x.moveTo(46, 148); x.quadraticCurveTo(34, 150, 26, 154); x.stroke();
    x.beginPath(); x.moveTo(64, 148); x.quadraticCurveTo(76, 150, 84, 154); x.stroke();

    // Foliage (3 layers, depth-sorted)
    const foliageColors = [
      `hsl(${h},52%,18%)`, `hsl(${h},50%,26%)`, `hsl(${h},48%,34%)`, `hsl(${h},45%,44%)`
    ];
    const layers = [
      { cx:55, cy:88, rx:40, ry:28 },
      { cx:50, cy:70, rx:36, ry:26 },
      { cx:62, cy:56, rx:28, ry:22 },
      { cx:54, cy:38, rx:20, ry:18 }
    ];
    layers.forEach((l, i) => {
      x.fillStyle = foliageColors[i];
      x.beginPath(); x.ellipse(l.cx, l.cy, l.rx, l.ry, 0, 0, Math.PI*2); x.fill();
    });
    // Highlight
    x.fillStyle = `hsla(${h},60%,60%,0.3)`;
    x.beginPath(); x.ellipse(46, 46, 10, 8, -0.5, 0, Math.PI*2); x.fill();

    return c;
  }

  static tree_dead() {
    const c = this._oc(110, 160);
    const x = c.getContext('2d');

    x.globalAlpha = 0.2; x.beginPath();
    x.ellipse(55, 148, 25, 8, 0, 0, Math.PI*2);
    x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;

    // Ghostly grey trunk
    const tg = x.createLinearGradient(46, 80, 64, 80);
    tg.addColorStop(0, '#a0a8a8'); tg.addColorStop(0.5, '#c0c8c8'); tg.addColorStop(1, '#707878');
    x.fillStyle = tg;
    x.beginPath(); x.moveTo(46, 148); x.lineTo(48, 60); x.lineTo(62, 60); x.lineTo(64, 148); x.closePath(); x.fill();
    x.strokeStyle = '#505858'; x.lineWidth = 1;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(50+i*3, 70); x.lineTo(49+i*3, 138); x.stroke(); }

    // Dead bare branches
    x.strokeStyle = '#8898a0'; x.lineCap = 'round';
    const branches = [
      [55,110, 20,88, 12,76], [55,110, 88,88, 100,74],
      [55,85, 28,60, 18,48], [55,85, 82,62, 96,52],
      [55,60, 48,30, 42,18], [55,60, 62,32, 68,18]
    ];
    branches.forEach(([sx,sy, mx,my, ex,ey], i) => {
      x.lineWidth = 3 - i * 0.4;
      x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
    });

    return c;
  }

  static stump() {
    const c = this._oc(72, 80);
    const x = c.getContext('2d');

    x.globalAlpha = 0.35; x.beginPath();
    x.ellipse(36, 72, 28, 9, 0, 0, Math.PI*2);
    x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;

    // Stump body
    const sg = x.createLinearGradient(12, 28, 60, 72);
    sg.addColorStop(0, '#6d4c32'); sg.addColorStop(0.5, '#8d6044'); sg.addColorStop(1, '#3a2010');
    x.fillStyle = sg;
    x.beginPath(); x.moveTo(14, 72); x.lineTo(18, 40); x.lineTo(54, 40); x.lineTo(58, 72); x.closePath(); x.fill();
    x.strokeStyle = '#2a1408'; x.lineWidth = 1.5; x.stroke();

    // Pointed top (beaver-chewed pencil shape)
    const cg = x.createLinearGradient(18, 10, 54, 40);
    cg.addColorStop(0, '#f0d8a8'); cg.addColorStop(1, '#c8a870');
    x.fillStyle = cg;
    x.beginPath(); x.moveTo(18, 40); x.lineTo(36, 14); x.lineTo(54, 40); x.closePath(); x.fill();
    x.strokeStyle = '#9a7848'; x.lineWidth = 1; x.stroke();

    // Growth rings on top
    x.strokeStyle = '#b09060'; x.lineWidth = 0.8;
    [13, 8, 4].forEach(r => { x.beginPath(); x.ellipse(36, 40, r, r*0.38, 0, 0, Math.PI*2); x.stroke(); });

    // Wood chips at base
    [20, 40, 52, 28, 45].forEach((bx, i) => {
      x.fillStyle = '#e0c090'; x.save(); x.translate(bx, 70+i%2*2); x.rotate((i-2)*0.3);
      x.beginPath(); x.ellipse(0, 0, 4, 2, 0, 0, Math.PI*2); x.fill(); x.restore();
    });

    return c;
  }

  static dam(level = 1) {
    // level: 1=small, 2=medium, 3=large
    const w = 80 + level * 40, h = 50 + level * 12;
    const c = this._oc(w, h);
    const x = c.getContext('2d');

    // Mud base
    const mg = x.createLinearGradient(0, h*0.6, 0, h);
    mg.addColorStop(0, '#5d4037'); mg.addColorStop(1, '#1e120a');
    x.fillStyle = mg;
    x.beginPath(); x.ellipse(w/2, h*0.85, w*0.45, h*0.2, 0, 0, Math.PI*2); x.fill();

    // Log grid
    const logColors = ['#8d6e63', '#795548', '#6d4c41', '#a1887f'];
    const angles = [-0.25, 0.15, -0.08, 0.22, -0.18, 0.1];
    for (let i = 0; i < 4 + level * 2; i++) {
      const lc = x.createLinearGradient(0, i*8, w, i*8+6);
      lc.addColorStop(0, logColors[i % 4]); lc.addColorStop(1, '#3e2723');
      x.fillStyle = lc; x.save();
      x.translate(w * (0.1 + (i * 0.15) % 0.75), h * (0.15 + (i * 0.12) % 0.55));
      x.rotate(angles[i % angles.length]);
      const lw = w * (0.3 + Math.random() * 0.4), lh = 6 + level * 1.5;
      x.beginPath(); x.roundRect(-lw/2, -lh/2, lw, lh, 3); x.fill();
      x.restore();
    }

    // Water seeping through
    x.strokeStyle = 'rgba(100,180,220,0.7)'; x.lineWidth = 2;
    [0.35, 0.55, 0.7].forEach(px => {
      x.beginPath(); x.moveTo(w*px, h*0.7); x.quadraticCurveTo(w*px+5, h*0.85, w*px-3, h*0.95); x.stroke();
    });

    return c;
  }

  static leaf_particle(color = '#4a8c2a') {
    const c = this._oc(12, 12);
    const x = c.getContext('2d');
    x.fillStyle = color;
    x.beginPath(); x.ellipse(6, 6, 5, 3, 0.4, 0, Math.PI*2); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.2)'; x.lineWidth = 0.5;
    x.beginPath(); x.moveTo(2,7); x.lineTo(10,5); x.stroke();
    return c;
  }

  static wood_chip() {
    const c = this._oc(10, 10);
    const x = c.getContext('2d');
    x.fillStyle = '#c49a6c';
    x.beginPath(); x.roundRect(0, 2, 10, 6, 2); x.fill();
    return c;
  }

  // ── ADDITIONAL SPRITES ─────────────────────────────────

  static tree_flooded() {
    const c = this._oc(110, 160);
    const x = c.getContext('2d');
    // Water at base
    x.globalAlpha = 0.6;
    const wg = x.createRadialGradient(55, 150, 0, 55, 150, 35);
    wg.addColorStop(0, '#3a90b8'); wg.addColorStop(1, 'transparent');
    x.fillStyle = wg;
    x.beginPath(); x.ellipse(55, 148, 35, 12, 0, 0, Math.PI*2); x.fill();
    x.globalAlpha = 1;
    // Algae ring
    x.strokeStyle = '#3a6a2a'; x.lineWidth = 2;
    x.beginPath(); x.ellipse(55, 140, 20, 6, 0, 0, Math.PI*2); x.stroke();
    // Grey trunk above water
    const tg = x.createLinearGradient(46, 60, 64, 60);
    tg.addColorStop(0, '#909898'); tg.addColorStop(1, '#505858');
    x.fillStyle = tg;
    x.beginPath(); x.moveTo(46, 150); x.lineTo(48, 50); x.lineTo(62, 50); x.lineTo(64, 150); x.closePath(); x.fill();
    // Dead branches
    x.strokeStyle = '#708080'; x.lineCap = 'round';
    const br = [[55,100, 25,78, 15,66],[55,100, 85,78, 95,64],[55,72, 46,44, 38,32],[55,72, 64,44, 72,32]];
    br.forEach(([sx,sy,mx,my,ex,ey], i) => {
      x.lineWidth = 2.5 - i*0.4;
      x.beginPath(); x.moveTo(sx,sy); x.quadraticCurveTo(mx,my,ex,ey); x.stroke();
    });
    return c;
  }

  static bush() {
    const c = this._oc(70, 55);
    const x = c.getContext('2d');
    x.globalAlpha = 0.3;
    x.beginPath(); x.ellipse(35, 48, 30, 9, 0, 0, Math.PI*2); x.fillStyle = '#000'; x.fill();
    x.globalAlpha = 1;
    // Branches
    ['#5a3820','#4a2810','#5a3820'].forEach((col, i) => {
      x.strokeStyle = col; x.lineWidth = 2;
      x.beginPath(); x.moveTo(35, 44);
      const tx = [15, 35, 55][i], ty = [28, 22, 28][i];
      x.lineTo(tx, ty); x.stroke();
    });
    // Foliage
    [[16, 23, 12, 9],[35, 17, 14, 10],[54, 23, 12, 9],[24, 17, 9, 7],[46, 17, 9, 7]].forEach(([cx,cy,rx,ry], i) => {
      x.fillStyle = ['#1b6e22','#2e7d32','#1b6e22','#2e8b2a','#2e8b2a'][i];
      x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); x.fill();
    });
    // Calafate berries
    [[18,26],[22,22],[50,26],[46,21],[35,14]].forEach(([bx,by], i) => {
      x.fillStyle = i%2===0 ? '#5c35be' : '#7c55de';
      x.beginPath(); x.arc(bx, by, 1.8, 0, Math.PI*2); x.fill();
    });
    return c;
  }

  static moss() {
    const c = this._oc(60, 40);
    const x = c.getContext('2d');
    x.fillStyle = '#2e5a20';
    x.beginPath(); x.ellipse(30, 28, 28, 11, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = '#3a7228';
    x.beginPath(); x.ellipse(30, 24, 23, 8, 0, 0, Math.PI*2); x.fill();
    [[14,22,6,4,'#4a8a30'],[28,20,8,5,'#3a7228'],[44,21,6,4,'#4a8a30'],
     [22,17,5,3.5,'#5a9a38'],[38,17,5,3.5,'#5a9a38'],[30,14,6,4,'#6aaa40']].forEach(([cx,cy,rx,ry,col]) => {
      x.fillStyle = col;
      x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); x.fill();
    });
    x.fillStyle = '#8acc50'; x.globalAlpha = 0.55;
    [[28,12,3,2],[15,19,2,1.5],[43,18,2,1.5]].forEach(([cx,cy,rx,ry]) => {
      x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.fill();
    });
    x.globalAlpha = 1;
    return c;
  }

  static rock() {
    const c = this._oc(90, 60);
    const x = c.getContext('2d');
    x.globalAlpha = 0.3;
    x.beginPath(); x.ellipse(32, 52, 22, 7, 0, 0, Math.PI*2); x.fillStyle = '#000'; x.fill();
    x.globalAlpha = 1;
    const rg = x.createRadialGradient(26, 22, 2, 32, 28, 28);
    rg.addColorStop(0, '#c0c8c0'); rg.addColorStop(0.5, '#808a80'); rg.addColorStop(1, '#404848');
    x.fillStyle = rg;
    x.beginPath(); x.moveTo(12,46); x.quadraticCurveTo(10,28,28,22); x.quadraticCurveTo(46,16,54,26);
    x.quadraticCurveTo(62,36,52,46); x.quadraticCurveTo(40,54,24,52); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(18,34); x.quadraticCurveTo(28,28,40,30); x.stroke();
    // Lichen
    [[28,30,5,3,'#7a9040'],[40,38,4,2.5,'#6a8030']].forEach(([cx,cy,rx,ry,col]) => {
      x.fillStyle = col; x.globalAlpha = 0.55;
      x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.fill(); x.globalAlpha = 1;
    });
    return c;
  }

  static log() {
    const c = this._oc(70, 40);
    const x = c.getContext('2d');
    x.globalAlpha = 0.3;
    x.beginPath(); x.ellipse(35, 33, 28, 7, 0, 0, Math.PI*2); x.fillStyle = '#000'; x.fill();
    x.globalAlpha = 1;
    const lg = x.createLinearGradient(8, 0, 62, 0);
    lg.addColorStop(0, '#9a6a38'); lg.addColorStop(0.5, '#c49a6c'); lg.addColorStop(1, '#5a3a18');
    x.fillStyle = lg;
    x.beginPath();
    x.moveTo(8, 20); x.quadraticCurveTo(8, 32, 35, 32); x.quadraticCurveTo(62, 32, 62, 20);
    x.lineTo(62, 16); x.quadraticCurveTo(62, 8, 35, 8); x.quadraticCurveTo(8, 8, 8, 16); x.closePath();
    x.fill(); x.strokeStyle = '#3a2010'; x.lineWidth = 1.2; x.stroke();
    // End cap
    x.fillStyle = '#d0a870';
    x.beginPath(); x.ellipse(35, 16, 27, 9, 0, 0, Math.PI*2); x.fill();
    x.strokeStyle = '#7a5030'; x.lineWidth = 1;
    [20, 13, 6].forEach(r => { x.beginPath(); x.ellipse(35, 16, r, r*0.35, 0, 0, Math.PI*2); x.stroke(); });
    return c;
  }

  static beaver_celebrate(size = 60) {
    const c = this._oc(size, size);
    const x = c.getContext('2d'), s = size / 60;
    // Shadow
    x.globalAlpha = 0.3; x.beginPath();
    x.ellipse(30*s, 56*s, 18*s, 6*s, 0, 0, Math.PI*2); x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;
    // Tail
    const tg = x.createLinearGradient(0, 0, 18*s, 0);
    tg.addColorStop(0, '#3d2b1f'); tg.addColorStop(1, '#1a0f09');
    x.fillStyle = tg;
    x.beginPath(); x.ellipse(10*s, 42*s, 12*s, 5*s, -0.2, 0, Math.PI*2); x.fill();
    // Body
    const bg = x.createRadialGradient(34*s, 32*s, 3*s, 32*s, 36*s, 20*s);
    bg.addColorStop(0, '#a36838'); bg.addColorStop(1, '#3d200c');
    x.fillStyle = bg;
    x.beginPath(); x.ellipse(30*s, 38*s, 16*s, 13*s, 0, 0, Math.PI*2); x.fill();
    // Arms raised in celebration!
    x.fillStyle = '#7a4020'; x.strokeStyle = '#3d200c'; x.lineWidth = 1*s;
    // Left arm up
    x.beginPath(); x.roundRect(12*s, 18*s, 7*s, 18*s, 3*s); x.fill(); x.stroke();
    // Right arm up
    x.beginPath(); x.roundRect(41*s, 18*s, 7*s, 18*s, 3*s); x.fill(); x.stroke();
    // Head
    const hg = x.createRadialGradient(32*s, 22*s, 2*s, 32*s, 24*s, 12*s);
    hg.addColorStop(0, '#b87840'); hg.addColorStop(1, '#6a3a14');
    x.fillStyle = hg;
    x.beginPath(); x.arc(30*s, 22*s, 12*s, 0, Math.PI*2); x.fill();
    // Big happy eyes
    x.fillStyle = '#1a1008';
    x.beginPath(); x.arc(26*s, 20*s, 2.5*s, 0, Math.PI*2); x.fill();
    x.beginPath(); x.arc(34*s, 20*s, 2.5*s, 0, Math.PI*2); x.fill();
    // Happy arc smile
    x.strokeStyle = '#1a0a00'; x.lineWidth = 1.5*s;
    x.beginPath(); x.arc(30*s, 22*s, 6*s, 0.1, Math.PI-0.1); x.stroke();
    // Orange teeth
    x.fillStyle = '#ff9900';
    x.beginPath(); x.roundRect(27*s, 28*s, 3*s, 4*s, 1*s); x.fill();
    x.beginPath(); x.roundRect(31*s, 28*s, 3*s, 4*s, 1*s); x.fill();
    // Stars / sparkles around
    ['#ffd700','#ff8844','#44ddff'].forEach((col, i) => {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 4;
      const sx = 30*s + Math.cos(a) * 22*s;
      const sy = 22*s + Math.sin(a) * 22*s;
      x.fillStyle = col; x.font = `bold ${10*s}px sans-serif`;
      x.textAlign = 'center'; x.fillText('✦', sx, sy);
    });
    return c;
  }

  static beaver_small(size = 48) {
    // Juvenile beaver: same shape, lighter fur color, slightly rounder
    const c = this._oc(size, size);
    const x = c.getContext('2d'), s = size / 80;
    // Shadow
    x.globalAlpha = 0.3; x.beginPath();
    x.ellipse(40*s, 72*s, 18*s, 6*s, 0, 0, Math.PI*2); x.fillStyle = '#000'; x.fill(); x.globalAlpha = 1;
    // Tail (tiny)
    x.fillStyle = '#5d4233';
    x.beginPath(); x.ellipse(14*s, 54*s, 12*s, 5*s, -0.3, 0, Math.PI*2); x.fill();
    // Body (lighter, chubbier)
    const bg = x.createRadialGradient(44*s, 44*s, 3*s, 44*s, 48*s, 22*s);
    bg.addColorStop(0, '#c98848'); bg.addColorStop(1, '#8a5828');
    x.fillStyle = bg;
    x.beginPath(); x.ellipse(42*s, 52*s, 18*s, 15*s, 0, 0, Math.PI*2); x.fill();
    // Belly
    x.fillStyle = 'rgba(200,160,100,0.45)';
    x.beginPath(); x.ellipse(46*s, 55*s, 10*s, 8*s, 0, 0, Math.PI*2); x.fill();
    // Head (big & round for juvenile)
    x.fillStyle = '#c88848';
    x.beginPath(); x.arc(54*s, 32*s, 14*s, 0, Math.PI*2); x.fill();
    // Ear
    x.fillStyle = '#7a3a1a';
    x.beginPath(); x.ellipse(48*s, 20*s, 4*s, 5*s, -0.4, 0, Math.PI*2); x.fill();
    // Eye (big innocent)
    x.fillStyle = '#1a1008';
    x.beginPath(); x.arc(58*s, 29*s, 3.5*s, 0, Math.PI*2); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(59.5*s, 27.5*s, 1.2*s, 0, Math.PI*2); x.fill();
    // Tiny nubby teeth
    x.fillStyle = '#ffaa22';
    x.beginPath(); x.roundRect(62*s, 38*s, 3*s, 4*s, 1*s); x.fill();
    return c;
  }
}


// ── PARTICLE SYSTEM ───────────────────────────────────────
class ParticlePool {
  constructor(maxCount = 200) {
    this.pool = [];
    this.leafSprites = [
      SpritePainter.leaf_particle('#3a7020'),
      SpritePainter.leaf_particle('#d4a020'),
      SpritePainter.leaf_particle('#c04010'),
      SpritePainter.leaf_particle('#7a9830')
    ];
    this.woodChip = SpritePainter.wood_chip();
    this.maxCount = maxCount;
    this._seedAmbient(60);
  }

  _seedAmbient(n) {
    for (let i = 0; i < n; i++) {
      this.pool.push({
        x: Math.random() * 1920, y: Math.random() * 1080,
        vx: Math.random() * 0.8 - 0.4, vy: Math.random() * 0.6 + 0.15,
        rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.04,
        alpha: Math.random() * 0.8 + 0.2, life: 1, decay: 0,
        kind: 'leaf', leafIdx: Math.floor(Math.random() * 4), scale: 0.6 + Math.random() * 0.8
      });
    }
  }

  burst(x, y, kind = 'wood', count = 12) {
    for (let i = 0; i < count && this.pool.length < this.maxCount; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = 2 + Math.random() * 3;
      this.pool.push({
        x: x + (Math.random()-0.5)*20, y: y + (Math.random()-0.5)*20,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2,
        rot: Math.random()*Math.PI*2, rotV: (Math.random()-0.5)*0.12,
        alpha: 1, life: 1, decay: 0.025 + Math.random() * 0.02,
        kind, leafIdx: Math.floor(Math.random() * 4), scale: 0.8 + Math.random() * 0.6
      });
    }
  }

  update(dt) {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.rot += p.rotV * dt * 60;
      if (p.decay > 0) {
        p.alpha -= p.decay * dt * 60;
        if (p.alpha <= 0) { this.pool.splice(i, 1); continue; }
        p.vy += 0.08 * dt * 60; // gravity
      } else {
        // ambient: recycle
        if (p.y > 1100) { p.y = -10; p.x = Math.random() * 1920; }
        if (p.x < -20)  { p.x = 1920; }
        if (p.x > 1940) { p.x = 0; }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    this.pool.forEach(p => {
      const sprite = p.kind === 'wood' ? this.woodChip : this.leafSprites[p.leafIdx];
      if (!sprite) return;
      ctx.globalAlpha = p.alpha;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(p.scale, p.scale);
      ctx.drawImage(sprite, -sprite.width/2, -sprite.height/2);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── ENTITY SYSTEM ─────────────────────────────────────────
class EntitySystem {
  constructor(sprites) {
    this.sprites = sprites;
    this.entities = [];
  }

  populate(stageData, canvasW, canvasH) {
    this.entities = [];
    const bCount = Math.min(stageData.beavers, 40);
    const cw = canvasW, ch = canvasH;

    for (let i = 0; i < bCount; i++) this._addBeaver(cw, ch);
    if (stageData.id >= 3) {
      // Scientists appear on later stages
      for (let i = 0; i < 2; i++) this._addHuman('scientist', cw, ch);
    }
    // Rangers always present
    for (let i = 0; i < 2; i++) this._addHuman('ranger', cw, ch);
  }

  addBeaver(cw, ch) {
    this._addBeaver(cw, ch);
  }

  _addBeaver(cw, ch) {
    const actions = ['idle', 'idle', 'walk', 'cut', 'carry', 'build'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    this.entities.push({
      type: 'beaver', action,
      x: 120 + Math.random() * (cw - 240),
      y: 120 + Math.random() * (ch - 260),
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 0.8,
      facing: Math.random() > 0.5 ? 1 : -1,
      timer: Math.random() * 180, maxTimer: 120 + Math.random() * 120,
      bobPhase: Math.random() * Math.PI * 2
    });
  }

  _addHuman(type, cw, ch) {
    this.entities.push({
      type, x: 150 + Math.random() * (cw - 300),
      y: 150 + Math.random() * (ch - 300),
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.5,
      timer: 0, maxTimer: 200 + Math.random() * 200,
      bobPhase: Math.random() * Math.PI * 2
    });
  }

  update(dt, canvasW, canvasH) {
    const t = performance.now() / 1000;
    this.entities.forEach(ent => {
      // Move
      ent.x += ent.vx * dt * 60;
      ent.y += ent.vy * dt * 60;
      ent.bobPhase += dt * 2.5;

      // Bounce on canvas bounds with margin
      const mx = 100, my = 90, mxR = canvasW - 100, myB = canvasH - 180;
      if (ent.x < mx || ent.x > mxR) {
        ent.vx *= -1;
        ent.x = Math.max(mx, Math.min(mxR, ent.x));
        if (ent.facing !== undefined) ent.facing *= -1;
      }
      if (ent.y < my || ent.y > myB) {
        ent.vy *= -1;
        ent.y = Math.max(my, Math.min(myB, ent.y));
      }

      // Periodic direction change
      ent.timer += dt * 60;
      if (ent.timer > ent.maxTimer) {
        ent.timer = 0;
        ent.vx = (Math.random() - 0.5) * (ent.type === 'beaver' ? 1.4 : 0.8);
        ent.vy = (Math.random() - 0.5) * (ent.type === 'beaver' ? 0.9 : 0.5);
        if (ent.facing !== undefined) ent.facing = ent.vx > 0 ? 1 : -1;
      }
    });
  }

  draw(ctx, sprites) {
    // Z-sort by Y for isometric depth
    const sorted = [...this.entities].sort((a, b) => a.y - b.y);
    sorted.forEach(ent => {
      const bob = Math.sin(ent.bobPhase) * 1.5;
      ctx.save();
      ctx.translate(ent.x, ent.y + bob);

      if (ent.type === 'beaver') {
        const inWater = (ent.x >= 612 && ent.x <= 668 && ent.y >= 70 && ent.y <= 680);
        const key = (inWater && ent.action !== 'build') ? 'beaver_swim' : (ent.action === 'build' ? 'beaver_build' : (ent.action === 'cut' ? 'beaver_cut' : (ent.action === 'carry' ? 'beaver_carry' : 'beaver_idle')));
        const sp = sprites[key] || sprites['beaver_idle'];
        if (sp) {
          ctx.scale(ent.facing || 1, 1);
          ctx.drawImage(sp, -sp.width/2, -sp.height/2);
        }
      } else if (ent.type === 'ranger') {
        const sp = sprites['ranger'];
        if (sp) ctx.drawImage(sp, -sp.width/2, -sp.height/2);
      } else if (ent.type === 'scientist') {
        const sp = sprites['scientist'];
        if (sp) ctx.drawImage(sp, -sp.width/2, -sp.height/2);
      }
      ctx.restore();
    });
  }
}

// ── VEGETATION LAYER (stage-aware) ───────────────────────
class VegetationLayer {
  constructor(sprites, canvasW, canvasH) {
    this.baseItems = [];
    this.cw = canvasW; this.ch = canvasH;
    this._buildBase(canvasW, canvasH);
  }

  _buildBase(cw, ch) {
    // Deterministic layout so sprites don't jump between frames
    const seed = (n, m) => ((Math.sin(n * 12.9898 + m * 78.233) * 43758.5453) % 1 + 1) % 1;

    // Trees (12 positions)
    for (let i = 0; i < 12; i++) {
      this.baseItems.push({
        kind: 'tree', idx: i,
        x: 80 + seed(i, 1) * (cw - 220),
        y: 70 + seed(i, 2) * (ch * 0.5),
        scale: 0.5 + seed(i, 3) * 0.35,
        variant: Math.floor(seed(i, 4) * 10)
      });
    }
    // Stumps (5)
    for (let i = 0; i < 5; i++) {
      this.baseItems.push({
        kind: 'stump', idx: i + 20,
        x: 120 + seed(i + 20, 1) * (cw - 280),
        y: 180 + seed(i + 20, 2) * (ch * 0.38),
        scale: 0.6 + seed(i + 20, 3) * 0.25
      });
    }
    // Rocks (4)
    for (let i = 0; i < 4; i++) {
      this.baseItems.push({
        kind: 'rock', idx: i + 30,
        x: 80 + seed(i + 30, 1) * (cw - 200),
        y: 200 + seed(i + 30, 2) * (ch * 0.35),
        scale: 0.6 + seed(i + 30, 3) * 0.3
      });
    }
    // Bushes (5)
    for (let i = 0; i < 5; i++) {
      this.baseItems.push({
        kind: 'bush', idx: i + 40,
        x: 60 + seed(i + 40, 1) * (cw - 160),
        y: 220 + seed(i + 40, 2) * (ch * 0.3),
        scale: 0.65 + seed(i + 40, 3) * 0.3
      });
    }
    // Moss patches (6)
    for (let i = 0; i < 6; i++) {
      this.baseItems.push({
        kind: 'moss', idx: i + 50,
        x: 40 + seed(i + 50, 1) * (cw - 120),
        y: 240 + seed(i + 50, 2) * (ch * 0.28),
        scale: 0.8 + seed(i + 50, 3) * 0.4
      });
    }
    // Logs (3)
    for (let i = 0; i < 3; i++) {
      this.baseItems.push({
        kind: 'log', idx: i + 60,
        x: 100 + seed(i + 60, 1) * (cw - 250),
        y: 300 + seed(i + 60, 2) * (ch * 0.2),
        scale: 0.7 + seed(i + 60, 3) * 0.2
      });
    }
    // Sort by Y once
    this.baseItems.sort((a, b) => a.y - b.y);
  }

  draw(ctx, sprites, stageIdx) {
    this.baseItems.forEach(item => {
      let sp = null;

      if (item.kind === 'tree') {
        // Stage-aware tree appearance
        if (stageIdx >= 4) {
          sp = sprites['tree_dead'];
        } else if (stageIdx === 3) {
          sp = item.idx % 3 === 0 ? sprites['tree_flooded'] : sprites['tree_dead'];
        } else if (stageIdx === 2) {
          sp = item.idx % 3 === 0 ? sprites['tree_dead'] : sprites[`tree_${item.variant}`];
        } else if (stageIdx === 5) {
          // Restoration: mix healthy young and stumps
          sp = item.idx % 2 === 0 ? sprites[`tree_${item.variant}`] : sprites['stump'];
        } else {
          sp = sprites[`tree_${item.variant}`];
        }
      } else if (item.kind === 'stump') {
        sp = sprites['stump'];
      } else if (item.kind === 'rock') {
        sp = sprites['rock'];
      } else if (item.kind === 'bush') {
        // Bushes disappear in devastated stages
        if (stageIdx >= 4) return;
        sp = sprites['bush'];
      } else if (item.kind === 'moss') {
        if (stageIdx >= 4) return;
        sp = sprites['moss'];
      } else if (item.kind === 'log') {
        // Logs appear more in later stages
        if (stageIdx < 1 && item.idx % 2 === 0) return;
        sp = sprites['log'];
      }

      if (!sp) return;
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.translate(item.x, item.y);
      ctx.scale(item.scale, item.scale);
      ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
      ctx.restore();
    });
  }
}

// ── MAIN GAME CLASS ───────────────────────────────────────
class BeaverGame {
  constructor() {
    this.canvas  = document.getElementById('game-canvas');
    this.ctx     = this.canvas.getContext('2d', { alpha: false });
    this.stage   = 0;
    this.mapImgs = {};
    this.sprites = {};
    this.loaded  = false;

    // Map transition
    this.transAlpha = 1; this.transDir = -1; this.prevStageImg = null;

    // Pan / zoom
    this.panX = 0; this.panY = 0;
    this.targetPanX = 0; this.targetPanY = 0;
    this.isDragging = false; this.dragStart = { x: 0, y: 0 };

    // FPS counter
    this.fps = 0; this._fpsCtr = 0; this._fpsTime = 0;
    this._lastT = 0;

    this.particles = null;
    this.entities  = null;
    this.veg       = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => { this.resizeCanvas(); });

    this._buildSprites();
    this._loadMaps(() => {
      this.loaded = true;
      this.particles = new ParticlePool(250);
      this.entities  = new EntitySystem(this.sprites);
      this.entities.populate(STAGES[this.stage], this.canvas.width, this.canvas.height);
      this.veg = new VegetationLayer(this.sprites, this.canvas.width, this.canvas.height);
      this._bindUI();
      this.updateHUD();
      requestAnimationFrame(t => this._loop(t));
    });
  }

  resizeCanvas() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _buildSprites() {
    // Pre-render all sprites into cached canvases (GPU-blittable)
    this.sprites['beaver_idle']      = SpritePainter.beaver(80, 'idle');
    this.sprites['beaver_swim']      = SpritePainter.beaver(117, 'swim');
    this.sprites['beaver_cut']       = SpritePainter.beaver(80, 'cut');
    this.sprites['beaver_carry']     = SpritePainter.beaver(80, 'carry');
    this.sprites['beaver_celebrate'] = SpritePainter.beaver_celebrate(60);
    this.sprites['beaver_small']     = SpritePainter.beaver_small(48);
    this.sprites['ranger']           = SpritePainter.ranger(80);
    this.sprites['scientist']        = SpritePainter.scientist(80);
    this.sprites['stump']            = SpritePainter.stump();
    this.sprites['bush']             = SpritePainter.bush();
    this.sprites['moss']             = SpritePainter.moss();
    this.sprites['rock']             = SpritePainter.rock();
    this.sprites['log']              = SpritePainter.log();
    for (let v = 0; v < 10; v++) {
      this.sprites[`tree_${v}`] = SpritePainter.tree_healthy(v);
    }
    this.sprites['tree_dead']     = SpritePainter.tree_dead();
    this.sprites['tree_flooded']  = SpritePainter.tree_flooded();
    this.sprites['dam_small']     = SpritePainter.dam(1);
    this.sprites['dam_medium']    = SpritePainter.dam(2);
    this.sprites['dam_large']     = SpritePainter.dam(3);
  }

  _loadMaps(cb) {
    let done = 0, total = STAGES.length;
    STAGES.forEach(s => {
      const img = new Image();
      img.onload  = () => { this.mapImgs[s.id] = img; if (++done === total) cb(); };
      img.onerror = () => { this.mapImgs[s.id] = null;  if (++done === total) cb(); };
      img.src = s.src;
    });
  }

  _bindUI() {
    // Timeline slider
    const sl = document.getElementById('timeline-slider');
    sl.addEventListener('input', e => {
      SFX.boot(); SFX.click();
      this._goToStage(parseInt(e.target.value));
    });

    // Map thumbnails
    document.querySelectorAll('.map-thumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SFX.boot(); SFX.click();
        const idx = parseInt(btn.dataset.stage);
        this._goToStage(idx);
        sl.value = idx;
      });
    });

    // Add beaver button
    document.getElementById('btn-add-beaver').addEventListener('click', () => {
      SFX.boot(); SFX.chop();
      STAGES[this.stage].beavers = Math.min(STAGES[this.stage].beavers + 1, 999);
      this.entities.addBeaver(this.canvas.width, this.canvas.height);
      this.particles.burst(this.canvas.width / 2, this.canvas.height / 2 - 80, 'wood', 16);
      this.updateHUD();
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
      SFX.boot(); SFX.splash();
      this._goToStage(0);
      sl.value = 0;
    });

    // Tutorial
    document.getElementById('btn-tutorial').addEventListener('click', () => {
      SFX.boot(); SFX.click();
      document.getElementById('modal-tutorial').classList.add('active');
    });
    document.getElementById('close-tutorial').addEventListener('click', () => {
      SFX.boot(); SFX.click();
      document.getElementById('modal-tutorial').classList.remove('active');
    });

    // Pan controls
    this.canvas.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
      this.canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if (!this.isDragging) return;
      this.panX = Math.max(-300, Math.min(300, e.clientX - this.dragStart.x));
      this.panY = Math.max(-200, Math.min(200, e.clientY - this.dragStart.y));
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });
  }

  _goToStage(idx) {
    if (idx === this.stage) return;
    // Capture current map image for transition
    const snap = document.createElement('canvas');
    snap.width = this.canvas.width; snap.height = this.canvas.height;
    snap.getContext('2d').drawImage(this.canvas, 0, 0);
    this.prevStageImg = snap;
    this.transAlpha = 0; this.transDir = 1;

    this.stage = idx;
    this.entities.populate(STAGES[idx], this.canvas.width, this.canvas.height);
    this.updateHUD();
  }

  updateHUD() {
    const d = STAGES[this.stage];

    // Resource counters
    document.getElementById('res-beavers').textContent = d.beavers;
    document.getElementById('res-health').textContent  = `${d.health}%`;
    document.getElementById('res-water').textContent   = d.flooded > 0 ? `${d.flooded.toLocaleString()} ha` : '—';
    document.getElementById('res-dams').textContent    = d.dams;

    // Stage info
    document.getElementById('stage-title').textContent          = d.title;
    document.getElementById('timeline-year-text').textContent   = d.year;
    document.getElementById('news-date').textContent            = d.newsDate;
    document.getElementById('news-title').textContent           = d.newsTitle;
    document.getElementById('news-text').textContent            = d.newsText;

    // Eco-indicator bars
    const bH = document.getElementById('bar-health');
    const bF = document.getElementById('bar-flood');
    const bB = document.getElementById('bar-beavers');
    if (bH) bH.style.width = `${d.health}%`;
    if (bF) bF.style.width = `${Math.min((d.flooded / 250), 100)}%`;     // max visible at 25000 ha
    if (bB) bB.style.width = `${Math.min((d.beavers / 150) * 100, 100)}%`;

    // Map thumbnails
    document.querySelectorAll('.map-thumb-btn').forEach((b, i) => b.classList.toggle('active', i === this.stage));
  }

  // ── MAIN LOOP (delta-time 60-FPS capped) ─────────────
  _loop(timestamp) {
    const raw = (timestamp - this._lastT) / 1000;
    const dt  = Math.min(raw, 0.05); // cap at 50ms (20 FPS floor) to avoid spiral
    this._lastT = timestamp;

    // FPS counter
    this._fpsCtr++;
    if (timestamp - this._fpsTime >= 1000) {
      this.fps = this._fpsCtr;
      this._fpsCtr = 0;
      this._fpsTime = timestamp;
      const el = document.getElementById('fps-counter');
      if (el) el.textContent = `${this.fps} FPS`;
    }

    // Map transition fade
    if (this.transDir > 0) {
      this.transAlpha = Math.min(1, this.transAlpha + dt * 3.5);
      if (this.transAlpha >= 1) { this.transDir = 0; this.prevStageImg = null; }
    }

    if (!this.loaded) { requestAnimationFrame(t => this._loop(t)); return; }

    // Update systems
    this.particles.update(dt);
    this.entities.update(dt, this.canvas.width, this.canvas.height);

    // Render
    this._draw(timestamp);
    requestAnimationFrame(t => this._loop(t));
  }

  _draw(timestamp) {
    const ctx = this.ctx;
    const cw = this.canvas.width, ch = this.canvas.height;

    // Background clear (never blank — always fill)
    const pal = STAGES[this.stage].palette;
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, 0, cw, ch);

    // Apply smooth pan
    ctx.save();
    ctx.translate(this.panX, this.panY);

    // ① MAP IMAGE (stretched to fill, maintain aspect)
    const mapImg = this.mapImgs[STAGES[this.stage].id];
    if (mapImg) {
      this._drawMap(ctx, mapImg, cw, ch);
    } else {
      this._drawProceduralMap(ctx, cw, ch, timestamp);
    }

    // ② Previous map image fade-out during transition
    if (this.prevStageImg && this.transAlpha < 1) {
      ctx.globalAlpha = 1 - this.transAlpha;
      ctx.drawImage(this.prevStageImg, -this.panX, -this.panY);
      ctx.globalAlpha = 1;
    }

    // ③ Animated water overlay
    this._drawWaterOverlay(ctx, cw, ch, timestamp);

    // ④ Vegetation overlay (stage-aware trees, stumps, rocks, bushes)
    if (this.veg) this.veg.draw(ctx, this.sprites, this.stage);

    // ⑤ Dams overlay on later stages
    if (this.stage >= 1) this._drawDams(ctx, cw, ch);

    // ⑥ Entities (beaver, ranger, scientist) — Z-sorted
    if (this.entities) this.entities.draw(ctx, this.sprites);

    // ⑦ Particle system (leaves, wood chips)
    if (this.particles) this.particles.draw(ctx);

    ctx.restore();

    // ⑥ Vignette overlay (post-process depth-of-field feel)
    this._drawVignette(ctx, cw, ch);
  }

  _drawMap(ctx, img, cw, ch) {
    // Cover-fit: fill without letterbox
    const scaleX = cw / img.width, scaleY = ch / img.height;
    const sc = Math.max(scaleX, scaleY);
    const dw = img.width * sc, dh = img.height * sc;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  _drawProceduralMap(ctx, cw, ch, t) {
    // Rich procedural fallback — isometric tiled terrain
    const stage = STAGES[this.stage];
    const pal = stage.palette;

    // Sky gradient
    const skyG = ctx.createLinearGradient(0, 0, 0, ch * 0.35);
    skyG.addColorStop(0, pal.sky);
    skyG.addColorStop(1, pal.ground);
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, cw, ch);

    // Isometric terrain grid
    const tileW = 80, tileH = 40;
    const cols = Math.ceil(cw / tileW) + 4;
    const rows = Math.ceil(ch / tileH) + 4;
    const offsetX = -tileW * 2, offsetY = ch * 0.15;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = offsetX + (c - r) * tileW / 2;
        const py = offsetY + (c + r) * tileH / 2;

        // Checker pattern for tile variety
        const isAlt = (r + c) % 2 === 0;
        const noise = ((Math.sin(r*7.3 + c*13.1) + 1) / 2) * 0.06;
        const base = stage.id >= 4 ? '#2a2a20' : (stage.id >= 2 ? '#3a4a30' : '#4a6a30');
        const alt  = stage.id >= 4 ? '#1e2018' : (stage.id >= 2 ? '#304030' : '#3a5a28');
        ctx.fillStyle = isAlt ? base : alt;

        // Draw isometric tile
        ctx.beginPath();
        ctx.moveTo(px + tileW/2, py);
        ctx.lineTo(px + tileW,   py + tileH/2);
        ctx.lineTo(px + tileW/2, py + tileH);
        ctx.lineTo(px,           py + tileH/2);
        ctx.closePath();
        ctx.fill();
        // Subtle edge lines
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
    }

    // River strip
    const rg = ctx.createLinearGradient(cw*0.2, 0, cw*0.55, 0);
    if (stage.id <= 1) {
      rg.addColorStop(0, 'rgba(80,180,220,0.9)'); rg.addColorStop(1, 'rgba(60,150,200,0.7)');
    } else {
      rg.addColorStop(0, 'rgba(80,100,80,0.8)'); rg.addColorStop(1, 'rgba(60,80,70,0.6)');
    }
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(cw*0.1, ch*0.2); ctx.lineTo(cw*0.6, ch*0.4);
    ctx.lineTo(cw*0.65, ch*0.5); ctx.lineTo(cw*0.15, ch*0.3); ctx.closePath();
    ctx.fill();

    // Animated water ripples
    if (stage.id <= 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const rx = cw*0.25 + i*30 + Math.sin(t/800 + i) * 8;
        const ry = ch*0.28 + i*12;
        ctx.beginPath(); ctx.arc(rx, ry, 12, 0, Math.PI*2); ctx.stroke();
      }
    }
  }

  _drawWaterOverlay(ctx, cw, ch, t) {
    // Animated water patches depending on stage
    if (this.stage < 1) return;
    const alpha = Math.min(this.stage * 0.18, 0.72);
    // Stagnant water pools
    const pools = [
      { x: cw*0.35, y: ch*0.45, rx: cw*0.12, ry: ch*0.06 },
      { x: cw*0.55, y: ch*0.38, rx: cw*0.08, ry: ch*0.04 }
    ];
    pools.forEach(p => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const wg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rx);
      const c1 = this.stage >= 3 ? 'rgba(80,100,80,0.9)'  : 'rgba(60,160,210,0.85)';
      const c2 = this.stage >= 3 ? 'rgba(50,70,60,0)'     : 'rgba(30,100,160,0)';
      wg.addColorStop(0, c1); wg.addColorStop(1, c2);
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
      // Animated ripples on clean water
      if (this.stage <= 2) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const r = ((t / 1000 * 18 + i * 22) % 55);
          ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  _drawDams(ctx, cw, ch) {
    const dCount = Math.min(Math.floor(STAGES[this.stage].dams / 12) + 1, 5);
    const key = this.stage >= 4 ? 'dam_large' : (this.stage >= 2 ? 'dam_medium' : 'dam_small');
    const sp = this.sprites[key];
    if (!sp) return;
    const positions = [
      { x: cw*0.38, y: ch*0.42 },
      { x: cw*0.52, y: ch*0.35 },
      { x: cw*0.28, y: ch*0.52 },
      { x: cw*0.60, y: ch*0.48 },
      { x: cw*0.44, y: ch*0.58 }
    ];
    for (let i = 0; i < dCount; i++) {
      const p = positions[i];
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.translate(p.x, p.y);
      ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
      ctx.restore();
    }
  }

  _drawVignette(ctx, cw, ch) {
    const vg = ctx.createRadialGradient(cw/2, ch/2, ch*0.3, cw/2, ch/2, ch*0.9);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cw, ch);
  }
}

// ── BOOT ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  window.__game = new BeaverGame();
});
