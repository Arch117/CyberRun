export class Collectibles {
  constructor(THREE, scene) {
    this.THREE = THREE;
    this.scene = scene;
    this.items = [];
    this.geometry = new THREE.TorusGeometry(0.31, 0.09, 8, 18);
    this.material = new THREE.MeshStandardMaterial({
      color: 0x75fbff, emissive: 0x20ddff, emissiveIntensity: 2.1,
      metalness: 0.56, roughness: 0.2
    });
  }

  spawnLine(lane, z, count = 4, spacing = 1.45) {
    for (let index = 0; index < count; index += 1) {
      const coin = new this.THREE.Mesh(this.geometry, this.material);
      coin.position.set((lane - 1) * 2.15, 1.12, z - index * spacing);
      coin.userData.baseY = coin.position.y;
      coin.userData.phase = Math.random() * Math.PI * 2;
      coin.userData.collected = false;
      coin.rotation.x = Math.PI / 2;
      this.scene.add(coin);
      this.items.push(coin);
    }
  }

  update(delta, speed, elapsed) {
    for (const coin of this.items) {
      coin.position.z += speed * delta;
      coin.rotation.z += delta * 2.2;
      coin.rotation.y = Math.sin(elapsed * 2 + coin.userData.phase) * 0.18;
      coin.position.y = coin.userData.baseY + Math.sin(elapsed * 4 + coin.userData.phase) * 0.1;
    }
    this.items = this.items.filter((coin) => {
      if (coin.position.z > 12 || coin.userData.collected) {
        this.scene.remove(coin);
        return false;
      }
      return true;
    });
  }

  clear() {
    for (const coin of this.items) this.scene.remove(coin);
    this.items.length = 0;
  }
}
