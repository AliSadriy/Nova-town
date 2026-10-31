import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
export const CameraController = ({ config, worldBounds }) => {
    const controlsRef = useRef(null);
    const { camera } = useThree();
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.minDistance = config.minZoom;
            controlsRef.current.maxDistance = config.maxZoom;
            controlsRef.current.minPolarAngle = config.minPolarAngle;
            controlsRef.current.maxPolarAngle = config.maxPolarAngle;
            controlsRef.current.enableDamping = true;
            controlsRef.current.dampingFactor = config.dampingFactor;
            controlsRef.current.enableRotate = config.enableRotate;
            controlsRef.current.enableZoom = config.enableZoom;
            controlsRef.current.enablePan = config.enablePan;
            controlsRef.current.target.set(config.defaultTarget[0], config.defaultTarget[1], config.defaultTarget[2]);
            camera.position.set(config.defaultPosition[0], config.defaultPosition[1], config.defaultPosition[2]);
            controlsRef.current.update();
        }
    }, [config, camera]);
    useFrame(() => {
        if (controlsRef.current && worldBounds) {
            const target = controlsRef.current.target;
            const clampedX = Math.max(worldBounds.minX, Math.min(worldBounds.maxX, target.x));
            const clampedZ = Math.max(worldBounds.minZ, Math.min(worldBounds.maxZ, target.z));
            if (target.x !== clampedX || target.z !== clampedZ) {
                target.x = clampedX;
                target.z = clampedZ;
                controlsRef.current.update();
            }
        }
    });
    return (_jsx(OrbitControls, { ref: controlsRef, makeDefault: true, enableDamping: true, dampingFactor: config.dampingFactor, minDistance: config.minZoom, maxDistance: config.maxZoom, minPolarAngle: config.minPolarAngle, maxPolarAngle: config.maxPolarAngle, enableRotate: config.enableRotate, enableZoom: config.enableZoom, enablePan: config.enablePan }));
};
export default CameraController;
