import { MeshPhysicalMaterial, BoxHelper } from "three";

import { Picking } from "./Picking.js";
import { FitSelectedMesh } from "./ZoomFit.js";

export class TreeView {
  static isFitSelectedMesh = false;

  constructor(
    scene,
    camera,
    renderer,
    meshes,
    controls,
    element,
    glbList,
    glbAttributeList,
    glbAttributeNames,
    nameConvert
  ) {
    this.scene = scene;
    this.camera = camera;
    this.meshes = meshes;
    this.controls = controls;
    this.renderer = renderer;

    this.treeElement = element;
    this.glbList = glbList;
    this.glbAttributeList = glbAttributeList;
    this.nameConvert = nameConvert;
    this.glbAttributeNames = glbAttributeNames;

    const $treeView = document.querySelector(this.treeElement);
    $treeView.innerHTML = "";

    const glbNames = Object.keys(this.glbList);
    const glbMeshes = Object.values(this.glbList);

    for (let i = 0; i < glbNames.length; i++) {
      const $menuList = document.createElement("li");
      $treeView.appendChild($menuList);

      const $label = document.createElement("label");
      $label.htmlFor = "label" + glbNames[i];
      $label.textContent = glbNames[i];
      $menuList.appendChild($label);

      const $checkBox = document.createElement("input");
      $checkBox.type = "checkBox";
      $checkBox.id = "label" + glbNames[i];
      $checkBox.setAttribute("uuid", glbNames[i]);
      $menuList.appendChild($checkBox);

      const $fileOrderedList = document.createElement("ol");
      $menuList.appendChild($fileOrderedList);

      if (this.glbAttributeList[glbNames[i]]) {
        this._createMeshList($fileOrderedList, glbNames[i]);
      } else {
        for (let j = 0; j < glbMeshes[i].length; j++) {
          const $fileList = document.createElement("li");
          $fileList.className = "file";
          $fileList.textContent = glbMeshes[i][j].name;
          $fileList.setAttribute("uuid", glbMeshes[i][j].uuid);
          $fileList.addEventListener("click", this._setDetailAttr.bind(this));
          $fileList.addEventListener("click", this._onSelectMesh.bind(this));
          $fileOrderedList.appendChild($fileList);
        }
      }
    }

    this._setObjectQueryList();

    this.timer;
  }

  _createMeshList(ele, name) {
    this._createUnitTree(this.glbAttributeList[name], ele, 0, name);
  }

  _createUnitTree(json, ele, depth, glbName) {
    let childEle = document.createElement("li");
    switch (json["type"]) {
      case "folder":
        childEle.classList.add("folder");
        childEle.classList.add("depth" + depth);

        childEle.style.paddingLeft = "20px";

        const $label = document.createElement("label");
        $label.htmlFor = "label" + json["id"];
        $label.textContent =
          json["Name"] && json["Name"].replaceAll(" ", "") != ""
            ? json["Name"]
            : json["IFCType"]
            ? json["IFCType"]
            : json["id"];
        childEle.appendChild($label);

        const $checkBox = document.createElement("input");
        $checkBox.type = "checkBox";
        $checkBox.id = "label" + json["id"];
        $checkBox.setAttribute("uuid", json["id"]);
        childEle.appendChild($checkBox);

        let childOl = document.createElement("ol");
        childEle.appendChild(childOl);
        ele.appendChild(childEle);
        for (let key in json["child"]) {
          this._createUnitTree(json["child"][key], childOl, depth + 1, glbName);
        }
        break;
      case "file":
        let findedMesh = this.scene.getObjectByProperty("name", json["id"]);
        if (findedMesh) {
          childEle.className = "file";
          childEle.textContent =
            json["Name"] && json["Name"].replaceAll(" ", "") != ""
              ? json["Name"]
              : json["IFCType"];
          childEle.setAttribute("uuid", findedMesh.uuid);
          childEle.setAttribute("meshid", json["id"]);
          childEle.addEventListener("click", this._setDetailAttr.bind(this));
          childEle.addEventListener("click", this._onSelectMesh.bind(this));
          ele.appendChild(childEle);
        }
        break;
    }
  }

