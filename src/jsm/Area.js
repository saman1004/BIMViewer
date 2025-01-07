import * as THREE from "three";
import { CSS2DObject } from '../three/examples/jsm/renderers/CSS2DRenderer.js';
import { Picking } from "./Picking.js";
import { Marker } from "./Marker.js";
import { earcut } from "./earcut.js";

export class Area extends Picking{
    constructor(scene, camera, meshes, renderer) {
        super(scene, camera, meshes);
        this.renderer = renderer;

        this.isDrawing = false;
        this.counter = 0;
        this.areaArray = [];
        this.curPolyLine;
        this.curLabel;
        this.curPositionArr = [];
        this.curCenterPosition;
        this.mousePoint = undefined;
    }

    setState() {
        Picking.state = 'area';
        this.renderer.domElement.style.cursor = 'crosshair';

        this.mousePoint = new Marker(17,18,19);
        this.scene.add(this.mousePoint);
    }

    drawMousePoint(){
        if(this.mousePoint == undefined) return;
        super.findIntersect();
        if( this.intersects.length ){
            this.mousePoint.position.set(this.intersects[0].point.x,this.intersects[0].point.y,this.intersects[0].point.z);
        }
    }

    start(){
        super.findIntersect();

        if (!this.intersects.length) return;

        if(!this.isDrawing){ 
            this.isDrawing = !this.isDrawing;
            this.curPositionArr.push(this.intersects[0].point);
            this.curPositionArr.push(this.intersects[0].point.clone());
            const startMarker = new Marker(this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z);
            startMarker.name = 'startMarker'+this.counter;
            this.scene.add(startMarker);
            this.areaArray.push(startMarker);

            const geometry = new THREE.BufferGeometry().setFromPoints(this.curPositionArr);
            const material = new THREE.LineBasicMaterial({ color: "white", depthTest: false, depthWrite: false });
            this.curPolyLine = new THREE.Line(geometry, material);
            this.curPolyLine.frustumCulled = false
            this.curPolyLine.name = 'areaPolyLine'+this.counter;
            this.scene.add(this.curPolyLine);
            this.areaArray.push(this.curPolyLine);

            const $areaTextDiv = document.createElement('div');
            $areaTextDiv.innerText = '보다 정확한 측정을 위해 \n 도형을 한쪽 방향으로 그려주세요.';
            $areaTextDiv.addEventListener('mouseover', () => {
                $areaTextDiv.style.background = '#ccc';
            })
            $areaTextDiv.addEventListener('mouseout', () => {
                $areaTextDiv.style.background = 'rgba(0, 0, 0, 0.5)';
            })
            $areaTextDiv.style.cssText = 'display: inline; padding: 5px; border-radius: 5px; font-size: 12px; background: rgba(0, 0, 0, 0.5); color: white; pointer-events: none;';
            this.curLabel = new CSS2DObject($areaTextDiv);
            this.curLabel.name = 'areaTextLabel'+this.counter;
            this.curLabel.position.copy(this.intersects[0].point);
            this.scene.add(this.curLabel);
            this.areaArray.push(this.curLabel)

            this._getCenterPosition();
        }else{
            this.curPositionArr.push(this.intersects[0].point);

            this.scene.remove(this.curPolyLine);
            this._removeCurPolyLine();

            let indexArr = [];
            for(let i =0;i<this.curPositionArr.length; i++){
                indexArr.push(i);
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(this.curPositionArr);
            geometry.setIndex(indexArr);
            const material = new THREE.LineBasicMaterial({ color: "white", depthTest: false, depthWrite: false });
            this.curPolyLine = new THREE.Line(geometry, material);
            this.curPolyLine.frustumCulled = false
            this.curPolyLine.name = 'areaPolyLine'+this.counter;
            this.scene.add(this.curPolyLine);
            this.areaArray.push(this.curPolyLine);

            const midMarker = new Marker( this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z );
            midMarker.name = 'Marker'+this.counter;
            this.scene.add(midMarker);
            this.areaArray.push(midMarker);

            this._getCenterPosition();
        }
    }

    drawing(){
        this.drawMousePoint();
        if(!this.isDrawing) return;
        super.findIntersect();

        if(this.intersects.length){
            this.curPositionArr.pop();
            this.curPositionArr.push(this.intersects[0].point);

            let positions = this.curPolyLine.geometry.attributes.position.array;
            positions[positions.length-3] = this.intersects[0].point.x;
            positions[positions.length-2] = this.intersects[0].point.y;
            positions[positions.length-1] = this.intersects[0].point.z;

            this.curPolyLine.geometry.attributes.position.needsUpdate = true;

            const v1 = new THREE.Vector3( this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z );
            this.curLabel.position.lerpVectors( this.curCenterPosition, v1, 0.5 );
        }
    }

    end(){
        if(!this.isDrawing) return;
        super.findIntersect();

        const endMarker = new Marker( this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z );
        endMarker.name = 'Marker'+this.counter;
        this.scene.add(endMarker);
        this.areaArray.push(endMarker);

        this.scene.remove(this.curPolyLine);
        this._removeCurPolyLine();

        let positionArr = [];
        for(let i = 0; i < this.curPositionArr.length; i++){
            positionArr.push(this.curPositionArr[i].x);
            positionArr.push(this.curPositionArr[i].z);
        }
        let indexArr = earcut(positionArr, [], 2);
        if(indexArr.length == 0){
           if(this.curPositionArr.length == 3){
            indexArr = [1,0,2];
           }else if(this.curPositionArr.length ==4){
            indexArr = [1,0,2,2,0,3];
           }
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(this.curPositionArr);
        geometry.setIndex(indexArr);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
        this.curPolygon = new THREE.Mesh(geometry, material);
        this.curPolygon.frustumCulled = false;
        this.curPolygon.name = 'areaPolygon'+this.counter;
        this.scene.add(this.curPolygon);
        this.areaArray.push(this.curPolygon);

        let areaInMeter = this._getArea();

        this.curLabel.element.innerText = '면적 : '+areaInMeter.toFixed(2)+' ㎡';

        this.scene.remove(this.mousePoint);
        this.mousePoint = undefined;

        Picking.state = 'pick';
        this.isDrawing = false;
        this.renderer.domElement.style.cursor = 'default';

        this.curPolygon = undefined;
        this.curLabel = undefined;
        this.curPositionArr = [];
        this.curCenterPosition = undefined;
    }

    reset(){
        Picking.state = 'pick';
        Picking.snapping = false;
        this.isDrawing = false;
        this.renderer.domElement.style.cursor = 'default';
        this.counter = 0;
        this.areaArray.forEach( ele => this.scene.remove(ele) );
        this.areaArray = [];
        this.curPolygon = undefined;
        this.curLabel = undefined;
        this.curPositionArr = [];
        this.curCenterPosition = undefined;
    }

    _getCenterPosition(){
        let len = this.curPositionArr.length;
        let vec = new THREE.Vector3(this.curPositionArr[0].x,this.curPositionArr[0].y,this.curPositionArr[0].z);
        for(let i =1; i < len-1; i++){
            vec.add(new THREE.Vector3(this.curPositionArr[i].x,this.curPositionArr[i].y,this.curPositionArr[i].z));
        }
        vec.divideScalar(len-1);
        this.curCenterPosition = vec;
    }

    _removeCurPolyLine(){
        let len = this.areaArray.length;
        for(let i =0; i < len ;i++){
            if(this.areaArray[i] == this.curPolyLine){
                this.areaArray.splice(i,1);
            }
        }
    }

    _getArea(){
        let areaInMeter = 0;
        let indices = this.curPolygon.geometry.index.array;
        let point = this.curPositionArr;
        for(let i = 0; i < indices.length; i += 3){
            areaInMeter += this._calcArea3D(point[indices[i]], point[indices[i+1]],point[indices[i+2]]);
        }

        return areaInMeter;
    }

    _calcArea3D(t1,t2,t3){
        let a1 = t2.x - t1.x;
        let a2 = t2.y - t1.y;
        let a3 = t2.z - t1.z;
    
        let b1 = t3.x - t1.x;
        let b2 = t3.y - t1.y;
        let b3 = t3.z - t1.z;
    
        let area = Math.sqrt(Math.pow(a2 * b3 - b2 * a3, 2) + Math.pow(b1 * a3 - a1 * b3, 2) + Math.pow(a1 * b2 - b1 * a2, 2)) / 2;
        return area; 
    }

    _ThrottleTimer(fn, delay){
        let timer;
        return function(){
            if(!timer){
                timer = setTimeout(()=>{
                    timer = null;
                    fn.apply(this, arguments);
                },delay);
            }
        }
    }
}