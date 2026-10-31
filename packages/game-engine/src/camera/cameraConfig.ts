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

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  defaultPosition: [30, 40, 50],
  defaultTarget: [0, 0, 0],
  minZoom: 10,
  maxZoom: 120,
  minPolarAngle: Math.PI / 6, // 30 degrees
  maxPolarAngle: Math.PI / 2.2, // ~81 degrees (prevent going below ground)
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  dampingFactor: 0.05,
};
