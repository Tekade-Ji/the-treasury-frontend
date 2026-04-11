import React, { useEffect, useRef, useState } from 'react';

const Cyberpunk404 = () => {
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
    player: { x: 0, y: 0, w: 40, h: 40, speed: 8, hitTime: 0 }, 
    bullets: [],
    squadBullets: [], 
    enemyBullets: [],
    enemies: [],
    friendlies: [], 
    drops: [],
    galaxy: [], 
    boss: null,
    keys: {},
    mouse: { x: null, isDown: false, active: false },
    lastFire: 0,
    lastBossFire: 0
  });

  // --- Audio Engine ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playLaser = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playSquadronStrike = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const duration = 2.5;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(200, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);
    osc2.frequency.setValueAtTime(205, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + duration / 2);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  };

  const playHitSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  const playHealSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const playBossExplosion = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.0);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  };

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

    const buildGalaxy = (level) => {
      const g = game.current;
      g.galaxy = [];
      const numArms = 3 + (level % 4); 
      const hueBase = level * 65; 
      const maxDist = Math.max(window.innerWidth, window.innerHeight);

      for (let i = 0; i < 2500; i++) { 
        const dist = Math.random() * maxDist;
        const armAngle = (i % numArms) * ((Math.PI * 2) / numArms);
        const spiralTwist = dist * 0.002; 
        const scatter = (Math.random() - 0.5) * (dist * 0.2 + 20); 

        g.galaxy.push({
          angle: armAngle + spiralTwist,
          dist: dist,
          scatterX: scatter,
          scatterY: (Math.random() - 0.5) * (dist * 0.2 + 20),
          size: Math.random() * 2 + 0.5,
          color: `hsl(${hueBase + (Math.random() * 50 - 25)}, ${70 + Math.random()*30}%, ${50 + Math.random()*50}%)`,
          speed: 0.0002 + (1 / (dist + 50)) * 0.05 
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      game.current.player.y = canvas.height - 80;
      if (game.current.player.x === 0) game.current.player.x = canvas.width / 2 - 20;
    };
    window.addEventListener('resize', resize);
    resize();

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

    const spawnBoss = () => {
      const g = game.current;
      g.boss = { 
        x: canvas.width / 2 - 75, y: -100, w: 150, h: 90, 
        hp: 200 + (g.level * 100), maxHp: 200 + (g.level * 100), 
        dx: 2 + (g.level * 0.3), targetY: 50 
      };
    };

    const update = (time) => {
      const g = game.current;
      if (g.lives <= 0) return;

      if (g.level !== g.lastLevel) {
        buildGalaxy(g.level);
        g.lastLevel = g.level;
      }

      const isInvulnerable = time - g.player.hitTime < 1500; 
      g.energy = Math.min(100, g.energy + 0.15);

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
          g.squadBullets.push({ x: f.x + 8, y: f.y, w: 4, h: 25, speed: 25 });
          g.squadBullets.push({ x: f.x + f.w - 11, y: f.y, w: 4, h: 25, speed: 25 });
        }
        if (f.y < -50) g.friendlies.splice(i, 1);
      }

      for (let i = g.squadBullets.length - 1; i >= 0; i--) {
        g.squadBullets[i].y -= g.squadBullets[i].speed;
        if (g.squadBullets[i].y < -50) g.squadBullets.splice(i, 1);
      }

      if (g.keys['arrowleft'] || g.keys['a']) { g.player.x -= g.player.speed; g.mouse.active = false; }
      if (g.keys['arrowright'] || g.keys['d']) { g.player.x += g.player.speed; g.mouse.active = false; }
      if (g.mouse.active && g.mouse.x !== null) g.player.x += (g.mouse.x - g.player.w / 2 - g.player.x) * 0.2;
      g.player.x = Math.max(0, Math.min(canvas.width - g.player.w, g.player.x));

      if ((g.keys[' '] || g.mouse.isDown) && time - g.lastFire > 120) {
        g.bullets.push({ x: g.player.x + 8, y: g.player.y, w: 3, h: 15, speed: 15 });
        g.bullets.push({ x: g.player.x + g.player.w - 11, y: g.player.y, w: 3, h: 15, speed: 15 });
        playLaser(); 
        g.lastFire = time;
      }

      if (!g.boss && Math.random() < 0.015 + (g.level * 0.002) && g.enemies.length < 10 + g.level) {
        g.enemies.push({
          x: Math.random() * (canvas.width - 30),
          y: -30, w: 30, h: 20,
          speed: 1.2 + Math.random() * g.level * 0.2,
          offset: Math.random() * Math.PI * 2,
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
              if (Math.random() < 0.08) g.drops.push({ x: e.x - 5, y: e.y, w: 40, h: 40, speed: 2.5 });
              g.enemies.splice(j, 1);
              hit = true;
              break;
            }
          }
        }
        if (hit) g.bullets.splice(i, 1);
      }

      for (let i = g.enemies.length - 1; i >= 0; i--) {
        let e = g.enemies[i];
        e.y += e.speed;
        e.x += Math.sin((time / 500) + e.offset) * 2.5; 

        if (e.y > canvas.height) {
          g.enemies.splice(i, 1); 
          continue;
        }

        if (Math.random() < 0.002 * g.level) {
          g.enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, w: 4, h: 12, speed: 5 });
        }
        
        if (!isInvulnerable && e.x < g.player.x + g.player.w && e.x + e.w > g.player.x && e.y < g.player.y + g.player.h && e.y + e.h > g.player.y) {
           g.lives--;
           g.player.hitTime = time; 
           g.enemies.splice(i, 1);
           playHitSound(); // AUDIO TRIGGER
           if (g.lives <= 0) setUiState({ mode: 'GAMEOVER', score: g.score, level: g.level, lives: 0, energy: g.energy });
        }
      }

      for (let i = g.drops.length - 1; i >= 0; i--) {
        let d = g.drops[i];
        d.y += d.speed;
        if (d.y > canvas.height) { g.drops.splice(i, 1); continue; }

        if (d.x < g.player.x + g.player.w && d.x + d.w > g.player.x && d.y < g.player.y + g.player.h && d.y + d.h > g.player.y) {
          g.lives = Math.min(g.lives + 1, 5);
          g.score += 500;
          g.drops.splice(i, 1);
          playHealSound(); // AUDIO TRIGGER
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
          g.level++;
          g.boss = null;
          playBossExplosion(); // AUDIO TRIGGER
          for(let i=0; i<3; i++) g.drops.push({x: canvas.width/2 + (i*50 - 50), y: 100, w: 40, h: 40, speed: 2});
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
          playHitSound(); // AUDIO TRIGGER
          if (g.lives <= 0) setUiState({ mode: 'GAMEOVER', score: g.score, level: g.level, lives: 0, energy: g.energy });
        }
      }

      if (time % 5 < 1 && g.lives > 0) {
        setUiState({ mode: 'PLAYING', score: g.score, level: g.level, lives: g.lives, energy: g.energy });
      }
    };

    const draw = (time) => {
      const g = game.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(time * 0.0001); 
      
      g.galaxy.forEach(p => {
        p.angle -= p.speed; 
        const x = Math.cos(p.angle) * p.dist + p.scatterX;
        const y = Math.sin(p.angle) * p.dist + p.scatterY;
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, p.size, p.size);
      });
      ctx.restore();

      const isInvulnerable = time - g.player.hitTime < 1500;

      if (playerImg.complete) {
        ctx.shadowBlur = 20; 
        ctx.shadowColor = '#0ff'; 
        g.friendlies.forEach(f => { ctx.drawImage(playerImg, f.x, f.y, f.w, f.h); });
      }

      ctx.shadowBlur = 10;
      ctx.fillStyle = '#0ff';
      g.squadBullets.forEach(b => { ctx.shadowColor = '#0ff'; ctx.fillRect(b.x, b.y, b.w, b.h); });

      if (g.lives > 0 && playerImg.complete) {
        if (!isInvulnerable || Math.floor(time / 100) % 2 === 0) {
          ctx.shadowBlur = 15; 
          ctx.shadowColor = isInvulnerable ? '#f00' : '#0ff'; 
          ctx.drawImage(playerImg, g.player.x, g.player.y, g.player.w, g.player.h);
        }
      }

      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff';
      g.bullets.forEach(b => { ctx.shadowColor = '#fff'; ctx.fillRect(b.x, b.y, b.w, b.h); });
      
      ctx.fillStyle = '#f00';
      g.enemyBullets.forEach(b => { ctx.shadowColor = '#f00'; ctx.fillRect(b.x, b.y, b.w, b.h); });

      if (heartImg.complete) {
        ctx.shadowColor = '#ff0055';
        g.drops.forEach(d => ctx.drawImage(heartImg, d.x, d.y, d.w, d.h));
      }

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
    };
  }, []);

  const resetGame = () => window.location.reload(); 

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

        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(transparent 95%, #0ff 100%), linear-gradient(90deg, transparent 95%, #0ff 100%)', backgroundSize: '60px 60px' }}>
        </div>

        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
          <div className="flex flex-col gap-2">
            <span className="text-cyan-400 font-black tracking-widest text-xl md:text-3xl drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">SYS.SEC.FINAL</span>
            <div className="mt-2 w-48 h-4 border-2 border-gray-700 bg-black relative">
              <div 
                className={`h-full transition-all duration-75 ${uiState.energy >= 100 ? 'bg-cyan-400 shadow-[0_0_15px_#0ff] animate-pulse' : 'bg-gray-500'}`} 
                style={{ width: `${uiState.energy}%` }}
              />
              <span className="absolute -bottom-5 left-0 text-[10px] text-gray-400 tracking-widest font-bold">
                {uiState.energy >= 100 ? '[R-CLICK] STRIKE READY' : 'RECHARGING COMMS...'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            <a href="/" draggable="false" className="group flex items-center gap-2 px-6 py-2 bg-red-950/80 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-black font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,0,0,1)] rounded-sm">
              <span className="text-xl animate-pulse group-hover:animate-none">⚠️</span>
              Emergency Eject
            </a>
            
            <span className="text-pink-500 font-black text-2xl md:text-4xl drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] mt-2">
              SCORE: {uiState.score.toString().padStart(7, '0')}
            </span>
            <div className="flex gap-6 text-sm md:text-lg font-bold">
              <span className="text-cyan-300 drop-shadow-[0_0_5px_#0ff]">WAVE {uiState.level}</span>
              <span className="text-red-500 tracking-widest">LIVES: {'❤'.repeat(uiState.lives)}</span>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 z-10 block bg-transparent" />

        {uiState.mode === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 text-center pointer-events-auto">
            <h2 className="text-6xl md:text-8xl text-red-600 font-black mb-4 drop-shadow-[0_0_30px_#f00] tracking-tighter">BREACH DETECTED</h2>
            <p className="text-2xl text-gray-400 mb-8 font-bold uppercase tracking-[0.4em]">Final Score: <span className="text-pink-500">{uiState.score}</span></p>
            <div className="flex gap-6">
              <button draggable="false" onClick={resetGame} className="px-8 py-4 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_30px_#0ff] transition-all duration-300 uppercase tracking-[0.2em] font-black text-xl">
                Restart Defense
              </button>
              <a href="/" draggable="false" className="px-8 py-4 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-black hover:shadow-[0_0_30px_#f00] transition-all duration-300 uppercase tracking-[0.2em] font-black text-xl flex items-center justify-center">
                Retreat to Base
              </a>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-6 left-0 w-full text-center z-20 pointer-events-none opacity-60">
          <span className="text-cyan-400 text-xs md:text-sm tracking-[0.3em] uppercase font-bold bg-black/70 px-5 py-2 rounded border border-cyan-900/50 shadow-lg">
            [A/D]/[ARROWS]: Move | [L-CLICK]: Fire | [R-CLICK]: Squadron
          </span>
        </div>
      </div>
    </>
  );
};

export default Cyberpunk404;