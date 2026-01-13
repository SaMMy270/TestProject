import React, { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture, PerspectiveCamera, Grid } from "@react-three/drei";
import * as THREE from "three";
import './RoomViewer.css'; 

function Wall({ url, width, height, position, rotation, offset }) {
  const texture = useTexture(url);
  
  const wallTexture = useMemo(() => {
    const t = texture.clone();
    t.repeat.set(0.25, 1);
    t.offset.set(offset, 0);
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false; 
    t.needsUpdate = true;
    return t;
  }, [texture, offset]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      {/* roughness={1} makes the photo look like a real matte wall, not plastic */}
      <meshStandardMaterial map={wallTexture} side={THREE.DoubleSide} roughness={1} />
    </mesh>
  );
}

// 2. Accept 'floorColor' as a prop from App.js
export default function RoomViewer({ data, floorColor }) {
  const [mode, setMode] = useState("orbit");
  const { walls, ceilingHeight, panorama_url } = data;
  const h = parseFloat(ceilingHeight);

  const roomWidth = walls[0].length || 3;
  const roomDepth = walls[1].length || 3;

  const wallConfigs = useMemo(() => {
    return [
      { pos: [0, h / 2, -roomDepth / 2], rot: [0, 0, 0], width: roomWidth, off: 0 },
      { pos: [roomWidth / 2, h / 2, 0], rot: [0, -Math.PI / 2, 0], width: roomDepth, off: 0.25 },
      { pos: [0, h / 2, roomDepth / 2], rot: [0, Math.PI, 0], width: roomWidth, off: 0.5 },
      { pos: [-roomWidth / 2, h / 2, 0], rot: [0, Math.PI / 2, 0], width: roomDepth, off: 0.75 }
    ];
  }, [roomWidth, roomDepth, h]);

  return (
    <div className="viewer-wrapper">
      {/* 3. Use the CSS class instead of inline styles */}
      <button 
        className="view-toggle-btn" 
        onClick={() => setMode(mode === "orbit" ? "walk" : "orbit")}
      >
        {mode === "orbit" ? "🚶 STEP INSIDE" : "🛸 TOP VIEW"}
      </button>

      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={mode === "walk" ? [0, 1.5, 0.1] : [6, 6, 6]} 
            fov={mode === "walk" ? 80 : 50} 
          />
          <OrbitControls 
            target={[0, 1.2, 0]} 
            enableDamping={true}
            dampingFactor={0.1}
            rotateSpeed={0.5}
            minDistance={0.1}
            maxDistance={20}
          />
          
          <ambientLight intensity={0.8} />
          {/* Slightly warm point light for a cozy feel */}
          <pointLight position={[0, h - 0.2, 0]} intensity={1.5} color="#fffaf0" />

          {wallConfigs.map((cfg, idx) => (
            <Wall 
              key={idx}
              url={panorama_url}
              width={cfg.width}
              height={h}
              position={cfg.pos}
              rotation={cfg.rot}
              offset={cfg.off}
            />
          ))}

          {/* 4. The Floor Mesh now uses the dynamic floorColor prop */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[roomWidth, roomDepth]} />
            <meshStandardMaterial color={floorColor} roughness={0.8} metalness={0.2} />
          </mesh>

          <Grid infiniteGrid fadeDistance={20} sectionColor="#333" cellColor="#222" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// REMOVED: const btnStyle (It's now in RoomViewer.css)