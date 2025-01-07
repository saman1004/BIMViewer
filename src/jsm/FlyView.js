import { Vector3, Matrix4, Euler } from "three";

export class FlyView {
  constructor(camera, controls, keyStates) {
    this.camera = camera;
    this.controls = controls;
    this.keyStates = keyStates;

    this.isFlyViewMode = false;

    this.distance = null;
  }

  setFlyView() {
    this.isFlyViewMode = true;

    const cameraPosition = this.controls.object.position.clone();
    const controlsTarget = this.controls.target.clone();

    this.distance = controlsTarget.sub(cameraPosition);
  }

  resetFlyView() {
    if (this.isFlyViewMode) {
      this.isFlyViewMode = false;

      const newPosition = this.distance.add(this.controls.object.position);
      this.controls.target.copy(newPosition);
    }
  }

  _flyViewKeyStates(delta) {
    if (this.keyStates["KeyW"]) {
      this._flyover("front", delta);
    }

    if (this.keyStates["KeyS"]) {
      this._flyover("back", delta);
    }

    if (this.keyStates["KeyA"]) {
      this._flyover("left", delta);
    }

    if (this.keyStates["KeyD"]) {
      this._flyover("right", delta);
    }

    if (this.keyStates["KeyE"]) {
      this._flyover("up", delta);
    }

    if (this.keyStates["KeyQ"]) {
      this._flyover("down", delta);
    }

    if (this.keyStates["KeyZ"]) {
      const distance = new Vector3().subVectors(
        this.controls.target,
        this.camera.position
      );
      distance.applyAxisAngle(new Vector3(0, 1, 0), Math.PI * 0.003);
      this.controls.target.addVectors(this.camera.position, distance);
    }

    if (this.keyStates["KeyC"]) {
      const delta = new Vector3().subVectors(
        this.controls.target,
        this.camera.position
      );
      delta.applyAxisAngle(new Vector3(0, 1, 0), Math.PI * -0.003);
      this.controls.target.addVectors(this.camera.position, delta);
    }
  }

  _flyover(direction, delta) {
    let tempVector = new Vector3();
    tempVector
      .subVectors(this.controls.target, this.camera.position)
      .normalize();
    const upVector = new Vector3();
    upVector.copy(this.camera.up).applyQuaternion(this.camera.quaternion);
    const angle = this.controls.getAzimuthalAngle();

    switch (direction) {
      case "front":
        break;
      case "back":
        tempVector.multiplyScalar(-1);
        break;
      case "right":
        tempVector.applyAxisAngle(upVector, -Math.PI / 2);
        break;
      case "left":
        tempVector.applyAxisAngle(upVector, Math.PI / 2);
        break;
      case "up":
        tempVector = new Vector3(0, 1, 0).applyAxisAngle(
          new Vector3(0, 1, 0),
          angle
        );
        break;
      case "down":
        tempVector = new Vector3(0, -1, 0).applyAxisAngle(
          new Vector3(0, 1, 0),
          angle
        );
        break;
    }

    this.controls.target.sub(this.camera.position).normalize();
    this.camera.position.addScaledVector(tempVector, 25 * delta);
    this.controls.target.add(this.camera.position);
  }
}
