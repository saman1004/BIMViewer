import * as THREE from "three";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  SAH,
} from "three-mesh-bvh";

import * as BufferGeometryUtils from "./three/examples/jsm/utils/BufferGeometryUtils.js";

import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "./three/examples/jsm/loaders/KTX2Loader.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "./three/examples/jsm/renderers/CSS2DRenderer.js";

import { EffectComposer } from "./three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "./three/examples/jsm/postprocessing/ShaderPass.js";
import { SSAOPass } from "./three/examples/jsm/postprocessing/SSAOPass.js";
import { GammaCorrectionShader } from "./three/examples/jsm/shaders/GammaCorrectionShader.js";
import { FXAAShader } from "./three/examples/jsm/shaders/FXAAShader.js";
import { ColorCorrectionShader } from "./three/examples/jsm/shaders/ColorCorrectionShader.js";

import { OrientationGizmo } from "./jsm/OrientationGizmo.js";
import { EnvironmentMapping } from "./jsm/EnvironmentMapping.js";
import { PreventDragClick } from "./jsm/PreventDragClick.js";
import { Picking } from "./jsm/Picking.js";
import { PickHelper } from "./jsm/PickHelper.js";
import { Dim } from "./jsm/Dim.js";
import { ZoomFit } from "./jsm/ZoomFit.js";
import { ProgressBar } from "./jsm/ProgressBar.js";
import { TreeView } from "./jsm/TreeView.js";
import { MarkUp } from "./jsm/MarkUp.js";
import { Screen } from "./jsm/Screen.js";
import { Clipping } from "./jsm/Clipping.js";
import { IntersectionTest } from "./jsm/IntersectionTest.js";
import { Area } from "./jsm/Area.js";
import { FirstPerson } from "./jsm/FirstPerson.js";
import { FlyView } from "./jsm/FlyView.js";
import { ViewPort } from "./jsm/ViewPort.js";
import { Interpolation } from "./jsm/interpolation.js";

export default class BimViewer {
  constructor(info) {
    this.canvasId = info.canvasId; 
    this.glbListElement = info.glbListElement; 
    this.viewMode = info.viewMode; 

    this.container = document.getElementById(this.canvasId);
    this.scene = new THREE.Scene();

    this.glbList = {};
    this.meshes = [];

    this.glbTextureList = {};
    this.meshMaterialTextures = [];

    this.glbAttributeList = {};
    this.glbListForJson = {};
    this.glbAttributeNameConvert = {};
    this.glbAttributeNames = {};

    this.meshGroup = new THREE.Group();
    this.meshGroup.name = "meshGroup";

    this.zoomFit = null;
    this.keyStates = [];

    this.clock = new THREE.Clock();
    this.startColor = new THREE.Color(0xff0000);
    this.targetColor = new THREE.Color(0x0000ff);
    this.blob = null;
    this.url = null;
  }

  init() {
    this._setBVH();
    this._setRenderer();
    this._setCss2DRenderer();
    this._setCamera();
    this._setLight();
    this._setControls();
    this._resize();
    window.addEventListener("resize", this._resize.bind(this));
  }

  addComponent() {
    this._setGlbLoader();
    this._setEnvironmentMapping();
    this._setNavigationGizmo();
    this._setProgressBar();
    this._setCanvasClick();
    this._setKeycode();
    this._setClippingMode();
    this._setScreen();
    this._getQueryParameter();
    this._setViewPort();
  }

  _updateAfterLoadModel() {
    this._setZoomFit(this.meshGroup);
    this._updateLight();
    this._setShadowPlane();
    this._setGrid();
    this._setAxes();
    this._hideProgress();
    this._resetSetting();
  }

  _addScene() {
    this._addMeshesToScene();
    this._updateAfterLoadModel();
    this._addMeshesToTreeView();
  }

  removeScene(glbUrl) {
    this._removeMeshesFromScene();
    this._removeMeshesFromTree(glbUrl);
    this._addScene();
  }

  removeSceneAll() {
    this._removeMeshesFromScene();
    this._removeAllMeshesFromTree();
    this._addScene();
  }

  _setRenderer() {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;
    renderer.physicallyCorrectLights = true;
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 2;
    this.renderer = renderer;
    this.container.appendChild(this.renderer.domElement);
  }

  _setCss2DRenderer() {
    const css2DRenderer = new CSS2DRenderer();
    css2DRenderer.domElement.style.cssText =
      "draggable: false; position: absolute; overflow: hidden; top: 0; pointer-events: none";
    this.css2DRenderer = css2DRenderer;
    this.container.appendChild(this.css2DRenderer.domElement);
  }

  _setCamera() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    const aspect = width / height;

    const pCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    pCamera.position.set(0, 20, 40);
    this.pCamera = pCamera;

    const oCamera = new THREE.OrthographicCamera(
      width / -aspect,
      width / aspect,
      height / aspect,
      height / -aspect,
      0.1,
      1000
    );
    oCamera.zoom = 1.0;
    oCamera.position.set(0, 20, 40);
    this.oCamera = oCamera;

