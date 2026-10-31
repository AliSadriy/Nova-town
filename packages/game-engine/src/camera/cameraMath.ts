import * as THREE from 'three';
import { CameraConfig } from './cameraConfig.js';

export function clampVector3(vector: THREE.Vector3, minX: number, maxX: number, minZ: number, maxZ: number): THREE.Vector3 {
  vector.x = Math.max(minX, Math.min(maxX, vector.x));
  vector.z = Math.max(minZ, Math.min(maxZ, vector.z));
  return vector;
}

export function calculateIsometricPosition(center: THREE.Vector3, distance: number, angle: number = Math.PI / 4): THREE.Vector3 {
  const x = center.x + distance * Math.cos(angle);
  const z = center.z + distance * Math.sin(angle);
  const y = center.y + distance * 0.8;
  return new THREE.Vector3(x, y, z);
}
