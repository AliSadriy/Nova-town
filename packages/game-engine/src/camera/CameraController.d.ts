import React from 'react';
import { CameraConfig } from '@nova-town/game-engine';
interface CameraControllerProps {
    config: CameraConfig;
    worldBounds?: {
        minX: number;
        maxX: number;
        minZ: number;
        maxZ: number;
    };
}
export declare const CameraController: React.FC<CameraControllerProps>;
export default CameraController;
