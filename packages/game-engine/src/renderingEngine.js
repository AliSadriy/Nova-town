import { z } from 'zod';
import * as THREE from 'three';
export const RenderConfigSchema = z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    fov: z.number().min(1).max(180),
    near: z.number().positive(),
    far: z.number().positive(),
    shadowMapSize: z.number().positive()
});
export class SceneRenderer {
    scene;
    camera;
    renderer;
    config;
    constructor(canvas, config) {
        this.config = config;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(config.fov, config.width / config.height, config.near, config.far);
        if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
            this.renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: true,
                alpha: true
            });
        }
        else if (canvas instanceof THREE.WebGLRenderer) {
            this.renderer = canvas;
        }
        else {
            this.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                alpha: true,
                context: canvas?.getContext ? canvas.getContext('webgl') : undefined
            });
        }
        this.renderer.setSize(config.width, config.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (typeof window !== 'undefined' && window.devicePixelRatio) {
            this.renderer.setPixelRatio(window.devicePixelRatio);
        }
    }
    createGridHelper(size = 100, divisions = 50) {
        const grid = new THREE.GridHelper(size, divisions);
        this.scene.add(grid);
        return grid;
    }
    createBuildingMesh(type, position, size) {
        let geometry;
        let material;
        switch (type) {
            case 'residential':
                geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
                material = new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
                break;
            case 'commercial':
                geometry = new THREE.BoxGeometry(size.width * 1.5, size.height, size.depth * 1.5);
                material = new THREE.MeshStandardMaterial({ color: 0xe24a4a });
                break;
            case 'industrial':
                geometry = new THREE.BoxGeometry(size.width * 2, size.height, size.depth * 2);
                material = new THREE.MeshStandardMaterial({ color: 0x4ae24a });
                break;
            case 'park':
                geometry = new THREE.CylinderGeometry(size.width / 2, size.width / 2, 1, 32);
                material = new THREE.MeshStandardMaterial({ color: 0x4ae24a });
                break;
            case 'road':
                geometry = new THREE.BoxGeometry(size.width, 0.1, size.depth);
                material = new THREE.MeshStandardMaterial({ color: 0x2d2d2d });
                break;
            case 'power':
                geometry = new THREE.BoxGeometry(size.width, size.height * 1.5, size.depth);
                material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
                break;
            case 'water':
                geometry = new THREE.BoxGeometry(size.width, 0.5, size.depth);
                material = new THREE.MeshStandardMaterial({ color: 0x0044ff });
                break;
            case 'sewage':
                geometry = new THREE.BoxGeometry(size.width, 0.3, size.depth);
                material = new THREE.MeshStandardMaterial({ color: 0x666666 });
                break;
            default:
                geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
                material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
    }
    addLight(type, options = {}) {
        if (type === 'ambient') {
            const light = new THREE.AmbientLight(options.intensity || 0.4);
            this.scene.add(light);
        }
        else if (type === 'directional') {
            const light = new THREE.DirectionalLight(options.color || 0xffffff, options.intensity || 1);
            light.position.set(options.x || 10, options.y || 20, options.z || 5);
            light.castShadow = true;
            light.shadow.mapSize.width = this.config.shadowMapSize;
            light.shadow.mapSize.height = this.config.shadowMapSize;
            this.scene.add(light);
        }
        else if (type === 'point') {
            const light = new THREE.PointLight(options.color || 0xffffff, options.intensity || 1, options.distance || 100);
            light.position.set(options.x || 0, options.y || 10, options.z || 0);
            this.scene.add(light);
        }
    }
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    dispose() {
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                }
                else {
                    child.material.dispose();
                }
            }
        });
        if (typeof this.renderer.forceContextLoss === 'function') {
            this.renderer.forceContextLoss();
        }
        this.scene.clear();
    }
}
export { SceneRenderer as IsometricCityRenderer };
export default SceneRenderer;
//# sourceMappingURL=renderingEngine.js.map