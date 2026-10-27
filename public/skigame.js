// Coming down - gates come from bottom to top
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
  
  const skier = {x: W/2, y: H - 80, vx: 0, radius: 6};
  let gates = [];
  let gateId = 0;
  let score = 0;
  let speed = 0;
  let keys = {};
  
  function getConfig(){
    if(discipline === 'slalom') return { spacing: 42, width: 56, baseSpeed: 3.0, turn: 0.18 };
    if(discipline === 'gs') return { spacing: 58, width: 86, baseSpeed: 3.4, turn: 0.14 };
    if(discipline === 'superg') return { spacing: 78, width: 108, baseSpeed: 3.8, turn: 0.11 };
    if(discipline === 'downhill') return { spacing: 105, width: 136, baseSpeed: 4.6, turn: 0.09 };
    return { spacing: 42, width: 56, baseSpeed: 3.0, turn: 0.18 };
  }
  
  function createGate(yOffset, red){
    const cfg = getConfig();
    const offset = Math.sin(gateId * 0.85) * (W * 0.26);
    gates.push({
      id: gateId++,
      y: yOffset,
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
    skier.y = H - 80;
    skier.vx = 0;
    const cfg = getConfig();
    for(let i=0; i<20; i++) {
      createGate(-i * cfg.spacing - 100, i % 2 === 0);
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
    skier.vx *= 0.84;
    skier.vx = Math.max(-4.2, Math.min(4.2, skier.vx));
    skier.x += skier.vx;
    
    // Gates move up toward skier (coming down)
    gates.forEach(g => {
      g.y += speed;
    });
    
    if(skier.x < 28) skier.x = 28;
    if(skier.x > W-28) skier.x = W-28;
    
    gates.forEach(g => {
      if(!g.passed && g.y > skier.y - 12 && g.y < skier.y + 8){
        if(skier.x >= g.x - g.width/2 && skier.x <= g.x + g.width/2){
          g.passed = true;
          score++;
          speed = Math.min(cfg.baseSpeed + 0.9, speed + 0.035);
        }else{
          g.passed = true;
        }
      }
    });
    
    // Add new gates at top
    if(gates.length > 0 && gates[gates.length-1].y > -200){
      const last = gates[gates.length-1];
      for(let i=0; i<4; i++){
        createGate(last.y - cfg.spacing * (i+1), gateId % 2 === 0);
      }
    }
    gates = gates.filter(g => g.y < H + 60);
    
    document.getElementById('ski-score').textContent = score;
  }
  
  function draw(){
    ctx.fillStyle = '#040608';
    ctx.fillRect(0,0,W,H);
    
    // Course edges
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W/2 - 88, 0);
    ctx.lineTo(W/2 - 88, H);
    ctx.moveTo(W/2 + 88, 0);
    ctx.lineTo(W/2 + 88, H);
    ctx.stroke();
    
    // Gates coming from bottom
    gates.forEach(g => {
      if(g.y < -50 || g.y > H+30) return;
      const color = g.red ? '#ff3333' : '#4d9bff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 14;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(g.x - g.width/2, g.y);
      ctx.lineTo(g.x - g.width/2, g.y - 34);
      ctx.moveTo(g.x + g.width/2, g.y);
      ctx.lineTo(g.x + g.width/2, g.y - 34);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(g.x - g.width/2, g.y - 34);
      ctx.lineTo(g.x - g.width/2 + 11, g.y - 32);
      ctx.lineTo(g.x - g.width/2, g.y - 30);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(g.x + g.width/2, g.y - 34);
      ctx.lineTo(g.x + g.width/2 - 11, g.y - 32);
      ctx.lineTo(g.x + g.width/2, g.y - 30);
      ctx.fill();
    });
    
    // Skier at bottom
    ctx.save();
    ctx.translate(skier.x, skier.y);
    ctx.rotate(skier.vx * 0.1);
    const grad = ctx.createRadialGradient(0,0,0,0,0,9);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 22;
    ctx.shadowColor = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(0,0, skier.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, 3);
    ctx.lineTo(-8, 14);
    ctx.moveTo(5, 3);
    ctx.lineTo(8, 14);
    ctx.stroke();
    ctx.restore();
    
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px IBM Plex Mono';
    ctx.fillText('COMING DOWN', W/2 - 38, H - 10);
  }
  
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
