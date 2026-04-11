import React, { useEffect, useRef, useState } from 'react';

const Cyberpunk404 = () => {
  // ==========================================
  // 1. THE MEMORY SYSTEM
  // ==========================================
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  
  const [uiState, setUiState] = useState({ mode: 'PLAYING', score: 0, level: 1, lives: 3, energy: 0 });
  
  const game = useRef({
    level: 1,
    lastLevel: 0,
    score: 0,
    kills: 0,
    lives: 3,
    energy: 0, 
    player: { x: 0, y: 0, w: 40, h: 40, speed: 14, hitTime: 0, angle: 0 }, 
    bullets: [],       
    squadBullets: [],  
    enemyBullets: [],  
    enemies: [],       
    friendlies: [],    
    drops: [],         
    galaxy: [],        
    galaxyHue: 280,    
    targetHue: 280, 
    boss: null,        
    cinematic: { active: false, startTime: 0, phase: '', particles: [], planetConfig: null, laserColor: '#ffaa00', textY: -100 },
    reinforcements: { active: false, timer: 0, ships: [] },
    keys: {},          
    mouse: { x: null, isDown: false, active: false }, 
    lastFire: 0,       
    lastBossFire: 0    
  });

  // ==========================================
  // 2. THE SOUND ENGINE 
  // ==========================================
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  };

  const playLaser = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1); 
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  };

  const playSquadronStrike = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const duration = 2.5;
    const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator(); const gain = ctx.createGain();
    osc1.type = 'sawtooth'; osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);
    osc2.frequency.setValueAtTime(205, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + duration / 2);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc1.start(); osc2.start();
    osc1.stop(ctx.currentTime + duration); osc2.stop(ctx.currentTime + duration);
  };

  const playHitSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  };

  const playHealSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2); 
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  };

  const playBossExplosion = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.0); 
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 1.0);
  };

  const playOrbitalCannon = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 3.0); 
    gain.gain.setValueAtTime(0.5, ctx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3.0);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 3.0);
  };

  // ==========================================
  // 3. MAIN GAME SETUP & LIFECYCLE
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d'); 
    let animationId; 

    const buildImg = (svg) => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      return img;
    };

    const playerImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 5 L35 35 L20 28 L5 35 Z" fill="#0ff" stroke="#fff" stroke-width="1"/><rect x="18" y="0" width="4" height="15" fill="#0ff"/></svg>`);
    const enemyImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path d="M5 10 L15 0 L25 10 L30 20 L0 20 Z" fill="#f0f" stroke="#fff" stroke-width="1"/><circle cx="15" cy="12" r="3" fill="#000"/></svg>`);
    const bossImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M10 20 L50 0 L90 20 L100 60 L80 50 L50 60 L20 50 L0 60 Z" fill="#f00" stroke="#ffaa00" stroke-width="2"/><circle cx="30" cy="30" r="8" fill="#000"/><circle cx="70" cy="30" r="8" fill="#000"/></svg>`);
    const heartImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 28s-12-8.5-12-16a6 6 0 0 1 12-4 6 6 0 0 1 12 4c0 7.5-12 16-12 16z" fill="#ff0055" stroke="#fff" stroke-width="2"/></svg>`);
    const beaconImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="16,2 30,16 16,30 2,16" fill="#00aaff" stroke="#fff" stroke-width="2"/></svg>`);

    const buildGalaxy = (level) => {
      const g = game.current;
      g.galaxy = [];
      const numArms = 2; 
      const hueBase = 280 + (level * 40); 
      const maxDist = Math.min(window.innerWidth, window.innerHeight) * 0.45; 

      for (let i = 0; i < 1200; i++) { 
        const isSpiral = i < 800; 
        let angle, dist, scatterX, scatterY, hueOffset, speed, size;

        if (isSpiral) {
           const armIndex = i % 2; 
           const angleOffset = armIndex * Math.PI; 
           dist = Math.pow(Math.random(), 1.5) * (maxDist - 50) + 50; 
           angle = angleOffset + (dist * 0.035); 
           scatterX = (Math.random() - 0.5) * 15;
           scatterY = (Math.random() - 0.5) * 15;
           hueOffset = 15 + (Math.random() * 10 - 5); 
           speed = 0; 
           size = Math.random() * 1.5 + 0.5; 
        } else {
           dist = 50 + Math.random() * (maxDist - 50); 
           angle = Math.random() * (Math.PI * 2); 
           scatterX = 0; 
           scatterY = 0;
           hueOffset = -15 + (Math.random() * 10 - 5); 
           speed = (Math.random() - 0.5) * 0.0005; 
           size = Math.random() * 3.0 + 1.0; 
        }

        g.galaxy.push({
          angle: angle, 
          dist: dist,                    
          scatterX: scatterX,             
          scatterY: scatterY, 
          size: size, 
          hueOffset: hueOffset,
          sat: 70 + Math.random() * 30,
          lit: 60 + Math.random() * 30,
          speed: speed 
        });
      }
      g.galaxyHue = hueBase; 
    };

    const generatePlanet = () => {
      const type = Math.random() > 0.5 ? 'TERRAN' : 'MARTIAN';
      const baseColor = type === 'TERRAN' ? '#0044aa' : '#8b2222'; 
      const landColor = type === 'TERRAN' ? '#228b22' : '#cd5c5c'; 
      const hue = type === 'TERRAN' ? 200 : 10;
      
      const blobs = [];
      for(let i=0; i<12; i++) {
         blobs.push({ 
           x: (Math.random() - 0.5) * 200, 
           y: (Math.random() - 0.5) * 200, 
           r: Math.random() * 40 + 15 
         });
      }
      return { type, baseColor, landColor, hue, blobs };
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      game.current.player.y = canvas.height - 80;
      if (game.current.player.x === 0) game.current.player.x = canvas.width / 2 - 20;
    };
    window.addEventListener('resize', resize);
    resize();

    // --- DESKTOP CONTROLS ---
    const handleKey = (e, isDown) => { 
      initAudio(); 
      game.current.keys[e.key.toLowerCase()] = isDown; 
    };
    const handleMouse = (e) => { game.current.mouse.x = e.clientX; game.current.mouse.active = true; };
    const handleMouseBtn = (e, isDown) => { 
      initAudio();
      if (isDown) e.preventDefault(); 
      if (e.button === 0) game.current.mouse.isDown = isDown; 
      if (e.button === 2 && isDown) game.current.keys['control'] = true; 
    };
    const handleContextMenu = (e) => e.preventDefault(); 

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('mousedown', (e) => handleMouseBtn(e, true), { passive: false });
    window.addEventListener('mouseup', (e) => handleMouseBtn(e, false));
    window.addEventListener('contextmenu', handleContextMenu);

    // --- MOBILE TOUCH CONTROLS ---
    // Attached strictly to the canvas so it doesn't break React UI buttons (like the Strike button)
    const handleTouchStart = (e) => {
      e.preventDefault(); // Stop scrolling/zooming
      initAudio();
      game.current.mouse.x = e.touches[0].clientX;
      game.current.mouse.isDown = true; // Auto-fires
      game.current.mouse.active = true;
    };
    const handleTouchMove = (e) => {
      e.preventDefault();
      game.current.mouse.x = e.touches[0].clientX; // Drags the ship
    };
    const handleTouchEnd = (e) => {
      e.preventDefault();
      // Only stop firing if all fingers are off the canvas
      if (e.touches.length === 0) {
         game.current.mouse.isDown = false;
         game.current.mouse.active = false;
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    const spawnBoss = () => {
      const g = game.current;
      g.boss = { 
        x: canvas.width / 2 - 75, y: -100, w: 150, h: 90, 
        hp: 200 + (g.level * 100), maxHp: 200 + (g.level * 100), 
        dx: 3 + (g.level * 0.4), targetY: 50 
      };
    };

    // ==========================================
    // 4. THE PHYSICS ENGINE
    // ==========================================
    const update = (time) => {
      const g = game.current;
      if (g.lives <= 0) return; 

      if (g.level !== g.lastLevel) {
        if (g.galaxy.length === 0) buildGalaxy(g.level);
        g.targetHue = 280 + (g.level * 60); 
        g.lastLevel = g.level;
      }
      g.galaxyHue += (g.targetHue - g.galaxyHue) * 0.02; 

      // --- THE CINEMATIC LOGIC ---
      if (g.cinematic.active) {
        const elapsed = time - g.cinematic.startTime;
        const planetX = canvas.width * 0.7; 
        const planetY = canvas.height * 0.6; 
        const attackPosX = canvas.width * 0.3; 
        const attackPosY = canvas.height * 0.3;
        const startPosX = canvas.width / 2 - 20; 
        const startPosY = canvas.height - 80;

        const angleToPlanet = Math.atan2(planetY - g.player.y, planetX - g.player.x) + (Math.PI / 2);

        if (elapsed < 500) {
           g.cinematic.phase = 'TRANSITION';
           g.cinematic.textY = -100; 
           g.player.x = -100;
           g.player.y = -100;
           g.player.angle = Math.PI/2; 
        }
        else if (elapsed >= 500 && elapsed < 3500) {
           g.cinematic.phase = 'APPROACH';
           g.player.x += (attackPosX - g.player.x) * 0.05;
           g.player.y += (attackPosY - g.player.y) * 0.05;
           g.player.angle += (angleToPlanet - g.player.angle) * 0.1;
        }
        else if (elapsed >= 3500 && elapsed < 4500) {
           if (g.cinematic.phase !== 'FIRING') {
              g.cinematic.phase = 'FIRING';
              playOrbitalCannon();
           }
           g.player.x += (attackPosX - g.player.x) * 0.1;
           g.player.y += (attackPosY - g.player.y) * 0.1;
        }
        else if (elapsed >= 4500 && elapsed < 7500) {
           if (g.cinematic.phase !== 'EXPLODING') {
              g.cinematic.phase = 'EXPLODING';
              playBossExplosion();
              for(let i = 0; i < 200; i++) {
                 g.cinematic.particles.push({
                    x: planetX + (Math.random() - 0.5) * 150, 
                    y: planetY + (Math.random() - 0.5) * 150, 
                    vx: (Math.random() - 0.5) * 30, 
                    vy: (Math.random() - 0.5) * 30,
                    size: Math.random() * 15 + 5,
                    color: Math.random() > 0.5 ? g.cinematic.planetConfig.baseColor : g.cinematic.planetConfig.landColor,
                    life: 1.0 
                 });
              }
           }
           
           const targetTextY = canvas.height / 2;
           g.cinematic.textY += (targetTextY - g.cinematic.textY) * 0.1;

           g.player.x += (startPosX - g.player.x) * 0.03;
           g.player.y += (startPosY - g.player.y) * 0.03;
           g.player.angle += (0 - g.player.angle) * 0.05;
        }
        else if (elapsed >= 7500) {
           g.cinematic.active = false;
           g.level++; 
           g.bullets = []; g.enemyBullets = []; g.enemies = []; g.drops = []; 
           g.player.x = startPosX;
           g.player.y = startPosY;
           g.player.angle = 0;
        }

        if (g.cinematic.phase === 'EXPLODING') {
           g.cinematic.particles.forEach(p => {
               p.x += p.vx; p.y += p.vy; 
               p.life -= 0.01; 
           });
        }
        return; 
      }

      const isInvulnerable = time - g.player.hitTime < 1500; 
      g.energy = Math.min(100, g.energy + 0.15);

      if (g.reinforcements.active) {
         g.reinforcements.timer++;
         let allExited = true;
         
         g.reinforcements.ships.forEach(s => {
            if (s.state === 'ENTER') {
               s.x += (s.tx - s.x) * 0.1;
               s.y += (s.ty - s.y) * 0.1;
               if (Math.abs(s.x - s.tx) < 2 && Math.abs(s.y - s.ty) < 2) s.state = 'SHOOT';
               allExited = false;
            } else if (s.state === 'SHOOT') {
               if (g.reinforcements.timer % 10 === 0 && g.enemies.length > 0) {
                   const target = g.enemies[Math.floor(Math.random() * g.enemies.length)];
                   const angle = Math.atan2(target.y - s.y, target.x - s.x);
                   g.squadBullets.push({
                       x: s.x, y: s.y, 
                       w: 3, h: 15, 
                       vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18,
                       type: 'AIMED_LASER',
                       angle: angle 
                   });
                   if(Math.random() > 0.5) playLaser(); 
               }
               if (g.reinforcements.timer > 180) s.state = 'EXIT';
               allExited = false;
            } else if (s.state === 'EXIT') {
               s.x += s.exitVx;
               s.y += s.exitVy; 
               if (s.x > -50 && s.x < canvas.width + 50 && s.y > -50 && s.y < canvas.height + 50) {
                   allExited = false;
               }
            }
         });
         
         if (allExited) g.reinforcements.active = false; 
      }

      // Capture 'control' key from keyboard OR the mobile HUD button
      if (g.keys['control'] && g.energy >= 100) {
        g.energy = 0; 
        playSquadronStrike(); 

        for(let i = 0; i < 12; i++) {
          g.friendlies.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 200,
            w: 40, h: 40, speed: 15 + Math.random() * 10
          });
        }
        g.score += g.enemies.length * 50;
        g.enemies = []; 
        if (g.boss) g.boss.hp -= 150; 
        g.keys['control'] = false; 
      }

      for (let i = g.friendlies.length - 1; i >= 0; i--) {
        let f = g.friendlies[i];
        f.y -= f.speed;
        if (Math.random() < 0.4) {
          g.squadBullets.push({ x: f.x + 8, y: f.y, w: 4, h: 25, speed: 25, type: 'LASER' });
          g.squadBullets.push({ x: f.x + f.w - 11, y: f.y, w: 4, h: 25, speed: 25, type: 'LASER' });
        }
        if (f.y < -50) g.friendlies.splice(i, 1);
      }

      for (let i = g.squadBullets.length - 1; i >= 0; i--) {
        let sb = g.squadBullets[i];
        if (sb.type === 'AIMED_LASER') {
            sb.x += sb.vx; sb.y += sb.vy;
        } else {
            sb.y -= sb.speed;
        }
        if (sb.y < -50 || sb.y > canvas.height + 50 || sb.x < -50 || sb.x > canvas.width + 50) {
            g.squadBullets.splice(i, 1);
        }
      }

      if (g.keys['arrowleft'] || g.keys['a']) { g.player.x -= g.player.speed; g.mouse.active = false; }
      if (g.keys['arrowright'] || g.keys['d']) { g.player.x += g.player.speed; g.mouse.active = false; }
      if (g.mouse.active && g.mouse.x !== null) g.player.x += (g.mouse.x - g.player.w / 2 - g.player.x) * 0.2;
      g.player.x = Math.max(0, Math.min(canvas.width - g.player.w, g.player.x));

      if ((g.keys[' '] || g.mouse.isDown) && time - g.lastFire > 100) {
        g.bullets.push({ x: g.player.x + 8, y: g.player.y, w: 3, h: 15, speed: 11 }); 
        g.bullets.push({ x: g.player.x + g.player.w - 11, y: g.player.y, w: 3, h: 15, speed: 11 });
        playLaser(); 
        g.lastFire = time;
      }

      if (!g.boss && Math.random() < 0.025 + (g.level * 0.003) && g.enemies.length < 15 + g.level) {
        g.enemies.push({
          x: Math.random() * (canvas.width - 30),
          y: -30, w: 30, h: 20,
          speed: 2.5 + Math.random() * g.level * 0.4,
          offset: Math.random() * (Math.PI * 2),
          hp: 1
        });
      }

      if (!g.boss && g.kills > 0 && g.kills % 40 === 0) {
        spawnBoss();
        g.kills++; 
      }

      for (let i = g.bullets.length - 1; i >= 0; i--) {
        let b = g.bullets[i];
        b.y -= b.speed;
        if (b.y < 0) { g.bullets.splice(i, 1); continue; }

        let hit = false;
        if (g.boss && b.x > g.boss.x && b.x < g.boss.x + g.boss.w && b.y > g.boss.y && b.y < g.boss.y + g.boss.h) {
          g.boss.hp -= 5;
          hit = true;
          g.score += 20;
        } else {
          for (let j = g.enemies.length - 1; j >= 0; j--) {
            let e = g.enemies[j];
            if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
              g.score += 100;
              g.kills++;
              
              if (Math.random() < 0.04 && !g.reinforcements.active) {
                 g.drops.push({ x: e.x - 5, y: e.y, w: 30, h: 30, speed: 3.5, type: 'BEACON' }); 
              }
              else if (Math.random() < 0.05) {
                 g.drops.push({ x: e.x - 5, y: e.y, w: 40, h: 40, speed: 3, type: 'HEAL' }); 
              }

              g.enemies.splice(j, 1);
              hit = true;
              break;
            }
          }
        }
        if (hit) g.bullets.splice(i, 1);
      }
      
      for (let i = g.squadBullets.length - 1; i >= 0; i--) {
         let sb = g.squadBullets[i];
         let hit = false;
         for (let j = g.enemies.length - 1; j >= 0; j--) {
            let e = g.enemies[j];
            if (sb.x > e.x && sb.x < e.x + e.w && sb.y > e.y && sb.y < e.y + e.h) {
               g.score += 100;
               g.kills++;
               g.enemies.splice(j, 1);
               hit = true;
               break;
            }
         }
         if (hit) g.squadBullets.splice(i, 1);
      }

      for (let i = g.enemies.length - 1; i >= 0; i--) {
        let e = g.enemies[i];
        e.y += e.speed;
        e.x += Math.sin((time / 500) + e.offset) * 3; 

        if (e.y > canvas.height) {
          g.enemies.splice(i, 1); 
          continue;
        }

        if (Math.random() < 0.003 * g.level) {
          g.enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, w: 4, h: 12, speed: 6 });
        }
        
        if (!isInvulnerable && e.x < g.player.x + g.player.w && e.x + e.w > g.player.x && e.y < g.player.y + g.player.h && e.y + e.h > g.player.y) {
           g.lives--;
           g.player.hitTime = time; 
           g.enemies.splice(i, 1);
           playHitSound(); 
           if (g.lives <= 0) setUiState({ mode: 'GAMEOVER', score: g.score, level: g.level, lives: 0, energy: g.energy });
        }
      }

      for (let i = g.drops.length - 1; i >= 0; i--) {
        let d = g.drops[i];
        d.y += d.speed;
        if (d.y > canvas.height) { g.drops.splice(i, 1); continue; }

        if (d.x < g.player.x + g.player.w && d.x + d.w > g.player.x && d.y < g.player.y + g.player.h && d.y + d.h > g.player.y) {
          if (d.type === 'HEAL') {
             g.lives = Math.min(g.lives + 1, 5);
             g.score += 500;
             playHealSound(); 
          } else if (d.type === 'BEACON') {
             g.score += 1500;
             playSquadronStrike(); 
             g.reinforcements.active = true;
             g.reinforcements.timer = 0;
             
             g.reinforcements.ships = [];
             for(let x=50; x<canvas.width; x+=100) {
                 g.reinforcements.ships.push({x: x, y: -50, tx: x, ty: 30, exitVx: 0, exitVy: -10, angle: Math.PI, state: 'ENTER'});
             }
             for(let x=50; x<canvas.width; x+=100) {
                 g.reinforcements.ships.push({x: x, y: canvas.height+50, tx: x, ty: canvas.height-30, exitVx: 0, exitVy: 10, angle: 0, state: 'ENTER'});
             }
             for(let y=100; y<canvas.height-100; y+=100) {
                 g.reinforcements.ships.push({x: -50, y: y, tx: 30, ty: y, exitVx: -10, exitVy: 0, angle: Math.PI/2, state: 'ENTER'});
             }
             for(let y=100; y<canvas.height-100; y+=100) {
                 g.reinforcements.ships.push({x: canvas.width+50, y: y, tx: canvas.width-30, ty: y, exitVx: 10, exitVy: 0, angle: -Math.PI/2, state: 'ENTER'});
             }
          }
          g.drops.splice(i, 1);
        }
      }

      if (g.boss) {
        if (g.boss.y < g.boss.targetY) g.boss.y += 1.5; 
        else {
          g.boss.x += g.boss.dx;
          if (g.boss.x <= 0 || g.boss.x + g.boss.w >= canvas.width) g.boss.dx *= -1;
          
          if (time - g.lastBossFire > 700 - (g.level * 20)) {
            g.enemyBullets.push({ x: g.boss.x + 20, y: g.boss.y + g.boss.h, w: 5, h: 15, speed: 6 });
            g.enemyBullets.push({ x: g.boss.x + g.boss.w - 20, y: g.boss.y + g.boss.h, w: 5, h: 15, speed: 6 });
            g.lastBossFire = time;
          }
        }

        if (g.boss.hp <= 0) {
          g.score += 10000;
          playBossExplosion(); 
          for(let i=0; i<3; i++) g.drops.push({x: canvas.width/2 + (i*50 - 50), y: 100, w: 40, h: 40, speed: 2, type: 'HEAL'});

          if (g.level % 3 === 0) {
             g.cinematic.active = true;
             g.cinematic.startTime = time; 
             g.cinematic.phase = 'TRANSITION';
             g.cinematic.particles = [];
             g.cinematic.planetConfig = generatePlanet(); 
             g.cinematic.laserColor = Math.random() > 0.5 ? '#ff6600' : `hsl(${Math.random() * 360}, 100%, 50%)`;
             g.boss = null; 
          } else {
             g.level++;
             g.boss = null;
          }
        }
      }

      for (let i = g.enemyBullets.length - 1; i >= 0; i--) {
        let eb = g.enemyBullets[i];
        eb.y += eb.speed;
        if (eb.y > canvas.height) { g.enemyBullets.splice(i, 1); continue; }
        
        if (!isInvulnerable && eb.x > g.player.x && eb.x < g.player.x + g.player.w && eb.y > g.player.y && eb.y < g.player.y + g.player.h) {
          g.lives -= 1;
          g.player.hitTime = time; 
          g.enemyBullets.splice(i, 1);
          playHitSound(); 
          if (g.lives <= 0) setUiState({ mode: 'GAMEOVER', score: g.score, level: g.level, lives: 0, energy: g.energy });
        }
      }

      if (time % 5 < 1 && g.lives > 0) {
        setUiState({ mode: 'PLAYING', score: g.score, level: g.level, lives: g.lives, energy: g.energy });
      }
    };

    // ==========================================
    // 5. THE RENDERING ENGINE
    // ==========================================
    const draw = (time) => {
      const g = game.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height); 

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2); 
      ctx.rotate(time * 0.0001); 
      
      const coreGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 150);
      coreGrad.addColorStop(0, `hsla(${g.galaxyHue}, 80%, 80%, 1)`); 
      coreGrad.addColorStop(1, 'transparent'); 
      ctx.fillStyle = coreGrad;
      ctx.fillRect(-150, -150, 300, 300); 

      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsla(${g.galaxyHue}, 80%, 90%, 0.8)`;
      ctx.stroke();
      
      g.galaxy.forEach(p => {
        p.angle -= p.speed; 
        const x = Math.cos(p.angle) * p.dist + p.scatterX;
        const y = Math.sin(p.angle) * p.dist + p.scatterY;
        
        if (x * x + y * y < 35 * 35) return; 

        ctx.fillStyle = `hsl(${g.galaxyHue + p.hueOffset}, ${p.sat}%, ${p.lit}%)`;
        ctx.globalAlpha = Math.max(0.1, 1 - (p.dist / (Math.min(canvas.width, canvas.height) * 0.45))); 
        ctx.fillRect(x, y, p.size, p.size);
      });
      ctx.restore(); 
      ctx.globalAlpha = 1.0;

      if (g.cinematic.active) {
         const cx = canvas.width / 2; 
         const cy = canvas.height / 3; 

         const planetX = canvas.width * 0.7; 
         const planetY = canvas.height * 0.6; 
         const planetRadius = 120;

         if (g.cinematic.phase === 'APPROACH' || g.cinematic.phase === 'CHARGING' || g.cinematic.phase === 'FIRING') {
             
             ctx.save();
             const planetGrad = ctx.createRadialGradient(planetX - 40, planetY - 40, 10, planetX, planetY, planetRadius);
             planetGrad.addColorStop(0, g.cinematic.planetConfig.baseColor); 
             planetGrad.addColorStop(1, '#000'); 

             ctx.beginPath();
             ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
             ctx.fillStyle = planetGrad;
             ctx.fill();

             ctx.clip(); 

             ctx.fillStyle = g.cinematic.planetConfig.landColor;
             ctx.globalAlpha = 0.8;
             g.cinematic.planetConfig.blobs.forEach(blob => {
                ctx.beginPath();
                ctx.arc(planetX + blob.x, planetY + blob.y, blob.r, 0, Math.PI * 2);
                ctx.fill();
             });
             
             ctx.globalAlpha = 1.0;
             const atmosGrad = ctx.createRadialGradient(planetX, planetY, planetRadius * 0.8, planetX, planetY, planetRadius);
             atmosGrad.addColorStop(0, 'transparent');
             atmosGrad.addColorStop(1, `hsla(${g.cinematic.planetConfig.hue}, 80%, 80%, 0.4)`);
             ctx.fillStyle = atmosGrad;
             ctx.fillRect(planetX - planetRadius, planetY - planetRadius, planetRadius*2, planetRadius*2);

             ctx.restore();

             if (Math.floor(time / 500) % 2 === 0) {
                ctx.fillStyle = '#f00';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.fillText("TARGET LOCKED", planetX, planetY - 140);
             }
         }

         if (g.cinematic.phase === 'CHARGING') {
             ctx.beginPath();
             ctx.arc(g.player.x + g.player.w/2, g.player.y + g.player.h/2, Math.random() * 40 + 20, 0, Math.PI*2);
             ctx.fillStyle = g.cinematic.laserColor;
             ctx.shadowBlur = 20; ctx.shadowColor = g.cinematic.laserColor;
             ctx.fill();
             ctx.shadowBlur = 0;
         }

         if (g.cinematic.phase === 'FIRING') {
             ctx.fillStyle = g.cinematic.laserColor;
             ctx.shadowBlur = 40;
             ctx.shadowColor = g.cinematic.laserColor;
             
             ctx.beginPath();
             ctx.moveTo(g.player.x + g.player.w/2 - 20, g.player.y + g.player.h/2 - 20);
             ctx.lineTo(g.player.x + g.player.w/2 + 20, g.player.y + g.player.h/2 + 20);
             ctx.lineTo(planetX + 40, planetY);
             ctx.lineTo(planetX - 40, planetY);
             ctx.fill();
             
             ctx.fillStyle = '#fff';
             ctx.beginPath();
             ctx.moveTo(g.player.x + g.player.w/2 - 5, g.player.y + g.player.h/2 - 5);
             ctx.lineTo(g.player.x + g.player.w/2 + 5, g.player.y + g.player.h/2 + 5);
             ctx.lineTo(planetX + 10, planetY);
             ctx.lineTo(planetX - 10, planetY);
             ctx.fill();
             ctx.shadowBlur = 0;
         }

         if (g.cinematic.phase === 'EXPLODING') {
             g.cinematic.particles.forEach(p => {
                 if (p.life > 0) {
                     ctx.globalAlpha = p.life; 
                     ctx.fillStyle = p.color;
                     ctx.beginPath();
                     ctx.moveTo(p.x, p.y);
                     ctx.lineTo(p.x + p.size, p.y + p.size / 2);
                     ctx.lineTo(p.x + p.size / 2, p.y + p.size);
                     ctx.closePath();
                     ctx.fill();
                 }
             });
             ctx.globalAlpha = 1.0;
             
             ctx.font = '900 60px monospace';
             ctx.fillStyle = '#fff'; 
             ctx.textAlign = 'center';
             ctx.shadowBlur = 30; ctx.shadowColor = '#0ff'; 
             ctx.fillText(`${g.level} WAVES CLEARED`, cx, g.cinematic.textY);
             ctx.shadowBlur = 0;
         }

         if (playerImg.complete && g.cinematic.phase !== 'TRANSITION') {
             ctx.save();
             ctx.translate(g.player.x + g.player.w/2, g.player.y + g.player.h/2);
             ctx.rotate(g.player.angle);
             ctx.drawImage(playerImg, -g.player.w/2, -g.player.h/2, g.player.w, g.player.h);
             ctx.restore();
         }
      } 
      else {
        const isInvulnerable = time - g.player.hitTime < 1500;

        if (playerImg.complete) {
          ctx.shadowBlur = 20; 
          ctx.shadowColor = '#0ff'; 
          g.friendlies.forEach(f => { ctx.drawImage(playerImg, f.x, f.y, f.w, f.h); });
          
          g.reinforcements.ships.forEach(s => {
             ctx.save();
             ctx.translate(s.x, s.y);
             ctx.rotate(s.angle);
             ctx.drawImage(playerImg, -20, -20, 40, 40);
             ctx.restore();
          });
        }

        ctx.shadowBlur = 10;
        g.squadBullets.forEach(b => { 
            if (b.type === 'AIMED_LASER') {
                ctx.fillStyle = '#fff'; 
                ctx.shadowColor = '#fff'; 
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.angle + (Math.PI / 2));
                ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
                ctx.restore();
            } else {
                ctx.fillStyle = '#0ff'; 
                ctx.shadowColor = '#0ff'; 
                ctx.fillRect(b.x, b.y, b.w, b.h);
            }
        });

        if (g.lives > 0 && playerImg.complete) {
          if (!isInvulnerable || Math.floor(time / 100) % 2 === 0) {
            ctx.shadowBlur = 15; 
            ctx.shadowColor = isInvulnerable ? '#f00' : '#0ff'; 
            
            ctx.save();
            ctx.translate(g.player.x + g.player.w/2, g.player.y + g.player.h/2);
            ctx.rotate(g.player.angle);
            ctx.drawImage(playerImg, -g.player.w/2, -g.player.h/2, g.player.w, g.player.h);
            ctx.restore();
          }
        }

        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        g.bullets.forEach(b => { ctx.shadowColor = '#fff'; ctx.fillRect(b.x, b.y, b.w, b.h); });
        
        ctx.fillStyle = '#f00';
        g.enemyBullets.forEach(b => { ctx.shadowColor = '#f00'; ctx.fillRect(b.x, b.y, b.w, b.h); });

        g.drops.forEach(d => {
            if (d.type === 'HEAL' && heartImg.complete) {
                ctx.shadowColor = '#ff0055';
                ctx.drawImage(heartImg, d.x, d.y, d.w, d.h);
            } else if (d.type === 'BEACON' && beaconImg.complete) {
                ctx.shadowColor = '#00aaff';
                ctx.globalAlpha = Math.abs(Math.sin(time / 200)); 
                ctx.drawImage(beaconImg, d.x, d.y, d.w, d.h);
                ctx.globalAlpha = 1.0;
            }
        });

        if (g.boss && bossImg.complete) {
          ctx.shadowColor = '#f00';
          ctx.drawImage(bossImg, g.boss.x, g.boss.y, g.boss.w, g.boss.h);
          ctx.fillStyle = '#333'; ctx.fillRect(g.boss.x, g.boss.y - 15, g.boss.w, 6);
          ctx.fillStyle = '#f00'; ctx.fillRect(g.boss.x, g.boss.y - 15, g.boss.w * (g.boss.hp / g.boss.maxHp), 6);
        } 
        
        if (enemyImg.complete) {
          ctx.shadowColor = '#f0f';
          g.enemies.forEach(e => ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h));
        }
        ctx.shadowBlur = 0;
      }

      update(time);
      if (g.lives > 0) animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mousedown', handleMouseBtn);
      window.removeEventListener('mouseup', handleMouseBtn);
      window.removeEventListener('contextmenu', handleContextMenu);
      // Clean up touch events too
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const resetGame = () => window.location.reload(); 

  // Mobile Strike Button Handler
  const handleMobileStrike = (e) => {
    e.preventDefault();
    if (uiState.energy >= 100) {
      game.current.keys['control'] = true;
    }
  };

  // ==========================================
  // 6. THE HTML UI
  // ==========================================
  return (
    <>
      <style>{`
        * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-user-drag: none !important;
        }
        canvas { touch-action: none; }
      `}</style>
      
      <div className="h-screen w-screen bg-[#020308] text-green-400 font-mono overflow-hidden relative cursor-crosshair">
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <h1 className="text-[35vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-700 opacity-60 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            404
          </h1>
        </div>

        <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-20 pointer-events-none">
          <div className="flex flex-col gap-2">
            <span className="text-cyan-400 font-black tracking-widest text-xl md:text-3xl drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">SYS.SEC.FINAL</span>
            <div className="mt-2 w-32 md:w-48 h-4 border-2 border-gray-700 bg-black relative">
              <div 
                className={`h-full transition-all duration-75 ${uiState.energy >= 100 ? 'bg-cyan-400 shadow-[0_0_15px_#0ff] animate-pulse' : 'bg-gray-500'}`} 
                style={{ width: `${uiState.energy}%` }}
              />
              <span className="absolute -bottom-5 left-0 text-[8px] md:text-[10px] text-gray-400 tracking-widest font-bold whitespace-nowrap">
                {uiState.energy >= 100 ? '[R-CLICK/TAP] STRIKE READY' : 'RECHARGING COMMS...'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            <a href="/" draggable="false" className="group flex items-center gap-2 px-4 py-2 bg-red-950/80 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-black font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,0,0,1)] rounded-sm text-sm md:text-base">
              <span className="text-lg md:text-xl animate-pulse group-hover:animate-none">⚠️</span>
              Eject
            </a>
            
            <span className="text-pink-500 font-black text-xl md:text-4xl drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] mt-2">
              SCORE: {uiState.score.toString().padStart(7, '0')}
            </span>
            <div className="flex gap-4 md:gap-6 text-xs md:text-lg font-bold">
              <span className="text-cyan-300 drop-shadow-[0_0_5px_#0ff]">WAVE {uiState.level}</span>
              <span className="text-red-500 tracking-widest">LIVES: {'❤'.repeat(uiState.lives)}</span>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 z-10 block bg-transparent" />

        {/* MOBILE STRIKE BUTTON */}
        <div className="absolute bottom-24 right-6 z-30 pointer-events-auto md:hidden">
            <button 
               onTouchStart={handleMobileStrike}
               onClick={handleMobileStrike}
               className={`w-20 h-20 rounded-full border-4 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 ${uiState.energy >= 100 ? 'border-cyan-400 text-cyan-400 shadow-[0_0_20px_#0ff] animate-pulse' : 'border-gray-700 text-gray-700'}`}
            >
               <span className="font-black text-xs">STRIKE</span>
            </button>
        </div>

        {uiState.mode === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 text-center pointer-events-auto">
            <h2 className="text-5xl md:text-8xl text-red-600 font-black mb-4 drop-shadow-[0_0_30px_#f00] tracking-tighter">BREACH DETECTED</h2>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 font-bold uppercase tracking-[0.4em]">Final Score: <span className="text-pink-500">{uiState.score}</span></p>
            <div className="flex gap-4 md:gap-6 flex-col md:flex-row">
              <button draggable="false" onClick={resetGame} className="px-6 py-3 md:px-8 md:py-4 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_30px_#0ff] transition-all duration-300 uppercase tracking-[0.2em] font-black text-lg md:text-xl">
                Restart Defense
              </button>
              <a href="/" draggable="false" className="px-6 py-3 md:px-8 md:py-4 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-black hover:shadow-[0_0_30px_#f00] transition-all duration-300 uppercase tracking-[0.2em] font-black text-lg md:text-xl flex items-center justify-center">
                Retreat to Base
              </a>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-6 left-0 w-full text-center z-20 pointer-events-none opacity-60">
          <span className="text-cyan-400 text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold bg-black/70 px-3 py-2 rounded border border-cyan-900/50 shadow-lg inline-block">
            [TOUCH/DRAG]: Move & Fire | [TAP STRIKE / R-CLICK]: Squadron
          </span>
        </div>
      </div>
    </>
  );
};

export default Cyberpunk404;