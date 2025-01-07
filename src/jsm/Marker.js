import {
	TextureLoader,
	SpriteMaterial,
    Sprite
} from 'three';

export class Marker {
    constructor (x, y, z, path, scale) {
        const loadPath = path || './textures/circle.png';
        const scaleScalar = scale || 0.02;

        const circleTexture = new TextureLoader().load(loadPath);

        const markerMaterial = new SpriteMaterial({
            map: circleTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            sizeAttenuation: false
        });

        const markerSprite  = new Sprite(markerMaterial);
        markerSprite.position.set(x, y, z);
        markerSprite.scale.setScalar(scaleScalar);

        return markerSprite
    }
}