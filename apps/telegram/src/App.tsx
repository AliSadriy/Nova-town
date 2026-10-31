import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { DEFAULT_CAMERA_CONFIG, CameraController } from '@nova-town/game-engine';
import { GridSystem, GameLogic } from '@nova-town/game-core';
import { BUILDING_CONFIGS } from '@nova-town/economy';

const grid = new GridSystem({ width: 50, height: 50, cellSize: 2 });
const city = GameLogic.createCity('Nova Telegram', 'player-1', 5000);

export default function TelegramApp() {
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
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111827', margin: 0, padding: 0, overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 20, display: 'flex', gap: '15px', background: 'rgba(15,23,42,0.85)', padding: '10px 16px', borderRadius: '10px', color: 'white', fontSize: '14px' }}>
        <div>🏙️ <b>Nova Telegram</b></div>
        <div>💰 <b>{gold}</b></div>
        <div>👥 <b>{population}</b></div>
      </div>

      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.9)', padding: '10px', borderRadius: '12px' }}>
        {Object.keys(BUILDING_CONFIGS).map(type => {
          const cfg = (BUILDING_CONFIGS as any)[type];
          const isSelected = selectedTool === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedTool(type as any)}
              style={{
                background: isSelected ? '#4ecca3' : '#1f2937',
                color: isSelected ? '#111827' : 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px'
              }}
            >
              {type.split('_')[0]} (${cfg.cost})
            </button>
          );
        })}
      </div>

      <Canvas camera={{ position: DEFAULT_CAMERA_CONFIG.defaultPosition, fov: 45 }}>
        <CameraController config={DEFAULT_CAMERA_CONFIG} worldBounds={{ minX: -25, maxX: 25, minZ: -25, maxZ: 25 }} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[30, 50, 20]} intensity={1} castShadow />

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
