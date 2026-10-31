import { GridSystem } from '../src/gridSystem.js';
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
function runStage23Tests() {
    console.log('Running Stage 2.3 Building Placement Tests...');
    const grid = new GridSystem({ width: 50, height: 50, cellSize: 2 });
    // Test footprint and rotation bounds validation
    assert(grid.isValidBounds(0, 0, 2, 2, 0) === true, 'Valid bounds at origin (2x2)');
    assert(grid.isValidBounds(49, 49, 2, 2, 0) === false, 'Out of bounds at bottom-right');
    // Test 90-degree rotation dimensions
    assert(grid.isValidBounds(48, 48, 2, 3, 90) === false, 'Rotated 2x3 at (48,48) should be out of bounds');
    assert(grid.isValidBounds(45, 45, 2, 3, 90) === true, 'Rotated 2x3 at (45,45) should be valid');
    // Test placement collision
    const b1 = { id: 'res1', type: 'RESIDENTIAL_SMALL', gridX: 10, gridY: 10, width: 2, height: 2, rotation: 0 };
    assert(grid.canPlace(10, 10, 2, 2, 0) === true, 'Should be able to place res1');
    assert(grid.placeBuilding(b1) === true, 'res1 placement should succeed');
    assert(grid.canPlace(11, 11, 2, 2, 0) === false, 'Should collide with res1');
    // Test removal frees up cells
    assert(grid.removeBuilding('res1') === true, 'Should successfully remove res1');
    assert(grid.canPlace(11, 11, 2, 2, 0) === true, 'Should be able to place at (11,11) after removal');
    console.log('All Stage 2.3 Building Placement Tests PASSED successfully!');
}
runStage23Tests();
//# sourceMappingURL=buildingPlacement.test.js.map