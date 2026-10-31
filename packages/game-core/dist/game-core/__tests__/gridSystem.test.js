import { GridSystem } from '../src/gridSystem.js';
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
function runTests() {
    console.log('Running GridSystem Stage 2.1 Tests...');
    const grid = new GridSystem({ width: 50, height: 50, cellSize: 2 });
    // Test 1: Coordinate conversion
    const worldCenter = grid.gridToWorld(25, 25);
    const backToGrid = grid.worldToGrid(worldCenter.x, worldCenter.z);
    assert(backToGrid.x === 25 && backToGrid.y === 25, `Back to grid should be 25,25, got ${backToGrid.x},${backToGrid.y}`);
    // Test 2: Grid boundaries
    assert(grid.isValidBounds(0, 0, 2, 2, 0) === true, 'Valid bounds (0,0,2,2)');
    assert(grid.isValidBounds(49, 49, 2, 2, 0) === false, 'Invalid bounds (49,49,2,2)');
    assert(grid.isValidBounds(-1, 0, 1, 1, 0) === false, 'Invalid bounds (-1,0)');
    // Test 3: Building footprint collision
    const building = {
        id: 'b1',
        type: 'residential',
        gridX: 10,
        gridY: 10,
        width: 2,
        height: 3,
        rotation: 0
    };
    assert(grid.canPlace(10, 10, 2, 3, 0) === true, 'Should be able to place b1');
    assert(grid.placeBuilding(building) === true, 'Place building b1 should return true');
    assert(grid.canPlace(11, 11, 2, 2, 0) === false, 'Should collide with b1');
    assert(grid.canPlace(15, 15, 2, 2, 0) === true, 'Should be able to place at 15,15');
    // Test 4: Road connectivity
    const r1 = { id: 'r1', gridX: 10, gridY: 10, connections: { north: false, east: false, south: false, west: false } };
    const r2 = { id: 'r2', gridX: 10, gridY: 11, connections: { north: false, east: false, south: false, west: false } };
    grid.placeRoad(r1);
    grid.placeRoad(r2);
    const roads = grid.getAllRoads();
    const updatedR1 = roads.find(r => r.id === 'r1');
    const updatedR2 = roads.find(r => r.id === 'r2');
    assert(updatedR1?.connections.north === true, 'Road r1 should connect north');
    assert(updatedR2?.connections.south === true, 'Road r2 should connect south');
    console.log('All GridSystem Stage 2.1 Tests PASSED successfully!');
}
runTests();
//# sourceMappingURL=gridSystem.test.js.map