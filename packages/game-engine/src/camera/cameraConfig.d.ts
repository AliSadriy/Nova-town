export interface CameraConfig {
    defaultPosition: [number, number, number];
    defaultTarget: [number, number, number];
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    enableRotate: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    dampingFactor: number;
}
export declare const DEFAULT_CAMERA_CONFIG: CameraConfig;
