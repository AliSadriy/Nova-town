import { z } from 'zod';
import * as THREE from 'three';
export declare const RenderConfigSchema: z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
    fov: z.ZodNumber;
    near: z.ZodNumber;
    far: z.ZodNumber;
    shadowMapSize: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    width?: number;
    height?: number;
    fov?: number;
    near?: number;
    far?: number;
    shadowMapSize?: number;
}, {
    width?: number;
    height?: number;
    fov?: number;
    near?: number;
    far?: number;
    shadowMapSize?: number;
}>;
export interface RenderConfig {
    width: number;
    height: number;
    fov: number;
    near: number;
    far: number;
    shadowMapSize: number;
}
export declare class SceneRenderer {
    private scene;
    private camera;
    private renderer;
    private config;
    constructor(canvas: any, config: RenderConfig);
    createGridHelper(size?: number, divisions?: number): THREE.GridHelper;
    createBuildingMesh(type: string, position: {
        x: number;
        y: number;
        z: number;
    }, size: {
        width: number;
        height: number;
        depth: number;
    }): THREE.Mesh;
    addLight(type: 'ambient' | 'directional' | 'point', options?: any): void;
    render(): void;
    dispose(): void;
}
export { SceneRenderer as IsometricCityRenderer };
export type { RenderConfig as RendererConfig };
export default SceneRenderer;
