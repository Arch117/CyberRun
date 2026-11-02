export class Obstacles {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;
    this.items = [];
    this.materials = {
      shell: new THREE.MeshStandardMaterial({ color: 0x211c42, metalness: 0.72, roughness: 0.28, emissive: 0x29104a, emissiveIntensity: 1.2 }),
      cyan: new THREE.MeshStandardMaterial({ color: 0x54f6ff, emissive: 0x12d8ff, emissiveIntensity: 2.3, metalness: 0.3, roughness: 0.2 }),
      pink: new THREE.MeshStandardMaterial({ color: 0xff4cbb, emissive: 0xa20c71, emissiveIntensity: 1.8, metalness: 0.3, roughness: 0.25 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x101226, metalness: 0.6, roughness: 0.3 })
    };
    this.box = new THREE.BoxGeometry(1, 1, 1);
  }

  spawn(lane, z, kind = Math.random() > 0.48 ? "barrier" : "beam") {
    const group = new this.THREE.Group();
    group.position.set((lane - 1) * 2.15, 0, z);
    if (kind === "barrier") {
      this.addBox(group, 1.34, 0.9, 0.48, 0, 0.47, 0, this.materials.shell);
      this.addBox(group, 1.18, 0.08, 0.055, 0, 0.72, 0.27, this.materials.cyan);
      this.addBox(group, 0.09, 0.55, 0.08, -0.48, 0.37, 0.28, this.materials.pink);
      this.addBox(group, 0.09, 0.55, 0.08, 0.48, 0.37, 0.28, this.materials.pink);
      group.userData.kind = "barrier";
    } else {
      this.addBox(group, 0.12, 1.46, 0.18, -0.61, 0.73, 0, this.materials.dark);
      this.addBox(group, 0.12, 1.46, 0.18, 0.61, 0.73, 0, this.materials.dark);
      this.addBox(group, 1.4, 0.25, 0.38, 0, 1.48, 0, this.materials.shell);
      this.addBox(group, 1.32, 0.07, 0.42, 0, 1.45, 0.04, this.materials.pink);
      group.userData.kind = "beam";
    }
    group.userData.lane = lane;
    group.position.z = z;
    this.scene.add(group);
    this.items.push(group);
    return group;
  }

  addBox(group, width, height, depth, x, y, z, material) {
    const mesh = new this.THREE.Mesh(this.box, material);
    mesh.scale.set(width, height, depth);
    mesh.position.set(x, y, z);
    group.add(mesh);
  }

  update(delta, speed) {
    for (const item of this.items) item.position.z += speed * delta;
    this.removePassed();
  }

  removePassed() {
    this.items = this.items.filter((item) => {
      if (item.position.z > 12) {
        this.scene.remove(item);
        return false;
      }
      return true;
    });
  }

  clear() {
    for (const item of this.items) this.scene.remove(item);
    this.items.length = 0;
  }
}
