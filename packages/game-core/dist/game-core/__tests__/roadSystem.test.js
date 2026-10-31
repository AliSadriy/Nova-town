import { GridSystem } from '../src/gridSystem.js';
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
function runRoadSystemTests() {
    console.log('Running Road System Stage 2.4 Tests...');
    const grid = new GridSystem({ width: 50, height: 50, cellSize: 2 });
    // Test road placement and auto-connectivity
    const r1 = { id: 'r1', gridX: 20, gridY: 20, connections: { north: false, east: false, south: false, west: false } };
    const r2 = { id: 'r2', gridX: 20, gridY: 21, connections: { north: false, east: false, south: false, west: false } };
    const r3 = { id: 'r3', gridX: 21, gridY: 20, connections: { north: false, east: false, south: false, west: false } };
    grid.placeRoad(r1);
    grid.placeRoad(r2);
    grid.placeRoad(r3);
    const roads = grid.getAllRoads();
    const updatedR1 = roads.find(r => r.id === 'r1');
    const updatedR2 = roads.find(r => r.id === 'r2');
    const updatedR3 = roads.find(r => r.id === 'r3');
    assert(updatedR1?.connections.north === true, 'Road r1 should connect north to r2');
    assert(updatedR1?.connections.east === true, 'Road r1 should connect east to r3');
    assert(updatedR2?.connections.south === true, 'Road r2 should connect south to r1');
    assert(updatedR3?.connections.west === true, 'Road r3 should connect west to r1');
    // Test road removal updates remaining road connections
    grid.removeRoad('r3');
    const roadsAfterRemoval = grid.getAllRoads();
    const r1AfterRemoval = roadsAfterRemoval.find(r => r.id === 'r1');
    assert(r1AfterRemoval?.connections.east === false, 'Road r1 east connection should be false after r3 removal');
    console.log('All Road System Stage 2.4 Tests PASSED successfully!');
}
runRoadSystemTests();
//# sourceMappingURL=roadSystem.test.js.map