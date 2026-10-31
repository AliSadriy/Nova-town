import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { DEFAULT_CAMERA_CONFIG, CameraController } from '@nova-town/game-engine';
import { GridSystem, GameLogic } from '@nova-town/game-core';
import { BUILDING_CONFIGS } from '@nova-town/economy';
const grid = new GridSystem({ width: 50, height: 50, cellSize: 2 });
const city = GameLogic.createCity('Nova Telegram', 'player-1', 5000);
export default function TelegramApp() {
    const [selectedTool, setSelectedTool] = useState('RESIDENTIAL_SMALL');
    const [placedItems, setPlacedItems] = useState([]);
    const [gold, setGold] = useState(city.gold);
    const [population, setPopulation] = useState(0);
    const handleCellClick = (gridX, gridY) => {
        if (selectedTool === 'demolish') {
            const existing = placedItems.find(item => item.gridX === gridX && item.gridY === gridY);
            if (existing) {
                grid.removeBuilding(existing.id);
                setPlacedItems(prev => prev.filter(item => item.id !== existing.id));
                setGold(g => g + Math.floor(BUILDING_CONFIGS[existing.type].cost * 0.5));
            }
            return;
        }
        const config = BUILDING_CONFIGS[selectedTool];
        if (!config)
            return;
        if (gold < config.cost) {
            return;
        }
        const width = selectedTool.includes('TOWER') || selectedTool.includes('FACTORY') ? 3 : 2;
        const height = width;
        if (grid.canPlace(gridX, gridY, width, height, 0)) {
            const newBuilding = GameLogic.placeBuilding(city, selectedTool, gridX, gridY);
            const placed = {
                id: newBuilding.id,
                type: selectedTool,
                gridX,
                gridY,
                width,
                height,
                rotation: 0
            };
            if (grid.placeBuilding(placed)) {
                setPlacedItems(prev => [...prev, placed]);
                setGold(g => g - config.cost);
                if (selectedTool.includes('RESIDENTIAL')) {
                    setPopulation(p => p + 20);
                }
            }
        }
    };
    return (_jsxs("div", { style: { width: '100vw', height: '100vh', background: '#111827', margin: 0, padding: 0, overflow: 'hidden', fontFamily: 'sans-serif' }, children: [_jsxs("div", { style: { position: 'absolute', top: 15, left: 15, zIndex: 20, display: 'flex', gap: '15px', background: 'rgba(15,23,42,0.85)', padding: '10px 16px', borderRadius: '10px', color: 'white', fontSize: '14px' }, children: [_jsxs("div", { children: ["\uD83C\uDFD9\uFE0F ", _jsx("b", { children: "Nova Telegram" })] }), _jsxs("div", { children: ["\uD83D\uDCB0 ", _jsx("b", { children: gold })] }), _jsxs("div", { children: ["\uD83D\uDC65 ", _jsx("b", { children: population })] })] }), _jsx("div", { style: { position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.9)', padding: '10px', borderRadius: '12px' }, children: Object.keys(BUILDING_CONFIGS).map(type => {
                    const cfg = BUILDING_CONFIGS[type];
                    const isSelected = selectedTool === type;
                    return (_jsxs("button", { onClick: () => setSelectedTool(type), style: {
                            background: isSelected ? '#4ecca3' : '#1f2937',
                            color: isSelected ? '#111827' : 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '11px'
                        }, children: [type.split('_')[0], " ($", cfg.cost, ")"] }, type));
                }) }), _jsxs(Canvas, { camera: { position: DEFAULT_CAMERA_CONFIG.defaultPosition, fov: 45 }, children: [_jsx(CameraController, { config: DEFAULT_CAMERA_CONFIG, worldBounds: { minX: -25, maxX: 25, minZ: -25, maxZ: 25 } }), _jsx("ambientLight", { intensity: 0.7 }), _jsx("directionalLight", { position: [30, 50, 20], intensity: 1, castShadow: true }), _jsxs("mesh", { position: [0, -0.01, 0], receiveShadow: true, rotation: [-Math.PI / 2, 0, 0], onClick: (e) => {
                            e.stopPropagation();
                            const point = e.point;
                            const gridCoord = grid.worldToGrid(point.x, point.z);
                            handleCellClick(gridCoord.x, gridCoord.y);
                        }, children: [_jsx("planeGeometry", { args: [50, 50] }), _jsx("meshStandardMaterial", { color: "#1a1a24" })] }), _jsx("gridHelper", { args: [50, 50, 0x4ecca3, 0x232931], position: [0, 0, 0] }), placedItems.map(item => {
                        const worldPos = grid.gridToWorld(item.gridX, item.gridY);
                        const height = item.type.includes('TOWER') ? 4 : item.type.includes('FACTORY') ? 3 : 2;
                        const color = item.type.includes('RESIDENTIAL') ? '#3498db' : item.type.includes('COMMERCIAL') ? '#e74c3c' : item.type.includes('INDUSTRIAL') ? '#2ecc71' : item.type.includes('PARK') ? '#27ae60' : '#f1c40f';
                        return (_jsxs("mesh", { position: [worldPos.x + item.width, height / 2, worldPos.z + item.height], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [item.width * 2, height, item.height * 2] }), _jsx("meshStandardMaterial", { color: color })] }, item.id));
                    })] })] }));
}
