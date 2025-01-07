export class Screen {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  getScreen(quality, width, height) {
    const canvas = this.renderer.domElement;
    this.renderer.render(this.scene, this.camera);

    const value = Math.min(1.0, Math.max(0.1, quality));
    const resizeWidth = width || canvas.width;
    const resizeHeight = height || canvas.height;

    const resizeCanvas = document.createElement("canvas");
    resizeCanvas.setAttribute("width", resizeWidth);
    resizeCanvas.setAttribute("height", resizeHeight);
    const ctx = resizeCanvas.getContext("2d");
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      resizeWidth,
      resizeHeight
    );

    const imageUrl = resizeCanvas.toDataURL("image/jpeg", value);

    console.log("imageUrl :", imageUrl);

    document.querySelector(".hamburger").click();
    return imageUrl;
  }

  saveLocalScreenshot() {
    this.renderer.render(this.scene, this.camera);

    const imgsrc = this.renderer.domElement.toDataURL("image/jpeg", 0.9);
    saveAs(imgsrc, `sceenshot.jpeg`);

    function saveAs(url, filename) {
      let link = document.createElement("a");

      if (typeof link.download === "string") {
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url);
      }
    }

    document.querySelector(".hamburger").click();
  }

  expandFullScreen() {
    const container = document.getElementById("view3d");

    const fullscreenElement =
      document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }

      document.querySelector(".hamburger").click();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }
}
