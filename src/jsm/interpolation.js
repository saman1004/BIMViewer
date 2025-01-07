export class Interpolation {
  constructor(camera, renderer, scene) {
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
  }

  to(origin, target, duration) {
    let startTime = performance.now();
    let endTime = startTime + duration;
    let that = this;
    function updateCameraPosition() {
      let now = performance.now();
      let progress = (now - startTime) / duration;

      progress = Math.min(progress, 1);

      let newPosition = origin.clone().lerp(target, progress);
      that.camera.position.copy(newPosition);

      that.renderer.render(that.scene, that.camera);
      if (now < endTime) {
        setTimeout(updateCameraPosition, Math.max(duration / 50, 10));
      }
    }

    updateCameraPosition();
  }
}
