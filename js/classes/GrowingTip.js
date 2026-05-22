// ── CLASS: GrowingTip (rễ cây ngoằng nghèo, hoạt dứt khoát) ───────
class GrowingTip {
    constructor(x, y, angle, size, generation) {
        this.x = x; this.y = y; this.angle = angle;
        this.size = size; this.generation = generation; this.active = true;
        this.hue      = 100 + Math.random() * 30;
        this.colorLit = 25  + Math.random() * 15;
    }

    // Noise phục vụ cho glow đầu chóp
    noise(x) {
        return Math.sin(x*1.9)*0.50 + Math.sin(x*4.3)*0.30 + Math.sin(x*9.1)*0.20;
    }

    update(ctx) {
        if (!this.active) return;
        const oldX = this.x, oldY = this.y;

        // Gốc giao điện: thay đổi góc ngẫu nhiên thô mỗi frame
        // Tạo đường ngoằng nghèo, gảy khúc tự nhiên
        this.angle += (Math.random() - 0.5) * 0.72;

        const speed = VINE_GROWTH_SPEED * (1 - this.generation * 0.07);
        this.x += Math.cos(this.angle) * speed;
        this.y += Math.sin(this.angle) * speed;
        // Chết chậm hơn → rễ đi xa hơn
        this.size -= this.generation===0 ? 0.012 : 0.022 + this.generation*0.008;

        if (this.size < 0.4) {
            this.active = false;
            // Giảm hoa 20%: 20% → 16%
            if (Math.random() > 0.92) flowers.push(new Flower3D(this.x, this.y, 2.5+Math.random()*3.5));
            return;
        }

        const dx = this.x-oldX, dy = this.y-oldY;
        const len= Math.hypot(dx,dy);
        if (len < 0.01) return;

        const perpX = -dy/len, perpY = dx/len;
        const r     = this.size * 0.5;

        // Gradient trụ tròn
        const sg = vineCtx.createLinearGradient(
            oldX+perpX*r, oldY+perpY*r,
            oldX-perpX*r, oldY-perpY*r
        );
        sg.addColorStop(0,    `hsl(${this.hue+8},  ${65}%, ${this.colorLit+22}%)`);
        sg.addColorStop(0.22, `hsl(${this.hue+3},  ${68}%, ${this.colorLit+10}%)`);
        sg.addColorStop(0.5,  `hsl(${this.hue},    ${70}%, ${this.colorLit}%)`);
        sg.addColorStop(0.78, `hsl(${this.hue-3},  ${72}%, ${Math.max(this.colorLit-9,3)}%)`);
        sg.addColorStop(1,    `hsl(${this.hue-6},  ${68}%, ${Math.max(this.colorLit-16,2)}%)`);

        vineCtx.beginPath();
        vineCtx.moveTo(oldX, oldY); vineCtx.lineTo(this.x, this.y);
        vineCtx.strokeStyle = sg; vineCtx.lineWidth = this.size;
        vineCtx.lineCap = 'round'; vineCtx.lineJoin = 'round';
        vineCtx.stroke();

        // Specular highlight
        if (r > 2) {
            const hl = vineCtx.createLinearGradient(
                oldX+perpX*r*0.28, oldY+perpY*r*0.28,
                oldX+perpX*r*0.7,  oldY+perpY*r*0.7
            );
            const ha = Math.max(0.04, 0.15-this.generation*0.025);
            hl.addColorStop(0, `rgba(220,255,220,${ha})`);
            hl.addColorStop(1, 'rgba(220,255,220,0)');
            vineCtx.beginPath();
            vineCtx.moveTo(oldX+perpX*r*0.28, oldY+perpY*r*0.28);
            vineCtx.lineTo(this.x+perpX*r*0.28, this.y+perpY*r*0.28);
            vineCtx.strokeStyle = hl; vineCtx.lineWidth = r*0.6; vineCtx.lineCap='round';
            vineCtx.stroke();
        }

        // Glow đầu chóp
        ctx.save();
        const ga = Math.min(1, this.size/6);
        const gg = ctx.createRadialGradient(this.x,this.y,0, this.x,this.y,this.size*2.5);
        gg.addColorStop(0,   `rgba(167,243,208,${ga*0.9})`);
        gg.addColorStop(0.4, `rgba(52,211,153,${ga*0.35})`);
        gg.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.size*2.5,0,Math.PI*2); ctx.fill();
        ctx.restore();

