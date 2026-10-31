export type Rotation = 0 | 90 | 180 | 270;
export interface GridConfig {
    width: number;
    height: number;
    cellSize: number;
}
export interface BuildingFootprint {
    width: number;
    height: number;
}
export interface PlacedBuilding {
    id: string;
    type: string;
    gridX: number;
    gridY: number;
    width: number;
    height: number;
    rotation: Rotation;
}
export interface PlacedRoad {
    id: string;
    gridX: number;
    gridY: number;
    connections: {
        north: boolean;
        east: boolean;
        south: boolean;
        west: boolean;
    };
}
export declare class GridSystem {
    config: GridConfig;
    private occupiedCells;
    private buildings;
    private roads;
    constructor(config?: GridConfig);
    worldToGrid(worldX: number, worldZ: number): {
        x: number;
        y: number;
    };
    gridToWorld(gridX: number, gridY: number): {
        x: number;
        z: number;
    };
    isValidBounds(gridX: number, gridY: number, width: number, height: number, rotation: Rotation): boolean;
    getOccupiedCells(gridX: number, gridY: number, width: number, height: number, rotation: Rotation): string[];
    canPlace(gridX: number, gridY: number, width: number, height: number, rotation: Rotation, ignoreId?: string): boolean;
    placeBuilding(building: PlacedBuilding): boolean;
    removeBuilding(id: string): boolean;
    placeRoad(road: PlacedRoad): void;
    removeRoad(id: string): boolean;
    updateRoadConnections(): void;
    getBuilding(id: string): PlacedBuilding | undefined;
    getAllBuildings(): PlacedBuilding[];
    getAllRoads(): PlacedRoad[];
}
