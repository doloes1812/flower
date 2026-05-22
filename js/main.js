// ── startGrowing ────────────────────────────────────────────
function startGrowing(x, y) {
    if (state!=='waiting') return;
    state='growing'; sceneTimer=0;
    uiLayer.classList.add('hidden-ui');
    vignette.style.opacity=1;
    touchStartPos={x,y};
    vineCtx.clearRect(0,0,vineCanvas.width,vineCanvas.height);
    flowers=[]; particles=[]; sparks=[]; growingTips=[]; vinesAlpha=1.0;
    shockwaves.push(new Shockwave(x,y));
    shockwaves.push(new Shockwave(x,y));

    // 6 cành chính vừa đủ, không quá nhiều
    const baseAngles = [
        Math.PI * 0.5,
        Math.PI * 0.5 + 0.45,
        Math.PI * 0.5 - 0.45,
        Math.PI * 0.5 + 1.0,
        Math.PI * 0.5 - 1.0,
        Math.PI * 0.5 + 1.5,
        Math.PI * 0.5 - 1.5,
        Math.PI * 0.5 + (Math.random()-0.5)*0.6,
    ];
    baseAngles.forEach(a => {
        const sz = 13 + Math.random() * 3;
        growingTips.push(new GrowingTip(x, y, a + (Math.random()-0.5)*0.3, sz, 0));
    });
    for (let i=0;i<30;i++) sparks.push(new Spark(x,y));
}