        if (Math.random() < 0.08 && this.size < 7)
            this.drawLeaf3D(this.x, this.y, this.angle+(Math.random()>0.5?1.1:-1.1), this.size*1.8);

        // Phân nhánh: góc rộng hơn nhiều, tạo cảm giác rễ toả ra
        if (Math.random() < VINE_SPLIT_CHANCE && this.generation < MAX_GENERATIONS) {
            const side = Math.random() > 0.5 ? 1 : -1;
            // Góc nhánh: 40°–120° → lan tỏa rộng như rễ thật
            const branchAngle = this.angle + side * (0.7 + Math.random() * 1.4);
            const bSz = this.size * (0.48 + Math.random() * 0.28);
            growingTips.push(new GrowingTip(this.x, this.y, branchAngle, bSz, this.generation + 1));
            // Giảm hoa 20%: 15% → 12%
            if (Math.random() > 0.94) flowers.push(new Flower3D(this.x, this.y, bSz*1.3));

            // Nhánh thứ 2 — xác suất cao hơn để rễ dày
            if (Math.random() > 0.65) {
                const b2Angle = this.angle - side * (0.4 + Math.random() * 0.9);
                growingTips.push(new GrowingTip(this.x, this.y, b2Angle,
                    bSz * 0.70, this.generation + 1));
            }
        }
    }

    drawLeaf3D(lx, ly, lAngle, lSize) {
        if (lSize < 1.5) return;
        vineCtx.save();
        vineCtx.translate(lx, ly); vineCtx.rotate(lAngle);

        vineCtx.beginPath(); vineCtx.moveTo(0,0);
        vineCtx.quadraticCurveTo(lSize*0.25, lSize*0.07, lSize*0.5, 0);
        vineCtx.strokeStyle = `hsl(${this.hue-10},55%,18%)`;
        vineCtx.lineWidth = Math.max(0.5, lSize*0.09); vineCtx.stroke();

        vineCtx.translate(lSize*0.5, 0);
        const ll = lSize*2.1, lh = lSize*0.85;

        const lg = vineCtx.createLinearGradient(0,-lh, ll*0.55, lh*0.8);
        lg.addColorStop(0,   `hsl(${this.hue+25},75%,${this.colorLit+20}%)`);
        lg.addColorStop(0.4, `hsl(${this.hue+10},70%,${this.colorLit+10}%)`);
        lg.addColorStop(1,   `hsl(${this.hue-5}, 65%,${Math.max(this.colorLit-5,8)}%)`);

        vineCtx.fillStyle = lg;
        vineCtx.beginPath(); vineCtx.moveTo(0,0);
        vineCtx.bezierCurveTo(lSize*0.55,-lh,   lSize*1.5,-lh*0.85, ll,0);
        vineCtx.bezierCurveTo(lSize*1.5,  lh*0.85,lSize*0.55, lh,   0,0);
        vineCtx.fill();

        vineCtx.strokeStyle = `hsla(${this.hue+30},70%,55%,0.35)`;
        vineCtx.lineWidth = 0.6; vineCtx.stroke();

        vineCtx.beginPath(); vineCtx.moveTo(0,0);
        vineCtx.quadraticCurveTo(ll*0.5, 0, ll, 0);
        vineCtx.strokeStyle = `hsla(${this.hue+35},65%,60%,0.45)`;
        vineCtx.lineWidth = 0.5; vineCtx.stroke();

        vineCtx.restore();
    }
}