  _onSelectMesh(event) {
    if (Picking.selectedElement) {
      Picking.selectedElement.style.background = "";
      Picking.selectedElement = null;
    }

    this.scene.remove(Picking.clonedPickedMesh);
    this.scene.remove(Picking.boxHelper);

    Picking.selectedElement = event.target;
    Picking.selectedElement.style.background = "#e6e8ff";

    const uuid = event.target.getAttribute("uuid");

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
    Picking.pickedMesh = this.scene.getObjectByProperty("uuid", uuid);
    Picking.clonedPickedMesh = Picking.pickedMesh.clone();
    Picking.clonedPickedMesh.name = "clonedPickedMesh";
    Picking.clonedPickedMesh.material = selectedColorMaterial;
    this.scene.add(Picking.clonedPickedMesh);

    Picking.boxHelper = new BoxHelper(Picking.pickedMesh, "forestgreen");
    this.scene.add(Picking.boxHelper);

    if (!TreeView.isFitSelectedMesh) return;
    new FitSelectedMesh(
      Picking.pickedMesh,
      this.camera,
      this.controls,
      this.scene,
      this.renderer
    );
  }

  _onChangeOpacityOtherMeshes(event) {}

  _setDetailAttr(event) {
    const uuid = event.target.getAttribute("uuid");
    const textContent = event.target.textContent;
    const selectedMesh = this.scene.getObjectByProperty("uuid", uuid);
    const meshid = event.target.getAttribute("meshid");

    const $treeWrap = document.querySelector(".tab_cont .tree_wrap");
    $treeWrap.style.height = "40%";
    const $detailAttr = document.querySelector(".detail_attr");
    $detailAttr.style.display = "block";

    const $objectTitle = document.querySelector(".object_title");
    $objectTitle.textContent = textContent;

    const $tbody = document.querySelector("table tbody");
    $tbody.innerHTML = "";

    const material = selectedMesh.material.name;

    Object.entries(this.glbAttributeList).find(([objectKey, objectValue]) => {
      let json = this._findTreeById(objectValue, meshid);
      for (let key in json) {
        if (key != "type" && key != "child") {
          let value = json[key];
          if (value.charAt(0) === "#") {
            value = this.glbAttributeNames[json[key].slice(1)]
              ? this.glbAttributeNames[json[key].slice(1)]
              : json[key];
          }
          this.addTableRow($tbody, key, value);
        }
      }
    });

    const $closeBtn = document.createElement("button");
    $closeBtn.className = "btn-close";
    $objectTitle.appendChild($closeBtn);

    const $detailCloseBtn = document.querySelector(
      ".detail_attr .object_title .btn-close"
    );
    $detailCloseBtn.addEventListener("click", () => {
      document.querySelector(".detail_attr").style.display = "none";
      document.querySelector(".tab_cont .tree_wrap").style.height =
        "calc(100% - 5px)";
    });

    const $itemVisible = document.getElementById("item_visible");
    $itemVisible.setAttribute("uuid", uuid);

    $itemVisible.checked = selectedMesh.visible;

    $itemVisible.addEventListener("click", this._onVisible.bind(this));

    const $colorPicker = document.getElementById("color_picker");
    $colorPicker.setAttribute("uuid", uuid);
    $colorPicker.value = "#" + selectedMesh.material.color.getHexString();

    this.$colorLabel = document.querySelector('label[for="color_picker"]');
    this.$colorLabel.textContent = $colorPicker.value;

    $colorPicker.addEventListener("input", this._onChangeColor.bind(this));

    const $opacity = document.getElementById("opacity");
    $opacity.value = selectedMesh.material.opacity;
    $opacity.style.cssText =
      "border: none; width: 25px; height: 20px; padding: 0; text-align: center; background: transparent;";
    $opacity.setAttribute("uuid", uuid);
    $opacity.addEventListener("change", this._onChangeOpacity.bind(this));
  }

  _findTreeById(tree, id) {
    let json = undefined;
    if (tree["id"] == id) {
      json = tree;
    } else {
      for (let key in tree["child"]) {
        if (json != undefined) return json;
        json = this._findTreeById(tree["child"][key], id);
      }
    }
    return json;
  }

  addTableRow(tbody, head, data) {
    const tr = document.createElement("tr");
    tbody.appendChild(tr);

    const th = document.createElement("th");
    th.textContent = head;
    tr.appendChild(th);

    const td = document.createElement("td");
    td.textContent = data;
    tr.appendChild(td);
  }

  _onVisible(event) {
    const uuid = event.target.getAttribute("uuid");
    const selectedMesh = this.scene.getObjectByProperty("uuid", uuid);
    const selectedElement = Picking.selectedElement;

    const isCheck = document.querySelector("#item_visible").checked;

    switch (isCheck) {
      case true:
        selectedMesh.visible = true;
        selectedMesh.layers.enable(1);
        selectedElement.style.color = "#545454";
        this.scene.add(Picking.clonedPickedMesh);
        break;

      case false:
        selectedMesh.visible = false;
        selectedMesh.layers.disable(1);
        selectedElement.style.color = "#bbbbbb";
        this.scene.remove(this.scene.getObjectByName("clonedPickedMesh"));
        break;
    }
  }

