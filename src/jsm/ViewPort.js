import * as THREE from "three";
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

export class ViewPort {
  constructor(container, renderer, scene, camera, control, parent) {
    this.container = container;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.orbitControls = control;
    this.parent = parent;
    this.axis = {
      x: undefined,
      y: undefined,
      z: undefined,
    };

    this.set1 = { camera: undefined, control: undefined };
    this.set2 = { camera: undefined, control: undefined };
    this.set3 = { camera: undefined, control: undefined };
    this.set4 = { camera: undefined, control: undefined };
  }

  init() {
    this.hamburgerMenu = document.querySelector(".hamburger");
    $(this.hamburgerMenu).css({ visibility: "hidden" });
    this.subMenu = document.querySelector(".sub_menu_wrap");
    $(this.subMenu).css({ visibility: "hidden" });
    this.divMenu = document.querySelector("div");
    $(this.divMenu).css({ visibility: "hidden" });
    this.gizmoMenu = document.querySelector("#gizmo");
    $(this.gizmoMenu).css({ visibility: "hidden" });
    this.openMenu = document.querySelector(".bt_open");
    $(this.openMenu).css({ visibility: "hidden" });

    this.viewPortWrap = document.querySelector(".split_container");
    this.viewPortWrap.style.display = "flex";
    this.view1 = document.getElementById("view1");
    $(this.view1).css({
      position: "absolute",
      inset: "0% 100% 100% 0%",
      border: "1px solid black",
      width: "100%",
      height: "100%",
    });
    this.view2 = document.getElementById("view2");
    $(this.view2).css({
      position: "absolute",
      inset: "0% 100% 100% 0%",
      border: "1px solid black",
      width: "100%",
      height: "100%",
    });
    this.view3 = document.getElementById("view3");
    $(this.view3).css({
      position: "absolute",
      inset: "0% 100% 100% 0%",
      border: "1px solid black",
      width: "100%",
      height: "100%",
    });
    this.view4 = document.getElementById("view4");
    $(this.view4).css({
      position: "absolute",
      inset: "0% 100% 100% 0%",
      border: "1px solid black",
      width: "100%",
      height: "100%",
    });

    let xPositions = [
      this.zoomFit.centerBox.clone(),
      this.zoomFit.centerBox
        .clone()
        .add(new THREE.Vector3(this.zoomFit.sizeBox / 4, 0, 0)),
    ];
    let yPositions = [
      this.zoomFit.centerBox.clone(),
      this.zoomFit.centerBox
        .clone()
        .add(new THREE.Vector3(0, this.zoomFit.sizeBox / 4, 0)),
    ];
    let zPositions = [
      this.zoomFit.centerBox.clone(),
      this.zoomFit.centerBox
        .clone()
        .add(new THREE.Vector3(0, 0, this.zoomFit.sizeBox / 4)),
    ];

    let xGeo = new THREE.BufferGeometry().setFromPoints(xPositions);
    let xMat = new THREE.LineBasicMaterial({
      color: "red",
      depthTest: false,
      depthWrite: false,
    });
    this.axis.x = new THREE.LineSegments(xGeo, xMat);
    this.axis.x.frustumCulled = false;
    this.scene.add(this.axis.x);
    let yGeo = new THREE.BufferGeometry().setFromPoints(yPositions);
    let yMat = new THREE.LineBasicMaterial({
      color: "green",
      depthTest: false,
      depthWrite: false,
    });
    this.axis.y = new THREE.LineSegments(yGeo, yMat);
    this.axis.y.frustumCulled = false;
    this.scene.add(this.axis.y);
    let zGeo = new THREE.BufferGeometry().setFromPoints(zPositions);
    let zMat = new THREE.LineBasicMaterial({
      color: "blue",
      depthTest: false,
      depthWrite: false,
    });
    this.axis.z = new THREE.LineSegments(zGeo, zMat);
    this.axis.z.frustumCulled = false;
    this.scene.add(this.axis.z);

    this.canvasWidth = this.container.clientWidth / 2;
    this.canvasHeight = this.container.clientHeight / 2;
    this.aspect = this.canvasWidth / this.canvasHeight;

    this.set1.camera = this._makeOrthographicCamera();
    this.set2.camera = this._makeOrthographicCamera();
    this.set3.camera = this._makeOrthographicCamera();
    this.set4.camera = this._makeOrthographicCamera();

    this.set1.control = new OrbitControls(this.set1.camera, this.view1);
    this.set2.control = new OrbitControls(this.set2.camera, this.view2);
    this.set3.control = new OrbitControls(this.set3.camera, this.view3);
    this.set4.control = new OrbitControls(this.set4.camera, this.view4);
  }

  ViewPort(zoomFit) {
    this.zoomFit = zoomFit;

    this.init();

    this.renderer.setScissorTest(true);

    this.set1 = this._setView(
      this.set1.camera,
      this.set1.control,
      "perspective"
    );

    this.set2 = this._setView(this.set2.camera, this.set2.control, "top");

    this.set3 = this._setView(this.set3.camera, this.set3.control, "front");

    this.set4 = this._setView(this.set4.camera, this.set4.control, "right");

    this.animate();
  }

