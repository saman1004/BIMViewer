import { PlaneGeometry, MeshBasicMaterial, Mesh, Plane, Vector3, BufferGeometry, BufferAttribute, LineSegments, LineBasicMaterial, Line3, Euler, MathUtils, Quaternion } from 'three';
import { MeshBVH } from 'three-mesh-bvh';

import * as BufferGeometryUtils from '../three/examples/jsm/utils/BufferGeometryUtils.js';
import { TransformControls } from '../three/examples/jsm/controls/TransformControls.js';

export class Clipping {
    constructor(scene, camera, meshes, renderer, controls) { 
        this.scene = scene;
        this.camera = camera;
        this.meshes = meshes;
        this.renderer = renderer;
        this.controls = controls;

        this.modelSize = null;
        this.modelCenter = null;

        this.isClippedEdgesMode = false;

        this.translateX = 0;
        this.translateY = 0;
        this.translateZ = 0;

        this.rotateX = 0;
        this.rotateY = 0;
        this.rotateZ = 0;
    }

    setClipping() {
        if (!this.transformControls) this._setTransformControls();

        for (const mesh of this.meshes) mesh.material.clippingPlanes = this.clipPlane;

        this._setMergedGeometry();

        this._setBvh();
        this._setLineGeometry();
        
        this.planeMesh.scale.setScalar(this.modelSize*2.5);
        this.planeMesh.visible = true;

        this.transformControls.enabled = true;
        this.transformControls.setMode('translate');
        this.transformControls.attach(this.planeMesh);
        this.transformControls.name = 'transformControls';
        this.scene.add(this.transformControls);

        this.transformControls.addEventListener('mouseDown', this._disableOrbit.bind(this));
        this.transformControls.addEventListener('mouseUp', this._enableOrbit.bind(this));	
        this.transformControls.addEventListener('change', this._setClipPlane.bind(this));

        if (this.isClipFirstClick) {
            this.planeMesh.position.copy(this.modelCenter);
            this._setClipPlane();
        }

        if (!this.isClipFirstClick) return

        this.isClipFirstClick = false;
    }

    resetClipping() {
        if (!this.planeMesh) return
        
        for (const mesh of this.meshes) mesh.material.clippingPlanes = null;

        this.planeMesh.visible = false;

        this.transformControls.enabled = false;
        this.transformControls.visible = false;
        this.scene.remove(this.transformControls);

        this.colliderBvh = null;
        this.scene.remove(this.outlineLines);
        
        this.transformControls.removeEventListener('mouseDown', this._disableOrbit.bind(this));
        this.transformControls.removeEventListener('mouseUp', this._enableOrbit.bind(this));	
        this.transformControls.removeEventListener('change', this._setClipPlane.bind(this));

        document.getElementById('radioTranslate').checked = true;
    }

    setTransformEle(value, ele, input){

        if(isNaN(value)) return;

        switch(ele){
            case 'translateX':
                this.translateX = value;
                break;
            case 'translateY':
                this.translateY = value;
                break;
            case 'translateZ':
                this.translateZ = value;
                break;
            case 'rotateX':
                this.rotateX = value;
                break;
            case 'rotateY':
                this.rotateY = value;
                break;
            case 'rotateZ':
                this.rotateZ = value;
                break;
        }
        if(input == 'input'){
            this._setClipPlane(input);
        }
    }

    _setTransformControls() {
        this.isClipFirstClick = true;

        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);

        const planeGeometry = new PlaneGeometry();
        const planeMaterial = new MeshBasicMaterial({
            side: 2, opacity: 0.1, transparent: true, color: 'forestgreen'
        });
        const planeMesh = new Mesh(planeGeometry, planeMaterial);
        planeMesh.name = 'clippingPlane';
        planeMesh.visible = false;
        this.planeMesh = planeMesh;
        this.scene.add(this.planeMesh);

