import {
  Mesh,
  MeshStandardMaterial,
  Line3,
  Vector3,
  AnimationMixer,
  Matrix4,
  Box3,
  Quaternion,
} from "three";
import { acceleratedRaycast, MeshBVH, MeshBVHVisualizer } from "three-mesh-bvh";

import * as BufferGeometryUtils from "../three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "../three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { Picking } from "./Picking.js";
import { TreeView } from "./TreeView.js";
import { Interpolation } from "./interpolation.js";

Mesh.prototype.raycast = acceleratedRaycast;

export class FirstPerson extends Picking {
  constructor(
    scene,
    camera,
    meshes,
    renderer,
    controls,
    meshGroup,
    gltfLoader,
    keyStates
  ) {
    super(scene, camera, meshes);
    this.renderer = renderer;
    this.controls = controls;

    this.meshGroup = meshGroup;

    this.gltfLoader = gltfLoader;
    this.keyStates = keyStates;

    this.isRun = false;
    this.isFirstPerson = false;
    this.playerIsOnGround = false;
    this.initCameraPosition = null;
    this.directionOffset = 0;
  }

  resetFirstPerson() {
    if (this.isFirstPerson) {
      const { x, y, z } = this.initCameraPosition;
      this.interpolation.to(this.camera.position, new Vector3(x, y, z), 800);
    }

    this.isFirstPerson = false;
    TreeView.isFitSelectedMesh = false;

    if (this.player) this.player.visible = false;
    this.scene.remove(this.colliderMesh);
  }

  setState() {
    this._makeCollider();

    this.interpolation = new Interpolation(
      this.camera,
      this.renderer,
      this.scene
    );

    Picking.state = "firstPerson";
    this.renderer.domElement.style.cursor = "crosshair";

    TreeView.isFitSelectedMesh = false;

    if (this.player) {
      this.player.visible = true;
      return;
    }

    this._addPlayer();
  }

  setPosition() {
    super.findIntersect();

    if (!this.intersects.length) return;

    this.initCameraPosition = this.camera.position.clone();

    const startPoint = this.intersects[0].point;
    startPoint.y = startPoint.y + 10;
    this.startPoint = startPoint;

    this._resetPlayer();

    this.isFirstPerson = true;

    Picking.state = "pick";
    this.renderer.domElement.style.cursor = "default";
  }

  _addPlayer() {
    const player = new Mesh(
      new RoundedBoxGeometry(1.0, 2.0, 1.0, 10, 0.5),
      new MeshStandardMaterial({ color: "#ffffff" })
    );

    player.geometry.translate(0, -0.5, 0);

    player.capsuleInfo = {
      radius: 0.5,
      segment: new Line3(new Vector3(), new Vector3(0.0, -1.0, 0.0)),
    };
    player.name = "player";
    player.castShadow = true;
    player.receiveShadow = true;
    player.material.shadowSide = 2;
    player.material.wireframe = true;
    player.visible = true;
    this.player = player;

    this.scene.add(this.player);

    this.actions = [];

    this.gltfLoader.load("../models/character/character_kd.glb", (glb) => {
      const character = glb.scene;
      character.traverse((child) => {
        if (!child.isMesh) return;

        child.castShadow = true;
        child.receiveShadow = true;
        child.material.shadowSide = 2;
      });
      character.visible = false;
      character.scale.set(0.01, 0.01, 0.01);
      character.position.copy(this.player.position);
      character.animations = glb.animations;
      this.character = character;

      this.mixer = new AnimationMixer(this.character);

      this.actions[0] = this.mixer.clipAction(this.character.animations[2]);
      this.actions[1] = this.mixer.clipAction(this.character.animations[4]);
      this.actions[2] = this.mixer.clipAction(this.character.animations[3]);
      this.actions[3] = this.mixer.clipAction(this.character.animations[1]);
      this.actions[4] = this.mixer.clipAction(this.character.animations[0]);
      this.currentAction = this.actions[4];

      this.scene.add(this.character);
    });
  }

