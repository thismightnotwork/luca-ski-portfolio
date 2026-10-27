// Simple ski game - control skier through gates
(function(){
  const canvas = document.getElementById('ski-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W,H;
  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width; H = 320;
    canvas.width = W; canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const skier = {x: W/2, y: 280, vx: 0, vy: -2, angle: 0, radius: 6};
  const gates = [];
  let gateCount = 0;
  let score = 0;
  let speed = 2.5;
  let keys = {};
  
  function createGate(y){
    const offset = (Math.random()-0.5) * (W * 0.4);
    gates.push({
      y: y,
      x1: W/2 + offset - 40,
      x2: W/2 + offset + 40,
      passed: false,
      color: gateCount % 2 === 0 ? '#ff3b30' : '#3b82f6'
    });
    gateCount++;
  }
  
  for(let i=0; i<12; i++) createGate(200 - i*35);
  
  document.addEventListener('keydown', e => { keys[e.key] = true; if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault(); });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  
  function update(){
    if(keys['ArrowLeft'] || keys['a'] || keys['A']) skier.vx -= 0.15;
    if(keys['ArrowRight'] || keys['d'] || keys['D']) skier.vx += 0.15;
    skier.vx *= 0.85;
    skier.vx = Math.max(-4, Math.min(4, skier.vx));
    skier.x += skier.vx;
    skier.y -= speed;
    if(skier.y < -50){
      gates.forEach(g => g.y += 400);
      for(let i=0; i<3; i++) createGate(gates[gates.length-1].y - 35);
    }
    if(skier.x < 20) skier.x = 20;
    if(skier.x > W-20) skier.x = W-20;
    gates.forEach(g => {
      if(!g.passed && skier.y < g.y && skier.y > g.y - 5){
        if(skier.x >= g.x1 && skier.x <= g.x2){
          g.passed = true;
          score++;
          speed = Math.min(4.5, speed + 0.05);
        }else{
          g.passed = true;
        }
      }
    });
    document.getElementById('ski-score').textContent = score;
  }
  
  function draw(){
    ctx.fillStyle = 'rgba(5,6,7,0.3)';
    ctx.fillRect(0,0,W,H);
    // Course
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W/2-60,0);
    ctx.lineTo(W/2-60,H);
    ctx.moveTo(W/2+60,0);
    ctx.lineTo(W/2+60,H);
    ctx.stroke();
    // Gates
    gates.forEach(g => {
      if(g.y < -10 || g.y > H+10) return;
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x1, g.y);
      ctx.lineTo(g.x2, g.y);
      ctx.stroke();
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.x1, g.y, 4, 0, Math.PI*2);
      ctx.arc(g.x2, g.y, 4, 0, Math.PI*2);
      ctx.fill();
    });
    // Skier
    ctx.save();
    ctx.translate(skier.x, skier.y);
    ctx.rotate(skier.vx * 0.1);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0,0, skier.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // Trail
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(skier.x, skier.y);
    ctx.lineTo(skier.x - skier.vx*3, skier.y + 15);
    ctx.stroke();
  }
  
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
