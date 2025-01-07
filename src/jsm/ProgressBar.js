export class ProgressBar {
  constructor(div) {
    const progressBarDiv = document.createElement("div");
    progressBarDiv.id = "progressBar";
    progressBarDiv.style.cssText =
      "position: absolute; top: 50%; width: 100%; display: block; text-align: center; font-size: 2rem; color: black; user-select: none;";
    this.progressBarDiv = progressBarDiv;
    div.appendChild(this.progressBarDiv);
  }

  show() {
    this.progressBarDiv.style.display = "block";
  }

  hide() {
    this.progressBarDiv.style.display = "none";
  }

  onProgress(xhr, glbUrl) {
    this.show();
    if (xhr.lengthComputable) {
      const percent = Math.min(xhr.loaded / xhr.total, 1);
      this.progressBarDiv.textContent =
        `${glbUrl} / ` + "⚡ Loading... " + Math.round(percent * 100, 2) + "%";
    } else {
      this.progressBarDiv.textContent = "Loading...";
    }
  }

  error(error) {
    this.progressBarDiv.innerText = error;
  }
}