    this.camera = this.pCamera;
    this.scene.add(this.camera);

    this.interpolation = new Interpolation(
      this.camera,
      this.renderer,
      this.scene
    );
  }

  _setLight() {
    const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 1);
    this.scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight("white", 1);
    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.bias = -1e-4;
    directionalLight.shadow.normalBias = 0.05;
    this.directionalLight = directionalLight;
    this.scene.add(this.directionalLight);

    const lightAttachCamera = new THREE.DirectionalLight("white", 0.5);
    lightAttachCamera.position.set(0, 0, 1);
    this.lightAttachCamera = lightAttachCamera;
    this.camera.add(this.lightAttachCamera);
  }

  _setControls() {
    const orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    orbitControls.autoRotate = false;
    orbitControls.autoRotateSpeed = -3;
    orbitControls.screenSpacePanning = true;
    orbitControls.minDistance = -100;
    orbitControls.zoomSpeed = 0.9;
    orbitControls.rotateSpeed = 0.7;
    orbitControls.panSpeed = 0.7;
    orbitControls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    orbitControls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    this.orbitControls = orbitControls;
  }

  _resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    const aspect = width / height;

    this.camera.aspect = aspect;

    if (this.camera.isOrthographicCamera) {
      this.camera.left = width / -aspect;
      this.camera.right = width / aspect;
      this.camera.top = height / aspect;
      this.camera.bottom = height / -aspect;
    }

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.css2DRenderer.setSize(width, height);
    if (this.composer) this.composer.setSize(width, height);
  }

  animate() {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.orbitControls.update();

    if (this.orientationGizmo) this.orientationGizmo.update();

    this.css2DRenderer.render(this.scene, this.camera);

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.renderer.setAnimationLoop(this.animate.bind(this));

    if (!this.meshes.length) return;

    const t = Math.sin(elapsedTime * 0.75) / 2 + 0.5; // 범위: 0 ~ 1

    if (Picking.clonedPickedMesh) {
      Picking.clonedPickedMesh.material.emissive = new THREE.Color().lerpColors(
        this.startColor,
        this.targetColor,
        t
      );
    }

    this._updateKeyStates(delta);
    if (this.flyView.isFlyViewMode)
      return this.flyView._flyViewKeyStates(delta);
    if (this.firstPerson.isFirstPerson)
      return this.firstPerson.updateRender(delta);

    this._zoomInfinite(delta);
    this.firstPerson.isNotFirstPerson = () => {
      this.orbitControls.maxPolarAngle = Math.PI;
    };
    this.orbitControls.maxPolarAngle = Math.PI;
  }

  _zoomInfinite(delta) {
    let distanceCamera = this.orbitControls.target.distanceTo(
      this.orbitControls.object.position
    );

    const minDistance = this.orbitControls.minDistanceSettingValue;

    if (distanceCamera < minDistance) {
      const v1Start = this.orbitControls.object.position;
      const v2End = this.orbitControls.target;
      const v3Result = new THREE.Vector3();
      const scale = 3;

      v2End.copy(
        v3Result
          .subVectors(v2End, v1Start)
          .normalize()
          .multiplyScalar(scale)
          .add(v2End)
      );
      this.orbitControls.update();
    }
  }

  _updateControlsTargetInfo() {
    if (document.getElementById("controlsInfo")) {
      const distanceCamera = this.orbitControls.target.distanceTo(
        this.orbitControls.object.position
      );
      const memory = performance.memory;

      document.querySelector("#CameraX").textContent =
        this.camera.position.x.toFixed(2);
      document.querySelector("#CameraY").textContent =
        this.camera.position.y.toFixed(2);
      document.querySelector("#CameraZ").textContent =
        this.camera.position.z.toFixed(2);
      document.querySelector("#TargetX").textContent =
        this.orbitControls.target.x.toFixed(2);
      document.querySelector("#TargetY").textContent =
        this.orbitControls.target.y.toFixed(2);
      document.querySelector("#TargetZ").textContent =
        this.orbitControls.target.z.toFixed(2);
      document.querySelector("#distance").textContent =
        distanceCamera.toFixed(2);
      document.querySelector("#Memory").textContent = (
        memory.usedJSHeapSize / 1048576
      ).toFixed(2); 
    } else {
      this._addControlsHtmlElement();
    }
  }

  _addControlsHtmlElement() {
    const $div = document.createElement("div");
    $div.id = "controlsInfo";
    $div.style.cssText =
      "z-index: 1000; position: absolute; bottom: 0; left: 0; padding: 3px; font-size: 10px; background: rgba(0, 0, 0, 0.5); color: white; pointer-events: auto;";
    $div.innerHTML = `
            Camera 
            X: <span id="CameraX"></span>,
            Y: <span id="CameraY"></span>,
            Z: <span id="CameraZ"></span>
            /
            Target 
            X: <span id="TargetX"></span>,
            Y: <span id="TargetY"></span>,
            Z: <span id="TargetZ"></span>
            / 
            distance: <span id="distance"></span>
            /
            memory : <span id="Memory"></span>
        `;
    document.body.appendChild($div);
  }

  _getQueryParameter() {
    const searchParams = new URLSearchParams(window.location.search);
    const glbUrl = searchParams.get("glbUrl");
    const csvUrl = searchParams.get("csvUrl");

    if (glbUrl) this.asyncLoadGlb(glbUrl, csvUrl);
  }

  _setBVH() {
    THREE.Mesh.prototype.raycast = acceleratedRaycast;
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  }

  _setGlbLoader() {
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("./basis/").detectSupport(this.renderer);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("./draco/gltf/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setKTX2Loader(ktx2Loader);
    gltfLoader.setDRACOLoader(dracoLoader);
    this.gltfLoader = gltfLoader;
  }

  async asyncLoadGlbFromFileBlob(glbName, glbBlob, csvBlob) {
    const glbUrl = URL.createObjectURL(glbBlob);
    const gltfData = await this.gltfLoader.loadAsync(glbUrl, (xhr) =>
      this._onProgress(xhr, glbUrl)
    );
    const model = gltfData.scene;
    model.name = "glbUrlModelGroup";
    model.updateMatrixWorld(true);
    this.content = model;
    this._traverseModel(model);

    const csvUrl = csvBlob === undefined ? null : URL.createObjectURL(csvBlob);
    await this._setGlbList(glbUrl, csvUrl, glbName);
    this._addScene();
  }

  async asyncLoadGlb(glbUrl, csvUrl) {
    const gltfData = await this.gltfLoader.loadAsync(glbUrl, (xhr) =>
      this._onProgress(xhr, glbUrl)
    );
    const model = gltfData.scene;
    model.name = "glbUrlModelGroup";
    model.updateMatrixWorld(true);
    this.content = model;

    this._traverseModel(model);
    await this._setGlbList(glbUrl, csvUrl);
    this._addScene();
  }

  _traverseModel(model) {
    this.tempSort = [];

    model.traverse((child) => {
      if (!child.isMesh) return;

      child.material.side = 0;
      child.layers.enable(1);
      child.castShadow = true;
      child.receiveShadow = false;
      child.material.shadowSide = 2;
      child.material.depthTest = true;
      child.material.depthWrite = true;

      this.tempSort.push(child);
    });
  }

  async _setGlbList(glbUrl, csvUrl, displayName) {
    const glbName =
      displayName === undefined ? this._getGlbName(glbUrl) : displayName;
    const glbMeshes = [];
    const glbTextures = [];

    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });
    this.tempSort.sort(function (a, b) {
      return collator.compare(a.name, b.name);
    });

    this.tempSort.forEach((mesh) => {
      glbMeshes.push(mesh);
      glbTextures.push(mesh.material.map);
    });

    this.glbList[glbName] = glbMeshes;
    this.glbTextureList[glbName] = glbTextures;
    if (csvUrl) {
      this.glbAttributeList[glbName] = await this.loadAttribute(csvUrl);
    }
  }

  _getGlbName(glbUrl) {
    const glbName = glbUrl.slice(0, glbUrl.indexOf(".glb"));
    return glbName;
  }

  async _convertCsvToText(csvUrl) {
    const res = await fetch(csvUrl);
    return res.text();
  }

  async loadAttribute(csvUrl) {
    let text = await this._convertCsvToText(`${csvUrl}`);

    let cleanedText = text.replace(/[\r\n\t]+/g, "");
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(cleanedText, "application/xml");
    //attributeNames for id to name
    this._makeAttributeNames(xmlDoc);

    let tree = this._makeAttributeTree(
      xmlDoc.querySelector("decomposition").childNodes[0]
    );

    return tree;
  }

  _makeAttributeTree(decomposition) {
    let json = {};
    if (
      decomposition.childNodes.length > 0 &&
      !this._isFile(
        decomposition.childNodes
      ) 
    ) {
      json = {
        IFCType: decomposition.nodeName,
        type: "folder",
      };
      for (let i = 0; i < decomposition.attributes.length; i++) {
        json[decomposition.attributes[i].name] =
          decomposition.attributes[i].nodeValue;
      }
      json["child"] = {};
      for (let i = 0; i < decomposition.childNodes.length; i++) {
        json["child"][decomposition.childNodes[i].id] = this._makeAttributeTree(
          decomposition.childNodes[i]
        );
      }
    } else {
      json = {
        IFCType: decomposition.nodeName,
        type: "file",
      };
      if (decomposition.childNodes.length > 0) {
        for (let i = 0; i < decomposition.childNodes.length; i++) {
          if (json[decomposition.childNodes[i].nodeName]) {
            let count = 2;
            while (json[decomposition.childNodes[i].nodeName + count]) {
              count++;
            }
            json[decomposition.childNodes[i].nodeName + count] =
              decomposition.childNodes[i].attributes[0].nodeValue;
          } else {
            json[decomposition.childNodes[i].nodeName] =
              decomposition.childNodes[i].attributes[0].nodeValue;
          }
        }
      }
      for (let i = 0; i < decomposition.attributes.length; i++) {
        json[decomposition.attributes[i].name] =
          decomposition.attributes[i].nodeValue;
      }
    }
    return json;
  }

  _makeAttributeNames(doc) {
    let materials = doc.querySelector("materials").childNodes;
    for (let j = 0; j < materials.length; j++) {
      let material = materials[j];
      let value = "";
      if (material.nodeName == "IfcMaterialList") {
        for (let i = 0; i < material.childNodes.length; i++) {
          if (i != 0) {
            value += ", ";
          }
          value += material.childNodes[i].attributes["Name"]
            ? material.childNodes[i].attributes["Name"].textContent
            : material.childNodes[i].id;
        }
      } else {
        value = material.attributes["Name"]
          ? material.attributes["Name"].textContent
          : material.id;
      }
      this.glbAttributeNames[material.id] = value;
    }
    let groups = doc.querySelector("groups").childNodes;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].attributes["Name"]) {
        this.glbAttributeNames[groups[i].id] =
          groups[i].attributes["Name"].textContent;
      }
    }
    let layers = doc.querySelector("layers").childNodes;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].attributes["Name"]) {
        this.glbAttributeNames[layers[i].id] =
          layers[i].attributes["Name"].textContent;
      }
    }
    let types = doc.querySelector("types").childNodes;
    for (let i = 0; i < types.length; i++) {
      if (types[i].attributes["Name"]) {
        this.glbAttributeNames[types[i].id] =
          types[i].attributes["Name"].textContent;
      }
    }
    let properties = doc.querySelector("properties").childNodes;
    for (let i = 0; i < properties.length; i++) {
      if (properties[i].attributes["Name"]) {
        this.glbAttributeNames[properties[i].id] =
          properties[i].attributes["Name"].textContent;
      }
    }
  }

  _checkChildNodesName(childNodes, name) {
    for (let i = 0; i < childNodes.length; i++) {
      if (childNodes[i].nodeName == name) {
        return true;
      }
    }
    return false;
  }

  _isFile(childNodes) {
    for (let i = 0; i < childNodes.length; i++) {
      if (childNodes[i].childNodes.length > 0) {
        return false;
      }
    }
    return true;
  }

  _filterNull(arr) {
    const arrFilter = arr.filter((element) => {
      return element !== undefined && element !== null && element !== "";
    });
    return arrFilter;
  }

  _addMeshesToScene() {
    const glbMeshes = Object.values(this.glbList);
    this.meshes = [];
    this.meshes = glbMeshes.flat();

    this.meshes.forEach((mesh) => this.meshGroup.add(mesh));
    this.scene.add(this.meshGroup);

    this._updateMeshesOfInstance();

    const glbTextures = Object.values(this.glbTextureList);
    this.meshMaterialTextures = [];
    this.meshMaterialTextures = glbTextures.flat();
  }

  _addMeshEdgeLine(angle) {
    const geometries = [];

    this.meshes.forEach((mesh) => {
      const cloneGeometry = mesh.geometry.clone();
      cloneGeometry.applyMatrix4(mesh.matrixWorld);

      for (const key in cloneGeometry.attributes) {
        if (key !== "position") {
          cloneGeometry.deleteAttribute(key);
        }
      }
      geometries.push(cloneGeometry);
    });

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geometries,
      false
    );

    const lineGeometry = new THREE.EdgesGeometry(mergedGeometry, angle);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x030303 });
    const meshEdgeLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    meshEdgeLines.name = "meshEdgeLines";
    this.scene.add(meshEdgeLines);
  }

  _updateMeshesOfInstance() {
    if (!this.pickHelper) return;

    this.pickHelper.meshes = this.meshes;
    this.dim.meshes = this.meshes;
    this.markUp.meshes = this.meshes;
    this.intersectionTest.meshes = this.meshes;
    this.area.meshes = this.meshes;
    this.firstPerson.meshes = this.meshes;
    if (this.clipping) this.clipping.meshes = this.meshes;
  }

  _removeMeshesFromScene() {
    this._disposeMesh();
    this.meshGroup.clear();
    this.meshes.length = 0;
    this.meshMaterialTextures.length = 0;
    this.scene.remove(this.scene.getObjectByName("meshGroup"));
  }

  _addMeshesToTreeView() {
    this.treeView = new TreeView(
      this.scene,
      this.camera,
      this.renderer,
      this.meshes,
      this.orbitControls,
      this.glbListElement,
      this.glbList,
      this.glbAttributeList,
      this.glbAttributeNames,
      this.glbAttributeNameConvert
    );
  }

  _removeMeshesFromTree(glbUrl) {
    const glbName = this._getGlbName(glbUrl);
    delete this.glbList[glbName];
    delete this.glbTextureList[glbName];
    delete this.glbAttributeList[glbName];
    delete this.glbListForJson[glbName];
  }

  _removeAllMeshesFromTree() {
    Object.keys(this.glbList).forEach((key) => delete this.glbList[key]);
    Object.keys(this.glbTextureList).forEach(
      (key) => delete this.glbTextureList[key]
    );
    Object.keys(this.glbAttributeList).forEach(
      (key) => delete this.glbAttributeList[key]
    );
    Object.keys(this.glbListForJson).forEach(
      (key) => delete this.glbListForJson[key]
    );
  }

  _setZoomFit(group) {
    if (this.camera.isOrthographicCamera) this._changeToPerspective();

    this.zoomFit = new ZoomFit(
      group,
      this.viewMode,
      this.camera,
      this.orbitControls
    );
  }

  _updateLight() {
    this.directionalLight.position.set(
      this.zoomFit.centerBox.x,
      this.zoomFit.box.min.y + this.zoomFit.sizeBox,
      this.zoomFit.centerBox.z
    );

    this.directionalLight.target.name = "lightSceneTarget";
    this.directionalLight.target.position.copy(this.zoomFit.centerBox);
    this.directionalLight.target.updateMatrixWorld();
    this.scene.add(this.directionalLight.target);

    this.directionalLight.shadow.camera.top = this.zoomFit.sizeBox;
    this.directionalLight.shadow.camera.bottom = -this.zoomFit.sizeBox;
    this.directionalLight.shadow.camera.left = -this.zoomFit.sizeBox;
    this.directionalLight.shadow.camera.right = this.zoomFit.sizeBox;
    this.directionalLight.shadow.camera.far = this.zoomFit.sizeBox + 3;
    const shadowCameraHelper = new THREE.CameraHelper(
      this.directionalLight.shadow.camera
    );
  }

  _setShadowPlane() {
    const prevShadowPlane = this.scene.getObjectByName("shadowPlane");

    if (prevShadowPlane) {
      prevShadowPlane.geometry.dispose();
      prevShadowPlane.material.dispose();
    }

    this.scene.remove(this.scene.getObjectByName("shadowPlane"));

    const planeGeometry = new THREE.PlaneGeometry(
      2 * this.zoomFit.sizeBox,
      2 * this.zoomFit.sizeBox
    );
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.4 });

    const shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    shadowPlane.name = "shadowPlane";
    shadowPlane.position.set(
      this.zoomFit.centerBox.x,
      this.zoomFit.box.min.y - 2,
      this.zoomFit.centerBox.z
    );
    shadowPlane.receiveShadow = false;
    this.shadowPlane = shadowPlane;
    this.scene.add(this.shadowPlane);
  }

  _setGrid() {
    this.scene.remove(this.scene.getObjectByName("gridHelper"));

    const size = 2 * this.zoomFit.sizeBox;
    const divisions = 20;
    const gridHelper = new THREE.GridHelper(size, divisions);
    gridHelper.name = "gridHelper";
    gridHelper.position.x = this.zoomFit.centerBox.x;
    gridHelper.position.y = this.zoomFit.box.min.y - 2;
    gridHelper.position.z = this.zoomFit.centerBox.z;
    gridHelper.visible = false;
    this.gridHelper = gridHelper;
    this.scene.add(this.gridHelper);
  }

  _setAxes() {
    this.scene.remove(this.scene.getObjectByName("axesHelper"));

    const axes = new THREE.AxesHelper(this.zoomFit.sizeBox);
    axes.name = "axesHelper";
    axes.visible = false;
    this.axes = axes;
    this.scene.add(this.axes);
  }

  _setNavigationGizmo() {
    const orientationGizmo = new OrientationGizmo(this.camera);
    this.orientationGizmo = orientationGizmo;
    this.container.appendChild(this.orientationGizmo);

    const $gizmo = document.getElementById("gizmo");
    $gizmo.style.cssText =
      "position: absolute; width: 90px; bottom: 0; right: 0;"; 
    this.orientationGizmo.onAxisSelected = (axis) => {
      switch (axis) {
        case "X":
          this.interpolation.to(
            this.camera.position,
            new THREE.Vector3(
              this.zoomFit.box.max.x + this.zoomFit.sizeBox,
              this.zoomFit.centerBox.y,
              this.zoomFit.centerBox.z
            ),
            800
          );
          break;

        case "-X":
          this.interpolation.to(
            this.camera.position,
            new THREE.Vector3(
              this.zoomFit.box.min.x - this.zoomFit.sizeBox,
              this.zoomFit.centerBox.y,
              this.zoomFit.centerBox.z
            ),
            800
          );
          break;

        case "Y":
          this.interpolation.to(
            this.camera.position,
            new THREE.Vector3(
              this.zoomFit.centerBox.x,
              this.zoomFit.box.max.y + this.zoomFit.sizeBox,
              this.zoomFit.centerBox.z + this.zoomFit.sizeBox * 0.0001
            ),
            800
          );
          break;

        case "-Y":
          this.interpolation.to(
            this.camera.position,
            new THREE.Vector3(
              this.zoomFit.centerBox.x,
              this.zoomFit.box.min.y - this.zoomFit.sizeBox,
              this.zoomFit.centerBox.z + this.zoomFit.sizeBox * 0.0001
            ),
            800
          );
          break;

        case "Z":
          this.interpolation.to(
            this.camera.position,
            new THREE.Vector3(
              this.zoomFit.centerBox.x,
              this.zoomFit.centerBox.y,
              this.zoomFit.box.max.z + this.zoomFit.sizeBox
            ),
            800
          );
          break;

        case "-Z":
          this.interpolation.to(
            this.camera.position,
            new THREE.Vector3(
              this.zoomFit.centerBox.x,
              this.zoomFit.centerBox.y,
              this.zoomFit.box.min.z - this.zoomFit.sizeBox
            ),
            800
          );
          break;
      }

      this.camera.lookAt(
        this.zoomFit.centerBox.x,
        this.zoomFit.centerBox.y,
        this.zoomFit.centerBox.z
      );
      this.orbitControls.target.set(
        this.zoomFit.centerBox.x,
        this.zoomFit.centerBox.y,
        this.zoomFit.centerBox.z
      );
    };
  }

  _setEnvironmentMapping() {
    this.envTexDay = new EnvironmentMapping().day();
    this.envTexNight = new EnvironmentMapping().night();
  }

  _setProgressBar() {
    this.progressBar = new ProgressBar(this.container);
  }

  _onProgress(xhr, glbUrl) {
    if (!this.progressBar) return;

    this.progressBar.onProgress(xhr, glbUrl);
  }

  _hideProgress() {
    if (!this.progressBar) return;

    this.progressBar.hide();
  }

  _onError() {
    this.progressBar.onError();
  }

  _setCanvasClick() {
    this.preventDragClick = new PreventDragClick(this.container);

    this.pickHelper = new PickHelper(this.scene, this.camera, this.meshes);
    this.dim = new Dim(this.scene, this.camera, this.meshes, this.renderer);
    this.markUp = new MarkUp(
      this.scene,
      this.camera,
      this.meshes,
      this.renderer,
      this.orbitControls
    );
    this.intersectionTest = new IntersectionTest(
      this.scene,
      this.camera,
      this.meshes,
      this.renderer
    );
    this.area = new Area(this.scene, this.camera, this.meshes, this.renderer);
    this.firstPerson = new FirstPerson(
      this.scene,
      this.camera,
      this.meshes,
      this.renderer,
      this.orbitControls,
      this.meshGroup,
      this.gltfLoader,
      this.keyStates
    );

    this.container.addEventListener("click", this._onCanvasClick.bind(this));
    this.container.addEventListener(
      "mousemove",
      this._onDimMouseMove.bind(this)
    );
    this.container.addEventListener(
      "contextmenu",
      this._onCanvasRightClick.bind(this)
    );
  }

  _onCanvasClick(event) {
    if (this.preventDragClick.mouseMoved) return;

    switch (Picking.state) {
      case "dim":
        this.dim.mouse.x = (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.dim.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.dim.start();
        break;

      case "markUp":
        this.markUp.mouse.x =
          (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.markUp.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.markUp.setMarkUp();
        break;

      case "pick":
        this.pickHelper.mouse.x =
          (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.pickHelper.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.pickHelper.pick();
        break;

      case "intersection":
        this.intersectionTest.mouse.x =
          (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.intersectionTest.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.intersectionTest.setIntersectionObject();
        break;

      case "area":
        this.area.mouse.x =
          (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.area.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.area.start();
        break;
      case "firstPerson":
        this.firstPerson.mouse.x =
          (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.firstPerson.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.firstPerson.setPosition();
        break;
    }
  }

  _onDimMouseMove(event) {
    event.preventDefault();

    switch (Picking.state) {
      case "dim":
        this.dim.mouse.x = (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.dim.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.dim.drawing();
        break;

      case "area":
        this.area.mouse.x =
          (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.area.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.area.drawing();
        break;
      default:
        return;
    }
  }

  _onCanvasRightClick(event) {
    event.preventDefault();

    switch (Picking.state) {
      case "area":
        this.area.mouse.x =
          (event.offsetX / this.container.clientWidth) * 2 - 1;
        this.area.mouse.y = -(
          (event.offsetY / this.container.clientHeight) * 2 -
          1
        );

        this.area.end();
        break;
      default:
        return;
    }
  }

  _setKeycode() {
    document.addEventListener("mousedown", (event) => {
      this.onTarget = event.target;
    });

    document.addEventListener("keydown", this._onKeydown.bind(this));
    document.addEventListener("keyup", this._onKeyup.bind(this));

    this.flyView = new FlyView(
      this.camera,
      this.orbitControls,
      this.keyStates,
      this.onTarget
    );
  }

  _onKeydown(event) {
    this.keyStates[event.code] = true;
  }

  _onKeyup(event) {
    this.keyStates[event.code] = false;
  }

  _updateKeyStates(delta) {
    if (this.keyStates["Escape"]) {
      if (Picking.selectedElement) {
        Picking.selectedElement.style.background = "";
        Picking.selectedElement = null;
      }

      this.scene.remove(Picking.clonedPickedMesh);
      this.scene.remove(Picking.boxHelper);
    }

    if (this.keyStates["Digit1"] && this.keyStates["ControlLeft"]) {
      this.clipping.cloneOutLine();
    }
  }


  home() {
    this._setZoomFit(this.meshGroup);

    document.querySelector(".hamburger").click();
  }

  setScale(id, dir) {
    const value = document.getElementById(id).value;

    const delta = new THREE.Vector3().subVectors(
      new THREE.Vector3(0, 0, 0),
      this.zoomFit.centerBox
    );

    for (const mesh of this.meshes) {
      mesh.scale[dir] = value;
      mesh.position[dir] = delta[dir] * value - delta[dir];
    }
  }

  resetScale() {
    document.getElementById("scaleX").value = 1;
    document.getElementById("scaleY").value = 1;
    document.getElementById("scaleZ").value = 1;
    this.setScale("scaleX", "x");
    this.setScale("scaleY", "y");
    this.setScale("scaleZ", "z");
  }

  _setClippingMode() {
    this.clipping = new Clipping(
      this.scene,
      this.camera,
      this.meshes,
      this.renderer,
      this.orbitControls
    );
  }

  setExplode(id, dir) {
    const value = document.getElementById(id).value;

    const v1 = new THREE.Vector3(
      this.zoomFit.centerBox.x,
      this.zoomFit.centerBox.y,
      this.zoomFit.centerBox.z
    );

    let xFactor = this.zoomFit.box.max.x - this.zoomFit.box.min.x;
    let yFactor = this.zoomFit.box.max.y - this.zoomFit.box.min.y;
    let zFactor = this.zoomFit.box.max.z - this.zoomFit.box.min.z;

    let maxFactor =
      xFactor > yFactor
        ? xFactor > zFactor
          ? xFactor
          : zFactor
        : yFactor > zFactor
        ? yFactor
        : zFactor;

    let factor;

    switch (dir) {
      case "x":
        factor = maxFactor / xFactor;
        break;
      case "y":
        factor = maxFactor / yFactor;
        break;
      case "z":
        factor = maxFactor / zFactor;
        break;
    }

    this.meshes.forEach((mesh) => {
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const v2 = boundingBox.getCenter(new THREE.Vector3());
      const v3 = new THREE.Vector3();

      if (!mesh.originV2) {
        mesh.originV2 = v2;
      }

      mesh.position[dir] = v3
        .subVectors(mesh.originV2, v1)
        .multiplyScalar(value * factor * 3)[dir];
    });
  }

  resetExplode() {
    document.getElementById("explodeX").value = 0;
    document.getElementById("explodeY").value = 0;
    document.getElementById("explodeZ").value = 0;
    this.setExplode("explodeX", "x");
    this.setExplode("explodeY", "y");
    this.setExplode("explodeZ", "z");
  }

  _setScreen() {
    this.screen = new Screen(this.scene, this.camera, this.renderer);
  }

  _setViewPort() {
    this.viewPort = new ViewPort(
      this.container,
      this.renderer,
      this.scene,
      this.camera,
      this.orbitControls,
      this
    );
  }

  changeWireframe() {
    const isChecked = document.querySelector("#chkWireframe").checked;

    for (const mesh of this.meshes)
      mesh.material.wireframe = isChecked ? true : false;
  }

  changeSolid() {
    const isChecked = document.querySelector("#chkSolid").checked;

    if (isChecked) {
      this.meshes.forEach((mesh) => {
        mesh.material.map = null;
        mesh.material.needsUpdate = true;
      });
    } else {
      this.meshes.forEach((mesh, i) => {
        mesh.material.map = this.meshMaterialTextures[i];
        mesh.material.needsUpdate = true;
      });
    }
  }

  changeGrid() {
    const isChecked = document.querySelector("#chkGridHelper").checked;

    this.gridHelper.visible = isChecked ? true : false;
  }

  changeAxes() {
    const isChecked = document.querySelector("#chkAxeSwitch").checked;

    this.axes.visible = isChecked ? true : false;
  }

  changeAutoRotate() {
    const isChecked = document.querySelector("#chkAutoRotate").checked;

    this.orbitControls.autoRotate = isChecked ? true : false;
  }

  changeCameraMode() {
    if (this.camera.isPerspectiveCamera) {
      this._changeToOrtho();
    } else if (this.camera.isOrthographicCamera) {
      this._changeToPerspective();
    }
  }

  _changeToOrtho() {
    this.oCamera.near = 0.001;
    this.oCamera.far = this.pCamera.far;
    this.oCamera.zoom =
      Math.min(
        window.innerWidth / (this.zoomFit.box.max.x - this.zoomFit.box.min.x),
        window.innerHeight / (this.zoomFit.box.max.y - this.zoomFit.box.min.y)
      ) * 0.4;

    this.camera = this.oCamera;
    this.camera.position.copy(this.pCamera.position);
    this.camera.updateProjectionMatrix();

    this._updateCameraOfInstance(this.camera);
    this._resize();

    document.getElementById("radioBgNone").click();
  }

  _changeToPerspective() {
    this.camera = this.pCamera;
    this.camera.position.copy(this.oCamera.position);
    this.camera.updateProjectionMatrix();

    this._updateCameraOfInstance(this.camera);
    this._resize();
  }

  _updateCameraOfInstance(camera) {
    this.orbitControls.object = camera;
    this.orbitControls.target.set(
      this.zoomFit.centerBox.x,
      this.zoomFit.centerBox.y,
      this.zoomFit.centerBox.z
    );
    this.orbitControls.update();

    this.pickHelper.camera = camera;
    this.dim.camera = camera;
    this.markUp.camera = camera;
    this.intersectionTest.camera = camera;
    this.area.camera = camera;
    if (this.orientationGizmo) this.orientationGizmo.camera = camera;
    this.treeView.camera = camera;
  }

  changeShadowPlane() {
    const isChecked = document.querySelector("#chkShadow").checked;

    this.shadowPlane.receiveShadow = isChecked ? true : false;
  }

  changeMeshShadow() {
    const isChecked = document.querySelector("#chkMeshShadow").checked;

    for (const mesh of this.meshes)
      mesh.receiveShadow = isChecked ? true : false;
  }

  changeMeshSide() {
    const isChecked = document.querySelector("#chkMeshSide").checked;

    for (const mesh of this.meshes) {
      mesh.material.side = isChecked ? 2 : 0;
      mesh.material.needsUpdate = true;
    }
  }

  changeShowClippingLine(bOn) {
    this.clipping.isClippedEdgesMode = bOn;
    if (this.clipping.outlineLines) {
      this.clipping.outlineLines.visible = bOn;
    }
  }

  changeBackground(event) {
    const value = event.target.value;

    switch (value) {
      case "option1":
        this.scene.background = new THREE.Color("#f7f5f8");
        this.scene.environment = null;
        break;
      case "option2":
        this.scene.background = this.scene.environment = this.envTexDay;
        break;
      case "option3":
        this.scene.background = this.scene.environment = this.envTexNight;
        break;
    }

    const $checkOrthoCamera = document.getElementById("chkCamera");

    if ($checkOrthoCamera.checked) {
      alert("직교모드에서는 배경을 사용할 수 없습니다");
      document.getElementById("radioBgNone").checked = true;
      this.scene.background = this.scene.environment = null;
    }
  }

  changeExposure(event) {
    this.renderer.toneMappingExposure = event.target.value;
  }

  changePostProcessing() {
    const isChecked = document.querySelector("#chkPostProcessing").checked;

    if (isChecked) {
      this.composer = new EffectComposer(this.renderer);

      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      const ssaoPass = new SSAOPass(this.scene, this.camera, width, height);
      ssaoPass.kernelRadius = 16;
      ssaoPass.minDistance = 0.02;

      this.composer.addPass(ssaoPass);

      const outputPass = new ShaderPass(GammaCorrectionShader);
      this.composer.addPass(outputPass);
    } else {
      this.composer = null;
    }
  }

  changeSnappingMode(bOn) {
    Picking.snapping = bOn;
  }

  _resetSetting() {
    const viewSetting = document.querySelectorAll("input[name=viewSetting]");
    viewSetting.forEach((value) => (value.checked = false));

    this.changeWireframe();
    this.changeSolid();
    this.changeGrid();
    this.changeAxes();
    this.changeAutoRotate();
    this.changeShadowPlane();
    this.changeMeshShadow();
    this.changeMeshSide();

    document.getElementById("radioBgNone").checked = true;
    this.scene.background = new THREE.Color("#f7f5f8");
    this.scene.environment = null;

    document.getElementById("rangeExposure").value = 2.0; 
    this.renderer.toneMappingExposure = 2.0;
  }

  _disposeMesh() {
    if (!this.content) return;

    this.meshGroup.traverse((mesh) => {
      if (!mesh.isMesh) return;

      mesh.geometry.dispose();
      mesh.material.dispose();

      for (const key in mesh.material) {
        if (
          key !== "envMap" &&
          mesh.material[key] &&
          mesh.material[key].isTexture
        ) {
          mesh.material[key].dispose();
        }
      }
    });

    console.log("memory check", this.renderer.info.memory);
  }

  getCameraInfo() {
    let result = {
      position: {
        x: bimViewer.camera.position.x,
        y: bimViewer.camera.position.y,
        z: bimViewer.camera.position.z,
      },
      targetPosition: {
        x: bimViewer.orbitControls.target.x,
        y: bimViewer.orbitControls.target.y,
        z: bimViewer.orbitControls.target.z,
      },
      FOV: bimViewer.camera.fov,
    };
    return result;
  }
}
