import { MeshPhysicalMaterial, BoxHelper } from "three";
import { Picking } from "./Picking.js";

export class PickHelper extends Picking {
  constructor(scene, camera, meshes) {
    super(scene, camera, meshes);
  }

  pick() {
    if (Picking.selectedElement) {
      Picking.selectedElement.style.background = "";
      Picking.selectedElement = null;
    }

    this.scene.remove(Picking.clonedPickedMesh);
    this.scene.remove(Picking.boxHelper);

    super.findIntersect();

    if (!this.intersects.length) return;

    console.log("this.intersects[0] :", this.intersects[0]);

    Picking.pickedMesh = this.intersects[0].object;
    Picking.selectedElement = document.querySelector(
      '[uuid="' + Picking.pickedMesh.uuid + '"]'
    );

    if (Picking.selectedElement) {
      Picking.selectedElement.scrollIntoView({ behavior: "smooth" });
      Picking.selectedElement.style.background = "#e6e8ff";
      Picking.selectedElement.click();
    } else {
      document.querySelector(".detail_table .btn-close").click();
      const selectedColorMaterial = new MeshPhysicalMaterial({
        color: "#ff8747",
        roughness: 0.4,
        metalness: 1.0,
        emissive: "blue",
        side: 2,
        transparent: true,
        opacity: 0.7,
        depthTest: false,
      });
      Picking.clonedPickedMesh = Picking.pickedMesh.clone();
      Picking.clonedPickedMesh.name = "clonedPickedMesh";
      Picking.clonedPickedMesh.material = selectedColorMaterial;
      this.scene.add(Picking.clonedPickedMesh);

      Picking.boxHelper = new BoxHelper(Picking.pickedMesh, "forestgreen");
      this.scene.add(Picking.boxHelper);
    }
  }
}
