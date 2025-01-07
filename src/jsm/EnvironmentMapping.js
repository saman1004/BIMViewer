import { CubeTextureLoader } from 'three';

const cubeTextureLoader = new CubeTextureLoader();

export class EnvironmentMapping {
    day() {
        const day = cubeTextureLoader
        .setPath('./textures/')
        .load([
            'px-day.png', 'nx-day.png', 'py-day.png', 'ny-day.png', 'pz-day.png', 'nz-day.png',
        ]);
        return day
    }

    night() {
        const night = cubeTextureLoader
        .setPath('./textures/')
        .load([
            'px-night.png', 'nx-night.png', 'py-night.png', 'ny-night.png', 'pz-night.png', 'nz-night.png',
        ]);
        return night
    }
}