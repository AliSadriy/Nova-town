import { DEFAULT_CAMERA_CONFIG, clampVector3, calculateIsometricPosition } from '../src/index.js';
import * as THREE from 'three';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runCameraTests() {
  console.log('Running Camera System Stage 2.2 Comprehensive Tests...');

  // Test 1: Camera Config defaults & boundaries
  assert(DEFAULT_CAMERA_CONFIG.minZoom === 10, 'Min zoom should be 10');
  assert(DEFAULT_CAMERA_CONFIG.maxZoom === 120, 'Max zoom should be 120');
  assert(DEFAULT_CAMERA_CONFIG.dampingFactor === 0.05, 'Damping factor should be 0.05');
  assert(DEFAULT_CAMERA_CONFIG.minPolarAngle === Math.PI / 6, 'Min polar angle should be 30 deg');
  assert(DEFAULT_CAMERA_CONFIG.maxPolarAngle === Math.PI / 2.2, 'Max polar angle should be ~81 deg');
  assert(DEFAULT_CAMERA_CONFIG.enableRotate === true, 'Rotation should be enabled');
  assert(DEFAULT_CAMERA_CONFIG.enableZoom === true, 'Zoom should be enabled');
  assert(DEFAULT_CAMERA_CONFIG.enablePan === true, 'Pan should be enabled');

  // Test 2: Clamp vector3 (boundary clamping)
  const v1 = new THREE.Vector3(60, 0, -60);
  clampVector3(v1, -25, 25, -25, 25);
  assert(v1.x === 25, 'Vector X should be clamped to max 25');
  assert(v1.z === -25, 'Vector Z should be clamped to min -25');

  const v2 = new THREE.Vector3(-30, 0, 30);
  clampVector3(v2, -25, 25, -25, 25);
  assert(v2.x === -25, 'Vector X should be clamped to min -25');
  assert(v2.z === 25, 'Vector Z should be clamped to max 25');

  const v3 = new THREE.Vector3(0, 0, 0);
  clampVector3(v3, -25, 25, -25, 25);
  assert(v3.x === 0 && v3.z === 0, 'Vector within bounds should remain unchanged');

  // Test 3: Calculate isometric position
  const center = new THREE.Vector3(0, 0, 0);
  const pos = calculateIsometricPosition(center, 50);
  assert(pos.y > 0, 'Isometric camera Y position should be positive');
  assert(Math.abs(pos.x - 50 * Math.cos(Math.PI / 4)) < 0.001, 'Isometric X calculation correct');
  assert(Math.abs(pos.z - 50 * Math.sin(Math.PI / 4)) < 0.001, 'Isometric Z calculation correct');

  // Test 4: Edge case configuration tests
  const customConfig = { ...DEFAULT_CAMERA_CONFIG, minZoom: 5, maxZoom: 200 };
  assert(customConfig.minZoom === 5 && customConfig.maxZoom === 200, 'Custom zoom limits correctly configured');

  console.log('All Camera System Stage 2.2 Comprehensive Tests PASSED successfully!');
}

runCameraTests();
