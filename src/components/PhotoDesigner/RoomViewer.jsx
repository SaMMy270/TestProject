import React, { Suspense, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber"; // Added useThree here
import { OrbitControls, useTexture, PerspectiveCamera, Grid } from "@react-three/drei";
import * as THREE from "three";
import './RoomViewer.css';

// 1. WALL COMPONENT
// 1. WALL COMPONENT (Updated to fix Black Wall issue)
function Wall({ url, width, height, position, rotation, offset }) {
  // useTexture handles crossOrigin: 'anonymous' automatically!
  const texture = useTexture(url);

  const wallTexture = useMemo(() => {
    if (!texture) return null;

    const t = texture.clone();
    t.repeat.set(0.25, 1);
    t.offset.set(offset, 0);
    t.wrapS = THREE.RepeatWrapping;
    t.minFilter = THREE.LinearFilter;

    // This tells the GPU to re-upload the image if it was previously "tainted"
    t.needsUpdate = true;
    return t;
  }, [texture, offset]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={wallTexture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 2. CAMERA LIGHT HELPER (Must be used inside Canvas)
function CameraLight() {
  const { camera } = useThree();
  return <pointLight position={camera.position} intensity={1.5} />;
}

// 3. MAIN VIEWER COMPONENT
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
      <button
        className="view-toggle-btn"
        onClick={() => setMode(mode === "orbit" ? "walk" : "orbit")}
      >
        {mode === "orbit" ? "🚶 STEP INSIDE" : "🛸 TOP VIEW"}
      </button>

      <Canvas shadow={false}>
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

          {/* LIGHTING SETUP */}
          <CameraLight /> {/* This light follows the camera like a headlamp */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 10, 10]} intensity={1.0} />
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

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[roomWidth, roomDepth]} />
            <meshStandardMaterial color={floorColor} roughness={0.8} metalness={0.2} />
          </mesh>

          <Grid infiniteGrid fadeDistance={20} sectionColor="#444" cellColor="#222" />
        </Suspense>
      </Canvas>
    </div>
  );
}