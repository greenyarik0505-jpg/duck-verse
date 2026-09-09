/** Duck Verse — Galactic Invaders: standalone neon canvas shooter. */
(function () {
  'use strict';

  const FRAME = 1000 / 60;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

  class DuckInvadersGame {
    constructor(canvas, onGameOver, onLevelComplete, onAddCoins) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onGameOver = onGameOver;
      this.onLevelComplete = onLevelComplete;
      this.onAddCoins = onAddCoins;
      this.player = { x: 0, y: 0, width: 46, height: 38, speed: 6.5, invulnerable: 0, rapid: 0, shield: 0 };
      this.keys = {}; this.lasers = []; this.enemyBombs = []; this.enemies = []; this.particles = []; this.powerUps = [];
      this.stars = []; this.nebulae = []; this.running = false; this.gameOver = false; this.isPointerDown = false;
      this.score = 0; this.bestScore = this.readBestScore(); this.lives = 3; this.wave = 1; this.combo = 0; this.comboTimer = 0;
      this.collectedCoins = 0; this.enemyDirection = 1; this.enemySpeed = 1; this.waveTransitionTimer = 0; this.announcement = '';
      this.lastFrameTime = 0; this.lastShotTime = 0; this.lastBombTime = 0; this.animationId = null; this.screenShake = 0;
      this.handleKeyDown = this.handleKeyDown.bind(this); this.handleKeyUp = this.handleKeyUp.bind(this); this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this); this.handlePointerUp = this.handlePointerUp.bind(this); this.handleBlur = this.handleBlur.bind(this); this.loop = this.loop.bind(this);
      this.createSpace();
    }

    readBestScore() { try { return parseInt(localStorage.getItem('duckverse_invaders_best') || '0', 10) || 0; } catch (_) { return 0; } }
    saveBestScore() { if (this.score > this.bestScore) { this.bestScore = this.score; try { localStorage.setItem('duckverse_invaders_best', String(this.bestScore)); } catch (_) {} } }
    playSound(name) { if (window.sound && typeof window.sound[name] === 'function') window.sound[name](); }

    createSpace() {
      const w = this.canvas.width || 850, h = this.canvas.height || 480;
      this.stars = Array.from({ length: Math.max(55, Math.floor(w / 12)) }, () => ({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.8 + .5, speed: Math.random() * 1.7 + .35, alpha: Math.random() * .65 + .25 }));
      this.nebulae = Array.from({ length: 4 }, () => ({ x: Math.random() * w, y: Math.random() * h, radius: 90 + Math.random() * 140, color: Math.random() > .5 ? '0, 243, 255' : '255, 0, 127', speed: Math.random() * .18 + .04 }));
    }

    start() {
      this.stop();
      this.running = true; this.gameOver = false; this.keys = {}; this.isPointerDown = false; this.score = 0; this.combo = 0; this.comboTimer = 0; this.lives = 3; this.wave = 1; this.collectedCoins = 0;
      this.lasers = []; this.enemyBombs = []; this.particles = []; this.powerUps = []; this.lastShotTime = 0; this.lastBombTime = performance.now();
      this.player.x = this.canvas.width / 2 - this.player.width / 2; this.player.y = this.canvas.height - this.player.height - 18; this.player.invulnerable = 0; this.player.rapid = 0; this.player.shield = 0;
      this.createSpace(); this.spawnWave();
      window.addEventListener('keydown', this.handleKeyDown); window.addEventListener('keyup', this.handleKeyUp); window.addEventListener('blur', this.handleBlur);
      this.canvas.addEventListener('pointermove', this.handlePointerMove); this.canvas.addEventListener('pointerdown', this.handlePointerDown); window.addEventListener('pointerup', this.handlePointerUp);
      this.lastFrameTime = performance.now(); this.animationId = requestAnimationFrame(this.loop);
    }

    stop() {
      this.running = false; if (this.animationId !== null) cancelAnimationFrame(this.animationId); this.animationId = null;
      window.removeEventListener('keydown', this.handleKeyDown); window.removeEventListener('keyup', this.handleKeyUp); window.removeEventListener('blur', this.handleBlur);
      if (this.canvas) { this.canvas.removeEventListener('pointermove', this.handlePointerMove); this.canvas.removeEventListener('pointerdown', this.handlePointerDown); }
      window.removeEventListener('pointerup', this.handlePointerUp);
    }
    restart() { this.start(); }

    resize(width, height) {
      if (!this.canvas || !width || !height) return;
      const oldWidth = this.canvas.width || width, oldHeight = this.canvas.height || height;
      this.canvas.width = Math.max(320, Math.floor(width)); this.canvas.height = Math.max(260, Math.floor(height));
      const sx = this.canvas.width / oldWidth, sy = this.canvas.height / oldHeight;
      this.player.x = clamp(this.player.x * sx, 0, this.canvas.width - this.player.width); this.player.y = this.canvas.height - this.player.height - 18;
      [...this.enemies, ...this.lasers, ...this.enemyBombs, ...this.powerUps, ...this.particles].forEach((item) => { item.x *= sx; item.y *= sy; });
      this.createSpace();
    }

    spawnWave() {
      this.enemies = []; this.enemyBombs = []; this.enemyDirection = 1; this.enemySpeed = .7 + this.wave * .14; this.waveTransitionTimer = 110;
      const isBossWave = this.wave > 1 && this.wave % 3 === 0;
      this.announcement = isBossWave ? 'КОМАНДИР ЭСКАДРЫ' : `ВОЛНА ${this.wave}`;
      if (isBossWave) {
        const width = Math.min(150, Math.max(112, this.canvas.width * .21)); const hp = 18 + this.wave * 4;
        this.enemies.push({ x: this.canvas.width / 2 - width / 2, y: 58, width, height: 70, type: 'boss', points: 1200, hp, maxHp: hp, bob: 0 }); return;
      }
      const rows = Math.min(5, 3 + Math.floor((this.wave - 1) / 2)); const cols = Math.min(9, Math.max(5, Math.floor((this.canvas.width - 40) / 58)));
      const spacingX = Math.min(64, (this.canvas.width - 42) / cols), startX = (this.canvas.width - ((cols - 1) * spacingX + 32)) / 2;
      for (let row = 0; row < rows; row++) for (let column = 0; column < cols; column++) {
        const type = row === 0 ? 'drone' : row === 1 ? 'orbiter' : 'goose';
        this.enemies.push({ x: startX + column * spacingX, y: 62 + row * 40, width: 32, height: 25, type, points: (rows - row + 1) * 20, column, bob: column * .55 + row });
      }
    }

    handleKeyDown(event) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) event.preventDefault();
      this.keys[event.code] = true;
      if (event.code === 'Space' || event.code === 'ArrowUp') { if (this.gameOver) this.restart(); else this.shoot(); }
      if (event.code === 'KeyR') this.restart();
    }
    handleKeyUp(event) { this.keys[event.code] = false; }
    handleBlur() { this.keys = {}; this.isPointerDown = false; }
    handlePointerMove(event) { const rect = this.canvas.getBoundingClientRect(); if (rect.width) this.player.x = clamp((event.clientX - rect.left) * this.canvas.width / rect.width - this.player.width / 2, 0, this.canvas.width - this.player.width); }
    handlePointerDown(event) {
      if (this.gameOver) { this.restart(); return; }
      this.isPointerDown = true; this.handlePointerMove(event); this.shoot();
      if (this.canvas.setPointerCapture) try { this.canvas.setPointerCapture(event.pointerId); } catch (_) {}
    }
    handlePointerUp() { this.isPointerDown = false; }

    shoot() {
      if (!this.running || this.gameOver) return;
      const now = performance.now(), cooldown = this.player.rapid > 0 ? 82 : 155;
      if (now - this.lastShotTime < cooldown) return;
      this.lastShotTime = now; const center = this.player.x + this.player.width / 2;
      (this.player.rapid > 0 ? [-12, 0, 12] : [-10, 10]).forEach((offset) => this.lasers.push({ x: center + offset - 2, y: this.player.y - 8, width: 4, height: 16, vy: -11.5 }));
      this.playSound('pew');
    }

    addBurst(x, y, color, count, speed) {
      for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2, velocity = (.5 + Math.random()) * speed; this.particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, radius: Math.random() * 2.7 + 1.2, color, alpha: 1, life: 18 + Math.random() * 18 }); }
    }

    update(delta) {
      const dt = clamp(delta / FRAME, .35, 2.2);
      this.stars.forEach((star) => { star.y += star.speed * dt; if (star.y > this.canvas.height) { star.y = -2; star.x = Math.random() * this.canvas.width; } });
      this.nebulae.forEach((nebula) => { nebula.y += nebula.speed * dt; if (nebula.y - nebula.radius > this.canvas.height) { nebula.y = -nebula.radius; nebula.x = Math.random() * this.canvas.width; } });
      this.screenShake = Math.max(0, this.screenShake - dt); if (this.gameOver) return;
      this.player.invulnerable = Math.max(0, this.player.invulnerable - dt); this.player.rapid = Math.max(0, this.player.rapid - dt); this.player.shield = Math.max(0, this.player.shield - dt); this.waveTransitionTimer = Math.max(0, this.waveTransitionTimer - dt); this.comboTimer = Math.max(0, this.comboTimer - dt); if (!this.comboTimer) this.combo = 0;
      if (this.keys.ArrowLeft) this.player.x -= this.player.speed * dt; if (this.keys.ArrowRight) this.player.x += this.player.speed * dt; this.player.x = clamp(this.player.x, 0, this.canvas.width - this.player.width);
      if (this.keys.Space || this.keys.ArrowUp || this.isPointerDown) this.shoot();
      for (let i = this.lasers.length - 1; i >= 0; i--) { const laser = this.lasers[i]; laser.y += laser.vy * dt; if (laser.y + laser.height < 0) this.lasers.splice(i, 1); }
      for (let i = this.enemyBombs.length - 1; i >= 0; i--) {
        const bomb = this.enemyBombs[i]; bomb.y += bomb.vy * dt; bomb.x += (bomb.vx || 0) * dt;
        if (this.player.invulnerable <= 0 && overlaps(bomb, { x: this.player.x + 5, y: this.player.y + 3, width: this.player.width - 10, height: this.player.height - 5 })) { this.enemyBombs.splice(i, 1); this.takeDamage(); }
        else if (bomb.y > this.canvas.height + 24 || bomb.x < -30 || bomb.x > this.canvas.width + 30) this.enemyBombs.splice(i, 1);
      }
      for (let i = this.powerUps.length - 1; i >= 0; i--) { const item = this.powerUps[i]; item.y += item.vy * dt; item.spin += .11 * dt; if (overlaps(item, this.player)) { this.collectPowerUp(item); this.powerUps.splice(i, 1); } else if (item.y > this.canvas.height + 25) this.powerUps.splice(i, 1); }
      this.moveEnemies(dt); this.fireEnemyBombs(); this.checkLaserHits(); this.updateParticles(dt); if (!this.enemies.length) this.completeWave();
    }

    moveEnemies(dt) {
      if (!this.enemies.length) return;
      const boss = this.enemies[0].type === 'boss';
      if (boss) { const enemy = this.enemies[0]; enemy.bob += .04 * dt; enemy.x += this.enemyDirection * this.enemySpeed * 1.8 * dt; enemy.y = 54 + Math.sin(enemy.bob) * 12; if (enemy.x < 14 || enemy.x + enemy.width > this.canvas.width - 14) { enemy.x = clamp(enemy.x, 14, this.canvas.width - enemy.width - 14); this.enemyDirection *= -1; } return; }
      let turn = false; this.enemies.forEach((enemy) => { enemy.x += this.enemyDirection * this.enemySpeed * dt; enemy.bob += .055 * dt; if (enemy.x < 12 || enemy.x + enemy.width > this.canvas.width - 12) turn = true; });
      if (turn) { this.enemyDirection *= -1; this.enemies.forEach((enemy) => { enemy.x = clamp(enemy.x, 12, this.canvas.width - enemy.width - 12); enemy.y += 13; }); this.screenShake = Math.max(this.screenShake, 2); }
      if (this.enemies.some((enemy) => enemy.y + enemy.height >= this.player.y - 5)) { this.lives = 0; this.triggerGameOver(); }
    }

    fireEnemyBombs() {
      const now = performance.now(), interval = Math.max(430, 1250 - this.wave * 70); if (!this.enemies.length || now - this.lastBombTime < interval) return; this.lastBombTime = now;
      if (this.enemies[0].type === 'boss') { const enemy = this.enemies[0], center = enemy.x + enemy.width / 2; [-1, 0, 1].forEach((spread) => this.enemyBombs.push({ x: center - 4, y: enemy.y + enemy.height - 2, width: 8, height: 14, vy: 3.2 + this.wave * .12, vx: spread * 1.2, color: '#ff007f' })); return; }
      const frontLine = {}; this.enemies.forEach((enemy) => { if (!frontLine[enemy.column] || enemy.y > frontLine[enemy.column].y) frontLine[enemy.column] = enemy; }); const shooters = Object.values(frontLine), enemy = shooters[Math.floor(Math.random() * shooters.length)];
      this.enemyBombs.push({ x: enemy.x + enemy.width / 2 - 3, y: enemy.y + enemy.height, width: 6, height: 13, vy: 3.3 + this.wave * .14, color: '#ff4d6d' });
    }

    checkLaserHits() {
      for (let li = this.lasers.length - 1; li >= 0; li--) for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const laser = this.lasers[li], enemy = this.enemies[ei]; if (!overlaps(laser, enemy)) continue;
        this.lasers.splice(li, 1);
        if (enemy.type === 'boss') { enemy.hp--; this.score += 25; this.addBurst(laser.x, laser.y, '#facc15', 4, 2.5); this.screenShake = 2; if (enemy.hp > 0) break; }
        this.destroyEnemy(enemy, ei); break;
      }
    }

    destroyEnemy(enemy, index) {
      const multiplier = 1 + Math.min(4, Math.floor(this.combo / 6)); this.combo++; this.comboTimer = 150; this.score += enemy.points * multiplier; this.saveBestScore(); this.enemies.splice(index, 1);
      this.addBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type === 'boss' ? '#facc15' : enemy.type === 'drone' ? '#00f3ff' : '#ff007f', enemy.type === 'boss' ? 40 : 15, enemy.type === 'boss' ? 7 : 4); this.screenShake = enemy.type === 'boss' ? 13 : 4; this.playSound(enemy.type === 'boss' ? 'explosion' : 'quack');
      if (Math.random() < (enemy.type === 'boss' ? 1 : .13)) { const kind = enemy.type === 'boss' || Math.random() > .5 ? 'rapid' : 'shield'; this.powerUps.push({ x: enemy.x + enemy.width / 2 - 11, y: enemy.y, width: 22, height: 22, vy: 2.15, kind, spin: 0 }); }
      if (Math.random() < .28) { this.collectedCoins++; if (this.onAddCoins) this.onAddCoins(1); this.playSound('coin'); }
    }

    collectPowerUp(item) { if (item.kind === 'rapid') { this.player.rapid = 480; this.announcement = 'ТУРБО-ЛАЗЕР ×3'; } else { this.player.shield = 480; this.announcement = 'КВАНТОВЫЙ ЩИТ'; } this.waveTransitionTimer = 85; this.addBurst(item.x + item.width / 2, item.y + item.height / 2, item.kind === 'rapid' ? '#facc15' : '#00f3ff', 18, 4); this.playSound('coin'); }
    completeWave() { this.wave++; this.score += 400 + this.wave * 40; this.collectedCoins += 2; this.saveBestScore(); if (this.onAddCoins) this.onAddCoins(2); this.playSound('victory'); this.spawnWave(); }
    takeDamage() {
      if (this.player.shield > 0) { this.player.shield = Math.max(0, this.player.shield - 150); this.screenShake = 5; this.addBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#00f3ff', 18, 4); return; }
      this.lives--; this.player.invulnerable = 95; this.combo = 0; this.screenShake = 12; this.addBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ff4d6d', 26, 5); this.playSound('explosion'); if (this.lives <= 0) this.triggerGameOver();
    }
    updateParticles(dt) { for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .035 * dt; p.life -= dt; p.alpha = Math.max(0, p.life / 30); if (p.life <= 0) this.particles.splice(i, 1); } }
    triggerGameOver() { if (this.gameOver) return; this.gameOver = true; this.playSound('gameover'); if (this.onGameOver) this.onGameOver({ score: this.score, wave: this.wave, best: this.bestScore, coins: this.collectedCoins }); }
    roundedRect(ctx, x, y, width, height, radius) { const r = Math.min(radius, width / 2, height / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath(); }

    draw() {
      const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height; ctx.clearRect(0, 0, w, h);
      const background = ctx.createLinearGradient(0, 0, 0, h); background.addColorStop(0, '#111a3e'); background.addColorStop(.48, '#070b22'); background.addColorStop(1, '#02030d'); ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
      this.nebulae.forEach((n) => { const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius); g.addColorStop(0, `rgba(${n.color}, .11)`); g.addColorStop(1, `rgba(${n.color}, 0)`); ctx.fillStyle = g; ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2); });
      this.stars.forEach((s) => { ctx.fillStyle = `rgba(235,250,255,${s.alpha})`; ctx.fillRect(s.x, s.y, s.size, s.size); });
      ctx.save(); if (this.screenShake > 0) ctx.translate((Math.random() - .5) * this.screenShake, (Math.random() - .5) * this.screenShake); this.drawPowerUps(ctx); this.drawLasers(ctx); this.drawBombs(ctx); this.drawEnemies(ctx); this.drawPlayer(ctx); this.drawParticles(ctx); ctx.restore();
      this.drawHud(ctx); if (this.waveTransitionTimer > 0 && !this.gameOver) this.drawAnnouncement(ctx); if (this.gameOver) this.drawGameOver(ctx);
    }

    drawPlayer(ctx) {
      const p = this.player, blink = p.invulnerable > 0 && Math.floor(p.invulnerable / 7) % 2 === 0; if (blink || this.lives <= 0) return;
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.shield > 0) { ctx.strokeStyle = 'rgba(0,243,255,.9)'; ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 16; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.width / 2, p.height / 2, p.width * .67, p.height * .75, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 12; ctx.fillStyle = '#00d8f3'; ctx.fillRect(1, 15, 7, 20); ctx.fillRect(p.width - 8, 15, 7, 20); ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffd92e'; ctx.beginPath(); ctx.ellipse(p.width / 2, 21, 16, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.moveTo(p.width / 2 - 4, 10); ctx.lineTo(p.width / 2, 1); ctx.lineTo(p.width / 2 + 4, 10); ctx.closePath(); ctx.fill();
      ctx.shadowColor = '#ff007f'; ctx.shadowBlur = 10; ctx.fillStyle = '#ff007f'; this.roundedRect(ctx, 15, 12, 16, 7, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(19, 14, 8, 2); ctx.restore();
    }
    drawLasers(ctx) { ctx.save(); ctx.fillStyle = '#b7fbff'; ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 15; this.lasers.forEach((l) => ctx.fillRect(l.x, l.y, l.width, l.height)); ctx.restore(); }
    drawBombs(ctx) { ctx.save(); this.enemyBombs.forEach((b) => { ctx.fillStyle = b.color || '#ff4d6d'; ctx.shadowColor = b.color || '#ff4d6d'; ctx.shadowBlur = 12; this.roundedRect(ctx, b.x, b.y, b.width, b.height, 3); ctx.fill(); }); ctx.restore(); }
    drawEnemies(ctx) {
      this.enemies.forEach((e) => { ctx.save(); ctx.translate(e.x, e.y + (e.type === 'boss' ? 0 : Math.sin(e.bob) * 2));
        if (e.type === 'boss') { ctx.shadowColor = '#ff007f'; ctx.shadowBlur = 18; ctx.fillStyle = '#6121a8'; this.roundedRect(ctx, 0, 5, e.width, e.height - 5, 18); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#ff007f'; this.roundedRect(ctx, e.width * .2, 19, e.width * .6, 17, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(e.width * .34, 25, e.width * .32, 3); ctx.fillStyle = '#facc15'; ctx.fillRect(14, e.height - 3, 18, 7); ctx.fillRect(e.width - 32, e.height - 3, 18, 7); }
        else if (e.type === 'drone') { ctx.shadowColor = '#ff007f'; ctx.shadowBlur = 11; ctx.fillStyle = '#ff007f'; ctx.beginPath(); ctx.arc(16, 12, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(11, 9, 10, 5); ctx.fillStyle = '#202443'; ctx.fillRect(14, 10, 3, 3); }
        else if (e.type === 'orbiter') { ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(16, 13, 14, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(16, 13, 7, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillStyle = '#dfe8f5'; ctx.beginPath(); ctx.ellipse(16, 13, 14, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff7a00'; ctx.fillRect(13, 2, 6, 7); ctx.fillStyle = '#182033'; ctx.fillRect(19, 11, 3, 3); } ctx.restore(); });
    }
    drawPowerUps(ctx) { this.powerUps.forEach((item) => { ctx.save(); ctx.translate(item.x + item.width / 2, item.y + item.height / 2); ctx.rotate(item.spin); ctx.shadowColor = item.kind === 'rapid' ? '#facc15' : '#00f3ff'; ctx.shadowBlur = 15; ctx.fillStyle = item.kind === 'rapid' ? '#facc15' : '#00f3ff'; this.roundedRect(ctx, -11, -11, 22, 22, 6); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#061024'; ctx.font = '900 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.kind === 'rapid' ? '×3' : 'S', 0, 1); ctx.restore(); }); }
    drawParticles(ctx) { this.particles.forEach((p) => { ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }); }
    drawHud(ctx) {
      const w = this.canvas.width, h = this.canvas.height; ctx.save(); ctx.fillStyle = 'rgba(3,7,24,.76)'; this.roundedRect(ctx, 10, 10, 156, 48, 10); ctx.fill(); ctx.font = '800 14px sans-serif'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f8fafc'; ctx.fillText(`ОЧКИ  ${this.score}`, 20, 28); ctx.fillStyle = '#a5f3fc'; ctx.font = '700 12px sans-serif'; ctx.fillText(`ЩИТ ${'◆ '.repeat(this.lives)}${'· '.repeat(3 - this.lives)}`, 20, 46);
      ctx.textAlign = 'center'; ctx.font = '900 16px sans-serif'; ctx.fillStyle = '#67e8f9'; ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 10; ctx.fillText(`ВОЛНА ${this.wave}`, w / 2, 27); ctx.shadowBlur = 0; if (this.combo >= 3) { ctx.fillStyle = '#facc15'; ctx.font = '900 13px sans-serif'; ctx.fillText(`КОМБО ×${1 + Math.min(4, Math.floor(this.combo / 6))}`, w / 2, 47); }
      ctx.textAlign = 'right'; ctx.fillStyle = '#facc15'; ctx.font = '800 14px sans-serif'; ctx.fillText(`+${this.collectedCoins} 🪙`, w - 17, 28); ctx.fillStyle = '#94a3b8'; ctx.font = '700 11px sans-serif'; ctx.fillText(`РЕКОРД ${this.bestScore}`, w - 17, 47);
      if (this.player.rapid > 0 || this.player.shield > 0) { const isRapid = this.player.rapid > 0, time = Math.ceil((isRapid ? this.player.rapid : this.player.shield) / 60); ctx.textAlign = 'left'; ctx.fillStyle = '#facc15'; ctx.font = '800 12px sans-serif'; ctx.fillText(`${isRapid ? '×3 ТУРБО' : 'ЩИТ'} ${time}с`, 18, h - 18); }
      const boss = this.enemies.find((e) => e.type === 'boss'); if (boss) { const barWidth = Math.min(300, w * .38), x = w / 2 - barWidth / 2; ctx.fillStyle = 'rgba(0,0,0,.55)'; this.roundedRect(ctx, x, 62, barWidth, 9, 5); ctx.fill(); ctx.fillStyle = '#ff007f'; this.roundedRect(ctx, x, 62, barWidth * boss.hp / boss.maxHp, 9, 5); ctx.fill(); } ctx.restore();
    }
    drawAnnouncement(ctx) { const alpha = Math.min(1, this.waveTransitionTimer / 18, (110 - this.waveTransitionTimer) / 18); ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = 'rgba(0,8,27,.72)'; ctx.fillRect(0, this.canvas.height / 2 - 42, this.canvas.width, 84); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 27px sans-serif'; ctx.fillStyle = this.announcement.includes('КОМАНДИР') ? '#ff4dbe' : '#67e8f9'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 16; ctx.fillText(this.announcement, this.canvas.width / 2, this.canvas.height / 2); ctx.restore(); }
    drawGameOver(ctx) { ctx.save(); ctx.fillStyle = 'rgba(2,4,15,.74)'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#ff007f'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff4dbe'; ctx.font = '900 34px sans-serif'; ctx.fillText('МИССИЯ ПРЕРВАНА', this.canvas.width / 2, this.canvas.height / 2 - 42); ctx.shadowBlur = 0; ctx.fillStyle = '#f8fafc'; ctx.font = '700 17px sans-serif'; ctx.fillText(`СЧЁТ ${this.score}  •  ВОЛНА ${this.wave}  •  РЕКОРД ${this.bestScore}`, this.canvas.width / 2, this.canvas.height / 2); ctx.fillStyle = '#a5f3fc'; ctx.font = '700 14px sans-serif'; ctx.fillText('Кликните или нажмите Пробел, чтобы начать заново', this.canvas.width / 2, this.canvas.height / 2 + 38); ctx.restore(); }
    loop(time) { if (!this.running) return; const delta = time - this.lastFrameTime; this.lastFrameTime = time; this.update(delta || FRAME); this.draw(); this.animationId = requestAnimationFrame(this.loop); }
  }
  window.DuckInvadersGame = DuckInvadersGame;
})();
