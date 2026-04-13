import React, { useEffect, useRef, useState } from 'react';

const Cyberpunk404 = () => {
  // ==========================================
  // 1. THE MEMORY SYSTEM (THE BRAIN)
  // ==========================================
  // Think of this section as the game's short-term memory. 
  // It remembers where the player is, how many points they have, and where the enemies are.

  // canvasRef connects our code to the actual drawing board on the screen.
  const canvasRef = useRef(null);
  
  // audioCtxRef holds the sound engine so we can play lasers and explosions.
  const audioCtxRef = useRef(null);
  
  // uiState controls what you see on the screen (the HTML text like SCORE and LIVES).
  // React uses this to quickly update the text without redrawing the whole 3D game.
  const [uiState, setUiState] = useState({ mode: 'INTRO', score: 0, level: 1, lives: 3, energy: 0 });
  
  // game.current is the TRUE memory of the game. It runs lightning fast behind the scenes.
  const game = useRef({
    mode: 'INTRO',           // Starts the game in the Horror Intro sequence
    audioInitialized: false, // Remembers if the user has tapped the screen yet (browsers block sound until you tap)
    level: 1,                // Current wave
    lastLevel: 0,            // Used to check if we just leveled up
    score: 0,                // Player's points
    kills: 0,                // How many enemies destroyed total
    lives: 3,                // TWEAK THIS: Change to 10 if you want to start with 10 lives!
    energy: 0,               // The Strike energy bar (starts at 0, goes to 100)
    
    // The Player's Ship
    player: { 
      x: 0, y: 0,           // Position on screen
      w: 40, h: 40,         // Width and Height of the ship
      speed: 14,            // TWEAK THIS: Change 14 to 25 to make your ship move MUCH faster!
      hitTime: 0,           // Remembers when you got hit so you get temporary invincibility
      angle: 0              // Used for spinning the ship during cutscenes
    }, 
    
    // Lists (Arrays) holding everything currently flying around the screen
    bullets: [],       // Your lasers
    squadBullets: [],  // Friendly blue team lasers
    enemyBullets: [],  // Red enemy lasers
    enemies: [],       // The bad guys
    friendlies: [],    // The blue ships that come help you
    drops: [],         // The health hearts and blue beacons
    
    // The background stars
    galaxy: [],        
    galaxyHue: 280,    // The color of the galaxy (280 is purple)
    targetHue: 280,    // The color the galaxy is slowly changing into
    
    boss: null,        // Holds the big boss data when it spawns
    
    // Data for the cutscene that plays when you beat a boss
    cinematic: { active: false, startTime: 0, phase: '', particles: [], planetConfig: null, laserColor: '#ffaa00', textY: -100 },
    
    reinforcements: { active: false, timer: 0, ships: [] }, // Handles the blue beacon team
    keys: {},          // Remembers which keyboard keys you are pressing
    mouse: { x: null, isDown: false, active: false }, // Remembers where your mouse/finger is
    lastFire: 0,       // Remembers exactly when you last shot a laser
    lastBossFire: 0    // Remembers when the boss last shot
  });

  // ==========================================
  // 2. THE SOUND ENGINE (THE EARS)
  // ==========================================
  // This section creates sounds from scratch using pure math (frequencies). No sound files needed!

  const initAudio = () => {
    // If the sound engine doesn't exist yet, build it.
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // If it fell asleep, wake it up.
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  };

  const playHorrorIntro = () => {
    // This creates the scary bass drop and metallic screech when the game starts.
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;

    // 1. Deep guttural drone (unsettling sub-bass)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth'; // Sawtooth waves sound harsh and buzzing
    osc1.frequency.setValueAtTime(32.70, t); // Very low pitch
    osc1.frequency.linearRampToValueAtTime(20, t + 4.5); // Pitch slides down over 4.5 seconds
    gain1.gain.setValueAtTime(0, t); // Volume starts at 0
    gain1.gain.linearRampToValueAtTime(1, t + 0.1); // Gets loud instantly
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 4.5); // Fades out
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.start(t); osc1.stop(t + 4.5);

    // 2. High-pitched dissonance (metallic scraping)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square'; // Square waves sound digital and retro
    osc2.frequency.setValueAtTime(1046.50, t); 
    osc2.frequency.exponentialRampToValueAtTime(1150, t + 1.5);
    osc2.frequency.exponentialRampToValueAtTime(800, t + 4);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.08, t + 0.5);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 4);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.start(t); osc2.stop(t + 4);

    // 3. Double Heartbeat Thud
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine'; // Sine waves sound smooth, like a heartbeat
    osc3.frequency.setValueAtTime(50, t);
    osc3.frequency.exponentialRampToValueAtTime(10, t + 0.3);
    gain3.gain.setValueAtTime(0, t);
    gain3.gain.linearRampToValueAtTime(1.5, t + 0.05);
    gain3.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc3.connect(gain3); gain3.connect(ctx.destination);
    osc3.start(t); osc3.stop(t + 0.5);
      
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(50, t + 0.4);
    osc4.frequency.exponentialRampToValueAtTime(10, t + 0.7);
    gain4.gain.setValueAtTime(0, t + 0.4);
    gain4.gain.linearRampToValueAtTime(1.2, t + 0.45);
    gain4.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
    osc4.connect(gain4); gain4.connect(ctx.destination);
    osc4.start(t + 0.4); osc4.stop(t + 0.9);
  };

  const playLaser = () => {
    // The "Pew Pew" sound
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Starts high pitch
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1); // Drops instantly to low pitch (pew effect)
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  };

  const playSquadronStrike = () => {
    // The loud rumbling sound when you trigger the blue beacon or strike button
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
    // The sound when you take damage
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
    // The happy chime when you collect a heart
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
    // The deep explosion when a boss dies
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
    // The charging sound during the cinematic
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
  // The 'useEffect' is React's way of saying "Run this setup code the moment the game loads on the screen."
  useEffect(() => {
    const canvas = canvasRef.current; // Grab the HTML canvas element
    const ctx = canvas.getContext('2d'); // Get the 2D drawing tools (paintbrushes)
    let animationId; // This will hold the ID for our looping animation

    // TWEAK THIS: This timer controls how long the horror intro lasts. 
    // 4500 means 4.5 seconds. Change to 2000 to make it super short.
    setTimeout(() => {
       game.current.mode = 'PLAYING';
       setUiState(prev => ({ ...prev, mode: 'PLAYING' }));
    }, 4500);

    // This helper function turns SVG code (text drawings) into actual Images the game can stamp on the screen.
    const buildImg = (svg) => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      return img;
    };

    // Build our game graphics!
    const playerImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 5 L35 35 L20 28 L5 35 Z" fill="#0ff" stroke="#fff" stroke-width="1"/><rect x="18" y="0" width="4" height="15" fill="#0ff"/></svg>`);
    const enemyImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path d="M5 10 L15 0 L25 10 L30 20 L0 20 Z" fill="#f0f" stroke="#fff" stroke-width="1"/><circle cx="15" cy="12" r="3" fill="#000"/></svg>`);
    const bossImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M10 20 L50 0 L90 20 L100 60 L80 50 L50 60 L20 50 L0 60 Z" fill="#f00" stroke="#ffaa00" stroke-width="2"/><circle cx="30" cy="30" r="8" fill="#000"/><circle cx="70" cy="30" r="8" fill="#000"/></svg>`);
    const heartImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 28s-12-8.5-12-16a6 6 0 0 1 12-4 6 6 0 0 1 12 4c0 7.5-12 16-12 16z" fill="#ff0055" stroke="#fff" stroke-width="2"/></svg>`);
    const beaconImg = buildImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="16,2 30,16 16,30 2,16" fill="#00aaff" stroke="#fff" stroke-width="2"/></svg>`);

    // This builds the spinning background stars
    const buildGalaxy = (level) => {
      const g = game.current;
      g.galaxy = [];
      const numArms = 2; 
      // As levels increase, the background color shifts!
      const hueBase = 280 + (level * 40); 
      const maxDist = Math.min(window.innerWidth, window.innerHeight) * 0.45; 

      // Create 1200 individual stars
      for (let i = 0; i < 1200; i++) { 
        const isSpiral = i < 800; // First 800 stars are in the arms, rest are scattered
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
          angle: angle, dist: dist, scatterX: scatterX, scatterY: scatterY, 
          size: size, hueOffset: hueOffset, sat: 70 + Math.random() * 30,
          lit: 60 + Math.random() * 30, speed: speed 
        });
      }
      g.galaxyHue = hueBase; 
    };

    // RANDOM RINGS + ADVANCED PLANETS GENERATOR (Used in the Boss Death Cutscene)
    const generatePlanet = () => {
      const roll = Math.random(); // Rolls a digital dice between 0 and 1
      
      // TWEAK THIS: Math.random() < 0.5 means a 50% chance for rings. 
      // If you want rings 10% of the time, change 0.5 to 0.10. 
      // If you want them 90% of the time, change to 0.90!
      let type, baseColor, landColor, hue, hasRings = Math.random() < 0.5, ringColor;

      // Decide what kind of planet to build based on the dice roll
      if (roll < 0.2) {
        type = 'TERRAN'; // Earth clone
        baseColor = '#0044aa'; 
        landColor = '#228b22'; 
        hue = 200;             
      } else if (roll < 0.4) {
        type = 'MARTIAN'; // Red desert
        baseColor = '#8b2222'; 
        landColor = '#cd5c5c'; 
        hue = 10;
      } else if (roll < 0.6) {
        type = 'SATURNIAN'; // Gas giant
        baseColor = '#e2bf7d'; 
        landColor = '#c3a36a'; 
        hue = 45;
      } else if (roll < 0.8) {
        type = 'CRYSTAL'; // Ice planet
        baseColor = '#00f2ff'; 
        landColor = '#ffffff'; 
        hue = 180;
      } else {
        type = 'NEON_CORE'; // Cyberpunk purple
        baseColor = '#1a1a2e'; 
        landColor = '#ff00ff'; 
        hue = 300;
      }

      // Dynamic ring color matching the atmosphere for ALL planets (if they win the 50% coin flip)
      ringColor = `hsla(${hue + (Math.random() * 60 - 30)}, 80%, 70%, 0.6)`;

      const blobs = [];
      // Gas giants get 20 stripes/blobs, other planets get 12 continents
      const numBlobs = type === 'SATURNIAN' ? 20 : 12; 

      for(let i=0; i < numBlobs; i++) {
        blobs.push({ 
          x: (Math.random() - 0.5) * 220, // Random X position on the planet
          y: (Math.random() - 0.5) * 220, // Random Y position
          r: Math.random() * 50 + 10      // Random size of the continent
        });
      }

      return { type, baseColor, landColor, hue, blobs, hasRings, ringColor };
    };

    // Makes sure the game always fills your browser window
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      game.current.player.y = canvas.height - 80;
      if (game.current.player.x === 0) game.current.player.x = canvas.width / 2 - 20;
    };
    window.addEventListener('resize', resize);
    resize();

    // Browsers require the user to interact (click/touch) before playing sound.
    // This function unlocks the sound engine as soon as they touch anything.
    const handleInteraction = () => {
      if (!game.current.audioInitialized) {
         initAudio();
         game.current.audioInitialized = true;
         // Play the horror intro sound only if we are still on the intro screen
         if (game.current.mode === 'INTRO') playHorrorIntro();
      }
    };

    // --- DESKTOP CONTROLS ---
    // Update the game brain when a key is pressed down or let go
    const handleKey = (e, isDown) => { 
      handleInteraction(); 
      game.current.keys[e.key.toLowerCase()] = isDown; 
    };
    // Track mouse movement
    const handleMouse = (e) => { game.current.mouse.x = e.clientX; game.current.mouse.active = true; };
    // Track mouse clicks (Left click shoots, Right click triggers strike)
    const handleMouseBtn = (e, isDown) => { 
      handleInteraction();
      if (isDown) e.preventDefault(); 
      if (e.button === 0) game.current.mouse.isDown = isDown; 
      if (e.button === 2 && isDown) game.current.keys['control'] = true; 
    };
    // Prevents the annoying right-click menu from popping up
    const handleContextMenu = (e) => e.preventDefault(); 

    // Tell the browser to listen to these actions
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('mousedown', (e) => handleMouseBtn(e, true), { passive: false });
    window.addEventListener('mouseup', (e) => handleMouseBtn(e, false));
    window.addEventListener('contextmenu', handleContextMenu);

    // --- MOBILE TOUCH CONTROLS ---
    const handleTouchStart = (e) => {
      e.preventDefault(); // Stop phone from scrolling
      handleInteraction();
      game.current.mouse.x = e.touches[0].clientX;
      game.current.mouse.isDown = true; // Auto-fires lasers when touching
      game.current.mouse.active = true;
    };
    const handleTouchMove = (e) => {
      e.preventDefault();
      game.current.mouse.x = e.touches[0].clientX; // Drags the ship
    };
    const handleTouchEnd = (e) => {
      e.preventDefault();
      // Only stop shooting if NO fingers are touching the screen
      if (e.touches.length === 0) {
         game.current.mouse.isDown = false;
         game.current.mouse.active = false;
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // This creates the massive Boss ship
    const spawnBoss = () => {
      const g = game.current;
      g.boss = { 
        x: canvas.width / 2 - 75, 
        y: -100, // Spawns off-screen at the top and lowers down
        w: 150, h: 90, 
        hp: 200 + (g.level * 100),     // TWEAK THIS: Boss health increases by 100 each level
        maxHp: 200 + (g.level * 100), 
        dx: 3 + (g.level * 0.4),       // TWEAK THIS: How fast the boss moves side to side
        targetY: 50 
      };
    };

    // ==========================================
    // 4. THE PHYSICS ENGINE (THE MATH)
    // ==========================================
    // This runs roughly 60 times a second. It updates positions, checks if things crashed into each other, etc.
    const update = (time) => {
      const g = game.current; // Grab our game brain
      
      if (g.mode === 'INTRO') return; // Freeze physics during the scary intro
      if (g.lives <= 0) return;       // Freeze physics if we are dead

      // If we leveled up, generate a new background color
      if (g.level !== g.lastLevel) {
        if (g.galaxy.length === 0) buildGalaxy(g.level);
        g.targetHue = 280 + (g.level * 60); 
        g.lastLevel = g.level;
      }
      g.galaxyHue += (g.targetHue - g.galaxyHue) * 0.02; // Smoothly blend background colors

      // --- THE CINEMATIC LOGIC ---
      // This massive block handles the animation of your ship blowing up a planet
      if (g.cinematic.active) {
        const elapsed = time - g.cinematic.startTime;
        const planetX = canvas.width * 0.7; 
        const planetY = canvas.height * 0.6; 
        const attackPosX = canvas.width * 0.3; 
        const attackPosY = canvas.height * 0.3;
        const startPosX = canvas.width / 2 - 20; 
        const startPosY = canvas.height - 80;

        const angleToPlanet = Math.atan2(planetY - g.player.y, planetX - g.player.x) + (Math.PI / 2);

        // Phase 1: Wait half a second
        if (elapsed < 500) {
           g.cinematic.phase = 'TRANSITION';
           g.cinematic.textY = -100; 
           g.player.x = -100;
           g.player.y = -100;
           g.player.angle = Math.PI/2; 
        }
        // Phase 2: Ship flies onto screen and aims at planet
        else if (elapsed >= 500 && elapsed < 3500) {
           g.cinematic.phase = 'APPROACH';
           g.player.x += (attackPosX - g.player.x) * 0.05;
           g.player.y += (attackPosY - g.player.y) * 0.05;
           g.player.angle += (angleToPlanet - g.player.angle) * 0.1;
        }
        // Phase 3: Fire the giant laser!
        else if (elapsed >= 3500 && elapsed < 4500) {
           if (g.cinematic.phase !== 'FIRING') {
              g.cinematic.phase = 'FIRING';
              playOrbitalCannon();
           }
           g.player.x += (attackPosX - g.player.x) * 0.1;
           g.player.y += (attackPosY - g.player.y) * 0.1;
        }
        // Phase 4: Planet explodes into chunks
        else if (elapsed >= 4500 && elapsed < 7500) {
           if (g.cinematic.phase !== 'EXPLODING') {
              g.cinematic.phase = 'EXPLODING';
              playBossExplosion();
              
              // Generate 200 pieces of shrapnel
              for(let i = 0; i < 200; i++) {
                 g.cinematic.particles.push({
                    x: planetX + (Math.random() - 0.5) * 150, 
                    y: planetY + (Math.random() - 0.5) * 150, 
                    vx: (Math.random() - 0.5) * 30, // Velocity X (speed)
                    vy: (Math.random() - 0.5) * 30, // Velocity Y
                    size: Math.random() * 15 + 5,
                    color: Math.random() > 0.5 ? g.cinematic.planetConfig.baseColor : g.cinematic.planetConfig.landColor,
                    life: 1.0 
                 });
              }
           }
           
           // Slide the "WAVES CLEARED" text down
           const targetTextY = canvas.height / 2;
           g.cinematic.textY += (targetTextY - g.cinematic.textY) * 0.1;

           // Move ship back to starting position
           g.player.x += (startPosX - g.player.x) * 0.03;
           g.player.y += (startPosY - g.player.y) * 0.03;
           g.player.angle += (0 - g.player.angle) * 0.05;
        }
        // Phase 5: Reset the game for the next level
        else if (elapsed >= 7500) {
           g.cinematic.active = false;
           g.level++; 
           g.bullets = []; g.enemyBullets = []; g.enemies = []; g.drops = []; 
           g.player.x = startPosX;
           g.player.y = startPosY;
           g.player.angle = 0;
        }

        // Update the explosion shrapnel math
        if (g.cinematic.phase === 'EXPLODING') {
           g.cinematic.particles.forEach(p => {
               p.x += p.vx; p.y += p.vy; // move particle
               p.life -= 0.01;           // fade it out
           });
        }
        return; // Don't run normal game physics while cutscene is playing
      }

      // --- NORMAL GAME PHYSICS ---

      const isInvulnerable = time - g.player.hitTime < 1500; // 1.5 seconds of invincibility after hit
      
      // TWEAK THIS: Change 0.15 to 0.5 to make your blue Strike bar fill up crazy fast!
      g.energy = Math.min(100, g.energy + 0.15); 

      // If you picked up a blue beacon, animate the friendly reinforcement ships
      if (g.reinforcements.active) {
         g.reinforcements.timer++;
         let allExited = true;
         
         g.reinforcements.ships.forEach(s => {
            if (s.state === 'ENTER') {
               s.x += (s.tx - s.x) * 0.1; // Smoothly slide into position
               s.y += (s.ty - s.y) * 0.1;
               if (Math.abs(s.x - s.tx) < 2 && Math.abs(s.y - s.ty) < 2) s.state = 'SHOOT';
               allExited = false;
            } else if (s.state === 'SHOOT') {
               // Shoot every 10 frames if there are enemies
               if (g.reinforcements.timer % 10 === 0 && g.enemies.length > 0) {
                   // Pick a random enemy
                   const target = g.enemies[Math.floor(Math.random() * g.enemies.length)];
                   // Calculate the angle to shoot directly at them
                   const angle = Math.atan2(target.y - s.y, target.x - s.x);
                   g.squadBullets.push({
                       x: s.x, y: s.y, 
                       w: 3, h: 15, 
                       vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18, // Bullet speed
                       type: 'AIMED_LASER',
                       angle: angle 
                   });
                   if(Math.random() > 0.5) playLaser(); 
               }
               if (g.reinforcements.timer > 180) s.state = 'EXIT'; // Leave after 3 seconds
               allExited = false;
            } else if (s.state === 'EXIT') {
               s.x += s.exitVx;
               s.y += s.exitVy; 
               // Check if they are completely off screen
               if (s.x > -50 && s.x < canvas.width + 50 && s.y > -50 && s.y < canvas.height + 50) {
                   allExited = false;
               }
            }
         });
         
         if (allExited) g.reinforcements.active = false; 
      }

      // Did the player press the Strike button?
      if (g.keys['control'] && g.energy >= 100) {
        g.energy = 0; // Reset energy
        playSquadronStrike(); 

        // Spawn a massive wave of friendlies from the bottom
        for(let i = 0; i < 12; i++) {
          g.friendlies.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 200,
            w: 40, h: 40, speed: 15 + Math.random() * 10
          });
        }
        g.score += g.enemies.length * 50; // Get points for all current enemies
        g.enemies = [];                   // Wipe out all enemies instantly
        if (g.boss) g.boss.hp -= 150;     // TWEAK THIS: Change 150 to 500 to make Strikes hurt bosses way more
        g.keys['control'] = false; 
      }

      // Move the Strike friendlies up the screen
      for (let i = g.friendlies.length - 1; i >= 0; i--) {
        let f = g.friendlies[i];
        f.y -= f.speed;
        if (Math.random() < 0.4) {
          // Shoot bullets
          g.squadBullets.push({ x: f.x + 8, y: f.y, w: 4, h: 25, speed: 25, type: 'LASER' });
          g.squadBullets.push({ x: f.x + f.w - 11, y: f.y, w: 4, h: 25, speed: 25, type: 'LASER' });
        }
        // Remove if off screen
        if (f.y < -50) g.friendlies.splice(i, 1);
      }

      // Move all friendly bullets
      for (let i = g.squadBullets.length - 1; i >= 0; i--) {
        let sb = g.squadBullets[i];
        if (sb.type === 'AIMED_LASER') {
            sb.x += sb.vx; sb.y += sb.vy;
        } else {
            sb.y -= sb.speed;
        }
        // Clean up memory if bullet flies off screen
        if (sb.y < -50 || sb.y > canvas.height + 50 || sb.x < -50 || sb.x > canvas.width + 50) {
            g.squadBullets.splice(i, 1);
        }
      }

      // Move player based on Keyboard or Mouse/Touch
      if (g.keys['arrowleft'] || g.keys['a']) { g.player.x -= g.player.speed; g.mouse.active = false; }
      if (g.keys['arrowright'] || g.keys['d']) { g.player.x += g.player.speed; g.mouse.active = false; }
      if (g.mouse.active && g.mouse.x !== null) g.player.x += (g.mouse.x - g.player.w / 2 - g.player.x) * 0.2;
      // Stop player from going off the edges
      g.player.x = Math.max(0, Math.min(canvas.width - g.player.w, g.player.x));

      // Player firing (Time check ensures we don't shoot 60 times a second)
      // TWEAK THIS: Change '100' to '50' to shoot twice as fast!
      if ((g.keys[' '] || g.mouse.isDown) && time - g.lastFire > 100) {
        g.bullets.push({ x: g.player.x + 8, y: g.player.y, w: 3, h: 15, speed: 11 }); 
        g.bullets.push({ x: g.player.x + g.player.w - 11, y: g.player.y, w: 3, h: 15, speed: 11 });
        playLaser(); 
        g.lastFire = time;
      }

      // Randomly spawn regular enemies if there is no boss
      // TWEAK THIS: Change '15' to '50' to allow massive swarms of enemies at once
      if (!g.boss && Math.random() < 0.025 + (g.level * 0.003) && g.enemies.length < 15 + g.level) {
        g.enemies.push({
          x: Math.random() * (canvas.width - 30),
          y: -30, w: 30, h: 20,
          speed: 2.5 + Math.random() * g.level * 0.4, // They get faster each level
          offset: Math.random() * (Math.PI * 2),      // Used to make them wobble left/right
          hp: 1
        });
      }

      // TWEAK THIS: Spawn a boss every X kills. Change 40 to 10 to fight bosses constantly!
      if (!g.boss && g.kills > 0 && g.kills % 40 === 0) {
        spawnBoss();
        g.kills++; // Increment so we don't spawn infinite bosses on the same frame
      }

      // Check for collisions between your bullets and enemies/boss
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        let b = g.bullets[i];
        b.y -= b.speed;
        if (b.y < 0) { g.bullets.splice(i, 1); continue; }

        let hit = false;
        // Did we hit the Boss?
        if (g.boss && b.x > g.boss.x && b.x < g.boss.x + g.boss.w && b.y > g.boss.y && b.y < g.boss.y + g.boss.h) {
          g.boss.hp -= 5;
          hit = true;
          g.score += 20;
        } else {
          // Did we hit a regular enemy?
          for (let j = g.enemies.length - 1; j >= 0; j--) {
            let e = g.enemies[j];
            if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
              g.score += 100;
              g.kills++;
              
              // TWEAK THIS: Change 0.04 to 0.50 for a 50% chance to drop Blue Beacons
              if (Math.random() < 0.04 && !g.reinforcements.active) {
                 g.drops.push({ x: e.x - 5, y: e.y, w: 30, h: 30, speed: 3.5, type: 'BEACON' }); 
              }
              // TWEAK THIS: Change 0.05 to 0.50 for a 50% chance to drop Hearts
              else if (Math.random() < 0.05) {
                 g.drops.push({ x: e.x - 5, y: e.y, w: 40, h: 40, speed: 3, type: 'HEAL' }); 
              }

              g.enemies.splice(j, 1); // Delete the enemy
              hit = true;
              break;
            }
          }
        }
        if (hit) g.bullets.splice(i, 1); // Delete the bullet
      }
      
      // Check for collisions between friendly reinforcement bullets and enemies
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

      // Move Enemies and check if they hit the Player
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        let e = g.enemies[i];
        e.y += e.speed;
        e.x += Math.sin((time / 500) + e.offset) * 3; // The wobble math

        // Delete if they fly off the bottom
        if (e.y > canvas.height) {
          g.enemies.splice(i, 1); 
          continue;
        }

        // TWEAK THIS: Change 0.003 to 0.05 to make regular enemies shoot tons of lasers at you
        if (Math.random() < 0.003 * g.level) {
          g.enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, w: 4, h: 12, speed: 6 });
        }
        
        // Did an enemy crash directly into the player?
        if (!isInvulnerable && e.x < g.player.x + g.player.w && e.x + e.w > g.player.x && e.y < g.player.y + g.player.h && e.y + e.h > g.player.y) {
           g.lives--;
           g.player.hitTime = time; // Trigger invincibility
           g.enemies.splice(i, 1);  // Destroy the kamikaze enemy
           playHitSound(); 
           // If we have 0 lives, tell the screen to show GAMEOVER
           if (g.lives <= 0) setUiState({ mode: 'GAMEOVER', score: g.score, level: g.level, lives: 0, energy: g.energy });
        }
      }

      // Move drops (Hearts/Beacons) and check if player catches them
      for (let i = g.drops.length - 1; i >= 0; i--) {
        let d = g.drops[i];
        d.y += d.speed;
        if (d.y > canvas.height) { g.drops.splice(i, 1); continue; } // Missed it

        // Did player touch the drop?
        if (d.x < g.player.x + g.player.w && d.x + d.w > g.player.x && d.y < g.player.y + g.player.h && d.y + d.h > g.player.y) {
          if (d.type === 'HEAL') {
             g.lives = Math.min(g.lives + 1, 5); // TWEAK THIS: Change 5 to 10 if you want to be able to hoard 10 lives
             g.score += 500;
             playHealSound(); 
          } else if (d.type === 'BEACON') {
             g.score += 1500;
             playSquadronStrike(); 
             g.reinforcements.active = true;
             g.reinforcements.timer = 0;
             
             // Setup the coordinates for the epic blue reinforcement ships to fly in from the edges
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
          g.drops.splice(i, 1); // Consume the drop
        }
      }

      // Boss Logic
      if (g.boss) {
        if (g.boss.y < g.boss.targetY) g.boss.y += 1.5; // Slowly descend onto screen
        else {
          g.boss.x += g.boss.dx; // Move side to side
          // Bounce off walls
          if (g.boss.x <= 0 || g.boss.x + g.boss.w >= canvas.width) g.boss.dx *= -1;
          
          // TWEAK THIS: Boss firing rate. Change 700 to 200 to make the boss spam lasers!
          if (time - g.lastBossFire > 700 - (g.level * 20)) {
            // Shoot from the left and right cannons
            g.enemyBullets.push({ x: g.boss.x + 20, y: g.boss.y + g.boss.h, w: 5, h: 15, speed: 6 });
            g.enemyBullets.push({ x: g.boss.x + g.boss.w - 20, y: g.boss.y + g.boss.h, w: 5, h: 15, speed: 6 });
            g.lastBossFire = time;
          }
        }

        // Did we kill the boss?
        if (g.boss.hp <= 0) {
          g.score += 10000;
          playBossExplosion(); 
          // Drop exactly 3 hearts as a reward
          for(let i=0; i<3; i++) g.drops.push({x: canvas.width/2 + (i*50 - 50), y: 100, w: 40, h: 40, speed: 2, type: 'HEAL'});

          // TWEAK THIS: Set to 'g.level % 1 === 0' to trigger cutscene after EVERY boss for testing.
          // Set to 'g.level % 3 === 0' for normal gameplay (cutscene every 3 levels).
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

      // Check if Enemy Lasers hit Player
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

      // Update the React UI (Text on screen) every 5 frames to save performance
      if (time % 5 < 1 && g.lives > 0) {
        setUiState({ mode: 'PLAYING', score: g.score, level: g.level, lives: g.lives, energy: g.energy });
      }
    };

    // ==========================================
    // 5. THE RENDERING ENGINE (THE PAINTBRUSH)
    // ==========================================
    // This looks at the game memory and paints the pictures on your screen
    const draw = (time) => {
      const g = game.current;
      
      // Wipe the whole screen clean before drawing the next frame
      ctx.clearRect(0, 0, canvas.width, canvas.height); 

      // --- DRAW GALAXY BACKGROUND ---
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2); // Move paintbrush to center
      ctx.rotate(time * 0.0001); // Slowly spin the whole galaxy
      
      // Draw the glowing center core
      const coreGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, 150);
      coreGrad.addColorStop(0, `hsla(${g.galaxyHue}, 80%, 80%, 1)`); 
      coreGrad.addColorStop(1, 'transparent'); 
      ctx.fillStyle = coreGrad;
      ctx.fillRect(-150, -150, 300, 300); 

      // Draw the black hole ring in the middle
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsla(${g.galaxyHue}, 80%, 90%, 0.8)`;
      ctx.stroke();
      
      // Draw all 1200 stars
      g.galaxy.forEach(p => {
        p.angle -= p.speed; 
        const x = Math.cos(p.angle) * p.dist + p.scatterX;
        const y = Math.sin(p.angle) * p.dist + p.scatterY;
        
        // Don't draw stars inside the black hole
        if (x * x + y * y < 35 * 35) return; 

        ctx.fillStyle = `hsl(${g.galaxyHue + p.hueOffset}, ${p.sat}%, ${p.lit}%)`;
        // Stars fade out near the edges
        ctx.globalAlpha = Math.max(0.1, 1 - (p.dist / (Math.min(canvas.width, canvas.height) * 0.45))); 
        ctx.fillRect(x, y, p.size, p.size);
      });
      ctx.restore(); // Put paintbrush back to normal
      ctx.globalAlpha = 1.0;

      // If we are in the Intro, stop drawing the game stuff, just spin the galaxy
      if (g.mode === 'INTRO') {
         update(time);
         animationId = requestAnimationFrame(draw); // Loop the drawing function forever
         return; 
      }

      // --- DRAW THE CINEMATIC CUTSCENE ---
      if (g.cinematic.active) {
         const cx = canvas.width / 2; 
         const cy = canvas.height / 3; 

         const planetX = canvas.width * 0.7; 
         const planetY = canvas.height * 0.6; 
         const planetRadius = 120;

         // Draw the intact planet
         if (g.cinematic.phase === 'APPROACH' || g.cinematic.phase === 'CHARGING' || g.cinematic.phase === 'FIRING') {
             
             ctx.save();
             // Create a 3D shadow effect
             const planetGrad = ctx.createRadialGradient(planetX - 40, planetY - 40, 10, planetX, planetY, planetRadius);
             planetGrad.addColorStop(0, g.cinematic.planetConfig.baseColor); 
             planetGrad.addColorStop(1, '#000'); 

             // Draw ocean/base
             ctx.beginPath();
             ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
             ctx.fillStyle = planetGrad;
             ctx.fill();

             // Lock drawing inside the planet circle (so land doesn't stick out)
             ctx.clip(); 

             // Draw landmasses
             ctx.fillStyle = g.cinematic.planetConfig.landColor;
             ctx.globalAlpha = 0.8;
             g.cinematic.planetConfig.blobs.forEach(blob => {
                ctx.beginPath();
                ctx.arc(planetX + blob.x, planetY + blob.y, blob.r, 0, Math.PI * 2);
                ctx.fill();
             });
             
             // Draw atmosphere glow
             ctx.globalAlpha = 1.0;
             const atmosGrad = ctx.createRadialGradient(planetX, planetY, planetRadius * 0.8, planetX, planetY, planetRadius);
             atmosGrad.addColorStop(0, 'transparent');
             atmosGrad.addColorStop(1, `hsla(${g.cinematic.planetConfig.hue}, 80%, 80%, 0.4)`);
             ctx.fillStyle = atmosGrad;
             ctx.fillRect(planetX - planetRadius, planetY - planetRadius, planetRadius*2, planetRadius*2);

             ctx.restore();

             // Draw the 50% random chance rings!
             if (g.cinematic.planetConfig.hasRings) {
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(planetX, planetY, planetRadius * 1.8, planetRadius * 0.4, Math.PI / 6, 0, Math.PI * 2);
                ctx.lineWidth = 15;
                ctx.strokeStyle = g.cinematic.planetConfig.ringColor;
                ctx.stroke();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#fff';
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                ctx.restore();
             }

             // Flashing warning text
             if (Math.floor(time / 500) % 2 === 0) {
                ctx.fillStyle = '#f00';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.fillText("TARGET LOCKED", planetX, planetY - 140);
             }
         }

         // Draw energy ball charging on ship
         if (g.cinematic.phase === 'CHARGING') {
             ctx.beginPath();
             ctx.arc(g.player.x + g.player.w/2, g.player.y + g.player.h/2, Math.random() * 40 + 20, 0, Math.PI*2);
             ctx.fillStyle = g.cinematic.laserColor;
             ctx.shadowBlur = 20; ctx.shadowColor = g.cinematic.laserColor;
             ctx.fill();
             ctx.shadowBlur = 0;
         }

         // Draw the actual laser beam
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
             
             // White hot core of the laser
             ctx.fillStyle = '#fff';
             ctx.beginPath();
             ctx.moveTo(g.player.x + g.player.w/2 - 5, g.player.y + g.player.h/2 - 5);
             ctx.lineTo(g.player.x + g.player.w/2 + 5, g.player.y + g.player.h/2 + 5);
             ctx.lineTo(planetX + 10, planetY);
             ctx.lineTo(planetX - 10, planetY);
             ctx.fill();
             ctx.shadowBlur = 0;
         }

         // Draw the explosion chunks flying everywhere
         if (g.cinematic.phase === 'EXPLODING') {
             g.cinematic.particles.forEach(p => {
                 if (p.life > 0) {
                     ctx.globalAlpha = p.life; 
                     ctx.fillStyle = p.color;
                     ctx.beginPath();
                     // Draw sharp triangular chunks
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

         // Draw the player ship dynamically rotating during cutscene
         if (playerImg.complete && g.cinematic.phase !== 'TRANSITION') {
             ctx.save();
             ctx.translate(g.player.x + g.player.w/2, g.player.y + g.player.h/2);
             ctx.rotate(g.player.angle);
             ctx.drawImage(playerImg, -g.player.w/2, -g.player.h/2, g.player.w, g.player.h);
             ctx.restore();
         }
      } 
      else {
        // --- DRAW NORMAL GAMEPLAY ---

        const isInvulnerable = time - g.player.hitTime < 1500;

        if (playerImg.complete) {
          ctx.shadowBlur = 20; 
          ctx.shadowColor = '#0ff'; 
          // Draw Strike wave friendlies
          g.friendlies.forEach(f => { ctx.drawImage(playerImg, f.x, f.y, f.w, f.h); });
          
          // Draw Beacon reinforcements
          g.reinforcements.ships.forEach(s => {
             ctx.save();
             ctx.translate(s.x, s.y);
             ctx.rotate(s.angle);
             ctx.drawImage(playerImg, -20, -20, 40, 40);
             ctx.restore();
          });
        }

        ctx.shadowBlur = 10;
        // Draw friendly lasers
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

        // Draw Player Ship (Flash red if hit recently)
        if (g.lives > 0 && playerImg.complete) {
          // If invulnerable, only draw every other frame (creates blinking effect)
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

        // Draw Player Lasers
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        g.bullets.forEach(b => { ctx.shadowColor = '#fff'; ctx.fillRect(b.x, b.y, b.w, b.h); });
        
        // Draw Enemy Lasers
        ctx.fillStyle = '#f00';
        g.enemyBullets.forEach(b => { ctx.shadowColor = '#f00'; ctx.fillRect(b.x, b.y, b.w, b.h); });

        // Draw Drops
        g.drops.forEach(d => {
            if (d.type === 'HEAL' && heartImg.complete) {
                ctx.shadowColor = '#ff0055';
                ctx.drawImage(heartImg, d.x, d.y, d.w, d.h);
            } else if (d.type === 'BEACON' && beaconImg.complete) {
                ctx.shadowColor = '#00aaff';
                ctx.globalAlpha = Math.abs(Math.sin(time / 200)); // Make beacon pulse smoothly
                ctx.drawImage(beaconImg, d.x, d.y, d.w, d.h);
                ctx.globalAlpha = 1.0;
            }
        });

        // Draw Boss and Boss Health Bar
        if (g.boss && bossImg.complete) {
          ctx.shadowColor = '#f00';
          ctx.drawImage(bossImg, g.boss.x, g.boss.y, g.boss.w, g.boss.h);
          // Dark background bar
          ctx.fillStyle = '#333'; ctx.fillRect(g.boss.x, g.boss.y - 15, g.boss.w, 6);
          // Red health bar
          ctx.fillStyle = '#f00'; ctx.fillRect(g.boss.x, g.boss.y - 15, g.boss.w * (g.boss.hp / g.boss.maxHp), 6);
        } 
        
        // Draw normal enemies
        if (enemyImg.complete) {
          ctx.shadowColor = '#f0f';
          g.enemies.forEach(e => ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h));
        }
        ctx.shadowBlur = 0;
      }

      update(time); // Run physics
      if (g.lives > 0) animationId = requestAnimationFrame(draw); // Loop drawing forever
    };

    animationId = requestAnimationFrame(draw);

    // This cleanup function runs if you leave the page, preventing memory leaks
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mousedown', handleMouseBtn);
      window.removeEventListener('mouseup', handleMouseBtn);
      window.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const resetGame = () => window.location.reload(); 

  // ==========================================
  // MOBILE BUTTON BUG FIX
  // ==========================================
  const handleMobileStrike = (e) => {
    // Stop the phone from accidentally zooming in or scrolling when you mash the button
    if (e && e.preventDefault) e.preventDefault();
    
    // THE FIX: We must check 'game.current.energy' (the fast engine memory), 
    // NOT 'uiState.energy' (the slow screen memory). This prevents all mobile glitches!
    if (game.current.energy >= 99) { 
      game.current.keys['control'] = true; // Tell the game we triggered the strike!
    }
  };

  const bypassIntro = () => {
     if (!game.current.audioInitialized) {
         initAudio();
         game.current.audioInitialized = true;
         if (game.current.mode === 'INTRO') playHorrorIntro();
      }
  };

  // ==========================================
  // 6. THE HTML UI (WHAT YOU CLICK AND READ)
  // ==========================================
  return (
    <>
      {/* CSS Styles for the scary glitch text and locking the screen from dragging */}
      <style>{`
        /* Import the aggressive digital horror font from Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap');

        * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-user-drag: none !important;
        }
        canvas { touch-action: none; }
        
        /* The custom animation for the blinding white core + massive red blood bleed */
        @keyframes gory-glitch {
          0% { text-shadow: 4px 0 0 #ff0000, -4px 0 0 #4a0000; transform: translate(0); }
          20% { transform: translate(-3px, 3px); text-shadow: -4px 0 20px #ff0000, 4px 0 30px #8b0000; }
          40% { transform: translate(3px, -3px) skewX(5deg); text-shadow: 4px 0 20px #8b0000, -4px 0 30px #ff0000; }
          60% { transform: translate(-3px, -3px); }
          80% { transform: translate(3px, 3px); }
          100% { text-shadow: 4px 0 20px #ff0000, -4px 0 30px #8b0000; transform: translate(0); }
        }
        
        .gory-text {
           animation: gory-glitch 0.15s infinite;
           font-family: 'Rubik Glitch', 'Courier New', Courier, monospace;
           color: #ffffff; /* Stark blinding white so it pops */
           filter: drop-shadow(0 0 40px #ff0000) drop-shadow(0 0 80px #aa0000); /* Massive double blood glow */
        }

        /* THE TRUE BLOOD VIGNETTE: Pulses the edges of the screen with dark red */
        @keyframes heartbeat-screen {
          0% { box-shadow: inset 0 0 50px 20px rgba(139, 0, 0, 0.4); }
          50% { box-shadow: inset 0 0 150px 60px rgba(180, 0, 0, 0.8); }
          100% { box-shadow: inset 0 0 50px 20px rgba(139, 0, 0, 0.4); }
        }

        .blood-vignette {
          animation: heartbeat-screen 1.5s infinite;
          pointer-events: none; /* So you can still click the button underneath it */
        }

        /* Styling for the massive touch button on the intro screen */
        .intro-btn {
           animation: pulse-glow 1.5s infinite;
           border: 2px solid #ff0000;
           background: rgba(20, 0, 0, 0.9);
           color: #ff3333;
           box-shadow: 0 0 20px #ff0000 inset, 0 0 30px #aa0000;
        }

        /* Makes the touch button physically pulse and glow */
        @keyframes pulse-glow {
           0%, 100% { transform: scale(1); opacity: 0.8; }
           50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 40px #ff0000 inset, 0 0 50px #ff0000; text-shadow: 0 0 10px #ff0000;}
        }
      `}</style>
      
      {/* Main Wrapper covering the whole screen */}
      <div className="h-screen w-screen bg-[#020308] text-green-400 font-mono overflow-hidden relative cursor-crosshair">
        
        {/* --- ACTUAL HORROR INTRO --- */}
        {uiState.mode === 'INTRO' && (
           <div 
              className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
              onClick={bypassIntro}
           >
              {/* THE BLOOD VIGNETTE OVERLAY */}
              <div className="blood-vignette absolute inset-0 w-full h-full z-10"></div>

              <h1 className="gory-text text-6xl md:text-8xl font-black uppercase tracking-tighter z-20 text-center px-4">
                 OBJECTIVE:<br/>SURVIVE
              </h1>

              {/* The new, highly visible, pulsing tactical start button! */}
              {!game.current.audioInitialized && (
                 <div className="absolute bottom-16 md:bottom-24 z-30">
                     <button className="intro-btn px-8 py-4 font-black tracking-[0.3em] text-sm md:text-lg rounded-sm uppercase">
                         Tap Here To Initialize
                     </button>
                 </div>
              )}
           </div>
        )}

        {(uiState.mode === 'PLAYING' || uiState.mode === 'GAMEOVER') && (
           <>
              {/* Giant transparent '404' in the background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                <h1 className="text-[35vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-700 opacity-60 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  404
                </h1>
              </div>

              {/* Top HUD (Heads Up Display) */}
              <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-20 pointer-events-none">
                
                {/* Left Side: Energy Bar */}
                <div className="flex flex-col gap-2">
                  <span className="text-cyan-400 font-black tracking-widest text-xl md:text-3xl drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">SYS.SEC.FINAL</span>
                  <div className="mt-2 w-32 md:w-48 h-4 border-2 border-gray-700 bg-black relative">
                    <div 
                      className={`h-full transition-all duration-75 ${uiState.energy >= 100 ? 'bg-cyan-400 shadow-[0_0_15px_#0ff] animate-pulse' : 'bg-gray-500'}`} 
                      style={{ width: `${uiState.energy}%` }} // CSS logic filling the bar based on state
                    />
                    <span className="absolute -bottom-5 left-0 text-[8px] md:text-[10px] text-gray-400 tracking-widest font-bold whitespace-nowrap">
                      {uiState.energy >= 100 ? '[R-CLICK/TAP] STRIKE READY' : 'RECHARGING COMMS...'}
                    </span>
                  </div>
                </div>
                
                {/* Right Side: Score and Lives */}
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

              {/* MOBILE STRIKE BUTTON - Now completely bug-free! */}
              <div className="absolute bottom-24 right-6 z-30 pointer-events-auto md:hidden">
                  <button 
                     onTouchStart={handleMobileStrike}
                     onClick={handleMobileStrike}
                     className={`w-20 h-20 rounded-full border-4 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 ${uiState.energy >= 100 ? 'border-cyan-400 text-cyan-400 shadow-[0_0_20px_#0ff] animate-pulse' : 'border-gray-700 text-gray-700'}`}
                  >
                     <span className="font-black text-xs">STRIKE</span>
                  </button>
              </div>

              {/* DEATH SCREEN */}
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
           </>
        )}
        
        {/* THE ACTUAL GAME SCREEN WHERE EVERYTHING IS DRAWN */}
        <canvas ref={canvasRef} className="absolute inset-0 z-10 block bg-transparent" />
      </div>
    </>
  );
};

export default Cyberpunk404;