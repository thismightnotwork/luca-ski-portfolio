// Proper ski game - realistic slalom course
(function(){
  const canvas = document.getElementById('ski-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = 380;
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
  
  const skier = {x: W/2, y: 340, vx: 0, vy: 0, radius: 7, turn: 0};
  let gates = [];
  let gateCount = 0;
  let score = 0;
  let speed = 0;
  let keys = {};
  let time = 0;
  
  function getConfig(){
    if(discipline === 'slalom'){
      return { spacing: 32, width: 65, baseSpeed: 2.2, turnRate: 0.12, gateType: 'pole' };
    }
    if(discipline === 'gs'){
      return { spacing: 48, width: 95, baseSpeed: 2.6, turnRate: 0.09, gateType: 'panel' };
    }
    if(discipline === 'superg'){
      return { spacing: 68, width: 120, baseSpeed: 3.0, turnRate: 0.07, gateType: 'panel' };
    }
    if(discipline === 'downhill'){
      return { spacing: 95, width: 150, baseSpeed: 3.6, turnRate: 0.05, gateType: 'panel' };
    }
    return { spacing: 32, width: 65, baseSpeed: 2.2, turnRate: 0.12, gateType: 'pole' };
  }
  
  function createGate(y, isRed){
    const cfg = getConfig();
    const offset = Math.sin(gateCount * 0.85) * (W * 0.25);
    gates.push({
      y: y,
      x1: W/2 + offset - cfg.width/2,
      x2: W/2 + offset + cfg.width/2,
      passed: false,
      isRed: isRed,
      type: cfg.gateType
    });
    gateCount++;
  }
  
  function resetGame(){
    gates = [];
    gateCount = 0;
    score = 0;
    speed = getConfig().baseSpeed;
    skier.x = W/2;
    skier.y = 340;
    skier.vx = 0;
    skier.turn = 0;
    time = 0;
    const cfg = getConfig();
    for(let i=0; i<18; i++) {
      createGate(280 - i*cfg.spacing, i % 2 === 0);
    }
    document.getElementById('ski-score').textContent = score;
  }
  
  resetGame();
  
  document.addEventListener('keydown', e => { 
    keys[e.key] = true; 
    if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)) e.preventDefault(); 
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  
  function update(){
    const cfg = getConfig();
    if(keys['ArrowLeft'] || keys['a'] || keys['A']) {
      skier.vx -= cfg.turnRate;
      skier.turn = -0.3;
    } else if(keys['ArrowRight'] || keys['d'] || keys['D']) {
      skier.vx += cfg.turnRate;
      skier.turn = 0.3;
    } else {
      skier.turn *= 0.9;
    }
    skier.vx *= 0.88;
    skier.vx = Math.max(-3.5, Math.min(3.5, skier.vx));
    skier.x += skier.vx;
    skier.y -= speed;
    time++;
    
    if(skier.y < -60){
      gates = gates.filter(g => g.y > -80);
      const lastY = gates.length > 0 ? gates[gates.length-1].y : -60;
      for(let i=0; i<3; i++) {
        createGate(lastY - cfg.spacing * (i+1), gateCount % 2 === 0);
      }
    }
    
    if(skier.x < 25) skier.x = 25;
    if(skier.x > W-25) skier.x = W-25;
    
    gates.forEach(g => {
      if(!g.passed && skier.y < g.y + 3 && skier.y > g.y - 10){
        if(skier.x >= g.x1 && skier.x <= g.x2){
          g.passed = true;
          score++;
          speed = Math.min(cfg.baseSpeed + 0.8, speed + 0.03);
        }else{
          g.passed = true;
        }
      }
    });
    document.getElementById('ski-score').textContent = score;
  }
  
  function draw(){
    // Snow
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, '#0a0d14');
    grad.addColorStop(1, '#050607');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);
    
    // Course lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<H; i+=20){
      ctx.beginPath();
      ctx.moveTo(W/2, i);
      ctx.lineTo(W/2, i+10);
      ctx.stroke();
    }
    
    // Gates
    gates.forEach(g => {
      if(g.y < -10 || g.y > H+10) return;
      const color = g.isRed ? '#ff3333' : '#4488ff';
      if(g.type === 'pole'){
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(g.x1, g.y);
        ctx.lineTo(g.x1, g.y - 28);
        ctx.moveTo(g.x2, g.y);
        ctx.lineTo(g.x2, g.y - 28);
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Flags
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(g.x1, g.y - 28);
        ctx.lineTo(g.x1 + 8, g.y - 26);
        ctx.lineTo(g.x1, g.y - 24);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(g.x2, g.y - 28);
        ctx.lineTo(g.x2 - 8, g.y - 26);
        ctx.lineTo(g.x2, g.y - 24);
        ctx.fill();
      }else{
        // Panel gate
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(g.x1, g.y);
        ctx.lineTo(g.x1, g.y - 35);
        ctx.moveTo(g.x2, g.y);
        ctx.lineTo(g.x2, g.y - 35);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.fillRect(g.x1 - 2, g.y - 35, g.x2 - g.x1 + 4, 6);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 5px Arial';
        ctx.fillText(g.isRed ? 'R' : 'B', g.x1 + 3, g.y - 30);
      }
    });
    
    // Skier trail
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(skier.x, skier.y + 12);
    ctx.lineTo(skier.x - skier.vx * 5, skier.y + 30);
    ctx.stroke();
    
    // Skier
    ctx.save();
    ctx.translate(skier.x, skier.y);
    ctx.rotate(skier.turn * 0.5 + skier.vx * 0.1);
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(0,0, skier.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Skis
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.lineTo(-6, 8);
    ctx.moveTo(4, 2);
    ctx.lineTo(6, 8);
    ctx.stroke();
    ctx.restore();
  }
  
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
