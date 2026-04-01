export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.roadSpacing = 500;   // distance between road centre-lines
        this.roadHalfWidth = 50;  // half of road width (100 px road = 2 lanes)
        this.sidewalkWidth = 14;  // kerb/pavement strip

        this.buildings = [];
        this.trees = [];
        this.parkBlocks = new Set();

        // Beach starts at ~78 % of the world width
        this.beachStart = Math.floor(width * 0.78 / this.roadSpacing) * this.roadSpacing;

        this._rng = this._createRng(42); // deterministic RNG for stable world
        this._generateWorld();
    }

    // ─── deterministic LCG random number generator ───────────────────────────
    _createRng(seed) {
        let s = seed >>> 0;
        return () => {
            s = (Math.imul(1664525, s) + 1013904223) >>> 0;
            return s / 0xffffffff;
        };
    }

    // ─── world generation ─────────────────────────────────────────────────────
    _generateWorld() {
        const sp = this.roadSpacing;
        const zone = this.roadHalfWidth + this.sidewalkWidth; // clear-zone from road centre
        const blockSize = sp - zone * 2;                      // buildable square per block
        const gridW = Math.floor(this.width  / sp);
        const gridH = Math.floor(this.height / sp);

        // Mark random blocks as parks (6 % chance)
        for (let gx = 0; gx < gridW; gx++) {
            for (let gy = 0; gy < gridH; gy++) {
                if (this._rng() < 0.06) this.parkBlocks.add(`${gx},${gy}`);
            }
        }

        // Buildings & trees per block
        for (let gx = 0; gx < gridW; gx++) {
            for (let gy = 0; gy < gridH; gy++) {
                const bx = gx * sp + zone;
                const by = gy * sp + zone;

                if (gx * sp >= this.beachStart) continue; // ocean side

                if (this.parkBlocks.has(`${gx},${gy}`)) {
                    this._addParkTrees(bx, by, blockSize);
                } else {
                    this._generateBuildingsInBlock(bx, by, blockSize, gx, gy);
                }
            }
        }

        // Scatter palm trees along sidewalks
        this._addSidewalkTrees(gridW, gridH);
    }

    _addParkTrees(bx, by, blockSize) {
        const count = 5 + Math.floor(this._rng() * 7);
        for (let i = 0; i < count; i++) {
            this.trees.push({
                x: bx + this._rng() * blockSize,
                y: by + this._rng() * blockSize,
                r: 7 + this._rng() * 6
            });
        }
    }

    _addSidewalkTrees(gridW, gridH) {
        const sp = this.roadSpacing;
        const rhw = this.roadHalfWidth;
        const sw  = this.sidewalkWidth;
        for (let gx = 0; gx <= gridW; gx++) {
            for (let gy = 0; gy < gridH; gy++) {
                if (this._rng() < 0.35 && gx * sp < this.beachStart) {
                    const bz = sp - (rhw + sw) * 2;
                    this.trees.push({
                        x: gx * sp - rhw - sw * 0.5,
                        y: gy * sp + (rhw + sw) + this._rng() * bz,
                        r: 7
                    });
                }
            }
        }
        for (let gy = 0; gy <= gridH; gy++) {
            for (let gx = 0; gx < gridW; gx++) {
                if (this._rng() < 0.35 && gx * sp < this.beachStart) {
                    const bz = sp - (rhw + sw) * 2;
                    this.trees.push({
                        x: gx * sp + (rhw + sw) + this._rng() * bz,
                        y: gy * sp - rhw - sw * 0.5,
                        r: 7
                    });
                }
            }
        }
    }

    _generateBuildingsInBlock(bx, by, bs, gx, gy) {
        const r   = this._rng();
        const pad = 5;
        const color = () => this._buildingColor(gx, gy);

        if (r < 0.28) {
            // one large building
            this.buildings.push({ x: bx + pad, y: by + pad, width: bs - pad*2, height: bs - pad*2, color: color() });
        } else if (r < 0.58) {
            // two side-by-side
            if (this._rng() < 0.5) {
                const w1 = (bs - pad*3) * (0.42 + this._rng() * 0.16);
                const w2 = bs - pad*3 - w1;
                this.buildings.push({ x: bx+pad,       y: by+pad, width: w1, height: bs-pad*2, color: color() });
                this.buildings.push({ x: bx+pad*2+w1,  y: by+pad, width: w2, height: bs-pad*2, color: color() });
            } else {
                const h1 = (bs - pad*3) * (0.42 + this._rng() * 0.16);
                const h2 = bs - pad*3 - h1;
                this.buildings.push({ x: bx+pad, y: by+pad,       width: bs-pad*2, height: h1, color: color() });
                this.buildings.push({ x: bx+pad, y: by+pad*2+h1,  width: bs-pad*2, height: h2, color: color() });
            }
        } else {
            // four quadrant buildings
            const hw = (bs - pad*3) / 2;
            const hh = (bs - pad*3) / 2;
            for (let qi = 0; qi < 2; qi++) {
                for (let qj = 0; qj < 2; qj++) {
                    this.buildings.push({
                        x: bx + pad + qi*(hw+pad),
                        y: by + pad + qj*(hh+pad),
                        width: hw, height: hh,
                        color: color()
                    });
                }
            }
        }
    }

    _buildingColor(gx, gy) {
        const nx = gx / 12;
        const ny = gy / 12;
        // Downtown core (centre of map)
        if (nx > 0.3 && nx < 0.65 && ny > 0.3 && ny < 0.65) {
            return ['#c0392b','#8e44ad','#2980b9','#16a085','#d35400','#2c3e50'][Math.floor(this._rng()*6)];
        }
        // Vice City pink/neon district (NW)
        if (nx < 0.35 && ny < 0.35) {
            return ['#ff6b9d','#ff1493','#9b59b6','#c8a9e0','#f39c12'][Math.floor(this._rng()*5)];
        }
        // Industrial (SE)
        if (nx > 0.6 && ny > 0.6) {
            return ['#455a64','#607d8b','#546e7a','#37474f','#6d6d6d'][Math.floor(this._rng()*5)];
        }
        // Suburbs
        return ['#e74c3c','#f39c12','#27ae60','#3498db','#e67e22','#1abc9c','#95a5a6'][Math.floor(this._rng()*7)];
    }

    // ─── collision ────────────────────────────────────────────────────────────
    checkCollision(x, y, w, h) {
        const hw = w / 2, hh = h / 2;
        if (x-hw < 0 || y-hh < 0 || x+hw > this.width || y+hh > this.height) return true;
        const b = { x: x-hw, y: y-hh, width: w, height: h };
        for (const bldg of this.buildings) {
            if (b.x < bldg.x+bldg.width && b.x+b.width  > bldg.x &&
                b.y < bldg.y+bldg.height && b.y+b.height > bldg.y) return true;
        }
        return false;
    }

    // ─── rendering ───────────────────────────────────────────────────────────
    draw(ctx, camera) {
        const { x: cx, y: cy, width: cw, height: ch } = camera;
        const vl = cx - cw/2, vt = cy - ch/2;
        const vr = cx + cw/2, vb = cy + ch/2;

        const sp  = this.roadSpacing;
        const rhw = this.roadHalfWidth;
        const sw  = this.sidewalkWidth;

        const sgx = Math.max(0, Math.floor(vl / sp) - 1);
        const egx = Math.min(Math.ceil(this.width  / sp) + 1, Math.ceil(vr / sp) + 1);
        const sgy = Math.max(0, Math.floor(vt / sp) - 1);
        const egy = Math.min(Math.ceil(this.height / sp) + 1, Math.ceil(vb / sp) + 1);

        // ── 1. ground base ─────────────────────────────────────────────────
        ctx.fillStyle = '#c4b99a'; // warm urban concrete
        ctx.fillRect(0, 0, this.width, this.height);

        // Beach / ocean on the right
        if (this.beachStart < this.width) {
            ctx.fillStyle = '#3a8ec2';
            ctx.fillRect(this.beachStart + sp*0.55, 0, this.width, this.height);
            ctx.fillStyle = '#f4d884';
            ctx.fillRect(this.beachStart - sp*0.08, 0, sp*0.63, this.height);
        }

        // ── 2. block interiors (concrete / park) ───────────────────────────
        for (let gx = sgx; gx < egx; gx++) {
            for (let gy = sgy; gy < egy; gy++) {
                if (gx * sp >= this.beachStart) continue;
                const bx = gx*sp + rhw + sw;
                const by = gy*sp + rhw + sw;
                const bw = sp - (rhw+sw)*2;
                const bh = sp - (rhw+sw)*2;
                ctx.fillStyle = this.parkBlocks.has(`${gx},${gy}`) ? '#3a7a33' : '#cfc4ae';
                ctx.fillRect(bx, by, bw, bh);
            }
        }

        // ── 3. roads ──────────────────────────────────────────────────────
        ctx.fillStyle = '#3e3e3e';
        for (let gy = sgy-1; gy <= egy; gy++) {
            const ry = gy * sp;
            if (ry + rhw < 0 || ry - rhw > this.height) continue;
            ctx.fillRect(0, ry - rhw, this.width, rhw*2);
        }
        for (let gx = sgx-1; gx <= egx; gx++) {
            const rx = gx * sp;
            if (rx + rhw < 0 || rx - rhw > this.width) continue;
            ctx.fillRect(rx - rhw, 0, rhw*2, this.height);
        }

        // ── 4. sidewalks ──────────────────────────────────────────────────
        ctx.fillStyle = '#888';
        for (let gy = sgy-1; gy <= egy; gy++) {
            const ry = gy * sp;
            ctx.fillRect(0, ry - rhw - sw, this.width, sw);
            ctx.fillRect(0, ry + rhw,      this.width, sw);
        }
        for (let gx = sgx-1; gx <= egx; gx++) {
            const rx = gx * sp;
            ctx.fillRect(rx - rhw - sw, 0, sw, this.height);
            ctx.fillRect(rx + rhw,      0, sw, this.height);
        }

        // ── 5. lane markings ──────────────────────────────────────────────
        this._drawLaneMarkings(ctx, vl, vt, vr, vb, sgx, egx, sgy, egy);

        // ── 6. buildings ──────────────────────────────────────────────────
        for (const bldg of this.buildings) {
            if (bldg.x+bldg.width < vl || bldg.x > vr ||
                bldg.y+bldg.height < vt || bldg.y > vb) continue;
            this._drawBuilding(ctx, bldg);
        }

        // ── 7. trees ──────────────────────────────────────────────────────
        for (const tree of this.trees) {
            if (tree.x < vl-20 || tree.x > vr+20 ||
                tree.y < vt-20 || tree.y > vb+20) continue;
            this._drawTree(ctx, tree);
        }
    }

    _drawLaneMarkings(ctx, vl, vt, vr, vb, sgx, egx, sgy, egy) {
        const sp  = this.roadSpacing;
        const rhw = this.roadHalfWidth;

        // Dashed yellow centre-lines
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.setLineDash([22, 18]);

        for (let gy = sgy-1; gy <= egy; gy++) {
            const ry = gy * sp;
            ctx.beginPath();
            ctx.moveTo(Math.max(0, vl), ry);
            ctx.lineTo(Math.min(this.width, vr), ry);
            ctx.stroke();
        }
        for (let gx = sgx-1; gx <= egx; gx++) {
            const rx = gx * sp;
            ctx.beginPath();
            ctx.moveTo(rx, Math.max(0, vt));
            ctx.lineTo(rx, Math.min(this.height, vb));
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // White edge lines at road edges
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        for (let gy = sgy-1; gy <= egy; gy++) {
            const ry = gy * sp;
            for (const off of [-rhw+3, rhw-3]) {
                ctx.beginPath();
                ctx.moveTo(Math.max(0,vl), ry+off);
                ctx.lineTo(Math.min(this.width,vr), ry+off);
                ctx.stroke();
            }
        }
        for (let gx = sgx-1; gx <= egx; gx++) {
            const rx = gx * sp;
            for (const off of [-rhw+3, rhw-3]) {
                ctx.beginPath();
                ctx.moveTo(rx+off, Math.max(0,vt));
                ctx.lineTo(rx+off, Math.min(this.height,vb));
                ctx.stroke();
            }
        }

        // Zebra crossings at each intersection
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        const stripeW = 8, stripeH = rhw - 4, stripes = 5;
        for (let gy = sgy-1; gy <= egy; gy++) {
            for (let gx = sgx-1; gx <= egx; gx++) {
                const rx = gx * sp, ry = gy * sp;
                // N/S crossing
                for (let s = 0; s < stripes; s++) {
                    const ox = -rhw + 4 + s * ((rhw*2-8) / stripes);
                    ctx.fillRect(rx+ox,          ry+rhw,     stripeW, 10);
                    ctx.fillRect(rx+ox,          ry-rhw-10,  stripeW, 10);
                }
                // E/W crossing
                for (let s = 0; s < stripes; s++) {
                    const oy = -rhw + 4 + s * ((rhw*2-8) / stripes);
                    ctx.fillRect(rx+rhw,     ry+oy,          10, stripeW);
                    ctx.fillRect(rx-rhw-10,  ry+oy,          10, stripeW);
                }
            }
        }
    }

    _drawBuilding(ctx, bldg) {
        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(bldg.x+4, bldg.y+4, bldg.width, bldg.height);

        // Main body
        ctx.fillStyle = bldg.color;
        ctx.fillRect(bldg.x, bldg.y, bldg.width, bldg.height);

        // Roof highlight (lighter inner face)
        ctx.fillStyle = this._lighten(bldg.color, 30);
        ctx.fillRect(bldg.x+4, bldg.y+4, bldg.width-8, bldg.height-8);

        // Outline
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bldg.x, bldg.y, bldg.width, bldg.height);

        // Windows – deterministic pattern based on position
        const wSz = 5, wSp = 13;
        ctx.fillStyle = '#ffd54f';
        for (let wx = bldg.x + 9; wx < bldg.x + bldg.width - 6; wx += wSp) {
            for (let wy = bldg.y + 9; wy < bldg.y + bldg.height - 6; wy += wSp) {
                if (((wx * 17 + wy * 31) & 3) !== 0) ctx.fillRect(wx, wy, wSz, wSz);
            }
        }
    }

    _drawTree(ctx, tree) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(tree.x+3, tree.y+4, tree.r, tree.r*0.65, 0, 0, Math.PI*2);
        ctx.fill();
        // Canopy
        ctx.fillStyle = '#1e8449';
        ctx.beginPath();
        ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI*2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(tree.x-tree.r*0.28, tree.y-tree.r*0.28, tree.r*0.48, 0, Math.PI*2);
        ctx.fill();
    }

    _lighten(hex, amt) {
        const n = parseInt(hex.slice(1), 16);
        const r = Math.min(255, (n >> 16)        + amt);
        const g = Math.min(255, ((n >> 8) & 0xff) + amt);
        const b = Math.min(255, (n & 0xff)        + amt);
        return `rgb(${r},${g},${b})`;
    }
}
