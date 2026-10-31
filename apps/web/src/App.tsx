import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { DEFAULT_CAMERA_CONFIG, CameraController } from '@nova-town/game-engine';
import { GridSystem, GameLogic } from '@nova-town/game-core';
import { BUILDING_CONFIGS } from '@nova-town/economy';

const grid = new GridSystem({ width: 50, height: 50, cellSize: 2 });
const city = GameLogic.createCity('Nova Capital', 'player-1', 5000);

export default function App() {
  const [selectedTool, setSelectedTool] = useState<keyof typeof BUILDING_CONFIGS | 'demolish'>('RESIDENTIAL_SMALL');
  const [placedItems, setPlacedItems] = useState<any[]>([]);
  const [gold, setGold] = useState<number>(city.gold);
  const [population, setPopulation] = useState<number>(0);

  const handleCellClick = (gridX: number, gridY: number) => {
    if (selectedTool === 'demolish') {
      const existing = placedItems.find(item => item.gridX === gridX && item.gridY === gridY);
      if (existing) {
        grid.removeBuilding(existing.id);
        setPlacedItems(prev => prev.filter(item => item.id !== existing.id));
        setGold(g => g + Math.floor((BUILDING_CONFIGS as any)[existing.type].cost * 0.5));
      }
      return;
    }

    const config = (BUILDING_CONFIGS as any)[selectedTool];
    if (!config) return;
    if (gold < config.cost) {
      alert('Not enough gold to build!');
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
        rotation: 0 as const
      };
      if (grid.placeBuilding(placed)) {
        setPlacedItems(prev => [...prev, placed]);
        setGold(g => g - config.cost);
        if (selectedTool.includes('RESIDENTIAL')) {
          setPopulation(p => p + 20);
        }
      }
    } else {
      alert('Cannot place building here! Collision or out of bounds.');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#121218', margin: 0, padding: 0, overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {/* HUD Top Bar */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20, display: 'flex', gap: '20px', background: 'rgba(20,20,30,0.85)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
        <div>🏛️ <b>Nova Capital</b></div>
        <div>💰 <b>{gold}</b> Gold</div>
        <div>👥 <b>{population}</b> Pop</div>
      </div>

      {/* Building Tool Palette */}
      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: '10px', background: 'rgba(20,20,30,0.9)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        {Object.keys(BUILDING_CONFIGS).map(type => {
          const cfg = (BUILDING_CONFIGS as any)[type];
          const isSelected = selectedTool === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedTool(type as any)}
              style={{
                background: isSelected ? '#4ecca3' : '#232931',
                color: isSelected ? '#121218' : 'white',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              {type.replace('_', ' ')} (${cfg.cost})
            </button>
          );
        })}
        <button
          onClick={() => setSelectedTool('demolish')}
          style={{
            background: selectedTool === 'demolish' ? '#e74c3c' : '#232931',
            color: 'white',
            border: 'none',
            padding: '10px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          🔨 Demolish
        </button>
      </div>

      {/* 3D Viewport */}
      <Canvas camera={{ position: DEFAULT_CAMERA_CONFIG.defaultPosition, fov: 45 }}>
        <CameraController config={DEFAULT_CAMERA_CONFIG} worldBounds={{ minX: -25, maxX: 25, minZ: -25, maxZ: 25 }} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[30, 50, 20]} intensity={1} castShadow />

        {/* Terrain Plane */}
        <mesh
          position={[0, -0.01, 0]}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            const point = e.point;
            const gridCoord = grid.worldToGrid(point.x, point.z);
            handleCellClick(gridCoord.x, gridCoord.y);
          }}
        >
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#1a1a24" />
        </mesh>
        <gridHelper args={[50, 50, 0x4ecca3, 0x232931]} position={[0, 0, 0]} />

        {/* Render Placed Buildings */}
        {placedItems.map(item => {
          const worldPos = grid.gridToWorld(item.gridX, item.gridY);
          const height = item.type.includes('TOWER') ? 4 : item.type.includes('FACTORY') ? 3 : 2;
          const color = item.type.includes('RESIDENTIAL') ? '#3498db' : item.type.includes('COMMERCIAL') ? '#e74c3c' : item.type.includes('INDUSTRIAL') ? '#2ecc71' : item.type.includes('PARK') ? '#27ae60' : '#f1c40f';
          return (
            <mesh
              key={item.id}
              position={[worldPos.x + item.width, height / 2, worldPos.z + item.height]}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                handleCellClick(item.gridX, item.gridY);
              }}
            >
              <boxGeometry args={[item.width * 2, height, item.height * 2]} />
              <meshStandardMaterial color={color} />
            </mesh>
          );
        })}
      </Canvas>
    </div>
  );
}