  _onChangeColor(event) {
    const uuid = event.target.getAttribute("uuid");
    const selectedMesh = this.scene.getObjectByProperty("uuid", uuid);
    selectedMesh.material.color.set(event.target.value);

    this.$colorLabel.textContent =
      document.getElementById("color_picker").value;
  }

  _onChangeOpacity(event) {
    const uuid = event.target.getAttribute("uuid");
    const selectedMesh = this.scene.getObjectByProperty("uuid", uuid);

    let value = Number(event.target.value);
    value = value > 1 ? 1 : value < 0.1 ? 0.1 : value;
    if (isNaN(value)) value = 1;

    event.target.value = value;

    selectedMesh.material.transparent = true;
    selectedMesh.material.opacity = event.target.value;

    if (event.target.value == 1) {
      selectedMesh.material.transparent = false;
    }

    selectedMesh.material.needsUpdate = true;
  }

  _setObjectQueryList() {
    const $searchTabDiv = document.getElementById("searchTab");

    const values = Object.values(this.glbAttributeList);

    for (const glbAttribute of values) {
      this._addQueryList(glbAttribute, $searchTabDiv);
    }
  }

  _addQueryList(attribute, $searchTabDiv) {
    const $wrapFolding = document.createElement("div");
    $wrapFolding.className = "info_wrap";
    $searchTabDiv.appendChild($wrapFolding);

    const $infoTitle = document.createElement("div");
    $infoTitle.className = "info_title";
    $infoTitle.setAttribute("data-bs-toggle", "tooltip");
    $infoTitle.setAttribute("data-bs-custom-class", "custom-tooltip");
    $infoTitle.setAttribute("data-bs-placement", "left");
    $infoTitle.setAttribute("data-bs-title", "파일명");
    $infoTitle.textContent =
      attribute["Name"] && attribute["Name"].replaceAll(" ", "") != ""
        ? attribute["Name"]
        : attribute["IFCType"];
    $wrapFolding.appendChild($infoTitle);

    for (const [key, value] of Object.entries(attribute)) {
      if (key == "type") continue;
      else if (key == "child") {
        for (const [key2, value2] of Object.entries(value)) {
          this._addQueryList(value2, $searchTabDiv);
        }
      } else {
        const $infoCont = document.createElement("div");
        $infoCont.className = "info_cont";
        $wrapFolding.appendChild($infoCont);

        const $subTitle = document.createElement("div");
        $subTitle.className = "sub_title";
        $subTitle.textContent = key;
        $infoCont.appendChild($subTitle);

        const $subCont = document.createElement("div");
        $subCont.className = "sub_cont";
        $subCont.textContent = this.glbAttributeNames[value.slice(1)]
          ? this.glbAttributeNames[value.slice(1)]
          : value;
        $infoCont.appendChild($subCont);
      }
    }
  }

  search() {
    const inputValue = document.getElementById("search").value;
    const searchWord = inputValue.toUpperCase();

    const $$resetElements = document.querySelectorAll(
      ".info_title, .info_cont, .sub_title, .sub_cont"
    );
    $$resetElements.forEach((ele) => {
      ele.style.display = "none";
    });

    const $$searchElements = document.querySelectorAll(
      ".info_title, .sub_title, .sub_cont"
    );

    let count = 0;

    $$searchElements.forEach((element) => {
      if (!inputValue) return;

      if (element.textContent.toUpperCase().indexOf(searchWord) > -1) {
        if (element.classList.contains("info_title")) {
          element.parentNode.querySelectorAll("*").forEach((child) => {
            child.style.display = "block";
          });

          for (let i = 1; i < element.parentNode.childNodes.length; i++) {
            element.parentNode.childNodes[i].style.display = "flex";
          }
        } else {
          element.parentNode.parentNode.style.display = "block";
          element.parentNode.parentNode.childNodes[0].style.display = "block";
          element.parentNode.style.display = "flex";
          element.parentNode.querySelectorAll("*").forEach((child) => {
            child.style.display = "block";
          });
        }
      } else {
        count++;
      }

      if (count == $$searchElements.length) {
        console.log("찾는 결과가 없습니다");
      }
    });
  }

  onKeyPress(event) {
    if (event.keyCode == 13) {
      this.search();
    }
  }
}
