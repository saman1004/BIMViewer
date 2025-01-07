import { CSS2DObject } from "../three/examples/jsm/renderers/CSS2DRenderer.js";

import { Picking } from "./Picking.js";
import { Marker } from "./Marker.js";

export class MarkUp extends Picking {
  constructor(scene, camera, meshes, renderer, controls) {
    super(scene, camera, meshes);
    this.renderer = renderer;
    this.controls = controls;

    this.savePos = {
      controls: null,
      camera: null,
    };

    this.loadedMarkUpArr = [];
  }

  setState() {
    Picking.state = "markUp";
    this.renderer.domElement.style.cursor = "crosshair";
  }

  setMarkUp() {
    super.findIntersect();

    if (!this.intersects.length) return;

    this.getCameraPosition();

    this.selectData = {
      markX: this.intersects[0].point.x,
      markY: this.intersects[0].point.y,
      markZ: this.intersects[0].point.z,
      cameraX: this.savePos.camera.x,
      cameraY: this.savePos.camera.y,
      cameraZ: this.savePos.camera.z,
      controlsX: this.savePos.controls.x,
      controlsY: this.savePos.controls.y,
      controlsZ: this.savePos.controls.z,
    };

    const tempMarker = new Marker(
      this.selectData.markX,
      this.selectData.markY,
      this.selectData.markZ,
      "./textures/pin-3.png",
      0.05
    );
    tempMarker.name = "tempMarker";
    this.scene.add(tempMarker);

    setTimeout(() => {
      const preTempMarker = this.scene.getObjectByName("tempMarker");
      this.scene.remove(preTempMarker);
    }, 1000);

    this.addFunction(this.selectData);

    Picking.state = "pick";
    this.renderer.domElement.style.cursor = "default";
  }

  getCameraPosition() {
    this.savePos.controls = this.controls.target.clone();
    this.savePos.camera = this.controls.object.position.clone();

    return this.savePos;
  }

  getMarkUpInfo() {
    return this.selectData;
  }

  moveCameraPosition(
    cameraX,
    cameraY,
    cameraZ,
    controlsX,
    controlsY,
    controlsZ
  ) {
    this.camera.position.set(cameraX, cameraY, cameraZ);
    this.controls.target.set(controlsX, controlsY, controlsZ);
    this.controls.update();
  }

  addFunction(data) {
    console.log("MarkUp Data :", data);
  }

  loadMarkUp(markUpData) {
    const dummyData = {
      name: "이슈HD-22-기타-01",
      markX: -3.84735611498402,
      markY: 0.5341684928003012,
      markZ: 12.144302669856236,
    };

    const data = markUpData || dummyData;

    const { name, markX, markY, markZ } = data;

    const marker = new Marker(
      markX,
      markY,
      markZ,
      "./textures/pin-3.png",
      0.05
    );
    marker.name = "mark";
    this.scene.add(marker);
    this.loadedMarkUpArr.push(marker);

    const $div = document.createElement("div");
    $div.textContent = name;
    $div.style.cssText =
      "position: absolute; top: 16px; left: 50%; min-width: 150px; transform: translate(-50%, 0); display: inline; text-align: center; padding: 5px; border-radius: 5px; font-size: 10px; background: rgba(0, 0, 0, 0.5); color: white; pointer-events: auto;";

    $div.addEventListener("click", () => {
      this.addMarkUpfunction(data);
    });
    $div.addEventListener("mouseover", () => {
      $div.style.background = "#ccc";
    });
    $div.addEventListener("mouseout", () => {
      $div.style.background = "rgba(0, 0, 0, 0.5)";
    });

    const $wrapDiv = document.createElement("div");
    $wrapDiv.appendChild($div);

    const labelCSS2D = new CSS2DObject($wrapDiv);
    labelCSS2D.name = "markerLabelCSS2D";
    labelCSS2D.position.set(markX, markY, markZ);
    this.scene.add(labelCSS2D);
    this.loadedMarkUpArr.push(labelCSS2D);
  }

  addMarkUpfunction(data) {
    console.log(data);
  }

  resetMarkUp() {
    this.loadedMarkUpArr.forEach((v) => this.scene.remove(v));
  }
}
