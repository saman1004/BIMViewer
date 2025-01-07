import { Box3, Vector3 } from "three";
import { Interpolation } from "./interpolation.js";

export class ZoomFit {
  constructor(model, viewMode, camera, controls) {
    this.model = model;
    this.viewMode = viewMode;
    this.camera = camera;
    this.controls = controls;

    this.box = new Box3().setFromObject(this.model);
    this.sizeBox = this.box.getSize(new Vector3()).length();
    this.centerBox = this.box.getCenter(new Vector3());

    let offsetX = 0,
      offsetY = 0,
      offsetZ = 0;

    switch (this.viewMode) {
      case "X":
        offsetX = 1;
        break;
      case "Y":
        offsetY = 1;
        break;
      case "Z":
        offsetZ = 1;
        break;
      case "-X":
        offsetX = 1;
        offsetX *= -1;
        break;
      case "-Y":
        offsetY = 1;
        offsetY *= -1;
        break;
      case "-Z":
        offsetZ = 1;
        offsetZ *= -1;
        break;
    }

    this.camera.position.set(
      this.centerBox.x + offsetX,
      this.centerBox.y + offsetY,
      this.centerBox.z + offsetZ
    );

    const halfSizeModel = this.sizeBox * 0.5;
    const halfFov = (Math.PI / 180) * (this.camera.fov * 0.5);
    const distance = halfSizeModel / Math.tan(halfFov);
    const direction = new Vector3()
      .subVectors(this.camera.position, this.centerBox)
      .normalize();
    const position = direction.multiplyScalar(distance).add(this.centerBox);

    this.camera.position.copy(position);

    this.camera.near = Math.min(this.sizeBox / 100, 0.1);
    this.camera.far = distance * 5;

    this.camera.updateProjectionMatrix();

    this.camera.lookAt(this.centerBox.x, this.centerBox.y, this.centerBox.z);
    this.controls.target.set(
      this.centerBox.x,
      this.centerBox.y,
      this.centerBox.z
    );

    this.controls.minDistanceSettingValue = distance / 20;
  }
}
export class FitSelectedMesh {
  constructor(model, camera, controls, scene, renderer) {
    this.model = model;
    this.camera = camera;
    this.controls = controls;
    this.scene = scene;
    this.renderer = renderer;
    this.interpolation = new Interpolation(
      this.camera,
      this.renderer,
      this.scene
    );

    const center = this.model.geometry.boundingSphere.center;
    const radius = this.model.geometry.boundingSphere.radius;
    const angle = 75 / 2;
    const distance = radius / Math.tan((Math.PI / 180) * angle);
    const direction = new Vector3()
      .subVectors(this.camera.position, center)
      .normalize();
    const position = direction.multiplyScalar(distance).add(center);

    this.interpolation.to(
      this.camera.position,
      new Vector3(position.x, position.y, position.z),
      800
    );
    this.interpolation.to(
      this.controls.target,
      new Vector3(position.x, position.y, position.z),
      800
    );

    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
}
