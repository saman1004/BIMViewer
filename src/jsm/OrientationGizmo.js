import { Vector3, Matrix4 } from "three";

export class OrientationGizmo extends HTMLElement {
  constructor(camera, options) {
    super();
    this.camera = camera;
    this.options = Object.assign(
      {
        size: 90,
        padding: 8,
        bubbleSizePrimary: 8,
        bubbleSizeSeconday: 6,
        showSecondary: true,
        lineWidth: 2,
        fontSize: "11px",
        fontFamily: "arial",
        fontWeight: "bold",
        fontColor: "#151515",
        fontYAdjust: 0,
        colors: {
          x: ["#f73c3c", "#942424"],
          y: ["#6ccb26", "#417a17"],
          z: ["#178cf0", "#0e5490"],
        },
      },
      options
    );

    this.onAxisSelected = null;

    this.bubbles = [
      {
        axis: "X",
        direction: new Vector3(1, 0, 0),
        size: this.options.bubbleSizePrimary,
        color: this.options.colors.x,
        line: this.options.lineWidth,
        label: "X",
      },
      {
        axis: "Y",
        direction: new Vector3(0, 1, 0),
        size: this.options.bubbleSizePrimary,
        color: this.options.colors.y,
        line: this.options.lineWidth,
        label: "Y",
      },
      {
        axis: "Z",
        direction: new Vector3(0, 0, 1),
        size: this.options.bubbleSizePrimary,
        color: this.options.colors.z,
        line: this.options.lineWidth,
        label: "Z",
      },
      {
        axis: "-X",
        direction: new Vector3(-1, 0, 0),
        size: this.options.bubbleSizeSeconday,
        color: this.options.colors.x,
      },
      {
        axis: "-Y",
        direction: new Vector3(0, -1, 0),
        size: this.options.bubbleSizeSeconday,
        color: this.options.colors.y,
      },
      {
        axis: "-Z",
        direction: new Vector3(0, 0, -1),
        size: this.options.bubbleSizeSeconday,
        color: this.options.colors.z,
      },
    ];

    this.center = new Vector3(this.options.size / 2, this.options.size / 2, 0);
    this.selectedAxis = null;

    this.innerHTML =
      "<canvas width='" +
      this.options.size +
      "' height='" +
      this.options.size +
      "'></canvas>";
    this.id = "gizmo";

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseClick = this.onMouseClick.bind(this);
  }

  connectedCallback() {
    this.canvas = this.querySelector("canvas");
    this.context = this.canvas.getContext("2d");

    this.canvas.addEventListener("mousemove", this.onMouseMove, false);
    this.canvas.addEventListener("mouseout", this.onMouseOut, false);
    this.canvas.addEventListener("click", this.onMouseClick, false);
  }

  disconnectedCallback() {
    this.canvas.removeEventListener("mousemove", this.onMouseMove, false);
    this.canvas.removeEventListener("mouseout", this.onMouseOut, false);
    this.canvas.removeEventListener("click", this.onMouseClick, false);
  }

  onMouseMove(evt) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse = new Vector3(
      evt.clientX - rect.left,
      evt.clientY - rect.top,
      0
    );
  }

  onMouseOut(evt) {
    this.mouse = null;
  }

  onMouseClick(evt) {
    if (!!this.onAxisSelected && typeof this.onAxisSelected == "function") {
      this.onAxisSelected(this.selectedAxis.axis);
    }
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCircle(p, radius = 10, color = "#FF0000") {
    this.context.beginPath();
    this.context.arc(p.x, p.y, radius, 0, 2 * Math.PI, false);
    this.context.fillStyle = color;
    this.context.fill();
    this.context.closePath();
  }

  drawLine(p1, p2, width = 1, color = "#FF0000") {
    this.context.beginPath();
    this.context.moveTo(p1.x, p1.y);
    this.context.lineTo(p2.x, p2.y);
    this.context.lineWidth = width;
    this.context.strokeStyle = color;
    this.context.stroke();
    this.context.closePath();
  }

  update() {
    this.clear();

    let rotMat = new Matrix4().makeRotationFromEuler(this.camera.rotation);
    let invRotMat = rotMat.clone().invert();

    for (const bubble of this.bubbles) {
      bubble.position = this.getBubblePosition(
        bubble.direction.clone().applyMatrix4(invRotMat)
      );
    }

    const layers = [];
    for (let axis in this.bubbles) {
      if (this.options.showSecondary === true || axis[0] !== "-") {
        layers.push(this.bubbles[axis]);
      }
    }

    layers.sort((a, b) => (a.position.z > b.position.z ? 1 : -1));

    this.selectedAxis = null;

    if (this.mouse) {
      let closestDist = Infinity;

      for (var bubble of layers) {
        const distance = this.mouse.distanceTo(bubble.position);

        if (distance < closestDist || distance < bubble.size) {
          closestDist = distance;
          this.selectedAxis = bubble;
        }
      }
    }

    this.drawLayers(layers);
  }

  drawLayers(layers) {
    for (let bubble of layers) {
      let color = bubble.color;

      if (this.selectedAxis === bubble) {
        color = "#FFFFFF";
      } else if (bubble.position.z >= -0.01) {
        color = bubble.color[0];
      } else {
        color = bubble.color[1];
      }

      this.drawCircle(bubble.position, bubble.size, color);

      if (bubble.line) {
        this.drawLine(this.center, bubble.position, bubble.line, color);
      }

      if (bubble.label) {
        this.context.font = [
          this.options.fontWeight,
          this.options.fontSize,
          this.options.fontFamily,
        ].join(" ");
        this.context.fillStyle = this.options.fontColor;
        this.context.textBaseline = "middle";
        this.context.textAlign = "center";
        this.context.fillText(
          bubble.label,
          bubble.position.x,
          bubble.position.y + this.options.fontYAdjust
        );
      }
    }
  }

  getBubblePosition(position) {
    return new Vector3(
      position.x *
        (this.center.x -
          this.options.bubbleSizePrimary / 2 -
          this.options.padding) +
        this.center.x,
      this.center.y -
        position.y *
          (this.center.y -
            this.options.bubbleSizePrimary / 2 -
            this.options.padding),
      position.z
    );
  }
}

window.customElements.define("orientation-gizmo", OrientationGizmo);
