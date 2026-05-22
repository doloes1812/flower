function drawSphere3D(ctx, x, y, r, hue, sat, lit, alpha) {
    const lx = x - r * 0.35, ly = y - r * 0.35;
    const g  = ctx.createRadialGradient(lx, ly, r * 0.05, x, y, r);
    g.addColorStop(0,    `hsla(${hue},${sat}%,${Math.min(lit+30,95)}%,${alpha})`);
    g.addColorStop(0.45, `hsla(${hue},${sat}%,${lit}%,${alpha})`);
    g.addColorStop(1,    `hsla(${hue},${sat}%,${Math.max(lit-25,5)}%,${alpha})`);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = g; ctx.fill();
    const sg = ctx.createRadialGradient(lx, ly, 0, lx, ly, r*0.5);
    sg.addColorStop(0, `rgba(255,255,255,${alpha*0.7})`);
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fill();
}

// ── CLASS: Spark ────────────────────────────────────────────
class Spark {
    constructor(x, y) {
        this.x    = x + (Math.random()-0.5)*25;
        this.y    = y + (Math.random()-0.5)*25;
        this.vx   = (Math.random()-0.5)*5;
        this.vy   = (Math.random()-0.5)*5 - 2.5;
        this.life = 1.0;
        this.hue  = Math.random() > 0.5 ? 160 : 50;
        this.size = Math.random()*3 + 1.5;
        this.trail= [];
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();
        this.x  += this.vx; this.y += this.vy;
        this.vy -= 0.08; this.vx *= 0.97;
        this.life -= 0.018;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        if (this.trail.length > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            this.trail.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = `hsla(${this.hue},90%,70%,${this.life*0.5})`;
            ctx.lineWidth = this.size*0.8; ctx.lineCap='round'; ctx.stroke();
            ctx.restore();
        }
        drawSphere3D(ctx, this.x, this.y, this.size, this.hue, 90, 70, this.life);
        ctx.save();
        ctx.globalAlpha = this.life*0.4;
        ctx.shadowBlur  = 15; ctx.shadowColor = `hsl(${this.hue},90%,60%)`;
        ctx.fillStyle   = `hsl(${this.hue},90%,75%)`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size*2.5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

// ── CLASS: Flower3D ─────────────────────────────────────────
class Flower3D {
    constructor(x, y, maxScale) {
        this.x = x; this.y = y; this.scale = 0;
        this.maxScale = maxScale + Math.random()*5;
        const type = Math.floor(Math.random()*4);
        this.petalHue = [330,45,270,25][type];
        this.petalSat = [85,90,75,90][type];
        this.centerHue= [50,40,50,50][type];
        this.petals   = Math.floor(Math.random()*2)+5;
        this.rotation = Math.random()*Math.PI;
        this.tiltX    = (Math.random()-0.5)*0.8;
        this.tiltY    = (Math.random()-0.5)*0.6;
    }
    draw(ctx) {
        if (this.scale <= 0.01) return;
        const s = this.scale;
        ctx.save();
        ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        ctx.scale(s*(1-Math.abs(this.tiltY)*0.3), s*(1-Math.abs(this.tiltX)*0.4));

        // Bóng đổ
        ctx.save();
        ctx.translate(s*1.5, s*2); ctx.scale(1,0.5); ctx.globalAlpha=0.13;
        ctx.fillStyle='#001a0a';
        for (let i=0;i<this.petals;i++) {
            ctx.rotate(Math.PI*2/this.petals);
            ctx.beginPath(); ctx.moveTo(0,0);
            ctx.bezierCurveTo(7,4,7,14,0,17);
            ctx.bezierCurveTo(-7,14,-7,4,0,0); ctx.fill();
        }
        ctx.restore();

        // Cánh hoa với shading theo ánh sáng
        for (let i=0;i<this.petals;i++) {
            ctx.rotate(Math.PI*2/this.petals);
            const pAngle = this.rotation + (i/this.petals)*Math.PI*2;
            const ld = Math.cos(pAngle)*0.5+0.5;
            const lb = 65+ld*20, le = 50+ld*15;
            const g  = ctx.createRadialGradient(0,4,0, 0,8,20);
            g.addColorStop(0,   `hsl(${this.petalHue+10},${this.petalSat}%,${lb+15}%)`);
            g.addColorStop(0.5, `hsl(${this.petalHue},   ${this.petalSat}%,${lb}%)`);
            g.addColorStop(1,   `hsl(${this.petalHue-15},${this.petalSat-10}%,${le}%)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(0,0);
            ctx.bezierCurveTo(8,4,8,15,0,19);
            ctx.bezierCurveTo(-8,15,-8,4,0,0); ctx.fill();
            // Gân
            ctx.beginPath(); ctx.moveTo(0,1); ctx.quadraticCurveTo(0,9,0,18);
            ctx.strokeStyle=`rgba(255,255,255,${0.1+ld*0.12})`; ctx.lineWidth=0.8; ctx.stroke();
        }

        // Nhụy
        const cg = ctx.createRadialGradient(-1.5,-1.5,0.2, 0,0,5);
        cg.addColorStop(0, `hsl(${this.centerHue},95%,90%)`);
        cg.addColorStop(0.4,`hsl(${this.centerHue},90%,65%)`);
        cg.addColorStop(1, `hsl(${this.centerHue-20},80%,40%)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
        for (let j=0;j<6;j++) {
            const a = (j/6)*Math.PI*2;
            ctx.beginPath(); ctx.arc(Math.cos(a)*3.5, Math.sin(a)*2.5, 1, 0, Math.PI*2);
            ctx.fillStyle=`hsl(${this.centerHue+30},95%,80%)`; ctx.fill();
        }
        ctx.restore();
    }
}

// ── CLASS: Particle ─────────────────────────────────────────
class Particle {
    constructor(x, y, type) {
        this.x=x; this.y=y;
        this.vx=(Math.random()-0.5)*2.5;
        this.vy=(Math.random()-0.5)*2.5-0.5;
        this.type=type; this.size=Math.random()*4+2;
        this.timeOffset=Math.random()*100;
        if (type==='petal') {
            this.hue=Math.random()*50+310; this.size=Math.random()*5+3;
            this.tilt=Math.random()*Math.PI; this.tiltSpeed=(Math.random()-0.5)*0.03;
        } else if (type==='firefly') {
            this.hue=Math.random()>0.5?150:55; this.size=Math.random()*2.5+1;
            this.pulseOffset=Math.random()*Math.PI*2;
        } else { // butterfly
            this.hue=[210,320,170,30][Math.floor(Math.random()*4)];
            this.size=Math.random()*7+6; this.flapPhase=Math.random()*Math.PI*2;
        }
        this.targetAngleOffset=Math.random()*Math.PI*2;
        this.orbitRadius=(Math.random()*80-40);
        this.verticalOffset=(Math.random()-0.5)*600;
        this.zDepth=0; this.history=[];
    }

    update(tx, ty, mode) {
        let rX, rY, ang;
        if (mode==='body_orbit') {
            rX=260+this.orbitRadius; rY=110+this.orbitRadius*0.5;
            ang=this.targetAngleOffset+globalTime*0.005;
            if (this.type==='butterfly') this.verticalOffset+=Math.sin(globalTime*0.05+this.timeOffset)*0.6;
            if (this.type==='petal') this.tilt+=this.tiltSpeed;
            this.vx*=0.96; this.vy*=0.96;
        } else if (mode==='hover_flower') {
            rX=35+this.orbitRadius*0.2; rY=15+this.orbitRadius*0.1;
            ang=this.targetAngleOffset+globalTime*0.02;
            if (this.type==='butterfly') this.verticalOffset = -50 + Math.sin(globalTime*0.05+this.timeOffset)*5;
            if (this.type==='petal') this.tilt+=this.tiltSpeed;
            this.vx*=0.88; this.vy*=0.88;
        } else {
            this.verticalOffset*=0.97;
            rX=110+this.orbitRadius*0.3; rY=35+this.orbitRadius*0.12;
            ang=this.targetAngleOffset+globalTime*0.009;
            if (this.type==='petal') this.tilt+=this.tiltSpeed;
            this.vx*=0.92; this.vy*=0.92;
        }
        this.zDepth=Math.sin(ang);

        let destX, destY, force;
        if (mode === 'hover_flower') {
            destX = (this.flowerX || tx) + Math.cos(ang)*rX;
            destY = (this.flowerY || ty) + Math.sin(ang)*rY + this.verticalOffset;
            force = 0.05;
        } else {
            destX = tx + Math.cos(ang)*rX;
            destY = ty + Math.sin(ang)*rY + this.verticalOffset;
            force = mode==='body_orbit'?0.005:0.02;
        }
        
        this.vx+=(destX-this.x)*force;
        this.vy+=(destY-this.y)*force;
        this.x+=this.vx; this.y+=this.vy;
        if (this.type==='firefly') {
            this.history.push({x:this.x,y:this.y});
            if (this.history.length>15) this.history.shift();
        }
    }

    draw(ctx) {
        const ds=(this.zDepth+1.5)/2.5;
        const da=this.zDepth<0?0.35:1.0;

        if (this.type==='firefly') {
            if (this.history.length>2) {
                ctx.save();
                for (let i=1;i<this.history.length;i++) {
                    const t=i/this.history.length;
                    ctx.beginPath();
                    ctx.moveTo(this.history[i-1].x,this.history[i-1].y);
                    ctx.lineTo(this.history[i].x,  this.history[i].y);
                    ctx.strokeStyle=`hsla(${this.hue},90%,70%,${t*da*0.4})`;
                    ctx.lineWidth=this.size*t*1.5; ctx.lineCap='round'; ctx.stroke();
                }
                ctx.restore();
            }
            const pulse=(Math.sin(globalTime*0.12+this.pulseOffset)+1)/2;
            ctx.save(); ctx.translate(this.x,this.y); ctx.scale(ds,ds); ctx.globalAlpha=da;
            [[this.size*6,.04+pulse*.04],[this.size*3,.15+pulse*.1],[this.size*1.5,.4+pulse*.2],[this.size*.6,.9+pulse*.1]].forEach(([r,a])=>{
                const g=ctx.createRadialGradient(0,0,0,0,0,r);
                g.addColorStop(0,`hsla(${this.hue},90%,80%,${a})`);
                g.addColorStop(1,`hsla(${this.hue},90%,70%,0)`);
                ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
            });
            drawSphere3D(ctx,0,0,this.size*0.5,this.hue,85,90,pulse*.8+.2);
            ctx.restore();

        } else if (this.type==='butterfly') {
            ctx.save(); ctx.translate(this.x,this.y); ctx.scale(ds,ds); ctx.globalAlpha=da;
            ctx.rotate(Math.atan2(this.vy,this.vx)+Math.PI/2);
            const flap=Math.sin(globalTime*0.28+this.flapPhase);
            const flapAbs=Math.abs(flap);
            const h=this.hue, s=75;

            // Cánh sau
            ctx.save(); ctx.scale(1,flapAbs*0.8+0.2);
            [[- this.size*.7, this.size*0.4, 1.2, 1.1,-2],[this.size*.7, this.size*0.4, 1.2, 1.1, 2]].forEach(([bx,by,rw,rh,flip])=>{
                const hg=ctx.createRadialGradient(flip*2,5,0,bx,by,this.size*1.1);
                hg.addColorStop(0,`hsla(${h+20},${s}%,55%,.85)`);
                hg.addColorStop(1,`hsla(${h-10},${s-10}%,30%,.6)`);
                ctx.fillStyle=hg;
                ctx.beginPath(); ctx.moveTo(flip,2);
                ctx.bezierCurveTo(flip*this.size*1.2,this.size*0.2,flip*this.size*1.4,this.size*1.4,flip*this.size*0.4,this.size*1.5);
                ctx.bezierCurveTo(flip*this.size*0.1,this.size*1.5,0,this.size*1.0,flip,2);
                ctx.fill();
            });
            ctx.restore();

            // Cánh trước
            ctx.save(); ctx.scale(flapAbs*0.9+0.1,1);
            [-1,1].forEach(flip=>{
                const wg=ctx.createLinearGradient(flip*this.size*0.2,-this.size,flip*this.size*1.5,this.size*0.5);
                wg.addColorStop(0,`hsla(${h+30},${s+10}%,75%,.9)`);
                wg.addColorStop(0.5,`hsla(${h},${s}%,55%,.85)`);
                wg.addColorStop(1,`hsla(${h-20},${s-15}%,35%,.7)`);
                ctx.fillStyle=wg;
                ctx.beginPath(); ctx.moveTo(flip,0);
                ctx.bezierCurveTo(flip*this.size*0.8,-this.size*1.8,flip*this.size*1.8,-this.size*0.8,flip*this.size*1.5,this.size*0.5);
                ctx.bezierCurveTo(flip*this.size*1.2,this.size*1.0,flip*this.size*0.2,this.size*0.5,flip,0);
                ctx.fill();
            });
            // Chấm họa tiết
            [-this.size*0.7,-this.size*0.6, this.size*.18,
             -this.size*1.1, this.size*0.1, this.size*.12,
              this.size*0.7,-this.size*0.6, this.size*.18,
              this.size*1.1, this.size*0.1, this.size*.12].reduce((a,_,i,arr)=>{
                if(i%3===0){
                    ctx.beginPath(); ctx.arc(arr[i],arr[i+1],arr[i+2],0,Math.PI*2);
                    ctx.fillStyle=`hsla(${h-30},50%,20%,.6)`; ctx.fill();
                    ctx.beginPath(); ctx.arc(arr[i],arr[i+1],arr[i+2]*0.5,0,Math.PI*2);
                    ctx.fillStyle=`hsla(${h+50},80%,85%,.8)`; ctx.fill();
                }
            }, null);
            ctx.restore();

            // Thân + râu
            const bg=ctx.createLinearGradient(-1,-this.size*.6,1,this.size*1.2);
            bg.addColorStop(0,`hsl(${h-30},40%,25%)`); bg.addColorStop(1,`hsl(${h-30},40%,12%)`);
            ctx.fillStyle=bg;
            ctx.beginPath(); ctx.ellipse(0,this.size*0.3,2,this.size*0.85,0,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=`hsl(${h-30},40%,30%)`; ctx.lineWidth=0.8;
            [[-1,-1],[1,1]].forEach(([sx,ex])=>{
                ctx.beginPath(); ctx.moveTo(0,-this.size*0.5);
                ctx.quadraticCurveTo(sx*this.size*0.8,-this.size*1.6,ex*this.size*0.6,-this.size*2.0); ctx.stroke();
                ctx.beginPath(); ctx.arc(ex*this.size*0.6,-this.size*2.0,1.5,0,Math.PI*2);
                ctx.fillStyle=`hsl(${h-30},50%,35%)`; ctx.fill();
            });
            ctx.restore();

        } else { // petal
            const ts=Math.abs(Math.cos(this.tilt));
            ctx.save(); ctx.translate(this.x,this.y); ctx.scale(ds,ds); ctx.globalAlpha=da*0.85;
            ctx.rotate(globalTime*0.04+this.timeOffset);
            ctx.scale(1, ts*0.6+0.4);
            const pg=ctx.createRadialGradient(0,0,0,0,0,this.size);
            pg.addColorStop(0,  `hsla(${this.hue+15},90%,90%,1)`);
            pg.addColorStop(0.5,`hsla(${this.hue},   85%,75%,.9)`);
            pg.addColorStop(1,  `hsla(${this.hue-20},80%,55%,.7)`);
            ctx.fillStyle=pg;
            ctx.beginPath(); ctx.moveTo(0,-this.size*0.5);
            ctx.bezierCurveTo(this.size*0.7,-this.size*0.5,this.size*0.8,this.size*0.5,0,this.size);
            ctx.bezierCurveTo(-this.size*0.8,this.size*0.5,-this.size*0.7,-this.size*0.5,0,-this.size*0.5);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ── CLASS: Shockwave ────────────────────────────────────────
class Shockwave {
    constructor(x, y) { this.x=x; this.y=y; this.r=10; this.a=1.0; this.spd=18; }
    update() { this.r+=this.spd; this.spd*=0.93; this.a-=0.018; }
    draw(ctx) {
        if (this.a<=0) return;
        ctx.save();
        [[this.r,`rgba(110,231,183,${this.a})`,4+this.a*6,'#34d399'],
         [this.r*0.8,`rgba(253,230,138,${this.a*0.5})`,2,'#fde68a'],
         [this.r*0.6,`rgba(167,243,208,${this.a*0.25})`,1.5,'#6ee7b7']].forEach(([rad,col,lw,shd])=>{
            ctx.beginPath(); ctx.arc(this.x,this.y,rad,0,Math.PI*2);
            ctx.strokeStyle=col; ctx.lineWidth=lw;
            ctx.shadowBlur=20*this.a; ctx.shadowColor=shd; ctx.stroke();
        });
        ctx.restore();
    }
}
