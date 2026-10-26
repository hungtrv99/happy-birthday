import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const CONF_COLORS = [0xff9eb4, 0xffd0dc, 0xffffff, 0xff7a96, 0xffc2d0, 0xffe8ee];
const SKY = 0xffc8d6;
const NIGHT = 0x3a2418;

export class BirthdayScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.pointer = new THREE.Vector2(0, 0);
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.mobile = window.innerWidth < 720;
    this.confetti = [];
    this.flames = [];
    this.orbs = [];
    this.hearts = [];
    this.spinY = 0;
    this.spinVel = 0.35;
    this.dragging = false;
    this.dragMoved = false;
    this.lastX = 0;
    this.lastY = 0;
    this.lastTap = 0;
    this.blown = true;
    this.candlesLit = false;
    this.tiltX = 0;
    this.ready = false;
    this.revealT = 0;
    this.cakeScale = 0.6955;
    this.punch = 1;
    this.idleSpin = 0.03;
    this.ageLabel = null;
    this.cakeTopY = 1.22;
    this.darkT = 0;
    this._skyDay = new THREE.Color(SKY);
    this._skyNight = new THREE.Color(NIGHT);
    this._skyNow = new THREE.Color(SKY);
    this._lightPos = new THREE.Vector3();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(SKY, 14, 42);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    this.syncCameraRig();
    this.camera.position.set(0, this.camBaseY, this.camBaseZ);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.mobile,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 1.8));
    this.renderer.setClearColor(SKY, 1);
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1.17;

    this.addLights();
    this.addSparkles();
    this.addFloor();
    this.cake = this.createCake();
    this.cake.visible = false;
    this.cake.scale.setScalar(0.01);
    this.scene.add(this.cake);
    this.addConfetti();
    this.confettiMesh.visible = false;
    this.addOrbs();
    this.addHearts();
    this.addComposer();
    this.bindInput();

    this.onResize();
    window.addEventListener("resize", () => this.onResize());
  }

  syncCameraRig() {
    this.mobile = window.innerWidth < 720;
    this.camBaseY = this.mobile ? 2.95 : 2.35;
    this.camBaseZ = this.mobile ? 9.2 : 6.2;
    this.lookY = this.mobile ? 0.12 : 0.28;
    this.cakeScale = 0.6955;
  }

  cream(color, extra = {}) {
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.64,
      metalness: 0,
      clearcoat: 0.03,
      clearcoatRoughness: 0.8,
      sheen: 0.22,
      sheenRoughness: 0.62,
      sheenColor: new THREE.Color(0xffe8ee),
      ...extra,
    });
  }

  addLights() {
    this.hemi = new THREE.HemisphereLight(0xfff6f9, 0xf7b8c6, 1.22);
    this.scene.add(this.hemi);

    this.key = new THREE.DirectionalLight(0xfff7fb, 1.02);
    this.key.position.set(3.2, 7.2, 4.2);
    this.scene.add(this.key);

    this.fill = new THREE.DirectionalLight(0xffd0dc, 0.58);
    this.fill.position.set(-4, 3, -2);
    this.scene.add(this.fill);

    this.lift = new THREE.DirectionalLight(0xfff4f7, 0.38);
    this.lift.position.set(-1.2, 5.4, 6.2);
    this.scene.add(this.lift);

    this.candleLight = new THREE.PointLight(0xffc56a, 0.85, 8, 2);
    this.candleLight.position.set(0, 2.1, 0.4);
    this.scene.add(this.candleLight);

    this.candleFill = new THREE.PointLight(0xff9a32, 0, 4.5, 1.6);
    this.scene.add(this.candleFill);
  }

  addSparkles() {
    const count = this.mobile ? 500 : 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color(0xfff5f8), new THREE.Color(0xffc0d0), new THREE.Color(0xffe0e8)];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = Math.random() * 10 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      })
    );
    this.scene.add(this.stars);
  }

  addFloor() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    g.addColorStop(0, "rgba(176, 88, 110, 0.34)");
    g.addColorStop(0.28, "rgba(214, 132, 154, 0.18)");
    g.addColorStop(0.62, "rgba(255, 176, 196, 0.07)");
    g.addColorStop(1, "rgba(255, 176, 196, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(5.8, 64),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.62;
    this.scene.add(floor);
  }

  createCake() {
    const cake = new THREE.Group();
    cake.position.y = -0.28;
    const R = 1.18;
    const pinkH = 0.4;
    const whiteH = 0.78;
    const boardH = 0.055;
    const topY = boardH + pinkH + whiteH;
    this.cakeTopY = topY;

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.86, boardH, 2.86),
      this.cream(0xefe4e2, { roughness: 0.78, clearcoat: 0.02, sheen: 0.04 })
    );
    board.position.y = boardH / 2;
    cake.add(board);

    const pink = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, pinkH, 64),
      this.cream(0xeea8bb)
    );
    pink.position.y = boardH + pinkH / 2;
    cake.add(pink);

    const white = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, whiteH, 64),
      this.cream(0xf4ecec, { roughness: 0.7, sheen: 0.16, sheenColor: new THREE.Color(0xffe8ee) })
    );
    white.position.y = boardH + pinkH + whiteH / 2;
    cake.add(white);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.006, R + 0.006, 0.04, 64),
      this.cream(0xfff6f4, { roughness: 0.58, sheen: 0.2, sheenColor: new THREE.Color(0xffe8ee) })
    );
    cap.position.y = topY - 0.005;
    cake.add(cap);

    this.addBandHearts(cake, R, boardH + pinkH * 0.48);
    this.addTopDecor(cake, topY + 0.02);
    this.addCakeLettering(cake, topY + 0.02);
    return cake;
  }

  makeFlame(y) {
    const flame = new THREE.Group();
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xff7a28,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      })
    );
    glow.scale.set(1.2, 2.55, 1.2);
    const orange = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffb03a,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      })
    );
    orange.scale.set(0.85, 2.15, 0.85);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff8d0 })
    );
    core.scale.set(0.72, 1.85, 0.72);
    core.position.y = 0.008;
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfffef6 })
    );
    tip.scale.set(0.48, 1.15, 0.48);
    tip.position.y = 0.05;
    const blue = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 10),
      new THREE.MeshBasicMaterial({
        color: 0x8ec8ff,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    blue.scale.set(0.9, 0.65, 0.9);
    blue.position.y = -0.022;
    flame.add(glow, orange, core, tip, blue);
    flame.position.y = y;
    flame.visible = false;
    this.flames.push(flame);
    return flame;
  }

  clearCandles() {
    this.flames.length = 0;
    if (!this.candleGroup) return;
    while (this.candleGroup.children.length) {
      this.candleGroup.remove(this.candleGroup.children[0]);
    }
  }

  placeNumberCandles(y, items) {
    const gap = 0.06;
    const total = items.reduce((s, it) => s + it.width, 0) + gap * (items.length - 1);
    let x = -total / 2;
    for (const item of items) {
      x += item.width / 2;
      item.group.position.set(x, y, 0);
      item.group.rotation.set(0, 0, 0);
      this.candleGroup.add(item.group);
      x += item.width / 2 + gap;
    }
  }

  addNumberCandleFallback(char, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 256, 320);
    ctx.fillStyle = "#e05670";
    ctx.font = "700 220px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, 128, 168);
    const tex = new THREE.CanvasTexture(canvas);
    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.46),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
    );
    plane.position.y = 0.23;
    group.add(plane);
    const peg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8),
      this.cream(color, { roughness: 0.5 })
    );
    peg.position.y = -0.02;
    group.add(peg);
    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.045, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a2a28, roughness: 1 })
    );
    wick.position.y = 0.48;
    group.add(wick);
    group.add(this.makeFlame(0.56));
    return { group, width: 0.4 };
  }

  makeNumberCandle(font, char, color) {
    const geo = new TextGeometry(char, {
      font,
      size: 0.41,
      depth: 0.17,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.022,
      bevelSize: 0.014,
      bevelSegments: 3,
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const width = bb.max.x - bb.min.x;
    const height = bb.max.y - bb.min.y;
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    const wax = new THREE.Mesh(
      geo,
      this.cream(color, { roughness: 0.38, clearcoat: 0.22 })
    );
    const group = new THREE.Group();
    group.add(wax);
    const peg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8),
      this.cream(color, { roughness: 0.5 })
    );
    peg.position.y = -0.02;
    group.add(peg);
    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.05, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a2a28, roughness: 1 })
    );
    wick.position.y = height + 0.02;
    group.add(wick);
    group.add(this.makeFlame(height + 0.09));
    group.rotation.set(0, 0, 0);
    return { group, width: width + 0.04 };
  }

  addCakeLettering(parent, y) {
    this.candleGroup = new THREE.Group();
    parent.add(this.candleGroup);
    this.placeNumberCandles(y, [
      this.addNumberCandleFallback("2", 0xe05670),
      this.addNumberCandleFallback("0", 0xee7a96),
    ]);
    const loader = new FontLoader();
    loader.load(
      "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json",
      (font) => {
        const wasLit = this.candlesLit && !this.blown;
        this.clearCandles();
        this.placeNumberCandles(y, [
          this.makeNumberCandle(font, "2", 0xe05670),
          this.makeNumberCandle(font, "0", 0xee7a96),
        ]);
        if (wasLit) for (const f of this.flames) f.visible = true;
      },
      undefined,
      () => {}
    );
  }

  pipedHeart(color, scale) {
    const mesh = new THREE.Mesh(this.heartGeometry(), this.cream(color, { roughness: 0.42 }));
    mesh.scale.setScalar(scale);
    return mesh;
  }

  addBandHearts(parent, radius, y) {
    const items = [
      [0.12, 0xe05670, 0.32],
      [0.78, 0xfff8f4, 0.16],
      [1.42, 0xff9eb4, 0.24],
      [2.05, 0xee7a96, 0.3],
      [2.68, 0xffd0dc, 0.14],
      [3.28, 0xff7a96, 0.22],
      [3.9, 0xfff8f4, 0.18],
      [4.48, 0xf07090, 0.28],
      [5.1, 0xffc2d0, 0.15],
      [5.72, 0xe8899a, 0.26],
    ];
    for (const [a, color, sc] of items) {
      const g = new THREE.Group();
      const heart = this.pipedHeart(color, sc);
      heart.position.z = 0.03;
      g.add(heart);
      g.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      g.rotation.y = Math.PI / 2 - a;
      parent.add(g);
    }
  }

  addTopDecor(parent, y) {
    const hearts = [
      [0.72, 0.58, 0.32, 0xe05670],
      [-0.74, 0.52, 0.18, 0xff9eb4],
      [0.86, -0.12, 0.26, 0xee7a96],
      [-0.82, -0.08, 0.14, 0xfff8f4],
      [0.48, -0.78, 0.3, 0xff7a96],
      [-0.52, -0.76, 0.16, 0xffc2d0],
      [0.92, 0.28, 0.12, 0xf07090],
      [-0.9, 0.22, 0.28, 0xe8899a],
      [0.28, 0.82, 0.2, 0xffd0dc],
      [-0.22, 0.8, 0.34, 0xee7a96],
      [0.62, -0.52, 0.15, 0xfff8f4],
      [-0.58, 0.68, 0.22, 0xff9eb4],
      [0.18, -0.88, 0.27, 0xe05670],
      [-0.9, -0.42, 0.13, 0xffb4c8],
      [0.78, 0.72, 0.17, 0xff7a96],
      [-0.38, -0.9, 0.31, 0xf07090],
    ];
    for (const [x, z, sc, color] of hearts) {
      const heart = this.pipedHeart(color, sc);
      heart.rotation.x = -Math.PI / 2;
      heart.position.set(x, y + 0.022, z);
      parent.add(heart);
    }
    const dotMat = this.cream(0xfff8f4);
    const dots = [
      [0.35, 0.22], [0.7, 0.05], [-0.3, 0.5], [0.15, -0.28],
      [-0.65, 0.15], [0.55, -0.55], [-0.1, -0.72], [0.9, -0.32],
      [-0.88, 0.35], [0.4, 0.7], [-0.5, -0.22], [0.05, 0.18],
    ];
    for (const [x, z] of dots) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), dotMat);
      d.position.set(x, y + 0.016, z);
      parent.add(d);
    }
  }

  heartGeometry() {
    if (this._heartGeo) return this._heartGeo;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.22);
    shape.bezierCurveTo(0.22, 0.48, 0.52, 0.22, 0, -0.32);
    shape.bezierCurveTo(-0.52, 0.22, -0.22, 0.48, 0, 0.22);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
    });
    geo.center();
    this._heartGeo = geo;
    return geo;
  }

  addConfetti() {
    const count = this.mobile ? 180 : 320;
    const geo = new THREE.PlaneGeometry(0.1, 0.16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    this.confettiMesh = new THREE.InstancedMesh(geo, mat, count);
    this.confettiMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const p = {
        x: (Math.random() - 0.5) * 8,
        y: Math.random() * 8,
        z: (Math.random() - 0.5) * 6,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.4 + Math.random() * 0.6,
        spin: 1 + Math.random() * 3,
      };
      this.confetti.push(p);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.updateMatrix();
      this.confettiMesh.setMatrixAt(i, dummy.matrix);
      color.setHex(CONF_COLORS[i % CONF_COLORS.length]);
      this.confettiMesh.setColorAt(i, color);
    }
    this.scene.add(this.confettiMesh);
    this._dummy = dummy;
  }

  addOrbs() {
    const n = this.mobile ? 10 : 16;
    for (let i = 0; i < n; i++) {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 12, 12),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0xfff0f5 : 0xff9eb4,
          transparent: true,
          opacity: 0.65,
        })
      );
      orb.userData = {
        r: 1.7 + Math.random() * 2.4,
        y: 0.5 + Math.random() * 2.4,
        speed: 0.18 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      };
      this.orbs.push(orb);
      this.scene.add(orb);
    }
  }

  addHearts() {
    const mat = this.cream(0xf07090);
    for (let i = 0; i < 16; i++) {
      const heart = new THREE.Mesh(this.heartGeometry(), mat.clone());
      heart.material.transparent = true;
      heart.visible = false;
      heart.userData = { life: 0, vx: 0, vy: 0, vz: 0 };
      this.hearts.push(heart);
      this.scene.add(heart);
    }
  }

  addComposer() {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(size, 0.03, 0.15, 0.98);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  bindInput() {
    const ui = (el) => el instanceof Element && el.closest(".sound, .wish");
    const canvas = this.canvas;
    canvas.style.touchAction = "none";
    canvas.style.pointerEvents = "auto";

    const onDown = (e) => {
      if (!this.ready || ui(e.target)) return;
      this.dragging = true;
      this.dragMoved = false;
      this.spinVel = 0;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      document.body.classList.add("is-dragging");
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!this.ready || !this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.dragMoved = true;
      this.spinY += dx * 0.014;
      this.spinVel = THREE.MathUtils.clamp(dx * 0.06, -1.1, 1.1);
      this.tiltX = THREE.MathUtils.clamp(this.tiltX + dy * 0.006, -0.45, 0.55);
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    };

    const onUp = (e) => {
      if (!this.ready || !this.dragging) return;
      this.dragging = false;
      document.body.classList.remove("is-dragging");
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (ui(e.target)) return;
      if (this.dragMoved) return;
      this.punch = 1.1;
      this.burst();
      this.spawnHearts();
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  reveal() {
    this.ready = true;
    this.revealT = 0;
    this.spinY = 0;
    this.spinVel = this.idleSpin;
    this.cake.visible = true;
    this.confettiMesh.visible = true;
    this.burst();
  }

  burst() {
    for (const p of this.confetti) {
      if (Math.random() > 0.62) continue;
      p.x = (Math.random() - 0.5) * 1.3;
      p.y = 2.0 + Math.random();
      p.z = (Math.random() - 0.5) * 1.3;
      p.vx = (Math.random() - 0.5) * 2.1;
      p.vy = 0.9 + Math.random() * 1.5;
    }
  }

  spawnHearts() {
    for (const heart of this.hearts) {
      if (heart.visible && heart.userData.life > 0.15) continue;
      heart.visible = true;
      heart.position.set((Math.random() - 0.5) * 0.8, 1.35, (Math.random() - 0.5) * 0.8);
      heart.scale.setScalar(0.18 + Math.random() * 0.12);
      heart.rotation.set(0, Math.random() * Math.PI, 0);
      heart.userData = {
        life: 1,
        vx: (Math.random() - 0.5) * 0.7,
        vy: 1.1 + Math.random() * 0.8,
        vz: (Math.random() - 0.5) * 0.7,
      };
      break;
    }
  }

  lightCandles() {
    this.candlesLit = true;
    this.blown = false;
    this.candleGroup.visible = true;
    for (const f of this.flames) f.visible = true;
    document.body.classList.add("is-candlelit");
  }

  blowCandles() {
    if (!this.candlesLit || this.blown) return;
    this.blown = true;
    for (const f of this.flames) f.visible = false;
    this.burst();
    this.spawnHearts();
    document.body.classList.remove("is-candlelit");
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.syncCameraRig();
    this.camera.position.z = this.camBaseZ;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
    this.bloom?.setSize(w, h);
  }

  start() {
    const tick = () => {
      this.update();
      this.composer.render();
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    if (this.ready) {
      this.revealT = Math.min(1, this.revealT + dt * 1.6);
      const s = (1 - Math.pow(1 - this.revealT, 3)) * this.cakeScale;
      this.punch += (1 - this.punch) * Math.min(1, dt * 8);
      this.cake.scale.setScalar(s * this.punch);
      if (!this.dragging) {
        this.spinVel += (this.idleSpin - this.spinVel) * 0.1;
        this.spinY += this.spinVel * dt;
      }
      this.cake.rotation.y = this.spinY;
      this.cake.rotation.x += (this.tiltX - this.cake.rotation.x) * 0.08;
      this.cake.position.y = -0.28 + Math.sin(t * 0.9) * 0.03;
    }

    const lit = this.candlesLit && !this.blown;
    this.darkT += ((lit ? 1 : 0) - this.darkT) * Math.min(1, dt * 2.8);
    const d = this.darkT;
    this.hemi.intensity = 1.22 * (1 - d) + 0.5 * d;
    this.hemi.color.setRGB(1, 0.965, 0.976).lerp(new THREE.Color(0xffd4a0), d);
    this.hemi.groundColor.set(0xf7b8c6).lerp(new THREE.Color(0x4a2a18), d);
    this.key.intensity = 1.02 * (1 - d) + 0.28 * d;
    this.fill.intensity = 0.58 * (1 - d) + 0.18 * d;
    this.lift.intensity = 0.38 * (1 - d) + 0.16 * d;
    this._skyNow.copy(this._skyDay).lerp(this._skyNight, d);
    this.renderer.setClearColor(this._skyNow, 1);
    this.scene.fog.color.copy(this._skyNow);
    this.scene.fog.near = 14 - d * 4;
    this.scene.fog.far = 42 - d * 12;
    this.renderer.toneMappingExposure = 1.17 - d * 0.16;

    const flicker = 0.88 + Math.sin(t * 11) * 0.12 + Math.sin(t * 17) * 0.08;
    if (this.cake) {
      this.cake.getWorldPosition(this._lightPos);
      this.candleLight.position.set(this._lightPos.x, this._lightPos.y + 1.28, this._lightPos.z + 0.08);
      this.candleFill.position.set(this._lightPos.x, this._lightPos.y + 1.08, this._lightPos.z + 0.55);
    }
    this.candleLight.color.set(d > 0.3 ? 0xffd078 : 0xffc4d4);
    this.candleLight.intensity = lit ? 1.85 * flicker : 0.78 + Math.sin(t * 11) * 0.08;
    this.candleLight.distance = lit ? 6.2 : 8;
    this.candleLight.decay = lit ? 1.55 : 2;
    this.candleFill.color.set(0xffc878);
    this.candleFill.intensity = lit ? 0.85 * flicker : 0;
    this.candleFill.distance = lit ? 4.6 : 4.5;
    this.candleFill.decay = 1.35;
    if (this.bloom) {
      this.bloom.strength = lit ? 0.05 : 0.03;
      this.bloom.threshold = lit ? 0.99 : 0.98;
    }

    if (this.candleGroup?.visible) {
      if (this._candlePop == null) this._candlePop = 1;
      this._candlePop = Math.min(1, this._candlePop + dt * 4.2);
      const pop = 1 - Math.pow(1 - this._candlePop, 3);
      this.candleGroup.scale.setScalar(pop);
    }

    for (let i = 0; i < this.flames.length; i++) {
      const f = this.flames[i];
      if (!f.visible) continue;
      const flicker = 0.85 + Math.sin(t * 16 + i) * 0.12 + Math.sin(t * 27 + i * 2) * 0.08;
      f.scale.set(flicker, 0.9 + flicker * 0.35, flicker);
      f.position.x = Math.sin(t * 19 + i) * 0.006;
    }

    this.stars.rotation.y = t * 0.02;
    this.stars.material.opacity = (0.55 + Math.sin(t * 1.6) * 0.2) * (1 - d * 0.82);

    for (const orb of this.orbs) {
      const d = orb.userData;
      orb.position.set(
        Math.cos(t * d.speed + d.phase) * d.r,
        d.y + Math.sin(t * d.speed * 1.4 + d.phase) * 0.25,
        Math.sin(t * d.speed + d.phase) * d.r
      );
    }

    for (const heart of this.hearts) {
      if (!heart.visible) continue;
      const u = heart.userData;
      u.life -= dt * 0.45;
      heart.position.x += u.vx * dt;
      heart.position.y += u.vy * dt;
      heart.position.z += u.vz * dt;
      heart.rotation.y += dt * 1.4;
      heart.material.opacity = Math.max(0, u.life);
      heart.material.transparent = true;
      if (u.life <= 0) heart.visible = false;
    }

    if (!this.ready) {
      this.camera.lookAt(0, this.lookY, 0);
      return;
    }

    const dummy = this._dummy;
    for (let i = 0; i < this.confetti.length; i++) {
      const p = this.confetti[i];
      p.y -= p.vy * dt;
      p.x += p.vx * dt + Math.sin(t + i) * dt * 0.15;
      p.rx += p.spin * dt;
      p.ry += p.spin * 0.7 * dt;
      if (p.y < -1.4) {
        p.y = 6.5 + Math.random() * 2;
        p.x = (Math.random() - 0.5) * 8;
        p.z = (Math.random() - 0.5) * 6;
        p.vx = (Math.random() - 0.5) * 0.25;
        p.vy = 0.4 + Math.random() * 0.6;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.updateMatrix();
      this.confettiMesh.setMatrixAt(i, dummy.matrix);
    }
    this.confettiMesh.instanceMatrix.needsUpdate = true;

    if (!this.reduced && !this.dragging) {
      this.camera.position.x += (this.pointer.x * 0.35 - this.camera.position.x) * 0.03;
      this.camera.position.y += (this.camBaseY + this.pointer.y * -0.16 - this.camera.position.y) * 0.03;
    }
    this.camera.lookAt(0, this.lookY, 0);
  }
}