// ── Render loop ──────────────────────────────────────────────
function renderLoop() {
    globalTime++;

    // Camera
    if (lastVideoFrame) {
        const ratio = Math.max(canvasElement.width/videoElement.videoWidth, canvasElement.height/videoElement.videoHeight);
        const dw=videoElement.videoWidth*ratio, dh=videoElement.videoHeight*ratio;
        const ox=(canvasElement.width-dw)/2, oy=(canvasElement.height-dh)/2;
        canvasCtx.save();
        canvasCtx.translate(canvasElement.width,0); canvasCtx.scale(-1,1);
        canvasCtx.drawImage(lastVideoFrame,ox,oy,dw,dh);
        canvasCtx.restore();
    } else {
        canvasCtx.fillStyle='#000'; canvasCtx.fillRect(0,0,canvasElement.width,canvasElement.height);
    }

    // Ambient spores
    ambientSpores.forEach(sp=>{
        sp.twinkle+=0.04;
        const tw=(Math.sin(sp.twinkle)+1)/2;
        sp.x+=Math.sin(globalTime*0.01+sp.y*0.01)*0.6+sp.vx;
        sp.y+=sp.vy;
        if(sp.y<-10){sp.y=canvasElement.height+10;sp.x=Math.random()*canvasElement.width;}
        canvasCtx.save();
        canvasCtx.globalAlpha=sp.alpha*tw*0.22;
        canvasCtx.shadowBlur=8; canvasCtx.shadowColor=`hsl(${sp.hue},80%,65%)`;
        canvasCtx.fillStyle=`hsl(${sp.hue},85%,70%)`;
        canvasCtx.beginPath(); canvasCtx.arc(sp.x,sp.y,sp.size*(tw*0.5+0.5),0,Math.PI*2); canvasCtx.fill();
        canvasCtx.restore();
    });

    // Shockwaves
    shockwaves=shockwaves.filter(sw=>{sw.update();sw.draw(canvasCtx);return sw.a>0;});

    // Sparks
    sparks=sparks.filter(s=>{s.update();s.draw(canvasCtx);return s.life>0;});

    // Gesture
    if (state==='waiting') {
        if (handLandmarks) {
            const tip=handLandmarks[8], mcp=handLandmarks[5];
            if (tip.y<mcp.y) {
                const c=getCanvasCoords(tip.x,tip.y);
                if (Math.random()>0.6) sparks.push(new Spark(c.x,c.y));
                if (!indexFingerLastPos) {
                    indexFingerLastPos={x:tip.x,y:tip.y,time:performance.now()};holdingProgress=0;
                } else {
                    const d=Math.hypot(tip.x-indexFingerLastPos.x,tip.y-indexFingerLastPos.y);
                    if (d<HOLD_THRESHOLD) {
                        holdingProgress=Math.min((performance.now()-indexFingerLastPos.time)/HOLD_DURATION,1);
                        drawMagicProgress(canvasCtx,c.x,c.y,holdingProgress);
                        if (holdingProgress>=1){startGrowing(c.x,c.y);indexFingerLastPos=null;holdingProgress=0;}
                    } else {
                        indexFingerLastPos={x:tip.x,y:tip.y,time:performance.now()};holdingProgress=0;
                    }
                }
            } else indexFingerLastPos=null;
        } else indexFingerLastPos=null;
    }

    // Growing
    if (state==='growing') {
        sceneTimer++;
        canvasCtx.fillStyle=`rgba(0,12,5,${Math.min(sceneTimer/180,0.55)})`;
        canvasCtx.fillRect(0,0,canvasElement.width,canvasElement.height);
        growingTips.forEach(t=>t.update(canvasCtx));
        canvasCtx.drawImage(vineCanvas,0,0);
        if (sceneTimer>294){state='blooming';sceneTimer=0;}
    }

    // Blooming
    else if (state==='blooming') {
        sceneTimer++;
        const prog=Math.min(sceneTimer/BLOOM_DURATION,1);
        const sa=(1-Math.cos(prog*Math.PI))/2;
        canvasCtx.fillStyle='rgba(0,12,5,0.55)';
        canvasCtx.fillRect(0,0,canvasElement.width,canvasElement.height);
        canvasCtx.drawImage(vineCanvas,0,0);

        if (sa>0) {
            canvasCtx.save();
            canvasCtx.translate(touchStartPos.x,touchStartPos.y);
            canvasCtx.rotate(globalTime*0.002);
            canvasCtx.globalCompositeOperation='screen';
            const maxR=Math.max(canvasElement.width,canvasElement.height)*sa*0.8;
            const g=canvasCtx.createRadialGradient(0,0,5,0,0,maxR);
            g.addColorStop(0,`rgba(255,255,255,${sa*0.85})`);
            g.addColorStop(0.1,`rgba(255,240,180,${sa*0.6})`);
            g.addColorStop(0.3,`rgba(110,231,183,${sa*0.25})`);
            g.addColorStop(1,'rgba(0,0,0,0)');
            canvasCtx.fillStyle=g;
            canvasCtx.beginPath();
            for(let i=0;i<16;i++){canvasCtx.rotate(Math.PI/8);canvasCtx.moveTo(0,0);canvasCtx.lineTo(18,-canvasElement.height*1.2);canvasCtx.lineTo(-18,-canvasElement.height*1.2);}
            canvasCtx.fill();
            canvasCtx.fillRect(-canvasElement.width,-canvasElement.height,canvasElement.width*2,canvasElement.height*2);
            canvasCtx.globalCompositeOperation='source-over'; canvasCtx.restore();
        }

        flowers.forEach(f=>{if(f.scale<f.maxScale)f.scale+=(f.maxScale-f.scale)*0.015+0.002;f.draw(canvasCtx);});
        if(sceneTimer>BLOOM_DURATION){state='hovering';sceneTimer=0;}
    }

    // Hovering
    else if (state==='hovering') {
        sceneTimer++;
        canvasCtx.fillStyle='rgba(0,12,5,0.55)';
        canvasCtx.fillRect(0,0,canvasElement.width,canvasElement.height);
        canvasCtx.drawImage(vineCanvas,0,0);
        flowers.forEach(f=>f.draw(canvasCtx));

        if(particles.length<MAX_PARTICLES && flowers.length>0){
            if(sceneTimer%3===0){
                const f=flowers[Math.floor(Math.random()*flowers.length)];
                let p = new Particle(f.x,f.y,'butterfly');
                p.flowerX = f.x; p.flowerY = f.y;
                particles.push(p);
                if(Math.random()>0.5){
                    let p2 = new Particle(f.x,f.y,'petal');
                    p2.flowerX = f.x; p2.flowerY = f.y;
                    particles.push(p2);
                }
            }
            if(sceneTimer%15===0)particles.push(new Particle(touchStartPos.x+(Math.random()-0.5)*500,touchStartPos.y+(Math.random()-0.5)*500,'firefly'));
        }
        if(sceneTimer>HOVER_DURATION){state='withering';sceneTimer=0;}
    }

    // Withering
    else if (state==='withering') {
        sceneTimer++;
        vinesAlpha=Math.max(0,vinesAlpha-0.015);
        if(vinesAlpha>0){
            canvasCtx.fillStyle=`rgba(0,12,5,${vinesAlpha*0.55})`;
            canvasCtx.fillRect(0,0,canvasElement.width,canvasElement.height);
            canvasCtx.globalAlpha=vinesAlpha;
            canvasCtx.drawImage(vineCanvas,0,0);
            flowers.forEach(f=>{
                if(f.scale>0) f.scale -= f.maxScale*0.02;
                if(f.scale<0) f.scale = 0;
                if(f.scale>0) f.draw(canvasCtx);
            });
            canvasCtx.globalAlpha=1;
        }
        if(sceneTimer>WITHER_DURATION){state='scattering';sceneTimer=0;}
    }

    // Scattering / Crowning
    else if (state==='scattering'||state==='crowning') {
        sceneTimer++;
        if(state==='scattering'&&sceneTimer>SCATTER_DURATION)state='crowning';
        
        if(vinesAlpha>0){
            vinesAlpha=Math.max(0,vinesAlpha-0.015);
            canvasCtx.fillStyle=`rgba(0,12,5,${vinesAlpha*0.55})`;
            canvasCtx.fillRect(0,0,canvasElement.width,canvasElement.height);
            canvasCtx.globalAlpha=vinesAlpha;
            canvasCtx.drawImage(vineCanvas,0,0);
            flowers.forEach(f=>{if(f.scale>0)f.draw(canvasCtx);});
            canvasCtx.globalAlpha=1;
        } else {
            if (!lastVideoFrame) {
               canvasCtx.fillStyle='rgba(0,0,0,1)';
               canvasCtx.fillRect(0,0,canvasElement.width,canvasElement.height);
            }
        }
    }

    // Particles & Tracking
    if (['hovering','withering','scattering','crowning'].includes(state)) {
        let hx=canvasElement.width/2,hy=canvasElement.height/3;
        let bx=canvasElement.width/2,by=canvasElement.height/2+100;
        let tilt=0,tracked=false;
        if(faceLandmarks&&faceLandmarks.length>0){
            const ht=getCanvasCoords(faceLandmarks[10].x,faceLandmarks[10].y);
            hx=ht.x;hy=ht.y-90;
            const ns=getCanvasCoords(faceLandmarks[1].x,faceLandmarks[1].y);
            bx=ns.x;by=ns.y+270;
            const le=getCanvasCoords(faceLandmarks[33].x,faceLandmarks[33].y);
            const re=getCanvasCoords(faceLandmarks[263].x,faceLandmarks[263].y);
            tilt=Math.atan2(re.y-le.y,re.x-le.x);tracked=true;
        }

        if(state==='crowning'&&tracked){
            const hp=(Math.sin(globalTime*0.05)+1)/2;
            canvasCtx.save();
            canvasCtx.translate(hx,hy); canvasCtx.rotate(tilt);
            canvasCtx.globalCompositeOperation='screen';
            canvasCtx.save(); canvasCtx.scale(1,0.35);
            const hg=canvasCtx.createRadialGradient(0,0,20,0,0,200);
            hg.addColorStop(0,`rgba(253,230,138,${0.45+hp*0.2})`);
            hg.addColorStop(0.35,`rgba(110,231,183,${0.15+hp*0.1})`);
            hg.addColorStop(0.7,`rgba(167,130,250,${0.05+hp*0.05})`);
            hg.addColorStop(1,'rgba(0,0,0,0)');
            canvasCtx.fillStyle=hg;
            canvasCtx.beginPath();canvasCtx.arc(0,0,200,0,Math.PI*2);canvasCtx.fill();
            canvasCtx.restore();
            canvasCtx.save(); canvasCtx.scale(1,0.3);
            canvasCtx.beginPath();canvasCtx.arc(0,0,120,0,Math.PI*2);
            canvasCtx.strokeStyle=`rgba(253,230,138,${0.3+hp*0.2})`;
            canvasCtx.lineWidth=2+hp*2;canvasCtx.shadowBlur=20*hp;canvasCtx.shadowColor='#fde68a';canvasCtx.stroke();
            canvasCtx.restore();
            canvasCtx.restore();
        }

        particles.sort((a,b)=>a.zDepth-b.zDepth);
        let md = 'head_crown', tx = hx, ty = hy;
        if (state==='hovering'||state==='withering') md='hover_flower';
        else if (state==='scattering') { md='body_orbit'; tx=bx; ty=by; }

        particles.forEach(p=>{p.update(tx,ty,md);p.draw(canvasCtx);});
    }

    if(['blooming','hovering','withering','scattering','crowning'].includes(state)) applyBloom();

    requestAnimationFrame(renderLoop);
}

