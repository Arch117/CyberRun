import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { Player } from "./player.js";
import { Obstacles } from "./obstacles.js";
import { Collectibles } from "./collectibles.js";

const BEST_KEY = "cyberrun-best-score";
const LANE_SPACING = 2.15;

export class CyberRunGame {
  constructor(host, callbacks) {
    this.host = host;
    this.callbacks = callbacks;
    this.state = "ready";
    this.score = 0;
    this.coins = 0;
    this.speed = 16;
    this.nextSpeedMilestone = 18;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.worldOffset = 0;
    this.best = Number.parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080a18);
    this.scene.fog = new THREE.FogExp2(0x080a18, 0.012);
    this.camera = new THREE.PerspectiveCamera(54, 1, 0.1, 180);
    this.camera.position.set(0, 5.2, 10.5);
    this.camera.lookAt(0, 1.1, -8);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.shadowMap.enabled = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.host.appendChild(this.renderer.domElement);

    this.buildLighting();
    this.buildTrack();
    this.buildCity();
    this.player = new Player(THREE, this.scene);
    this.obstacles = new Obstacles(THREE, this.scene);
    this.collectibles = new Collectibles(THREE, this.scene);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
    this.lastFrame = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0x9caaff, 0x101020, 1.45));
    const key = new THREE.DirectionalLight(0x8defff, 2.1);
    key.position.set(-5, 9, 5);
    this.scene.add(key);
    const purple = new THREE.PointLight(0x8a44ff, 16, 27, 2);
    purple.position.set(0, 5, -12);
    this.scene.add(purple);
    this.scene.add(new THREE.AmbientLight(0x3e3a79, 0.55));
  }

  buildTrack() {
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x101528, metalness: 0.48, roughness: 0.52, emissive: 0x070b19 });
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x090b18, metalness: 0.22, roughness: 0.9 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 190), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.14, -52);
    this.scene.add(ground);
    this.trackSegments = [];
    const roadGeometry = new THREE.BoxGeometry(7.5, 0.18, 18);
    const railGeometry = new THREE.BoxGeometry(0.09, 0.07, 18);
    const lineGeometry = new THREE.BoxGeometry(0.025, 0.025, 1.7);
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x33eaff, emissive: 0x12b9ff, emissiveIntensity: 2.3 });
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0x3371b7, emissive: 0x16458b, emissiveIntensity: 1.5 });
    for (let segmentIndex = 0; segmentIndex < 7; segmentIndex += 1) {
      const segment = new THREE.Group();
      segment.position.z = -108 + segmentIndex * 18;
      const road = new THREE.Mesh(roadGeometry, roadMaterial);
      road.position.y = -0.04;
      segment.add(road);
      for (const x of [-3.68, 3.68]) {
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(x, 0.08, 0);
        segment.add(rail);
      }
      for (const x of [-1.075, 1.075]) {
        for (let dash = 0; dash < 6; dash += 1) {
          const line = new THREE.Mesh(lineGeometry, lineMaterial);
          line.position.set(x, 0.065, -7.5 + dash * 3);
          segment.add(line);
        }
      }
      const grid = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.018, 0.05), lineMaterial);
      grid.position.set(0, 0.07, 8.8);
      segment.add(grid);
      this.scene.add(segment);
      this.trackSegments.push(segment);
    }
  }

  buildCity() {
    this.cityItems = [];
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x11152c, metalness: 0.4, roughness: 0.8, emissive: 0x080b1b }),
      new THREE.MeshStandardMaterial({ color: 0x17142f, metalness: 0.42, roughness: 0.75, emissive: 0x100b24 })
    ];
    const windowMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x36dfff, emissive: 0x1386cf, emissiveIntensity: 1.6 }),
      new THREE.MeshStandardMaterial({ color: 0xb54dff, emissive: 0x7220b8, emissiveIntensity: 1.4 })
    ];
    const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    const windowGeometry = new THREE.BoxGeometry(0.09, 0.15, 0.035);
    for (let side = -1; side <= 1; side += 2) {
      for (let index = 0; index < 24; index += 1) {
        const z = -160 + index * 7.4 + Math.random() * 2;
        const width = 2.8 + Math.random() * 3.8;
        const height = 4 + Math.random() * 16;
        const depth = 3 + Math.random() * 5;
        const x = side * (7.5 + Math.random() * 6);
        const building = new THREE.Mesh(buildingGeometry, materials[index % 2]);
        building.scale.set(width, height, depth);
        building.position.set(x, height / 2 - 0.2, z);
        this.scene.add(building);
        this.cityItems.push(building);
        if (index % 2 === 0) {
          const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, height * 0.62, 0.09), windowMaterials[index % 2]);
          strip.position.set(x - side * width * 0.25, height * 0.5, z + depth * 0.51);
          this.scene.add(strip);
          this.cityItems.push(strip);
        }
        if (index % 3 === 0) {
          for (let row = 0; row < Math.min(8, Math.floor(height / 1.5)); row += 1) {
            const light = new THREE.Mesh(windowGeometry, windowMaterials[(row + index) % 2]);
            light.position.set(x + (Math.random() - 0.5) * width * 0.55, 1 + row * 1.25, z + depth * 0.51);
            this.scene.add(light);
            this.cityItems.push(light);
          }
        }
      }
    }
  }

  resize() {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    this.camera.fov = width < 600 ? 59 : 54;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  start() {
    this.clearRun();
    this.state = "running";
    this.score = 0;
    this.coins = 0;
    this.speed = 16;
    this.nextSpeedMilestone = 18;
    this.elapsed = 0;
    this.spawnTimer = 0.55;
    this.player.lane = 1;
    this.player.x = 0;
    this.player.group.position.set(0, 0.08, 0);
    this.player.group.scale.set(1, 1, 1);
    this.player.jumpTime = 0;
    this.player.slideTime = 0;
    this.updateHud();
    this.collectibles.spawnLine(1, -25, 4);
    this.callbacks.onState("running");
  }

  clearRun() {
    this.obstacles.clear();
    this.collectibles.clear();
  }

  pause() {
    if (this.state !== "running") return;
    this.state = "paused";
    this.callbacks.onState("paused");
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "running";
    this.lastFrame = performance.now();
    this.callbacks.onState("running");
  }

  setGameOver() {
    if (this.state !== "running") return;
    this.state = "gameover";
    const isNewBest = this.score > this.best;
    if (isNewBest) {
      this.best = this.score;
      localStorage.setItem(BEST_KEY, String(this.best));
    }
    this.updateHud();
    this.callbacks.onCollision({ score: this.score, coins: this.coins, isNewBest });
    this.callbacks.onState("gameover");
  }

  move(direction) {
    if (this.state === "running") this.player.move(direction);
  }

  jump() {
    if (this.state === "running" && this.player.jumpTime <= 0 && this.player.slideTime <= 0.25) {
      this.player.jump();
      this.callbacks.onSound("jump");
    }
  }

  slide() {
    if (this.state === "running" && this.player.slideTime <= 0 && this.player.jumpTime <= 0) this.player.slide();
  }

  spawnWave() {
    const obstacleLane = Math.floor(Math.random() * 3);
    const kind = Math.random() > 0.5 ? "barrier" : "beam";
    this.obstacles.spawn(obstacleLane, -74, kind);
    if (Math.random() > 0.2) {
      const safeLanes = [0, 1, 2].filter((lane) => lane !== obstacleLane);
      const coinLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
      this.collectibles.spawnLine(coinLane, -76, 4, 1.65);
    }
  }

  checkCollisions() {
    const playerX = this.player.x;
    for (const obstacle of this.obstacles.items) {
      if (Math.abs(obstacle.position.z) > 0.67 || Math.abs(playerX - obstacle.position.x) > LANE_SPACING * 0.43) continue;
      if (obstacle.userData.kind === "barrier" && this.player.isJumping) continue;
      if (obstacle.userData.kind === "beam" && this.player.isSliding) continue;
      this.callbacks.onSound("crash");
      this.setGameOver();
      return;
    }
    for (const coin of this.collectibles.items) {
      if (coin.userData.collected || Math.abs(coin.position.z) > 0.78 || Math.abs(playerX - coin.position.x) > LANE_SPACING * 0.43) continue;
      coin.userData.collected = true;
      this.coins += 1;
      this.callbacks.onSound("coin");
      this.callbacks.onCoin();
      this.updateHud();
    }
  }

  updateHud() {
    this.callbacks.onHud({ score: Math.floor(this.score), coins: this.coins, best: this.best });
  }

  animate(now) {
    requestAnimationFrame(this.animate);
    const delta = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    if (this.state === "running") {
      this.elapsed += delta;
      this.speed = Math.min(31, 16 + this.elapsed * 0.22);
      if (this.speed >= this.nextSpeedMilestone) {
        this.callbacks.onSpeedUp();
        this.nextSpeedMilestone += 3;
      }
      this.score += this.speed * delta;
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnWave();
        this.spawnTimer = Math.max(0.72, 1.06 - this.elapsed * 0.0015);
      }
      this.player.update(delta, this.elapsed);
      this.obstacles.update(delta, this.speed);
      this.collectibles.update(delta, this.speed, this.elapsed);
      this.worldOffset += this.speed * delta;
      for (const segment of this.trackSegments) {
        segment.position.z += this.speed * delta;
        if (segment.position.z > 18) segment.position.z -= this.trackSegments.length * 18;
      }
      for (const structure of this.cityItems) {
        structure.position.z += this.speed * delta;
        if (structure.position.z > 20) structure.position.z -= 178;
      }
      this.camera.position.x += (this.player.x * 0.16 - this.camera.position.x) * Math.min(1, delta * 2.2);
      this.camera.lookAt(this.player.x * 0.08, 1.05, -8);
      this.checkCollisions();
      this.updateHud();
    } else if (this.state === "ready" || this.state === "gameover") {
      this.player.update(delta, this.elapsed);
      this.camera.lookAt(0, 1.05, -8);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