  _makeCollider() {
    const geometries = [];
    this.meshGroup.updateMatrixWorld(true);
    this.meshGroup.traverse((mesh) => {
      if (!mesh.geometry) return;

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

    const colliderBvh = new MeshBVH(mergedGeometry, { maxDepth: 80 });
    mergedGeometry.boundsTree = colliderBvh;

    const colliderMesh = new Mesh(mergedGeometry);
    colliderMesh.name = "collider";
    colliderMesh.visible = false;
    colliderMesh.material.wireframe = false;
    this.colliderMesh = colliderMesh;
  }

  _resetPlayer() {
    this.playerVelocity = new Vector3();
    this.playerVelocity.set(0, 0, 0);

    this.player.position.copy(this.startPoint);
    this.controls.target.copy(this.player.position);

    const moveCameraPos = this.camera.position
      .clone()
      .sub(this.controls.target)
      .normalize()
      .multiplyScalar(2);
    moveCameraPos.add(this.player.position);

    this.interpolation.to(
      this.camera.position,
      new Vector3(moveCameraPos.x, moveCameraPos.y - 8, moveCameraPos.z),
      800
    );

    this.controls.update();
  }

  updatePlayer(delta) {
    let tempVector = new Vector3();
    let tempVector2 = new Vector3();
    let upVector = new Vector3(0, 1, 0);
    let tempBox = new Box3();
    let tempMat = new Matrix4();
    let tempSegment = new Line3();

    let playerSpeed = this.isRun ? 30 : 3;
    const GRAVITY = -30;

    this.playerVelocity.y += this.playerIsOnGround ? 0 : delta * GRAVITY;
    this.player.position.addScaledVector(this.playerVelocity, delta);

    const angle = this.controls.getAzimuthalAngle();

    const previousAction = this.currentAction;
    this.currentAction = this.actions[0];

    if (this.keyStates["KeyW"]) {
      tempVector.set(0, 0, -1).applyAxisAngle(upVector, angle);
      this.player.position.addScaledVector(tempVector, playerSpeed * delta);
      this.directionOffset = 0;
      this.currentAction = this.isRun ? this.actions[2] : this.actions[1];
    }

    if (this.keyStates["KeyS"]) {
      tempVector.set(0, 0, 1).applyAxisAngle(upVector, angle);
      this.player.position.addScaledVector(tempVector, playerSpeed * delta);
      this.directionOffset = Math.PI;
      this.currentAction = this.isRun ? this.actions[2] : this.actions[1];
    }

    if (this.keyStates["KeyA"]) {
      tempVector.set(-1, 0, 0).applyAxisAngle(upVector, angle);
      this.player.position.addScaledVector(tempVector, playerSpeed * delta);
      this.directionOffset = Math.PI / 2;
      this.currentAction = this.isRun ? this.actions[2] : this.actions[1];
    }

    if (this.keyStates["KeyD"]) {
      tempVector.set(1, 0, 0).applyAxisAngle(upVector, angle);
      this.player.position.addScaledVector(tempVector, playerSpeed * delta);
      this.directionOffset = -Math.PI / 2;
      this.currentAction = this.isRun ? this.actions[2] : this.actions[1];
    }

    if (this.keyStates["KeyX"]) {
      this.currentAction = this.actions[4];
    }

    if (this.playerVelocity.y < -8) {
      this.currentAction = this.actions[3];
    }

    if (this.keyStates["Space"]) {
      if (this.playerIsOnGround) {
        this.playerVelocity.y = 20.0;
      }
    }

    if (previousAction !== this.currentAction) {
      previousAction.fadeOut(0.5);
      this.currentAction.reset().fadeIn(0.1).play();
    }

    this.player.updateMatrixWorld();

    const capsuleInfo = this.player.capsuleInfo;
    tempBox.makeEmpty();
    tempMat.copy(this.colliderMesh.matrixWorld).invert();
    tempSegment.copy(capsuleInfo.segment);

    tempSegment.start
      .applyMatrix4(this.player.matrixWorld)
      .applyMatrix4(tempMat);
    tempSegment.end.applyMatrix4(this.player.matrixWorld).applyMatrix4(tempMat);

    tempBox.expandByPoint(tempSegment.start);
    tempBox.expandByPoint(tempSegment.end);

    tempBox.min.addScalar(-capsuleInfo.radius);
    tempBox.max.addScalar(capsuleInfo.radius);

    this.colliderMesh.geometry.boundsTree.shapecast({
      intersectsBounds: (box) => box.intersectsBox(tempBox),

      intersectsTriangle: (tri) => {
        const triPoint = tempVector;
        const capsulePoint = tempVector2;

        const distance = tri.closestPointToSegment(
          tempSegment,
          triPoint,
          capsulePoint
        );
        if (distance < capsuleInfo.radius) {
          const depth = capsuleInfo.radius - distance;
          const direction = capsulePoint.sub(triPoint).normalize();

          tempSegment.start.addScaledVector(direction, depth);
          tempSegment.end.addScaledVector(direction, depth);
        }
      },
    });

    const newPosition = tempVector;
    newPosition
      .copy(tempSegment.start)
      .applyMatrix4(this.colliderMesh.matrixWorld);

    const deltaVector = tempVector2;
    deltaVector.subVectors(newPosition, this.player.position);

    this.playerIsOnGround =
      deltaVector.y > Math.abs(delta * this.playerVelocity.y * 0.25);

    const offset = Math.max(0.0, deltaVector.length() - 1e-5);
    deltaVector.normalize().multiplyScalar(offset);

    this.player.position.add(deltaVector);

    if (!this.playerIsOnGround) {
      deltaVector.normalize();
      this.playerVelocity.addScaledVector(
        deltaVector,
        -deltaVector.dot(this.playerVelocity)
      );
    } else {
      this.playerVelocity.set(0, 0, 0);
    }

    this.camera.position.sub(this.controls.target);
    this.controls.target.copy(this.player.position);
    this.camera.position.add(this.player.position);

    if (this.player.position.y < -25) {
      this._resetPlayer();
    }
  }

  updateRender(delta) {
    if (this.isFirstPerson && this.colliderMesh && this.mixer) {
      this.mixer.update(delta);

      const angleCameraDirectionAxisY =
        Math.atan2(
          this.camera.position.x - this.player.position.x,
          this.camera.position.z - this.player.position.z
        ) + Math.PI;

      const rotateQuarternion = new Quaternion();
      rotateQuarternion.setFromAxisAngle(
        new Vector3(0, 1, 0),
        angleCameraDirectionAxisY + this.directionOffset
      );

      this.character.quaternion.rotateTowards(
        rotateQuarternion,
        5 * (Math.PI / 180)
      );

      this.character.position.copy(this.player.position);
      this.character.position.sub(new Vector3(0, 1.5, 0));

      this.controls.maxPolarAngle = Math.PI / 2;
      this.updatePlayer(delta);
    } else {
      this.isNotFirstPerson();
    }
  }

  isNotFirstPerson() {}
}
