// ── Magic circle ─────────────────────────────────────────────
function drawMagicProgress(ctx, x, y, progress) {
    ctx.save(); ctx.translate(x,y);

    // 1. Vòng ngoài xoay ngược (nét đứt xanh ngọc)
    ctx.save(); ctx.rotate(-globalTime*0.025);
    ctx.beginPath(); ctx.arc(0,0,60,0,Math.PI*2);
    ctx.strokeStyle=`rgba(110,231,183,${0.15+progress*0.4})`;
    ctx.lineWidth=2; ctx.setLineDash([8,14]); ctx.stroke();
    ctx.restore();

    // 2. Vòng giữa xoay thuận (nét đứt vàng)
    ctx.save(); ctx.rotate(globalTime*0.018);
    ctx.beginPath(); ctx.arc(0,0,45,0,Math.PI*2);
    ctx.strokeStyle=`rgba(253,230,138,${0.1+progress*0.3})`;
    ctx.lineWidth=1.5; ctx.setLineDash([5,18]); ctx.stroke();
    ctx.restore();

    // 3. Lục giác đan nhau (2 tam giác)
    ctx.save(); ctx.rotate(-globalTime*0.03); ctx.setLineDash([]);
    ctx.strokeStyle=`rgba(52,211,153,${0.25+progress*0.55})`; ctx.lineWidth=1.5;
    for (let tri=0;tri<2;tri++) {
        ctx.beginPath();
        for (let i=0;i<3;i++) {
            const a=(i/3)*Math.PI*2+(tri===1?Math.PI:0);
            const px=Math.cos(a)*32, py=Math.sin(a)*32;
            i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
        }
        ctx.closePath(); ctx.stroke();
    }
    ctx.restore();

    // 4. Vòng tiến trình rực sáng
    ctx.setLineDash([]);
    ctx.shadowBlur=25*(0.5+progress); ctx.shadowColor='#34d399';
    ctx.beginPath(); ctx.arc(0,0,50,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);
    ctx.strokeStyle=`hsl(${155+progress*30},85%,55%)`;
    ctx.lineWidth=7; ctx.lineCap='round'; ctx.stroke();
    ctx.shadowBlur=0;

    // 5. Rune nodes sáng dần
    for (let i=0;i<6;i++) {
        if (i/6>progress) break;
        const ra=(i/6)*Math.PI*2-Math.PI/2;
        const rx=Math.cos(ra)*50, ry=Math.sin(ra)*50;
        ctx.save(); ctx.translate(rx,ry); ctx.rotate(ra+globalTime*0.05);
        ctx.globalAlpha=progress;
        ctx.fillStyle='#a7f3d0'; ctx.shadowBlur=12; ctx.shadowColor='#6ee7b7';
        ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1; ctx.restore();
    }

    // Phần trăm
    ctx.shadowBlur=0; ctx.fillStyle='#fff';
    ctx.font='bold 20px Inter'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(`${Math.floor(progress*100)}%`, 0, -82);
    ctx.restore();

    if (Math.random()>1-progress-0.05) { sparks.push(new Spark(x,y)); sparks.push(new Spark(x,y)); }
}

// ── Bloom ────────────────────────────────────────────────────
function applyBloom() {
    bloomCtx.clearRect(0,0,bloomCanvas.width,bloomCanvas.height);
    bloomCtx.filter='blur(10px) brightness(1.4)';
    bloomCtx.drawImage(canvasElement,0,0);
    bloomCtx.filter='none';
}
