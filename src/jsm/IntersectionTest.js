import * as THREE from "three";
import { Picking } from "./Picking.js";

export class IntersectionTest extends Picking {
  static selectedMesh = { a: undefined, b: undefined };
  static clonedMesh = { a: undefined, b: undefined };

  constructor(scene, camera, meshes, renderer) {
    super(scene, camera, meshes);
    this.renderer = renderer;
    this.init();
  }

  setState(index, ele) {
    Picking.state = "intersection";
    this.index = index;
    this.ele = ele;
  }

  init() {
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setFromPoints([
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
    ]);
    this.intersection_line = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 5,
        fog: false,
        depthTest: false,
        depthWrite: false,
        side: 2,
        transparent: true,
      })
    );

    this.intersection_line_bgLine = this.intersection_line.clone();
    this.intersection_line_bgLine.material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 5,
      transparent: true,
      opacity: 1,
      fog: false,
      side: 2,
      depthTest: false,
      depthWrite: false,
    });
    this.intersection_line_bgLine.renderOrder = 3;

    this.intersection_lineGroup = new THREE.Group();
    this.intersection_lineGroup.add(
      this.intersection_line,
      this.intersection_line_bgLine
    );
    this.intersection_lineGroup.visible = false;
    this.scene.add(this.intersection_lineGroup);
  }

  setIntersectionObject() {
    super.findIntersect();
    if (this.intersects.length) {
      const selectedColorMaterial = new THREE.MeshPhysicalMaterial({
        color: "#ff8747",
        roughness: 0.4,
        metalness: 1.0,
        emissive: "yellow",
        side: 2,
        transparent: true,
        opacity: 0.7,
        depthTest: false,
      });

      switch (this.index) {
        case "a":
          this.scene.remove(IntersectionTest.clonedMesh.a);
          IntersectionTest.selectedMesh.a = this.intersects[0];

          IntersectionTest.clonedMesh.a =
            IntersectionTest.selectedMesh.a.object.clone();
          IntersectionTest.clonedMesh.a.name = "clonedMesh.a";
          IntersectionTest.clonedMesh.a.material = selectedColorMaterial;
          this.scene.add(IntersectionTest.clonedMesh.a);
          this.ele.style.border = "0.4rem solid #0a58ca";
          break;
        case "b":
          this.scene.remove(IntersectionTest.clonedMesh.b);
          IntersectionTest.selectedMesh.b = this.intersects[0];

          IntersectionTest.clonedMesh.b =
            IntersectionTest.selectedMesh.b.object.clone();
          IntersectionTest.clonedMesh.b.name = "clonedMesh.a";
          IntersectionTest.clonedMesh.b.material = selectedColorMaterial;
          this.scene.add(IntersectionTest.clonedMesh.b);
          this.ele.style.border = "0.4rem solid #0a58ca";
          break;
      }
    }
    Picking.state = "pick";
    if (IntersectionTest.selectedMesh.a && IntersectionTest.selectedMesh.b)
      this.check();
  }

  check() {
    if (IntersectionTest.selectedMesh.a && IntersectionTest.selectedMesh.b) {
      IntersectionTest.selectedMesh.a.object.geometry.boundsTree =
        IntersectionTest.selectedMesh.a.object.geometry.computeBoundsTree();
      IntersectionTest.selectedMesh.b.object.geometry.boundsTree =
        IntersectionTest.selectedMesh.b.object.geometry.computeBoundsTree();

      const matrix2to1 = new THREE.Matrix4()
        .copy(IntersectionTest.selectedMesh.a.object.matrixWorld)
        .invert()
        .multiply(IntersectionTest.selectedMesh.b.object.matrixWorld);

      const edge = new THREE.Line3();
      const results = [];
      IntersectionTest.selectedMesh.a.object.geometry.boundsTree.bvhcast(
        IntersectionTest.selectedMesh.b.object.geometry.boundsTree,
        matrix2to1,
        {
          intersectsTriangles(triangle1, triangle2) {
            if (triangle1.intersectsTriangle(triangle2, edge)) {
              const { start, end } = edge;
              results.push(start.x, start.y, start.z, end.x, end.y, end.z);
            }
          },
        }
      );

      const $msg = document.querySelector(".menu_intersect .msg");

      if (results.length) {
        const geometry = this.intersection_line.geometry;
        const posArray = geometry.attributes.position.array;
        if (posArray.length < results.length) {
          geometry.dispose();
          geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(new Float32Array(results), 3, false)
          );
        } else {
          posArray.set(results);
        }

        geometry.setDrawRange(0, results.length / 3);
        geometry.attributes.position.needsUpdate = true;
        this.intersection_lineGroup.visible = true;

        $msg.innerHTML =
          '  선택한 두 Mesh의 <span style="color : #ff0000;">교차 영역이 존재합니다.</span>';
      } else {
        this.intersection_lineGroup.visible = false;
        $msg.innerHTML =
          '  선택한 두 Mesh의 <span style="color : #0000ff;">교차 영역이 없습니다.</span>';
      }
    }
  }

  reset() {
    Picking.state = "pick";
    this.scene.remove(IntersectionTest.clonedMesh.a);
    this.scene.remove(IntersectionTest.clonedMesh.b);
    this.intersection_lineGroup.visible = false;
    IntersectionTest.selectedMesh.a = undefined;
    IntersectionTest.selectedMesh.b = undefined;
    IntersectionTest.clonedMesh.a = undefined;
    IntersectionTest.clonedMesh.b = undefined;
    this.ele = undefined;

    const $msg = document.querySelector(".menu_intersect .msg");
    $msg.innerHTML = " 확인할 두 Mesh를 선택하세요";

    const $$btn = document.querySelectorAll(".menu_intersect .btn-primary");
    $$btn.forEach((ele) => {
      ele.style.border = "";
    });
  }
}
