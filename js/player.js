export class Player {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.lane = 1;
    this.x = 0;
    this.jumpTime = 0;
    this.slideTime = 0;
    this.runTime = 0;
    this.group = new THREE.Group();
    this.group.position.y = 0.08;
    scene.add(this.group);

    const armor = new THREE.MeshStandardMaterial({ color: 0x182b50, metalness: 0.78, roughness: 0.28 });
    const lightArmor = new THREE.MeshStandardMaterial({ color: 0x8deeff, metalness: 0.5, roughness: 0.25, emissive: 0x14546a, emissiveIntensity: 1.1 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x101324, metalness: 0.35, roughness: 0.5 });
    const visor = new THREE.MeshStandardMaterial({ color: 0x47f3ff, emissive: 0x11a5d2, emissiveIntensity: 2.3, metalness: 0.4, roughness: 0.16 });
    const sphere = new THREE.SphereGeometry(0.5, 12, 10);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.34), armor);
    torso.position.y = 1.25;
    this.group.add(torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.035), visor);
    chest.position.set(0, 1.4, 0.19);
    this.group.add(chest);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), armor);
    head.scale.set(0.9, 1.12, 0.85);
    head.position.y = 1.83;
    this.group.add(head);
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.11), visor);
    face.position.set(0, 1.85, 0.25);
    this.group.add(face);
    const shoulderGeometry = new THREE.SphereGeometry(0.2, 10, 8);
    this.leftArm = this.createLimb(shoulderGeometry, 0.43, 1.48, armor, lightArmor);
    this.rightArm = this.createLimb(shoulderGeometry, -0.43, 1.48, armor, lightArmor);
    this.leftLeg = this.createLeg(sphere, -0.17, dark, lightArmor);
    this.rightLeg = this.createLeg(sphere, 0.17, dark, lightArmor);
    this.bodyParts = [torso, chest, head, face, this.leftArm, this.rightArm];
    this.group.userData.materials = [armor, lightArmor, dark, visor];
  }

  createLimb(shoulderGeometry, x, y, armor, accent) {
    const pivot = new this.THREE.Group();
    pivot.position.set(x, y, 0);
    const shoulder = new this.THREE.Mesh(shoulderGeometry, armor);
    shoulder.scale.set(0.9, 1, 0.9);
    pivot.add(shoulder);
    const forearm = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.18, 0.45, 0.2), accent);
    forearm.position.y = -0.31;
    pivot.add(forearm);
    this.group.add(pivot);
    return pivot;
  }

  createLeg(sphere, x, dark, accent) {
    const pivot = new this.THREE.Group();
    pivot.position.set(x, 0.92, 0);
    const leg = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.2, 0.52, 0.24), dark);
    leg.position.y = -0.22;
    pivot.add(leg);
    const boot = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.23, 0.16, 0.38), accent);
    boot.position.set(0, -0.49, 0.07);
    pivot.add(boot);
    this.group.add(pivot);
    return pivot;
  }

  move(direction) {
    this.lane = Math.max(0, Math.min(2, this.lane + direction));
  }

  jump() {
    if (this.jumpTime <= 0 && this.slideTime <= 0.25) {
      this.slideTime = 0;
      this.jumpTime = 0.82;
    }
  }

  slide() {
    if (this.slideTime <= 0 && this.jumpTime <= 0) this.slideTime = 0.65;
  }

  update(delta, elapsed) {
    const targetX = (this.lane - 1) * 2.15;
    this.x += (targetX - this.x) * Math.min(1, delta * 12);
    this.group.position.x = this.x;
    this.runTime = elapsed * 11;
    const jumping = this.jumpTime > 0;
    if (jumping) this.jumpTime = Math.max(0, this.jumpTime - delta);
    if (this.slideTime > 0) this.slideTime = Math.max(0, this.slideTime - delta);
    const jumpProgress = jumping ? 1 - this.jumpTime / 0.82 : 1;
    this.group.position.y = 0.08 + (jumping ? Math.sin(jumpProgress * Math.PI) * 1.7 : 0);
    const sliding = this.slideTime > 0;
    this.group.scale.y += ((sliding ? 0.48 : 1) - this.group.scale.y) * Math.min(1, delta * 30);
    this.group.rotation.z += ((this.lane === 1 ? 0 : (this.lane < 1 ? 0.1 : -0.1)) - this.group.rotation.z) * Math.min(1, delta * 8);
    const stride = Math.sin(this.runTime) * (sliding ? 0.12 : 0.72);
    this.leftLeg.rotation.x = stride;
    this.rightLeg.rotation.x = -stride;
    this.leftArm.rotation.x = -stride * 0.65;
    this.rightArm.rotation.x = stride * 0.65;
  }

  get isSliding() { return this.slideTime > 0.12; }
  get isJumping() { return this.group.position.y > 0.95; }
}