        this.clipPlane = [new Plane(new Vector3())];
    }

	_enableOrbit() {
		this.controls.enabled = true;
	}

	_disableOrbit() {
		this.controls.enabled = false;
	}

    _setClipPlane(input) {

        if(input != 'input'){
            const normal = new Vector3().set(0, 0, 1).applyQuaternion(this.planeMesh.quaternion);
            const point = new Vector3().copy(this.planeMesh.position); 
            this.clipPlane[0].setFromNormalAndCoplanarPoint(normal, point);
            if(this.transformControls.mode == 'translate'){
                this.setTransformEle(point.x, 'translateX', input);
                this.setTransformEle(point.y, 'translateY', input);
                this.setTransformEle(point.z, 'translateZ', input);
            }else{
                const euler = new Euler();
                euler.setFromQuaternion(this.planeMesh.quaternion);
                this.setTransformEle(MathUtils.radToDeg(euler.x), 'rotateX', input);
                this.setTransformEle(MathUtils.radToDeg(euler.y), 'rotateY', input);
                this.setTransformEle(MathUtils.radToDeg(euler.z), 'rotateZ', input);
            }
            this._changeTransformEle();
        }else{
            const rotateXRad = MathUtils.degToRad(this.rotateX);
            const rotateYRad = MathUtils.degToRad(this.rotateY);
            const rotateZRad = MathUtils.degToRad(this.rotateZ);
    
            let euler = new Euler(rotateXRad, rotateYRad, rotateZRad);
            let quaternion = new Quaternion();
            quaternion.setFromEuler(euler);
            const normal = new Vector3().set(0, 0, 1).applyQuaternion(quaternion);
            const point = new Vector3(this.translateX, this.translateY, this.translateZ);
            this.clipPlane[0].setFromNormalAndCoplanarPoint(normal, point);

            this.planeMesh.quaternion.copy(quaternion);
            this.planeMesh.position.set(point.x, point.y, point.z);
        }
        this._updateOutline();
	}

	changeTransformMode(event) {
		switch (event.target.value) {
			case 'option1' :
				this.transformControls.setMode('translate');
                document.getElementById('input-translate').style.display = 'flex';
                document.getElementById('input-rotate').style.display = 'none';
				break;
			case 'option2' :
				this.transformControls.setMode('rotate');
                document.getElementById('input-translate').style.display = 'none';
                document.getElementById('input-rotate').style.display = 'flex';
				break;
		}
	}

    _changeTransformEle(){
        document.getElementById('translateX').value = this.translateX;
        document.getElementById('translateY').value = this.translateY;
        document.getElementById('translateZ').value = this.translateZ;

        document.getElementById('rotateX').value = this.rotateX;
        document.getElementById('rotateY').value = this.rotateY;
        document.getElementById('rotateZ').value = this.rotateZ;
    }

    _setMergedGeometry() {
        const geometries = [];

        this.meshes.forEach((mesh) => {
            const cloneGeometry = mesh.geometry.clone();
            cloneGeometry.applyMatrix4(mesh.matrixWorld);
    
            for(const key in cloneGeometry.attributes) {
                if (key !== 'position') {
                    cloneGeometry.deleteAttribute(key);
                }
            }
            geometries.push(cloneGeometry);
        })

		this.mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
        
        this.mergedGeometry.computeBoundingSphere();
        this.modelSize = 2*this.mergedGeometry.boundingSphere.radius;
        this.modelCenter = this.mergedGeometry.boundingSphere.center;
    }

    _setBvh() {
        this.colliderBvh = new MeshBVH(this.mergedGeometry, { maxDepth: 80 });
        this.mergedGeometry.boundsTree = this.colliderBvh;
    }
    
    _setLineGeometry() {
        const lineGeometry = new BufferGeometry();
        const linePosAttr = new BufferAttribute(new Float32Array(300_000), 3, false);
        linePosAttr.setUsage(35048);
        lineGeometry.setAttribute('position', linePosAttr);

        const outlineLines = new LineSegments(lineGeometry, new LineBasicMaterial());
        outlineLines.material.color.set(0x00acc1).convertSRGBToLinear();
        outlineLines.material.depthTest = false;
        outlineLines.frustumCulled = false;
        outlineLines.renderOrder = 3;
        outlineLines.name = 'clippingSectionLine';
        this.outlineLines = outlineLines;
        this.scene.add(this.outlineLines);
        this.outlineLines.visible = this.isClippedEdgesMode;
    }

    _updateOutline() {
        const tempLine = new Line3();
        const tempVector = new Vector3();
        const tempVector1 = new Vector3();
        const tempVector2 = new Vector3();
        const tempVector3 = new Vector3();

		let index = 0;
		const posAttr = this.outlineLines.geometry.attributes.position;

		this.colliderBvh.shapecast({
			intersectsBounds: box => {
				return this.clipPlane[0].intersectsBox(box);
			},
			intersectsTriangle: tri => {
				let count = 0;

				tempLine.start.copy(tri.a);
				tempLine.end.copy(tri.b);
				if (this.clipPlane[0].intersectLine(tempLine, tempVector)) {
					posAttr.setXYZ(index, tempVector.x, tempVector.y, tempVector.z);
					index ++;
					count ++;
				}

				tempLine.start.copy(tri.b);
				tempLine.end.copy(tri.c);
				if (this.clipPlane[0].intersectLine(tempLine, tempVector)) {
					posAttr.setXYZ(index, tempVector.x, tempVector.y, tempVector.z);
					count ++;
					index ++;
				}

				tempLine.start.copy(tri.c);
				tempLine.end.copy(tri.a);
				if (this.clipPlane[0].intersectLine(tempLine, tempVector)) {
					posAttr.setXYZ(index, tempVector.x, tempVector.y, tempVector.z);
					count ++;
					index ++;
				}

				if (count === 3) {
					tempVector1.fromBufferAttribute(posAttr, index - 3);
					tempVector2.fromBufferAttribute(posAttr, index - 2);
					tempVector3.fromBufferAttribute(posAttr, index - 1);

					if (tempVector3.equals(tempVector1) || tempVector3.equals(tempVector2)) {
						count --;
						index --;
					} else if (tempVector1.equals(tempVector2)) {
						posAttr.setXYZ(index - 2, tempVector3);
						count --;
						index --;
					}
				}

				if (count !== 2) {
					index -= count;
				}
			}
		});

        this.outlineLines.geometry.setDrawRange(0, index);
        this.outlineLines.position.copy(this.clipPlane[0].normal).multiplyScalar(- 0.00001);
        posAttr.needsUpdate = true;        
    }

    cloneOutLine() {
        const cloneOutLines = this.outlineLines.clone();
        cloneOutLines.position.clone(this.outlineLines.position);
        cloneOutLines.quaternion.clone(this.outlineLines.quaternion);
        cloneOutLines.scale.clone(this.outlineLines.scale);
        cloneOutLines.matrixAutoUpdate = false;
        cloneOutLines.matrixWorldAutoUpdate = false;
        cloneOutLines.material = new LineBasicMaterial({ color: 0x030303 });
        cloneOutLines.name = 'clone'
        this.cloneOutLines = cloneOutLines;
        this.scene.add(cloneOutLines);
    }
}