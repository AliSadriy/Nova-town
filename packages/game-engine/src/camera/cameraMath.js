import * as THREE from 'three';
export function clampVector3(vector, minX, maxX, minZ, maxZ) {
    vector.x = Math.max(minX, Math.min(maxX, vector.x));
    vector.z = Math.max(minZ, Math.min(maxZ, vector.z));
    return vector;
}
export function calculateIsometricPosition(center, distance, angle = Math.PI / 4) {
    const x = center.x + distance * Math.cos(angle);
    const z = center.z + distance * Math.sin(angle);
    const y = center.y + distance * 0.8;
    return new THREE.Vector3(x, y, z);
}
//# sourceMappingURL=cameraMath.js.map