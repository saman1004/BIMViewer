import { Vector3, Vector2, Raycaster } from "three";

export class Picking {
  static state = "pick";
  static pickedMesh = null;
  static clonedPickedMesh = null;
  static boxHelper = null;
  static selectedElement = null;
  static snapping = false;

  constructor(scene, camera, meshes) {
    this.scene = scene;
    this.camera = camera;
    this.meshes = meshes;

    this.mouse = new Vector2();
    this.raycaster = new Raycaster();
    this.intersects = null;
  }

  findIntersect() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.firstHitOnly = true;
    this.raycaster.layers.set(1);
    this.intersects = this.raycaster.intersectObjects(this.meshes, false);
    if (
      (Picking.state == "dim" || Picking.state == "area") &&
      Picking.snapping
    ) {
      let minDistance = Infinity;
      let nearestVertex;

      for (let i = 0; i < this.intersects.length; i++) {
        let positions = this.intersects[i].object.geometry.attributes.position;
        let worldMatrix = this.intersects[i].object.matrixWorld;

        for (let j = 0; j < positions.count; j++) {
          const vertex = new Vector3();
          vertex.fromBufferAttribute(positions, j);
          vertex.applyMatrix4(worldMatrix);

          const distance = this.raycaster.ray.distanceToPoint(vertex);
          if (distance < minDistance) {
            minDistance = distance;
            nearestVertex = vertex;
          }
        }
      }
      if (nearestVertex) {
        this.intersects = [{ point: nearestVertex }];
      }
    }
  }
}
