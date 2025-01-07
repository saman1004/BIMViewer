import {
    BufferGeometry,
    LineBasicMaterial,
    LineSegments,
    Vector2,
    Vector3,
} from 'three'

import { CSS2DObject } from '../three/examples/jsm/renderers/CSS2DRenderer.js';
import { Picking } from './Picking.js';
import { Marker } from "./Marker.js";

export class Dim extends Picking {
    constructor (scene, camera, meshes, renderer) {
        super(scene, camera, meshes);
        this.renderer = renderer;

        this.lineDrawing = false;
        this.dimLine;
        this.dimTextLabel;
        this.delBtnLabel;
        this.counter = 0;
        this.dimArr = [];
        this.mousePoint = undefined;
    }

    setState() {
        Picking.state = 'dim';
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

    start() {
        super.findIntersect();

        if (!this.intersects.length) return

        if (!this.lineDrawing) {
            this.counter = this.counter >= 0 ? this.counter : 0;
            this.counter++;
            
            const points = [];

            points.push(this.intersects[0].point);
            points.push(this.intersects[0].point.clone());

            const startMarker = new Marker(this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z);
            startMarker.name = 'startMarker'+this.counter;
            this.scene.add(startMarker);
            this.dimArr.push(startMarker);

            const dimLineGeo = new BufferGeometry().setFromPoints(points);
            const dimLineMat = new LineBasicMaterial({ color: "black", depthTest: false, depthWrite: false });
            this.dimLine = new LineSegments(dimLineGeo, dimLineMat);
            this.dimLine.frustumCulled = false
            this.dimLine.name = 'dimLine'+this.counter;
            this.scene.add(this.dimLine);
            this.dimArr.push(this.dimLine);

            const $dimTextDiv = document.createElement('div');
            $dimTextDiv.innerText = '0.0m';
            $dimTextDiv.addEventListener('mouseover', () => {
                $dimTextDiv.style.background = '#ccc';
            })
            $dimTextDiv.addEventListener('mouseout', () => {
                $dimTextDiv.style.background = 'rgba(0, 0, 0, 0.5)';
            })

            $dimTextDiv.style.cssText = 'display: inline; padding: 5px; border-radius: 5px; font-size: 12px; background: rgba(0, 0, 0, 0.5); color: white; pointer-events: auto;';
            this.dimTextLabel = new CSS2DObject($dimTextDiv);
            this.dimTextLabel.name = 'dimTextLabel'+this.counter;
            this.dimTextLabel.position.copy(this.intersects[0].point);
            this.scene.add(this.dimTextLabel);
            this.dimArr.push(this.dimTextLabel)

            this.lineDrawing = true; 
        } else { 
            const positions = this.dimLine.geometry.attributes.position.array;
            positions[3] = this.intersects[0].point.x;
            positions[4] = this.intersects[0].point.y;
            positions[5] = this.intersects[0].point.z;
            this.dimLine.geometry.attributes.position.needsUpdate = true;

            const endMarker = new Marker( this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z );
            endMarker.name = 'endMarker'+this.counter;
            this.scene.add(endMarker);
            this.dimArr.push(endMarker);

            this.lineDrawing = false;

            this.scene.remove(this.mousePoint);
            this.mousePoint = undefined;

            Picking.state = 'pick';
            this.renderer.domElement.style.cursor = 'default';
        }

    }

    drawing() {
        this.drawMousePoint();
        if(!this.lineDrawing) return 

        super.findIntersect();
        if( this.intersects.length ) {

            const positions = this.dimLine.geometry.attributes.position.array;
            const v0 = new Vector3( positions[0], positions[1], positions[2] );
            const v1 = new Vector3( this.intersects[0].point.x, this.intersects[0].point.y, this.intersects[0].point.z );
            positions[3] = this.intersects[0].point.x;
            positions[4] = this.intersects[0].point.y;
            positions[5] = this.intersects[0].point.z;

            const verticalDistance = Math.abs(v0.y - v1.y);

            const v2 = new Vector2(positions[0], positions[1]);
            const v3 = new Vector2(this.intersects[0].point.x, this.intersects[0].point.y);

            const horizontalDistance = Math.sqrt(Math.pow((v0.x - v1.x),2) + Math.pow((v0.z - v1.z),2));

            this.dimLine.geometry.attributes.position.needsUpdate = true;

            const distance = v0.distanceTo(v1);
            this.dimTextLabel.element.innerText = '거리 : ' + distance.toFixed(2) + 'm' + '\n';
            this.dimTextLabel.element.innerText += '수직 : ' + verticalDistance.toFixed(2) + 'm' + '\n';
            this.dimTextLabel.element.innerText += '수평 : ' + horizontalDistance.toFixed(2) + 'm';
            this.dimTextLabel.position.lerpVectors( v0, v1, 0.5 );
        }
    }

    resetDim() {
        this.dimArr.forEach( dimEle => this.scene.remove(dimEle) );
        this.counter = 0;

        Picking.state = 'pick';
        Picking.snapping = false;
        this.lineDrawing = false;
        this.renderer.domElement.style.cursor = 'default';
    }
}