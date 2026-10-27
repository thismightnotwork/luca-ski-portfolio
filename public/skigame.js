// Interactive ski game - control skier through gates
(function(){
  const canvas = document.getElementById('ski-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    W = Math.max(300, rect.width);
    H = 340;
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
  
  const skier = {x: W/2, y: 300, vx: 0, vy: 0, radius: 6};
  let gates = [];
  let gateCount = 0;
  let score = 0;
  let speed = 3;
  let keys = {};
  
  function getGateSpacing(){
    if(discipline === 'slalom') return 28;
    if(discipline === 'gs') return 45;
    if(discipline === 'superg') return 70;
    if(discipline === 'downhill') return 95;
    return 28;
  }
  
  function getGateWidth(){
    if(discipline === 'slalom') return 70;
    if(discipline === 'gs') return 90;
    if(discipline === 'superg') return 110;
    if(discipline === 'downhill') return 140;
    return 70;
  }
  
  function getSpeed(){
    if(discipline === 'slalom') return 2.8;
    if(discipline === 'gs') return 3.2;
    if(discipline === 'superg') return 3.8;
    if(discipline === 'downhill') return 4.5;
    return 2.8;
  }
  
  function createGate(y){
    const spacing = getGateSpacing();
    const width = getGateWidth();
    const maxOffset = Math.min(W * 0.35, 150);
    const offset = (Math.sin(gateCount * 0.7) * maxOffset * 0.6) + ((Math.random()-0.5) * maxOffset * 0.4);
    gates.push({
      y: y,
      x1: W/2 + offset - width/2,
      x2: W/2 + offset + width/2,
      passed: false,
      color: gateCount % 2 === 0 ? '#ff3b30' : '#3b82f6',
      type: discipline
    });
    gateCount++;
  }
  
  function resetGame(){
    gates = [];
    gateCount = 0;
    score = 0;
    speed = getSpeed();
    skier.x = W/2;
    skier.y = 300;
    skier.vx = 0;
    for(let i=0; i<15; i++) createGate(250 - i*getGateSpacing());
    document.getElementById('ski-score').textContent = score;
  }
  
  resetGame();
  
  document.addEventListener('keydown', e => { 
    keys[e.key] = true; 
    if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)) e.preventDefault(); 
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  
  function update(){
    if(keys['ArrowLeft'] || keys['a'] || keys['A']) skier.vx -= 0.18;
    if(keys['ArrowRight'] || keys['d'] || keys['D']) skier.vx += 0.18;
    skier.vx *= 0.82;
    skier.vx = Math.max(-5, Math.min(5, skier.vx));
    skier.x += skier.vx;
    skier.y -= speed;
    
    if(skier.y < -80){
      gates = gates.filter(g => g.y > -100);
      for(let i=0; i<4; i++) createGate(gates.length > 0 ? gates[gates.length-1].y - getGateSpacing() : -80);
    }
    
    if(skier.x < 15) skier.x = 15;
    if(skier.x > W-15) skier.x = W-15;
    
    gates.forEach(g => {
      if(!g.passed && skier.y < g.y + 2 && skier.y > g.y - 8){
        if(skier.x >= g.x1 && skier.x <= g.x2){
          g.passed = true;
          score++;
          speed = Math.min(getSpeed() + 1.5, speed + 0.08);
        }else{
          g.passed = true;
        }
      }
    });
    document.getElementById('ski-score').textContent = score;
  }
  
  function draw(){
    ctx.fillStyle = '#030405';
    ctx.fillRect(0,0,W,H);
    
    // Course edges
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W/2-70, 0);
    ctx.lineTo(W/2-70, H);
    ctx.moveTo(W/2+70, 0);
    ctx.lineTo(W/2+70, H);
    ctx.stroke();
    
    // Gates
    gates.forEach(g => {
      if(g.y < -5 || g.y > H+5) return;
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 10;
      ctx.shadowColor = g.color;
      ctx.beginPath();
      ctx.moveTo(g.x1, g.y);
      ctx.lineTo(g.x2, g.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.x1, g.y, 5, 0, Math.PI*2);
      ctx.arc(g.x2, g.y, 5, 0, Math.PI*2);
      ctx.fill();
    });
    
    // Skier trail
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(skier.x, skier.y + 10);
    ctx.lineTo(skier.x - skier.vx * 4, skier.y + 25);
    ctx.stroke();
    
    // Skier
    ctx.save();
    ctx.translate(skier.x, skier.y);
    ctx.rotate(skier.vx * 0.08);
    const gradient = ctx.createRadialGradient(0,0,0,0,0,8);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e5e5e5');
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(0,0, skier.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