  animate() {
    const wSize = window.innerWidth / 2;
    const hSize = window.innerHeight / 2;

    this.set1.camera.updateProjectionMatrix();
    this.set1.control.update();
    this.renderer.setViewport(0, hSize, wSize, hSize);
    this.renderer.setScissor(0, hSize, wSize, hSize);
    this.renderer.render(this.scene, this.set1.camera);

    this.set2.camera.updateProjectionMatrix();
    this.set2.control.update();
    this.renderer.setViewport(wSize, hSize, wSize, hSize);
    this.renderer.setScissor(wSize, hSize, wSize, hSize);
    this.renderer.render(this.scene, this.set2.camera);

    this.set3.camera.updateProjectionMatrix();
    this.renderer.setViewport(0, 0, wSize, hSize);
    this.renderer.setScissor(0, 0, wSize, hSize);
    this.renderer.render(this.scene, this.set3.camera);
    this.set3.control.update();

    this.set4.camera.updateProjectionMatrix();
    this.renderer.setViewport(wSize, 0, wSize, hSize);
    this.renderer.setScissor(wSize, 0, wSize, hSize);
    this.renderer.render(this.scene, this.set4.camera);
    this.set4.control.update();

    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  resetViewPort() {
    $(this.divMenu).css({ visibility: "visible" });
    $(this.gizmoMenu).css({ visibility: "visible" });
    $(this.openMenu).css({ visibility: "visible" });
    $(this.hamburgerMenu).css({ visibility: "visible" });
    $(this.subMenu).css({ visibility: "visible" });

    if (!this.viewPortWrap) return;

    this.viewPortWrap.style.display = "none";
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.camera.updateProjectionMatrix();
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);

    this.scene.remove(this.axis.x);
    this.scene.remove(this.axis.y);
    this.scene.remove(this.axis.z);
    this.axis = {
      x: undefined,
      y: undefined,
      z: undefined,
    };

    this.renderer.setAnimationLoop(this.parent.animate.bind(this.parent));
  }

  changeCamera(_mode) {
    console.log(_mode);

    let view = _mode.split("view")[1][0];
    let mode = _mode.split("view")[1].substring(1);

    switch (view) {
      case "1":
        this.set1 = this._setView(this.set1.camera, this.set1.control, mode);
        break;
      case "2":
        this.set2 = this._setView(this.set2.camera, this.set2.control, mode);
        break;
      case "3":
        this.set3 = this._setView(this.set3.camera, this.set3.control, mode);
        break;
      case "4":
        this.set4 = this._setView(this.set4.camera, this.set4.control, mode);
        break;
    }
  }

  _setControlOrtho(control) {
    control.enableRotate = false;
  }

  _setControlPerspec(control) {
    control.enableRotate = true;
  }

  _makePerspectiveCamera() {
    return new THREE.PerspectiveCamera(75, this.aspect, 0.001, 10000);
  }

  _makeOrthographicCamera() {
    return new THREE.OrthographicCamera(
      this.zoomFit.sizeBox / -2,
      this.zoomFit.sizeBox / 2,
      this.zoomFit.sizeBox / (this.aspect * 2),
      this.zoomFit.sizeBox / -(this.aspect * 2),
      0.001,
      10000
    );
  }

  _setView(camera, control, mode) {
    switch (mode) {
      case "perspective":
        camera = this._makePerspectiveCamera();
        camera.position.set(
          this.zoomFit.centerBox.x,
          this.zoomFit.centerBox.y + this.zoomFit.sizeBox / 3,
          this.zoomFit.centerBox.z + this.zoomFit.sizeBox / 2
        );
        this._setControlPerspec(control);
        break;
      case "top":
        camera = this._makeOrthographicCamera();
        camera.position.set(
          this.zoomFit.centerBox.x,
          this.zoomFit.centerBox.y + this.zoomFit.sizeBox * 1.5,
          this.zoomFit.centerBox.z
        );
        this._setControlOrtho(control);
        break;
      case "bottom":
        camera = this._makeOrthographicCamera();
        camera.position.set(
          this.zoomFit.centerBox.x,
          this.zoomFit.centerBox.y - this.zoomFit.sizeBox * 1.5,
          this.zoomFit.centerBox.z
        );
        this._setControlOrtho(control);
        break;
      case "front":
        camera = this._makeOrthographicCamera();
        camera.position.set(
          this.zoomFit.centerBox.x,
          this.zoomFit.centerBox.y,
          this.zoomFit.centerBox.z + this.zoomFit.sizeBox * 1.5
        );
        this._setControlOrtho(control);
        break;
      case "back":
        camera = this._makeOrthographicCamera();
        camera.position.set(
          this.zoomFit.centerBox.x,
          this.zoomFit.centerBox.y,
          this.zoomFit.centerBox.z - this.zoomFit.sizeBox * 1.5
        );
        this._setControlOrtho(control);
        break;
      case "right":
        camera = this._makeOrthographicCamera();
        camera.position.set(
          this.zoomFit.centerBox.x + this.zoomFit.sizeBox * 1.5,
          this.zoomFit.centerBox.y,
          this.zoomFit.centerBox.z
        );
        this._setControlOrtho(control);
        break;
      case "left":
        camera = this._makeOrthographicCamera();
        camera.position.set(
          this.zoomFit.centerBox.x - this.zoomFit.sizeBox * 1.5,
          this.zoomFit.centerBox.y,
          this.zoomFit.centerBox.z
        );
        this._setControlOrtho(control);
        break;
    }
    camera.lookAt(
      this.zoomFit.centerBox.x,
      this.zoomFit.centerBox.y,
      this.zoomFit.centerBox.z
    );
    control.object = camera;
    control.target.set(
      this.zoomFit.centerBox.x,
      this.zoomFit.centerBox.y,
      this.zoomFit.centerBox.z
    );
    return { camera: camera, control: control };
  }
}
