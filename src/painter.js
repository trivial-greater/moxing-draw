window.MoxingDraw = window.MoxingDraw || {};

(function (MD) {
  var SIZE = 640;
  var INK = '#111118';

  function Painter() {
    this.off = document.createElement('canvas');
    this.off.width = SIZE;
    this.off.height = SIZE;
    this.offCtx = this.off.getContext('2d');
  }

  // Hand-drawn wobbly ellipse helper for authentic "灵魂画师" ink lines!
  function wobbleEllipse(ctx, cx, cy, rx, ry, rng, jitter, fill, stroke, lw) {
    var steps = 22;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var a = (Math.PI * 2 * i) / steps;
      var j = (rng() - 0.5) * jitter;
      var x = cx + Math.cos(a) * (rx + j);
      var y = cy + Math.sin(a) * (ry + j);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke !== false) {
      ctx.strokeStyle = stroke || INK;
      ctx.lineWidth = lw || 5;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  function wobbleLine(ctx, x1, y1, x2, y2, rng, jitter, color, lw) {
    var mx = (x1 + x2) / 2 + (rng() - 0.5) * jitter * 2;
    var my = (y1 + y2) / 2 + (rng() - 0.5) * jitter * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.strokeStyle = color || INK;
    ctx.lineWidth = lw || 5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function wobbleRect(ctx, x, y, w, h, rng, jitter, fill, stroke, lw) {
    var j = function () { return (rng() - 0.5) * jitter; };
    ctx.beginPath();
    ctx.moveTo(x + j(), y + j());
    ctx.lineTo(x + w + j(), y + j());
    ctx.lineTo(x + w + j(), y + h + j());
    ctx.lineTo(x + j(), y + h + j());
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke !== false) {
      ctx.strokeStyle = stroke || INK;
      ctx.lineWidth = lw || 5;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  Painter.prototype.render = function (canvas, parsed, opts) {
    var style = opts.style || 'soul';
    var chaos = (opts.chaos != null ? opts.chaos : 78) / 100; // 0.15 .. 1.0
    var wobbleFrame = opts.wobbleFrame || 0;
    var rng = MD.createRng((parsed.seed + wobbleFrame * 1337) >>> 0);
    var jitter = 2.5 + chaos * 7.5 + (style === 'abstract' ? 6 : 0);

    var ctx = this.offCtx;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // 1. Background Scene
    this._drawBackground(ctx, parsed.scene.id, style, chaos, rng, jitter);

    // 2. Comic Action Speedlines / Radial Chaos Burst
    if (chaos > 0.45 || style === 'meme' || style === 'soul') {
      this._drawSpeedLines(ctx, style, chaos, rng);
    }

    // 3. Fire / Explosion Backdrop if prompt calls for it
    if (parsed.props.some(function (p) { return p.id === 'fire'; }) || parsed.scene.id === 'volcano') {
      this._drawExplosionBack(ctx, 320, 355, rng, jitter);
    }

    // 4. Subjects & Dual-Character Interactions!
    var hasRide = parsed.actions.some(function (a) { return a.id === 'ride'; });
    var hasFight = parsed.actions.some(function (a) { return a.id === 'fight'; });
    var hasFly = parsed.actions.some(function (a) { return a.id === 'fly'; });
    var hasDance = parsed.actions.some(function (a) { return a.id === 'dance'; });
    var hasSleep = parsed.actions.some(function (a) { return a.id === 'sleep'; });
    var hasDrive = parsed.actions.some(function (a) { return a.id === 'drive'; });
    var hasWork = parsed.actions.some(function (a) { return a.id === 'work'; });

    if (hasDance) {
      this._drawDiscoBall(ctx, 320, 72, rng, jitter);
    }

    var subs = parsed.subjects;
    if (subs.length >= 2 && hasRide) {
      // Hilarious piggyback / riding stack! Subject 2 carries Subject 1!
      this._drawSubject(ctx, subs[1], 330, 445, 1.08, parsed, {
        isRider: false, isMount: true, hasFly: hasFly, hasDance: hasDance, hasSleep: false
      }, rng, jitter, chaos);
      this._drawSubject(ctx, subs[0], 315, 250, 0.84, parsed, {
        isRider: true, hasProps: true, hasFly: hasFly, hasDance: hasDance, hasSleep: false
      }, rng, jitter, chaos);
    } else if (subs.length >= 2) {
      // Side-by-side duo or chaotic fight!
      var sep = hasFight ? 128 : 148;
      this._drawSubject(ctx, subs[0], 320 - sep, hasFly ? 290 : 375, 0.88, parsed, {
        facing: 1, hasProps: true, hasFight: hasFight, hasFly: hasFly, hasDance: hasDance, hasSleep: hasSleep
      }, rng, jitter, chaos);
      this._drawSubject(ctx, subs[1], 320 + sep, hasFly ? 310 : 385, 0.88, parsed, {
        facing: -1, hasProps: false, hasFight: hasFight, hasFly: hasFly, hasDance: hasDance, hasSleep: false
      }, rng, jitter, chaos);
      if (hasFight) {
        this._drawFightClash(ctx, 320, 345, rng, jitter);
      }
    } else {
      // Solo glorious chaotic hero!
      var cy = hasFly ? 285 : (hasSleep ? 425 : 365);
      if (hasDrive) {
        this._drawVehicle(ctx, 320, 465, rng, jitter);
        cy = 325;
      }
      this._drawSubject(ctx, subs[0], 320, cy, 1.15, parsed, {
        facing: 1, hasProps: true, hasFly: hasFly, hasDance: hasDance, hasSleep: hasSleep, hasDrive: hasDrive
      }, rng, jitter, chaos);
      if (hasWork) {
        this._drawSmokingDesk(ctx, 435, 470, rng, jitter);
      }
    }

    // 5. Global action effects: Money Rain / Musical Notes / Hotpot Foreground
    if (parsed.actions.some(function (a) { return a.id === 'rich'; }) || parsed.props.some(function (p) { return p.id === 'money'; })) {
      this._drawMoneyRain(ctx, rng, jitter, chaos);
    }
    if (hasDance || parsed.props.some(function (p) { return p.id === 'headphones'; })) {
      this._drawMusicNotes(ctx, rng);
    }
    if (parsed.props.some(function (p) { return p.id === 'hotpot'; }) && !hasDrive) {
      this._drawHotpotProp(ctx, 130, 495, rng, jitter);
    }

    // 6. Chaotic Meme Stamps & Floating Text Stickers scaled by chaos!
    this._drawChaosStickers(ctx, parsed, style, chaos, rng);

    // 7. Apply Style Post-Processing to main visible canvas
    var outCtx = canvas.getContext('2d');
    outCtx.clearRect(0, 0, SIZE, SIZE);
    this._applyStylePost(outCtx, this.off, style, chaos, rng);

    // 8. Meme Caption & Pop-Art Frame (drawn crisp AFTER pixelation so text stays readable!)
    if (opts.showCaption) {
      var cap = (opts.customCaption || '').trim() || parsed.autoCaption;
      this._drawMemeCaption(outCtx, cap, parsed.raw, style);
    }
    this._drawCornerStamp(outCtx, style);
  };

  // ==================== BACKGROUNDS ====================
  Painter.prototype._drawBackground = function (ctx, sceneId, style, chaos, rng, jitter) {
    if (style === 'meme') {
      // Classic explosive reaction-meme radial burst!
      var colors = ['#fef08a', '#ffffff', '#fbcfe8', '#bae6fd'];
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      var slices = 16;
      for (var s = 0; s < slices; s++) {
        ctx.fillStyle = colors[s % colors.length];
        ctx.beginPath();
        ctx.moveTo(320, 320);
        var a1 = (Math.PI * 2 * s) / slices;
        var a2 = (Math.PI * 2 * (s + 1)) / slices;
        ctx.lineTo(320 + Math.cos(a1) * 520, 320 + Math.sin(a1) * 520);
        ctx.lineTo(320 + Math.cos(a2) * 520, 320 + Math.sin(a2) * 520);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }

    if (sceneId === 'space') {
      var g = ctx.createLinearGradient(0, 0, 0, SIZE);
      g.addColorStop(0, '#090421');
      g.addColorStop(0.65, '#2b0f54');
      g.addColorStop(1, '#7c2d12');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SIZE, SIZE);
      // Twinkling chaotic stars
      for (var i = 0; i < 48; i++) {
        ctx.fillStyle = i % 3 === 0 ? '#fde047' : '#ffffff';
        var sx = rng() * SIZE, sy = rng() * 420;
        ctx.fillRect(sx, sy, 3 + rng() * 4, 3 + rng() * 4);
      }
      // Derpy grinning Saturn!
      ctx.save();
      ctx.translate(495, 130);
      ctx.rotate(-0.2);
      wobbleEllipse(ctx, 0, 0, 96, 22, rng, jitter * 0.5, null, '#22d3ee', 7);
      wobbleEllipse(ctx, 0, 0, 52, 50, rng, jitter * 0.5, '#f97316', INK, 5);
      // Derp eyes on Saturn
      wobbleEllipse(ctx, -16, -8, 10, 12, rng, 1, '#fff', INK, 3);
      wobbleEllipse(ctx, 16, -5, 12, 10, rng, 1, '#fff', INK, 3);
      wobbleEllipse(ctx, -14, -7, 3, 3, rng, 0, INK, false);
      wobbleEllipse(ctx, 14, -5, 3, 3, rng, 0, INK, false);
      wobbleLine(ctx, -15, 18, 18, 14, rng, 3, INK, 4);
      ctx.restore();
      // Red Mars lumpy ground
      ctx.beginPath();
      ctx.moveTo(0, 465);
      ctx.quadraticCurveTo(200, 425, 420, 460);
      ctx.quadraticCurveTo(540, 480, SIZE, 445);
      ctx.lineTo(SIZE, SIZE);
      ctx.lineTo(0, SIZE);
      ctx.closePath();
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5;
      ctx.stroke();
      wobbleEllipse(ctx, 130, 535, 48, 16, rng, 3, '#c2410c', INK, 4);
      wobbleEllipse(ctx, 510, 520, 60, 18, rng, 3, '#c2410c', INK, 4);
    } else if (sceneId === 'cyber') {
      var cg = ctx.createLinearGradient(0, 0, 0, SIZE);
      cg.addColorStop(0, '#09061f');
      cg.addColorStop(0.55, '#3b0764');
      cg.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, SIZE, SIZE);
      // Giant striped synthwave sun
      wobbleEllipse(ctx, 320, 260, 135, 135, rng, jitter * 0.4, '#f43f5e', '#fde047', 6);
      ctx.fillStyle = '#3b0764';
      for (var sl = 240; sl < 395; sl += 22) ctx.fillRect(170, sl, 300, 7);
      // Perspective neon grid
      ctx.fillStyle = '#140c2e';
      ctx.fillRect(0, 415, SIZE, 225);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      for (var gy = 415; gy <= SIZE; gy += 32) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(SIZE, gy); ctx.stroke();
      }
      for (var gx = -240; gx <= SIZE + 240; gx += 80) {
        ctx.beginPath(); ctx.moveTo(320 + (gx - 320) * 0.25, 415); ctx.lineTo(gx, SIZE); ctx.stroke();
      }
      // Neon buildings + hilarious sign
      wobbleRect(ctx, 18, 135, 92, 280, rng, 4, '#1e1b4b', '#f472b6', 4);
      wobbleRect(ctx, 530, 110, 96, 305, rng, 4, '#1e1b4b', '#22d3ee', 4);
      wobbleRect(ctx, 28, 165, 72, 42, rng, 2, '#09061f', '#fde047', 3);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('抽象区', 64, 194);
    } else if (sceneId === 'beach') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 0, SIZE, 380);
      // Cool Sunglasses Sun!
      wobbleEllipse(ctx, 108, 105, 58, 58, rng, jitter * 0.5, '#fde047', INK, 5);
      wobbleRect(ctx, 68, 86, 34, 22, rng, 1, INK, INK, 2);
      wobbleRect(ctx, 112, 86, 34, 22, rng, 1, INK, INK, 2);
      wobbleLine(ctx, 102, 95, 112, 95, rng, 1, INK, 4);
      wobbleLine(ctx, 90, 128, 128, 124, rng, 2, INK, 4);
      // Wobbly Ocean
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 320, SIZE, 120);
      for (var wx = 0; wx < SIZE; wx += 75) {
        wobbleEllipse(ctx, wx + 35, 325, 44, 16, rng, 2, '#0284c7', '#e0f2fe', 4);
      }
      // Sandy beach
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(0, 420, SIZE, 220);
      wobbleLine(ctx, 0, 420, SIZE, 424, rng, 4, INK, 5);
      // Crooked palm tree on right
      wobbleLine(ctx, 575, 455, 535, 190, rng, 8, '#92400e', 18);
      wobbleEllipse(ctx, 490, 185, 55, 18, rng, 3, '#22c55e', INK, 4);
      wobbleEllipse(ctx, 575, 175, 55, 18, rng, 3, '#22c55e', INK, 4);
      wobbleEllipse(ctx, 540, 145, 22, 48, rng, 3, '#4ade80', INK, 4);
    } else if (sceneId === 'office') {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, SIZE, 450);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 450, SIZE, 190);
      wobbleLine(ctx, 0, 450, SIZE, 450, rng, 3, INK, 5);
      // Wall clock stuck at 23:59!
      wobbleEllipse(ctx, 110, 125, 48, 48, rng, 3, '#ffffff', INK, 5);
      wobbleLine(ctx, 110, 125, 110, 88, rng, 1, '#ef4444', 5);
      wobbleLine(ctx, 110, 125, 102, 92, rng, 1, INK, 5);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('23:59', 110, 192);
      // Red motivational banner "加油打工人"
      wobbleRect(ctx, 210, 62, 260, 62, rng, 3, '#dc2626', INK, 5);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
      ctx.fillText('加油！打工人！', 340, 103);
      // Cubicle window
      wobbleRect(ctx, 505, 85, 110, 150, rng, 3, '#0f172a', INK, 5);
      ctx.fillStyle = '#fde047';
      wobbleEllipse(ctx, 558, 130, 16, 16, rng, 1, '#fde047', false);
    } else if (sceneId === 'volcano') {
      var vg = ctx.createLinearGradient(0, 0, 0, SIZE);
      vg.addColorStop(0, '#450a0a');
      vg.addColorStop(0.55, '#dc2626');
      vg.addColorStop(1, '#f97316');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, SIZE, SIZE);
      // Volcano cone
      ctx.beginPath();
      ctx.moveTo(80, 480); ctx.lineTo(270, 210); ctx.lineTo(370, 210); ctx.lineTo(560, 480); ctx.closePath();
      ctx.fillStyle = '#292524'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
      // Lava spray
      for (var lv = 0; lv < 12; lv++) {
        wobbleEllipse(ctx, 260 + rng() * 120, 110 + rng() * 110, 12 + rng() * 14, 12 + rng() * 14, rng, 3, lv % 2 === 0 ? '#fde047' : '#fb923c', INK, 3);
      }
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 465, SIZE, 175);
      wobbleLine(ctx, 0, 465, SIZE, 465, rng, 4, '#fde047', 6);
    } else if (sceneId === 'nightmarket') {
      ctx.fillStyle = '#1e1036';
      ctx.fillRect(0, 0, SIZE, SIZE);
      // Stall awning
      for (var aw = 0; aw < 10; aw++) {
        wobbleRect(ctx, aw * 64, 70, 64, 48, rng, 2, aw % 2 === 0 ? '#ef4444' : '#fefce8', INK, 4);
      }
      wobbleRect(ctx, 175, 16, 290, 52, rng, 3, '#09061f', '#facc15', 5);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ 灵魂夜市大排档 ★', 320, 51);
      // Glowing lanterns
      wobbleEllipse(ctx, 72, 165, 28, 36, rng, 2, '#ef4444', INK, 4);
      wobbleEllipse(ctx, 568, 165, 28, 36, rng, 2, '#ef4444', INK, 4);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(0, 445, SIZE, 195);
      wobbleLine(ctx, 0, 445, SIZE, 445, rng, 3, '#f472b6', 5);
    } else if (sceneId === 'meadow') {
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(0, 0, SIZE, 410);
      // Derpy smiling sun
      wobbleEllipse(ctx, 540, 96, 54, 54, rng, 4, '#fde047', INK, 5);
      wobbleEllipse(ctx, 526, 88, 6, 8, rng, 1, INK, false);
      wobbleEllipse(ctx, 554, 88, 6, 8, rng, 1, INK, false);
      wobbleLine(ctx, 524, 114, 556, 110, rng, 3, INK, 4);
      // Fluffy clouds
      wobbleEllipse(ctx, 130, 110, 66, 32, rng, 4, '#fff', INK, 4);
      wobbleEllipse(ctx, 320, 86, 54, 26, rng, 4, '#fff', INK, 4);
      // Rolling green hills
      wobbleEllipse(ctx, 160, 520, 290, 175, rng, 6, '#4ade80', INK, 5);
      wobbleEllipse(ctx, 500, 540, 290, 185, rng, 6, '#22c55e', INK, 5);
    } else {
      // Rainbow Mental Pollution Hypno-Burst!
      var rCols = ['#fde047', '#ff4d94', '#22d3ee', '#a3e635', '#c084fc', '#fb923c'];
      var n = 18;
      for (var r = 0; r < n; r++) {
        ctx.fillStyle = rCols[r % rCols.length];
        ctx.beginPath();
        ctx.moveTo(320, 320);
        var ra1 = (Math.PI * 2 * r) / n;
        var ra2 = (Math.PI * 2 * (r + 1)) / n;
        ctx.lineTo(320 + Math.cos(ra1) * 520, 320 + Math.sin(ra1) * 520);
        ctx.lineTo(320 + Math.cos(ra2) * 520, 320 + Math.sin(ra2) * 520);
        ctx.closePath();
        ctx.fill();
      }
      wobbleEllipse(ctx, 320, 320, 220, 220, rng, 6, 'rgba(255,255,255,0.28)', false);
    }
  };

  Painter.prototype._drawSpeedLines = function (ctx, style, chaos, rng) {
    var count = Math.floor(14 + chaos * 24);
    ctx.strokeStyle = style === 'cyber' ? 'rgba(34, 211, 238, 0.45)' : 'rgba(17, 17, 24, 0.22)';
    for (var i = 0; i < count; i++) {
      var a = (Math.PI * 2 * i) / count + (rng() - 0.5) * 0.12;
      var inner = 195 + rng() * 65;
      ctx.lineWidth = 2 + rng() * 4;
      ctx.beginPath();
      ctx.moveTo(320 + Math.cos(a) * inner, 320 + Math.sin(a) * inner);
      ctx.lineTo(320 + Math.cos(a) * 480, 320 + Math.sin(a) * 480);
      ctx.stroke();
    }
  };

  Painter.prototype._drawExplosionBack = function (ctx, cx, cy, rng, jitter) {
    var spikes = 16;
    ctx.beginPath();
    for (var i = 0; i < spikes * 2; i++) {
      var a = (Math.PI * i) / spikes;
      var r = (i % 2 === 0 ? 225 : 135) + (rng() - 0.5) * 26;
      var x = cx + Math.cos(a) * r;
      var y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#f97316'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();

    wobbleEllipse(ctx, cx, cy, 130, 120, rng, jitter, '#fde047', '#ef4444', 5);
  };

  // ==================== CHARACTERS (18+ CURSED SOUL HEROES!) ====================
  Painter.prototype._drawSubject = function (ctx, sub, cx, cy, sc, parsed, flags, rng, jitter, chaos) {
    ctx.save();
    ctx.translate(cx, cy);
    var fatX = parsed.mods.isFat ? 1.24 : 1.0;
    var tilt = (rng() - 0.5) * (0.14 + chaos * 0.16);
    if (flags.hasFly) tilt += 0.24;
    if (flags.hasDance) tilt += (rng() > 0.5 ? 0.2 : -0.2);
    if (flags.hasSleep) {
      ctx.translate(0, 35);
      ctx.rotate(-Math.PI / 2 + 0.1);
    } else {
      ctx.rotate(tilt);
    }
    ctx.scale((flags.facing || 1) * sc, sc);

    var baseCol = parsed.mods.tint || sub.color || '#fde047';
    var hasWings = parsed.props.some(function (p) { return p.id === 'wings'; }) || flags.hasFly;

    // Ground shadow
    if (!flags.hasFly && !flags.isRider && !flags.hasDrive) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 118, 82 * fatX, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Jetpack rainbow/fire thrust if flying!
    if (flags.hasFly) {
      wobbleEllipse(ctx, -20, 138, 22, 48, rng, jitter, '#f97316', INK, 4);
      wobbleEllipse(ctx, 20, 144, 18, 42, rng, jitter, '#fde047', INK, 4);
    }

    // Flapping goofy wings behind torso
    if (hasWings) {
      wobbleEllipse(ctx, -98, -10, 56, 26, rng, jitter, '#ffffff', INK, 5);
      wobbleEllipse(ctx, 98, -10, 56, 26, rng, jitter, '#ffffff', INK, 5);
    }

    // Draw Character Specific Body + Head!
    var headY = -58;
    if (sub.id === 'dino') {
      // Hilarious big-belly T-Rex with TINY arms!
      // Spiky tail
      ctx.beginPath();
      ctx.moveTo(-45, 55); ctx.lineTo(-155, 82); ctx.lineTo(-55, 12); ctx.closePath();
      ctx.fillStyle = baseCol; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      // Chunky legs
      wobbleEllipse(ctx, -28, 92, 24, 34, rng, jitter, baseCol, INK, 5);
      wobbleEllipse(ctx, 32, 92, 24, 34, rng, jitter, baseCol, INK, 5);
      // Giant pear belly
      wobbleEllipse(ctx, 0, 34, 72 * fatX, 66, rng, jitter, baseCol, INK, 5);
      wobbleEllipse(ctx, 18, 42, 42 * fatX, 46, rng, jitter, '#bbf7d0', INK, 3);
      // Comedically tiny flailing T-Rex arms!!
      wobbleLine(ctx, 50, 16, 86, 4, rng, 3, baseCol, 12);
      wobbleLine(ctx, 50, 16, 86, 4, rng, 2, INK, 4);
      wobbleLine(ctx, 54, 30, 88, 26, rng, 3, INK, 4);
      // Big boxy goofy snout head
      wobbleRect(ctx, -56, -116, 134, 82, rng, jitter, baseCol, INK, 5);
      // Jagged goofy teeth
      for (var dt = 0; dt < 4; dt++) {
        wobbleRect(ctx, 20 + dt * 14, -46, 10, 14, rng, 1, '#fff', INK, 3);
      }
      headY = -74;
    } else if (sub.id === 'goose') {
      // Iconic Screaming Rubber-Neck Goose!
      wobbleLine(ctx, -22, 80, -32, 118, rng, 2, '#f97316', 8);
      wobbleLine(ctx, 20, 80, 32, 118, rng, 2, '#f97316', 8);
      wobbleEllipse(ctx, -10, 48, 78 * fatX, 46, rng, jitter, '#ffffff', INK, 5);
      // Long curvy rubber neck
      ctx.beginPath();
      ctx.moveTo(22, 25);
      ctx.bezierCurveTo(60, -25, -20, -45, 12, -88);
      ctx.strokeStyle = INK; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 24; ctx.stroke();
      wobbleEllipse(ctx, 14, -92, 34, 28, rng, jitter, '#ffffff', INK, 5);
      // Screaming orange beak!
      wobbleEllipse(ctx, 64, -90, 32, 14, rng, jitter, '#f97316', INK, 5);
      wobbleLine(ctx, 42, -88, 92, -86, rng, 2, INK, 4);
      headY = -92;
    } else if (sub.id === 'fish') {
      // Giant dead-inside Salted Fish with stick limbs!
      ctx.beginPath();
      ctx.moveTo(-88, 0); ctx.lineTo(-136, -42); ctx.lineTo(-124, 0); ctx.lineTo(-136, 42); ctx.closePath();
      ctx.fillStyle = baseCol; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      wobbleEllipse(ctx, 0, 0, 98 * fatX, 56, rng, jitter, baseCol, INK, 5);
      wobbleEllipse(ctx, 20, 16, 62, 24, rng, jitter, '#e0f2fe', false);
      // Funny skinny human stick legs!
      wobbleLine(ctx, -20, 52, -32, 108, rng, 3, INK, 6);
      wobbleLine(ctx, 24, 52, 36, 108, rng, 3, INK, 6);
      headY = -8;
    } else if (sub.id === 'ghost') {
      // Wavy floating bedsheet ghost!
      ctx.beginPath();
      ctx.moveTo(-70, 95);
      ctx.quadraticCurveTo(-76, -118, 0, -122);
      ctx.quadraticCurveTo(76, -118, 70, 95);
      ctx.lineTo(42, 74); ctx.lineTo(18, 98); ctx.lineTo(-4, 72); ctx.lineTo(-32, 98); ctx.closePath();
      ctx.fillStyle = '#f8fafc'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      headY = -48;
    } else {
      // Bipedal Hilarious Big-Head Meme Character! (Cat, Dog, Panda, Frog, Pig, Chicken, Alien, Robot, Ultraman, Rabbit, Coder, Boss, Bancho, Human, Blob)
      // Legs
      var legSpread = flags.hasDance ? 38 : 22;
      wobbleLine(ctx, -22, 68, -legSpread, 114, rng, 4, INK, 8);
      wobbleLine(ctx, 22, 68, legSpread, 114, rng, 4, INK, 8);
      wobbleEllipse(ctx, -legSpread - 6, 116, 16, 9, rng, 2, '#ef4444', INK, 4);
      wobbleEllipse(ctx, legSpread + 6, 116, 16, 9, rng, 2, '#ef4444', INK, 4);

      // Tail for cat / dog / pig
      if (sub.id === 'cat' || sub.id === 'dog' || sub.id === 'pig') {
        wobbleLine(ctx, -56, 52, -108, 12, rng, 8, sub.id === 'pig' ? '#f472b6' : baseCol, 12);
        wobbleLine(ctx, -56, 52, -108, 12, rng, 4, INK, 4);
      }

      // Chubby / expressive torso
      var shirtCol = sub.id === 'boss' ? '#1e293b' : (sub.id === 'coder' ? '#3b82f6' : (sub.id === 'bancho' ? '#1e1b2e' : (sub.id === 'ultraman' ? '#e2e8f0' : baseCol)));
      wobbleEllipse(ctx, 0, 32, 58 * fatX, 54, rng, jitter, shirtCol, INK, 5);
      if (sub.id === 'boss') {
        // Red necktie on huge belly
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-10, 44); ctx.lineTo(0, 62); ctx.lineTo(10, 44); ctx.closePath();
        ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      } else if (sub.id === 'ultraman') {
        wobbleEllipse(ctx, 0, 26, 14, 14, rng, 1, '#38bdf8', INK, 4); // Color timer!
        wobbleRect(ctx, -46, 8, 92, 12, rng, 2, '#ef4444', INK, 3);
      } else if (sub.id === 'coder') {
        // Plaid shirt lines
        wobbleLine(ctx, -38, 22, 38, 22, rng, 1, '#1d4ed8', 3);
        wobbleLine(ctx, -42, 42, 42, 42, rng, 1, '#1d4ed8', 3);
        wobbleLine(ctx, -14, -8, -14, 72, rng, 1, '#1d4ed8', 3);
        wobbleLine(ctx, 14, -8, 14, 72, rng, 1, '#1d4ed8', 3);
      } else if (sub.id === 'cat' || sub.id === 'dog' || sub.id === 'panda') {
        wobbleEllipse(ctx, 0, 38, 34 * fatX, 32, rng, jitter * 0.6, '#fffbeb', false);
      }

      // Waving Arms!
      var armUpL = (flags.hasDance || flags.hasFly || parsed.emotion === 'angry') ? -48 : 26;
      var armUpR = (flags.hasFight || flags.hasDance || flags.hasProps) ? -34 : 24;
      wobbleLine(ctx, -50, 12, -96, armUpL, rng, 5, INK, 8);
      wobbleEllipse(ctx, -98, armUpL, 12, 12, rng, 2, baseCol, INK, 4);
      wobbleLine(ctx, 50, 12, 96, armUpR, rng, 5, INK, 8);
      wobbleEllipse(ctx, 98, armUpR, 12, 12, rng, 2, baseCol, INK, 4);

      // HUGE EXPRESSIVE HEAD!
      var headCol = (sub.id === 'coder' || sub.id === 'boss' || sub.id === 'bancho' || sub.id === 'human') ? '#ffd4a3' : (sub.id === 'ultraman' ? '#cbd5e1' : baseCol);
      if (sub.id === 'robot') {
        wobbleRect(ctx, -64, -124, 128, 112, rng, jitter, '#94a3b8', INK, 5);
        wobbleLine(ctx, 0, -124, 10, -162, rng, 4, INK, 5);
        wobbleEllipse(ctx, 12, -166, 12, 12, rng, 2, '#ef4444', INK, 4);
      } else if (sub.id === 'frog') {
        wobbleEllipse(ctx, 0, -56, 76, 52, rng, jitter, '#4ade80', INK, 5);
        wobbleEllipse(ctx, -32, -104, 24, 24, rng, 2, '#4ade80', INK, 5);
        wobbleEllipse(ctx, 32, -104, 24, 24, rng, 2, '#4ade80', INK, 5);
      } else {
        // Ears BEFORE head
        if (sub.id === 'cat') {
          ctx.beginPath(); ctx.moveTo(-58, -96); ctx.lineTo(-76, -158); ctx.lineTo(-18, -118); ctx.closePath();
          ctx.fillStyle = headCol; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(58, -96); ctx.lineTo(76, -158); ctx.lineTo(18, -118); ctx.closePath();
          ctx.fillStyle = headCol; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
        } else if (sub.id === 'dog') {
          wobbleEllipse(ctx, -68, -82, 22, 42, rng, 3, '#b45309', INK, 5);
          wobbleEllipse(ctx, 68, -82, 22, 42, rng, 3, '#b45309', INK, 5);
        } else if (sub.id === 'panda') {
          wobbleEllipse(ctx, -56, -116, 26, 26, rng, 2, INK, INK, 4);
          wobbleEllipse(ctx, 56, -116, 26, 26, rng, 2, INK, INK, 4);
        } else if (sub.id === 'rabbit') {
          wobbleEllipse(ctx, -28, -154, 18, 56, rng, 3, '#fce7f3', INK, 5);
          wobbleEllipse(ctx, 34, -142, 18, 52, rng, 3, '#fce7f3', INK, 5);
        } else if (sub.id === 'pig') {
          wobbleEllipse(ctx, -54, -108, 22, 18, rng, 2, '#f472b6', INK, 5);
          wobbleEllipse(ctx, 54, -108, 22, 18, rng, 2, '#f472b6', INK, 5);
        } else if (sub.id === 'alien') {
          wobbleLine(ctx, -24, -118, -46, -162, rng, 4, INK, 5);
          wobbleEllipse(ctx, -48, -166, 11, 11, rng, 1, '#fde047', INK, 4);
          wobbleLine(ctx, 24, -118, 46, -162, rng, 4, INK, 5);
          wobbleEllipse(ctx, 48, -166, 11, 11, rng, 1, '#fde047', INK, 4);
        } else if (sub.id === 'chicken') {
          wobbleEllipse(ctx, -10, -128, 16, 22, rng, 2, '#ef4444', INK, 4);
          wobbleEllipse(ctx, 12, -132, 16, 24, rng, 2, '#ef4444', INK, 4);
        }

        wobbleEllipse(ctx, 0, -64, 70, 62, rng, jitter, headCol, INK, 5);

        // Specific head details
        if (sub.id === 'cat') {
          // Forehead tabby stripes + whiskers
          wobbleLine(ctx, -16, -118, -14, -100, rng, 1, '#c2410c', 5);
          wobbleLine(ctx, 0, -122, 0, -98, rng, 1, '#c2410c', 5);
          wobbleLine(ctx, 16, -118, 14, -100, rng, 1, '#c2410c', 5);
          wobbleLine(ctx, -58, -54, -98, -62, rng, 2, INK, 4);
          wobbleLine(ctx, -58, -42, -96, -38, rng, 2, INK, 4);
          wobbleLine(ctx, 58, -54, 98, -62, rng, 2, INK, 4);
          wobbleLine(ctx, 58, -42, 96, -38, rng, 2, INK, 4);
        } else if (sub.id === 'panda') {
          // Iconic Panda black eye patches!
          wobbleEllipse(ctx, -26, -70, 22, 18, rng, 2, INK, false);
          wobbleEllipse(ctx, 26, -70, 22, 18, rng, 2, INK, false);
        } else if (sub.id === 'pig') {
          wobbleEllipse(ctx, 0, -48, 28, 18, rng, 2, '#f472b6', INK, 4);
          wobbleEllipse(ctx, -10, -48, 5, 7, rng, 0, INK, false);
          wobbleEllipse(ctx, 10, -48, 5, 7, rng, 0, INK, false);
        } else if (sub.id === 'chicken') {
          // 中分头 + orange beak!
          wobbleEllipse(ctx, -36, -104, 24, 12, rng, 2, '#94a3b8', INK, 4);
          wobbleEllipse(ctx, 36, -104, 24, 12, rng, 2, '#94a3b8', INK, 4);
        } else if (sub.id === 'bancho') {
          // MASSIVE GLOWING NEON PURPLE POMPADOUR!
          wobbleEllipse(ctx, 18, -124, 84, 34, rng, jitter, '#a855f7', INK, 6);
          wobbleLine(ctx, -16, -134, 62, -130, rng, 3, '#f472b6', 6);
        } else if (sub.id === 'coder' || parsed.mods.isBald) {
          // 3 lonely surviving programmer hairs on top!
          wobbleLine(ctx, -12, -122, -24, -148, rng, 3, INK, 4);
          wobbleLine(ctx, 0, -124, 4, -152, rng, 3, INK, 4);
          wobbleLine(ctx, 12, -122, 26, -146, rng, 3, INK, 4);
        } else if (sub.id === 'ultraman') {
          // Center silver crest fin
          wobbleRect(ctx, -8, -144, 16, 36, rng, 2, '#e2e8f0', INK, 4);
        } else if (sub.id === 'blob') {
          // Sticky-note label on abstract blob chest!
          wobbleRect(ctx, -40, 12, 80, 34, rng, 2, '#fef08a', INK, 3);
          ctx.fillStyle = INK;
          ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(parsed.raw.slice(0, 4), 0, 34);
        }
      }
    }

    // ==================== CURSED MEME FACIAL EXPRESSIONS ====================
    this._drawCursedFace(ctx, sub, 0, headY, parsed.emotion, parsed.mods, rng, jitter, chaos);

    // ==================== PROPS ON HERO ====================
    if (flags.hasProps) {
      this._drawCharacterProps(ctx, parsed.props, headY, rng, jitter);
    }

    ctx.restore();
  };

  Painter.prototype._drawCursedFace = function (ctx, sub, fx, fy, emotion, mods, rng, jitter, chaos) {
    var eyeX = sub.id === 'dino' ? 22 : (sub.id === 'fish' ? 42 : 0);
    var eyeY = sub.id === 'frog' ? fy - 48 : fy - 8;
    var eyeSep = sub.id === 'dino' ? 22 : (sub.id === 'fish' ? 18 : 26);

    // Ultraman glowing salted-egg eyes!
    if (sub.id === 'ultraman') {
      wobbleEllipse(ctx, -26, eyeY, 20, 14, rng, 2, '#fef08a', INK, 4);
      wobbleEllipse(ctx, 26, eyeY, 20, 14, rng, 2, '#fef08a', INK, 4);
      wobbleLine(ctx, -12, fy + 24, 12, fy + 24, rng, 2, INK, 4);
      return;
    }

    // Dark eye circles for programmers / tired prompts!
    if (mods.hasDarkCircles || sub.id === 'coder') {
      wobbleEllipse(ctx, eyeX - eyeSep, eyeY + 14, 22, 10, rng, 1, 'rgba(88, 28, 135, 0.45)', false);
      wobbleEllipse(ctx, eyeX + eyeSep, eyeY + 14, 22, 10, rng, 1, 'rgba(88, 28, 135, 0.45)', false);
    }

    if (emotion === 'sleep') {
      // Closed peaceful U-eyes + giant snot bubble + Zzz!
      ctx.strokeStyle = INK; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(eyeX - eyeSep, eyeY, 14, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(eyeX + eyeSep, eyeY, 14, 0.1, Math.PI - 0.1); ctx.stroke();
      // Giant translucent snot bubble!!
      wobbleEllipse(ctx, eyeX + 26, fy + 18, 22, 22, rng, 2, 'rgba(186, 230, 253, 0.78)', '#0284c7', 3);
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.font = '900 32px monospace';
      ctx.strokeText('Zzz', eyeX + 68, eyeY - 45);
      ctx.fillText('Zzz', eyeX + 68, eyeY - 45);
      return;
    }

    // MASSIVE ASYMMETRIC DERPY / CURSED BULGING EYES!
    var rL = 16 + chaos * 10;
    var rR = 13 + chaos * 12;
    wobbleEllipse(ctx, eyeX - eyeSep, eyeY, rL, rL * 1.05, rng, 2, '#ffffff', INK, 4);
    wobbleEllipse(ctx, eyeX + eyeSep, eyeY, rR, rR * 0.92, rng, 2, '#ffffff', INK, 4);

    if (emotion === 'rich') {
      ctx.fillStyle = '#eab308';
      ctx.font = '900 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('￥', eyeX - eyeSep, eyeY + 9);
      ctx.fillText('￥', eyeX + eyeSep, eyeY + 9);
    } else {
      // Deliberately cross-eyed / misaligned pinpoint pupils for maximum 魔性!
      var offL = (rng() - 0.5) * 14 * chaos;
      var offR = (rng() - 0.5) * 14 * chaos;
      wobbleEllipse(ctx, eyeX - eyeSep + offL, eyeY + (rng() - 0.5) * 8, 5, 5, rng, 0, INK, false);
      wobbleEllipse(ctx, eyeX + eyeSep + offR, eyeY + (rng() - 0.5) * 8, 4, 4, rng, 0, INK, false);
    }

    // Expressive eyebrows
    if (emotion === 'angry') {
      wobbleLine(ctx, eyeX - eyeSep - 18, eyeY - 24, eyeX - 6, eyeY - 12, rng, 2, INK, 6);
      wobbleLine(ctx, eyeX + eyeSep + 18, eyeY - 24, eyeX + 6, eyeY - 12, rng, 2, INK, 6);
      // Red comic anger cross vein!
      wobbleLine(ctx, eyeX + 46, eyeY - 38, eyeX + 62, eyeY - 22, rng, 1, '#ef4444', 5);
      wobbleLine(ctx, eyeX + 62, eyeY - 38, eyeX + 46, eyeY - 22, rng, 1, '#ef4444', 5);
    }

    // Waterfall Crying Jets!!
    if (emotion === 'cry') {
      wobbleRect(ctx, eyeX - eyeSep - 12, eyeY + 12, 20, 125, rng, 5, '#38bdf8', '#0284c7', 3);
      wobbleRect(ctx, eyeX + eyeSep - 8, eyeY + 12, 20, 125, rng, 5, '#38bdf8', '#0284c7', 3);
    }

    // Mouths!
    var my = fy + 24;
    if (sub.id === 'goose') return; // beak already drawn
    if (sub.id === 'chicken') {
      ctx.beginPath(); ctx.moveTo(-12, my - 10); ctx.lineTo(12, my - 10); ctx.lineTo(0, my + 12); ctx.closePath();
      ctx.fillStyle = '#f97316'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
      return;
    }

    if (emotion === 'cry' || emotion === 'shock' || emotion === 'angry') {
      // Huge screaming open mouth + wavy tongue!
      wobbleEllipse(ctx, eyeX, my + 4, 28, 22, rng, 3, '#991b1b', INK, 5);
      wobbleEllipse(ctx, eyeX, my + 14, 16, 10, rng, 2, '#fb7185', false);
      wobbleRect(ctx, eyeX - 18, my - 12, 36, 9, rng, 1, '#ffffff', INK, 2);
    } else if (emotion === 'manic' || emotion === 'rich') {
      // Unhinged gigantic grin!
      ctx.beginPath();
      ctx.arc(eyeX, my - 4, 30, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      wobbleLine(ctx, eyeX - 24, my + 8, eyeX + 24, my + 8, rng, 1, INK, 3);
    } else {
      // Iconic derpy squiggle mouth + cheeky pink blush + floppy tongue!
      wobbleEllipse(ctx, eyeX - 42, my - 4, 12, 8, rng, 1, 'rgba(255, 77, 148, 0.5)', false);
      wobbleEllipse(ctx, eyeX + 42, my - 4, 12, 8, rng, 1, 'rgba(255, 77, 148, 0.5)', false);
      wobbleLine(ctx, eyeX - 24, my, eyeX + 24, my + (rng() - 0.5) * 10, rng, 4, INK, 5);
      if (sub.id === 'dog' || chaos > 0.6) {
        wobbleEllipse(ctx, eyeX + 8, my + 14, 11, 15, rng, 2, '#fb7185', INK, 4);
      }
    }
  };

  Painter.prototype._drawCharacterProps = function (ctx, props, headY, rng, jitter) {
    for (var i = 0; i < props.length; i++) {
      var id = props[i].id;
      if (id === 'sunglasses') {
        // Deal-With-It bold dark shades!
        wobbleRect(ctx, -56, headY - 22, 46, 26, rng, 2, INK, '#22d3ee', 4);
        wobbleRect(ctx, 10, headY - 22, 46, 26, rng, 2, INK, '#22d3ee', 4);
        wobbleLine(ctx, -10, headY - 12, 10, headY - 12, rng, 1, INK, 6);
        wobbleLine(ctx, -46, headY - 14, -26, headY - 4, rng, 1, '#ffffff', 4);
        wobbleLine(ctx, 20, headY - 14, 40, headY - 4, rng, 1, '#ffffff', 4);
      } else if (id === 'crown') {
        ctx.beginPath();
        ctx.moveTo(-36, headY - 62); ctx.lineTo(-42, headY - 108); ctx.lineTo(-14, headY - 82);
        ctx.lineTo(0, headY - 116); ctx.lineTo(14, headY - 82); ctx.lineTo(42, headY - 108);
        ctx.lineTo(36, headY - 62); ctx.closePath();
        ctx.fillStyle = '#fde047'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
        wobbleEllipse(ctx, 0, headY - 76, 6, 6, rng, 0, '#ef4444', INK, 2);
      } else if (id === 'headphones') {
        ctx.beginPath();
        ctx.arc(0, headY - 16, 76, Math.PI, Math.PI * 2);
        ctx.strokeStyle = '#ff4d94'; ctx.lineWidth = 10; ctx.stroke();
        wobbleEllipse(ctx, -74, headY - 6, 16, 28, rng, 2, '#22d3ee', INK, 4);
        wobbleEllipse(ctx, 74, headY - 6, 16, 28, rng, 2, '#22d3ee', INK, 4);
      } else if (id === 'sword') {
        // Glowing Lightsaber in right hand!
        wobbleLine(ctx, 98, -28, 178, -148, rng, 3, '#22d3ee', 16);
        wobbleLine(ctx, 98, -28, 178, -148, rng, 1, '#ffffff', 6);
        wobbleRect(ctx, 84, -36, 22, 34, rng, 1, '#475569', INK, 4);
      } else if (id === 'mop') {
        wobbleLine(ctx, 92, 48, 148, -118, rng, 3, '#cbd5e1', 9);
        wobbleEllipse(ctx, 152, -124, 34, 24, rng, 4, '#22d3ee', INK, 5);
      } else if (id === 'boba') {
        // Giant Boba Milk Tea Cup!
        wobbleRect(ctx, 76, -34, 46, 66, rng, 2, '#fde68a', INK, 4);
        wobbleLine(ctx, 102, -34, 114, -76, rng, 1, '#ff4d94', 7);
        for (var b = 0; b < 6; b++) {
          wobbleEllipse(ctx, 84 + (b % 3) * 14, 16 + Math.floor(b / 3) * 10, 5, 5, rng, 0, INK, false);
        }
      }
    }
  };

  // ==================== EXTRA SCENE PROPS & EFFECTS ====================
  Painter.prototype._drawVehicle = function (ctx, cx, cy, rng, jitter) {
    // Crooked Turbo Electric Scooter!
    wobbleEllipse(ctx, cx - 88, cy + 48, 36, 36, rng, jitter, '#1e293b', INK, 6);
    wobbleEllipse(ctx, cx + 88, cy + 48, 36, 36, rng, jitter, '#1e293b', INK, 6);
    wobbleEllipse(ctx, cx - 88, cy + 48, 14, 14, rng, 1, '#fde047', INK, 3);
    wobbleEllipse(ctx, cx + 88, cy + 48, 14, 14, rng, 1, '#fde047', INK, 3);
    wobbleRect(ctx, cx - 102, cy - 12, 198, 56, rng, jitter, '#ff4d94', INK, 5);
    wobbleLine(ctx, cx + 75, cy - 12, cx + 98, cy - 92, rng, 3, '#cbd5e1', 10);
    // Exhaust turbo fire!
    wobbleEllipse(ctx, cx - 148, cy + 20, 44, 18, rng, 4, '#f97316', INK, 4);
    wobbleEllipse(ctx, cx - 134, cy + 20, 24, 10, rng, 2, '#fde047', false);
  };

  Painter.prototype._drawSmokingDesk = function (ctx, cx, cy, rng, jitter) {
    wobbleRect(ctx, cx - 78, cy, 156, 78, rng, 3, '#a16207', INK, 5);
    // Overheating Laptop emitting smoke & 404!
    wobbleRect(ctx, cx - 44, cy - 58, 86, 56, rng, 3, '#334155', INK, 5);
    wobbleRect(ctx, cx - 36, cy - 50, 70, 40, rng, 1, '#2563eb', false);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(':( 404', cx - 1, cy - 24);
    wobbleEllipse(ctx, cx + 10, cy - 86, 22, 16, rng, 3, 'rgba(203,213,225,0.85)', INK, 3);
    wobbleEllipse(ctx, cx + 28, cy - 116, 28, 20, rng, 3, 'rgba(203,213,225,0.75)', INK, 3);
  };

  Painter.prototype._drawHotpotProp = function (ctx, cx, cy, rng, jitter) {
    wobbleEllipse(ctx, cx, cy + 16, 62, 34, rng, 3, '#991b1b', INK, 5);
    wobbleEllipse(ctx, cx, cy, 58, 22, rng, 3, '#ef4444', INK, 4);
    wobbleEllipse(ctx, cx - 16, cy, 12, 8, rng, 1, '#fde047', false);
    wobbleEllipse(ctx, cx + 18, cy + 2, 14, 7, rng, 1, '#4ade80', false);
    wobbleLine(ctx, cx - 22, cy - 24, cx - 12, cy - 72, rng, 6, 'rgba(255,255,255,0.8)', 6);
    wobbleLine(ctx, cx + 16, cy - 24, cx + 26, cy - 78, rng, 6, 'rgba(255,255,255,0.8)', 6);
  };

  Painter.prototype._drawDiscoBall = function (ctx, cx, cy, rng, jitter) {
    wobbleLine(ctx, cx, 0, cx, cy - 36, rng, 1, INK, 5);
    wobbleEllipse(ctx, cx, cy, 38, 38, rng, 2, '#e2e8f0', INK, 5);
    var cols = ['#ff4d94', '#22d3ee', '#fde047', '#a855f7'];
    for (var i = 0; i < 8; i++) {
      wobbleRect(ctx, cx - 24 + (i % 4) * 12, cy - 18 + Math.floor(i / 4) * 18, 10, 12, rng, 0, cols[i % 4], INK, 2);
    }
  };

  Painter.prototype._drawFightClash = function (ctx, cx, cy, rng, jitter) {
    wobbleEllipse(ctx, cx, cy, 48, 42, rng, 8, '#fde047', '#ef4444', 5);
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.font = '900 32px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText('啪!!', cx, cy + 12);
    ctx.fillText('啪!!', cx, cy + 12);
  };

  Painter.prototype._drawMoneyRain = function (ctx, rng, jitter, chaos) {
    var count = 10 + Math.floor(chaos * 14);
    for (var i = 0; i < count; i++) {
      ctx.save();
      ctx.translate(rng() * SIZE, rng() * SIZE);
      ctx.rotate((rng() - 0.5) * 1.4);
      wobbleRect(ctx, -22, -11, 44, 22, rng, 1, '#4ade80', INK, 3);
      ctx.fillStyle = '#14532d';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('￥', 0, 5);
      ctx.restore();
    }
  };

  Painter.prototype._drawMusicNotes = function (ctx, rng) {
    var notes = ['♪', '♫', '♬'];
    for (var i = 0; i < 9; i++) {
      ctx.fillStyle = ['#ff4d94', '#22d3ee', '#fde047'][i % 3];
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.font = '900 30px sans-serif';
      var x = 50 + rng() * 540, y = 70 + rng() * 240;
      ctx.strokeText(notes[i % 3], x, y);
      ctx.fillText(notes[i % 3], x, y);
    }
  };

  Painter.prototype._drawChaosStickers = function (ctx, parsed, style, chaos, rng) {
    var words = ['离谱!', '绝了', '精神超前', '草', '合理', '???', '⚡', '666'];
    if (parsed.emotion === 'cry') words.unshift('破防!', '呜呜呜');
    if (parsed.emotion === 'angry') words.unshift('怒!!', '核爆');
    if (parsed.emotion === 'rich') words.unshift('暴富!', '发财');

    var count = Math.floor(chaos * (style === 'abstract' ? 8 : 5));
    for (var i = 0; i < count; i++) {
      var side = i % 2 === 0;
      var sx = side ? (56 + rng() * 95) : (480 + rng() * 105);
      var sy = 95 + rng() * 380;
      var w = words[i % words.length];
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((rng() - 0.5) * 0.55);
      ctx.font = '900 ' + Math.round(22 + rng() * 14) + 'px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.strokeText(w, 0, 0);
      ctx.fillStyle = ['#fde047', '#ff4d94', '#22d3ee', '#a3e635'][i % 4];
      ctx.fillText(w, 0, 0);
      ctx.restore();
    }
  };

  // ==================== 5 VISUAL STYLE POST-PROCESSORS ====================
  Painter.prototype._applyStylePost = function (outCtx, srcCanvas, style, chaos, rng) {
    if (style === 'pixel') {
      // True crunchy 8-bit Pixelation + RGB Glitch Offset!
      var low = document.createElement('canvas');
      var res = Math.round(136 - chaos * 40); // 96..136px
      low.width = res; low.height = res;
      var lctx = low.getContext('2d');
      lctx.imageSmoothingEnabled = false;
      lctx.drawImage(srcCanvas, 0, 0, res, res);

      outCtx.imageSmoothingEnabled = false;
      outCtx.drawImage(low, 0, 0, SIZE, SIZE);
      // Chromatic aberration RGB shift
      outCtx.globalAlpha = 0.25;
      outCtx.globalCompositeOperation = 'screen';
      outCtx.drawImage(low, -5, 0, SIZE, SIZE);
      outCtx.drawImage(low, 5, 2, SIZE, SIZE);
      outCtx.globalAlpha = 1;
      outCtx.globalCompositeOperation = 'source-over';
    } else if (style === 'cyber') {
      outCtx.drawImage(srcCanvas, 0, 0);
      // Random horizontal glitch slice shifts
      var slices = Math.floor(6 + chaos * 10);
      for (var i = 0; i < slices; i++) {
        var sy = Math.floor(rng() * SIZE);
        var sh = 4 + Math.floor(rng() * 16);
        var dx = Math.round((rng() - 0.5) * 28);
        outCtx.drawImage(srcCanvas, 0, sy, SIZE, sh, dx, sy, SIZE, sh);
      }
      // CRT Scanlines + Neon Cam HUD
      outCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (var y = 0; y < SIZE; y += 5) outCtx.fillRect(0, y, SIZE, 2);
      outCtx.strokeStyle = '#22d3ee'; outCtx.lineWidth = 4;
      outCtx.strokeRect(16, 16, 40, 2); outCtx.strokeRect(16, 16, 2, 40);
      outCtx.strokeRect(SIZE - 56, 16, 40, 2); outCtx.strokeRect(SIZE - 18, 16, 2, 40);
      outCtx.fillStyle = '#ef4444';
      outCtx.font = 'bold 16px monospace';
      outCtx.textAlign = 'left';
      outCtx.fillText('● MOXING_CAM 999FPS', 28, 42);
    } else if (style === 'abstract') {
      outCtx.drawImage(srcCanvas, 0, 0);
      // Confetti & floating Picasso eyes!
      for (var k = 0; k < 22; k++) {
        outCtx.fillStyle = ['#ff4d94', '#fde047', '#22d3ee', '#a3e635'][k % 4];
        outCtx.fillRect(rng() * SIZE, rng() * SIZE, 8 + rng() * 12, 8 + rng() * 12);
      }
    } else {
      outCtx.drawImage(srcCanvas, 0, 0);
    }
  };

  Painter.prototype._drawMemeCaption = function (ctx, caption, rawPrompt, style) {
    // Classic bold white text with thick black outline!
    ctx.textAlign = 'center';
    if (style === 'meme') {
      ctx.font = '900 24px "Microsoft YaHei", sans-serif';
      ctx.lineWidth = 7;
      ctx.strokeStyle = INK;
      var topText = rawPrompt.length > 20 ? rawPrompt.slice(0, 20) + '…' : rawPrompt;
      ctx.strokeText(topText, SIZE / 2, 62, SIZE - 48);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(topText, SIZE / 2, 62, SIZE - 48);
    }

    // Bottom punchy caption ribbon
    var fontSize = caption.length > 18 ? 22 : 28;
    ctx.font = '900 ' + fontSize + 'px "Microsoft YaHei", sans-serif';
    ctx.lineWidth = 8;
    ctx.strokeStyle = INK;
    ctx.strokeText(caption, SIZE / 2, SIZE - 24, SIZE - 40);
    ctx.fillStyle = '#fde047';
    ctx.fillText(caption, SIZE / 2, SIZE - 24, SIZE - 40);
  };

  Painter.prototype._drawCornerStamp = function (ctx, style) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, SIZE - 8, SIZE - 8);

    ctx.fillStyle = '#111118';
    ctx.fillRect(SIZE - 136, 12, 124, 24);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.strokeRect(SIZE - 136, 12, 124, 24);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MOXING · ' + style.toUpperCase(), SIZE - 74, 28);
  };

  Painter.prototype.compositeImage = function (canvas, img, rawPrompt, opts) {
    var style = opts.style || 'soul';
    var chaos = (opts.chaos != null ? opts.chaos : 78) / 100;
    var seed = (MD.hashString(rawPrompt || 'moxing') + (opts.seedOffset || 0) * 7919 + (opts.wobbleFrame || 0) * 1337) >>> 0;
    var rng = MD.createRng(seed);

    var ctx = this.offCtx;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Draw AI-generated image with cover-fit & slight comedic wobble if animated
    var jx = opts.wobbleFrame ? (rng() - 0.5) * 10 * chaos : 0;
    var jy = opts.wobbleFrame ? (rng() - 0.5) * 10 * chaos : 0;
    var scale = Math.max(SIZE / img.width, SIZE / img.height);
    var dw = img.width * scale;
    var dh = img.height * scale;
    var dx = (SIZE - dw) / 2 + jx;
    var dy = (SIZE - dh) / 2 + jy;
    ctx.drawImage(img, dx, dy, dw, dh);

    // Optional chaotic radial speedlines around outer edges
    if (chaos > 0.6 || style === 'meme') {
      this._drawSpeedLines(ctx, style, chaos * 0.75, rng);
    }

    // Optional hilarious meme stickers around borders
    if (opts.showStickers !== false) {
      var dummyParsed = MD.parsePrompt(rawPrompt, opts.seedOffset || 0);
      this._drawChaosStickers(ctx, dummyParsed, style, chaos * 0.85, rng);
    }

    // Apply style post-processing (pixelation / RGB glitch / CRT / abstract confetti)
    var outCtx = canvas.getContext('2d');
    outCtx.clearRect(0, 0, SIZE, SIZE);
    this._applyStylePost(outCtx, this.off, style, chaos, rng);

    // Crisp Meme Caption overlay
    if (opts.showCaption) {
      var cap = (opts.customCaption || '').trim() || ('灵魂魔性版：' + rawPrompt.slice(0, 14) + (rawPrompt.length > 14 ? '…' : ''));
      this._drawMemeCaption(outCtx, cap, rawPrompt, style);
    }
    this._drawCornerStamp(outCtx, opts.badgeText || ('AI · ' + style.toUpperCase()));
  };

  Painter.prototype.drawNoticeCard = function (canvas, title, lines) {
    var ctx = canvas.getContext('2d');
    var rng = MD.createRng(921);
    ctx.clearRect(0, 0, SIZE, SIZE);
    this._drawBackground(ctx, 'rainbow', 'meme', 0.5, rng, 3);

    wobbleRect(ctx, 56, 118, SIZE - 112, 396, rng, 4, '#fffdf5', INK, 6);
    wobbleRect(ctx, 96, 86, SIZE - 192, 54, rng, 3, '#ff4d94', INK, 5);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px "Microsoft YaHei", sans-serif';
    ctx.fillText(title, SIZE / 2, 121);

    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('🤯', SIZE / 2, 212);

    ctx.fillStyle = INK;
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], SIZE / 2, 266 + i * 38, SIZE - 150);
    }
    this._drawCornerStamp(ctx, 'NOTICE');
  };

  MD.painter = new Painter();
})(window.MoxingDraw);