// ── Camera init ──────────────────────────────────────────────
async function initCamera() {
    try {
        const fm=new FaceMesh({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`});
        fm.setOptions({maxNumFaces:1,refineLandmarks:false,minDetectionConfidence:0.5,minTrackingConfidence:0.6});
        fm.onResults(r=>{lastVideoFrame=r.image;faceLandmarks=r.multiFaceLandmarks?.[0]||null;});

        const hd=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
        hd.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
        hd.onResults(r=>handLandmarks=r.multiHandLandmarks?.[0]||null);

        const cam=new Camera(videoElement,{
            onFrame:async()=>{await fm.send({image:videoElement});await hd.send({image:videoElement});},
            width:640,height:480
        });
        await cam.start();

        document.getElementById('loading-spinner').style.display='none';
        statusText.style.display='none'; permissionText.style.display='none';
        instructionBox.classList.remove('hidden'); instructionBox.classList.add('flex');
        state='waiting';
        requestAnimationFrame(renderLoop);
    } catch(e) {
        statusText.innerHTML='Lỗi Camera<br><span style="font-size:16px;font-weight:normal">(Hãy cấp quyền Camera)</span>';
        statusText.classList.add('text-red-400');
        document.getElementById('loading-spinner').style.display='none';
    }
}

window.addEventListener('load', initCamera);
