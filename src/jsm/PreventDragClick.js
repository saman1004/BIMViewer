export class PreventDragClick {
    constructor(elem) { 
        this.mouseMoved;
        
        let clickStartX;
        let clickStartY;
        let clickStartTime;

        elem.addEventListener('mousedown', e => { 
            clickStartX = e.offsetX;
            clickStartY = e.offsetY;
            clickStartTime = Date.now();
        });
        
        elem.addEventListener('mouseup', e => { 
            const xGap = Math.abs(e.offsetX - clickStartX);
            const yGap = Math.abs(e.offsetY - clickStartY);
            const timeGap = clickStartTime - Date.now();

            if(xGap > 5 || yGap >5 || timeGap > 500) {
                this.mouseMoved = true; 
            } else {
                this.mouseMoved = false; 
            }
        });
    }
}