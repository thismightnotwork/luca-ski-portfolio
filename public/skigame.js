// Top-down scrolling ski game
(function(){
  const canvas = document.getElementById('ski-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = 420;
    canvas.width = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize);
  
  let discipline = 'slalom';
  const modeBtns = document.querySelectorAll('.ski-mode');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      discipline = btn.dataset.mode;
      resetGame();
    });
  });
  
  const skier = {x: W/2, y: 60, vx: 0, radius: 6};
  let gates = [];
  let gateId = 0;
  let score = 0;
  let speed = 0;
  let keys = {};
  let cameraY = 0;
  
  function getConfig(){
    if(discipline === 'slalom') return { spacing: 38, width: 58, baseSpeed: 3.2, turn: 0.16 };
    if(discipline === 'gs') return { spacing: 52, width: 88, baseSpeed: 3.6, turn: 0.12 };
    if(discipline === 'superg') return { spacing: 72, width: 110, baseSpeed: 4.0, turn: 0.09 };
    if(discipline === 'downhill') return { spacing: 98, width: 138, baseSpeed: 4.8, turn: 0.07 };
    return { spacing: 38, width: 58, baseSpeed: 3.2, turn: 0.16 };
  }
  
  function createGate(y, red){
    const cfg = getConfig();
    const offset = (Math.sin(gateId * 0.9) * (W * 0.28));
    gates.push({
      id: gateId++,
      y: y,
      x: W/2 + offset,
      width: cfg.width,
      red: red,
      passed: false
    });
  }
  
  function resetGame(){
    gates = [];
    gateId = 0;
    score = 0;
    speed = getConfig().baseSpeed;
    skier.x = W/2;
    skier.y = 80;
    skier.vx = 0;
    cameraY = 0;
    const cfg = getConfig();
    for(let i=0; i<25; i++) {
      createGate(150 + i*cfg.spacing, i % 2 === 0);
    }
    document.getElementById('ski-score').textContent = score;
  }
  
  resetGame();
  
  document.addEventListener('keydown', e => { keys[e.key] = true; if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)) e.preventDefault(); });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  
  function update(){
    const cfg = getConfig();
    if(keys['ArrowLeft'] || keys['a'] || keys['A']) skier.vx -= cfg.turn;
    if(keys['ArrowRight'] || keys['d'] || keys['D']) skier.vx += cfg.turn;
    skier.vx *= 0.85;
    skier.vx = Math.max(-4.5, Math.min(4.5, skier.vx));
    skier.x += skier.vx;
    cameraY += speed;
    
    if(skier.x < 30) skier.x = 30;
    if(skier.x > W-30) skier.x = W-30;
    
    gates.forEach(g => {
      const gy = g.y + cameraY;
      if(!g.passed && gy > skier.y - 5 && gy < skier.y + 15){
        if(skier.x >= g.x - g.width/2 && skier.x <= g.x + g.width/2){
          g.passed = true;
          score++;
          speed = Math.min(cfg.baseSpeed + 1.0, speed + 0.04);
        }else{
          g.passed = true;
        }
      }
    });
    
    if(gates.length > 0 && gates[gates.length-1].y + cameraY < H + 200){
      const last = gates[gates.length-1];
      for(let i=0; i<5; i++){
        createGate(last.y + cfg.spacing * (i+1), gateId % 2 === 0);
      }
    }
    gates = gates.filter(g => g.y + cameraY > -100);
    
    document.getElementById('ski-score').textContent = score;
  }
  
  function draw(){
    ctx.fillStyle = '#040608';
    ctx.fillRect(0,0,W,H);
    
    // Course edges
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W/2 - 90, 0);
    ctx.lineTo(W/2 - 90, H);
    ctx.moveTo(W/2 + 90, 0);
    ctx.lineTo(W/2 + 90, H);
    ctx.stroke();
    
    // Gates
    gates.forEach(g => {
      const gy = g.y + cameraY;
      if(gy < -40 || gy > H+40) return;
      const color = g.red ? '#ff3333' : '#4d9bff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      // Left pole
      ctx.beginPath();
      ctx.moveTo(g.x - g.width/2, gy);
      ctx.lineTo(g.x - g.width/2, gy - 32);
      // Right pole
      ctx.moveTo(g.x + g.width/2, gy);
      ctx.lineTo(g.x + g.width/2, gy - 32);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Flags
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(g.x - g.width/2, gy - 32);
      ctx.lineTo(g.x - g.width/2 + 10, gy - 30);
      ctx.lineTo(g.x - g.width/2, gy - 28);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(g.x + g.width/2, gy - 32);
      ctx.lineTo(g.x + g.width/2 - 10, gy - 30);
      ctx.lineTo(g.x + g.width/2, gy - 28);
      ctx.fill();
    });
    
    // Skier
    ctx.save();
    ctx.translate(skier.x, skier.y);
    ctx.rotate(skier.vx * 0.08);
    const g = ctx.createRadialGradient(0,0,0,0,0,9);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#dddddd');
    ctx.fillStyle = g;
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0,0, skier.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Skis
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, 3);
    ctx.lineTo(-8, 12);
    ctx.moveTo(5, 3);
    ctx.lineTo(8, 12);
    ctx.stroke();
    ctx.restore();
    
    // Top indicator
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px IBM Plex Mono';
    ctx.fillText('TOP', W/2 - 12, 15);
  }
  
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
