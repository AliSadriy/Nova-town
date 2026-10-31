export class GridSystem {
    config;
    occupiedCells = new Map();
    buildings = new Map();
    roads = new Map();
    constructor(config = { width: 50, height: 50, cellSize: 2 }) {
        this.config = config;
    }
    worldToGrid(worldX, worldZ) {
        const totalWidth = this.config.width * this.config.cellSize;
        const totalHeight = this.config.height * this.config.cellSize;
        const gridX = Math.floor((worldX + totalWidth / 2) / this.config.cellSize);
        const gridY = Math.floor((worldZ + totalHeight / 2) / this.config.cellSize);
        return { x: gridX, y: gridY };
    }
    gridToWorld(gridX, gridY) {
        const totalWidth = this.config.width * this.config.cellSize;
        const totalHeight = this.config.height * this.config.cellSize;
        const worldX = gridX * this.config.cellSize - totalWidth / 2;
        const worldZ = gridY * this.config.cellSize - totalHeight / 2;
        return { x: worldX, z: worldZ };
    }
    isValidBounds(gridX, gridY, width, height, rotation) {
        let effectiveWidth = width;
        let effectiveHeight = height;
        if (rotation === 90 || rotation === 270) {
            effectiveWidth = height;
            effectiveHeight = width;
        }
        return (gridX >= 0 &&
            gridY >= 0 &&
            gridX + effectiveWidth <= this.config.width &&
            gridY + effectiveHeight <= this.config.height);
    }
    getOccupiedCells(gridX, gridY, width, height, rotation) {
        let effectiveWidth = width;
        let effectiveHeight = height;
        if (rotation === 90 || rotation === 270) {
            effectiveWidth = height;
            effectiveHeight = width;
        }
        const cells = [];
        for (let x = 0; x < effectiveWidth; x++) {
            for (let y = 0; y < effectiveHeight; y++) {
                cells.push(`${gridX + x},${gridY + y}`);
            }
        }
        return cells;
    }
    canPlace(gridX, gridY, width, height, rotation, ignoreId) {
        if (!this.isValidBounds(gridX, gridY, width, height, rotation)) {
            return false;
        }
        const cells = this.getOccupiedCells(gridX, gridY, width, height, rotation);
        for (const cellKey of cells) {
            const occupant = this.occupiedCells.get(cellKey);
            if (occupant && occupant !== ignoreId) {
                return false;
            }
        }
        return true;
    }
    placeBuilding(building) {
        if (!this.canPlace(building.gridX, building.gridY, building.width, building.height, building.rotation)) {
            return false;
        }
        const cells = this.getOccupiedCells(building.gridX, building.gridY, building.width, building.height, building.rotation);
        for (const cellKey of cells) {
            this.occupiedCells.set(cellKey, building.id);
        }
        this.buildings.set(building.id, building);
        return true;
    }
    removeBuilding(id) {
        const building = this.buildings.get(id);
        if (!building)
            return false;
        const cells = this.getOccupiedCells(building.gridX, building.gridY, building.width, building.height, building.rotation);
        for (const cellKey of cells) {
            if (this.occupiedCells.get(cellKey) === id) {
                this.occupiedCells.delete(cellKey);
            }
        }
        this.buildings.delete(id);
        return true;
    }
    placeRoad(road) {
        const cellKey = `${road.gridX},${road.gridY}`;
        this.occupiedCells.set(cellKey, road.id);
        this.roads.set(road.id, road);
        this.updateRoadConnections();
    }
    removeRoad(id) {
        const road = this.roads.get(id);
        if (!road)
            return false;
        const cellKey = `${road.gridX},${road.gridY}`;
        if (this.occupiedCells.get(cellKey) === id) {
            this.occupiedCells.delete(cellKey);
        }
        this.roads.delete(id);
        this.updateRoadConnections();
        return true;
    }
    updateRoadConnections() {
        const roadArray = Array.from(this.roads.values());
        const roadPositions = new Set(roadArray.map(r => `${r.gridX},${r.gridY}`));
        for (const road of roadArray) {
            const north = roadPositions.has(`${road.gridX},${road.gridY + 1}`);
            const south = roadPositions.has(`${road.gridX},${road.gridY - 1}`);
            const east = roadPositions.has(`${road.gridX + 1},${road.gridY}`);
            const west = roadPositions.has(`${road.gridX - 1},${road.gridY}`);
            road.connections = { north, east, south, west };
        }
    }
    getBuilding(id) {
        return this.buildings.get(id);
    }
    getAllBuildings() {
        return Array.from(this.buildings.values());
    }
    getAllRoads() {
        return Array.from(this.roads.values());
    }
}
//# sourceMappingURL=gridSystem.js.map