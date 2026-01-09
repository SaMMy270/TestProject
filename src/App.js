import React, { useState } from 'react';
import RoomViewer from './components/PhotoDesigner/RoomViewer';
import './App.css'; // Import the new modern CSS

const FIXED_WALLS = [
  { id: 0, name: "Front Wall" },
  { id: 1, name: "Right Wall" },
  { id: 2, name: "Back Wall" },
  { id: 3, name: "Left Wall" }
];

const COLOR_PRESETS = [
  { name: 'Dark', color: '#1a1a1a' },
  { name: 'Wood', color: '#5d4037' },
  { name: 'Grey', color: '#757575' },
  { name: 'Beige', color: '#d7ccc8' },
];

function App() {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ceilingHeight, setCeilingHeight] = useState(2.5);
  const [floorColor, setFloorColor] = useState('#1a1a1a'); // NEW STATE

  const [walls, setWalls] = useState(
    FIXED_WALLS.map(w => ({ ...w, length: 3.0, files: [] }))
  );

  const handleGenerate = async () => {
    setLoading(true);
    const formData = new FormData();
    walls.forEach(w => w.files.forEach(f => formData.append('files', f)));

    try {
      const res = await fetch('http://localhost:8000/process-room', { method: 'POST', body: formData });
      const data = await res.json();
      setRoomData({ ...data, walls, ceilingHeight });
    } catch (err) {
      alert("Backend Error: Check if server is running on localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className="sidebar">
        <h2 className="brand-logo">PlanPro 3D</h2>

        {!roomData ? (
          <div className="controls">
            <div className="height-input">
              <label>Ceiling Height (meters):</label>
              <input type="number" step="0.1" value={ceilingHeight} onChange={e => setCeilingHeight(e.target.value)} />
            </div>

            <div className="scroll-area">
              {walls.map((wall, idx) => (
                <div key={idx} className="wall-card">
                  <div className="wall-header">
                    <strong>{wall.name}</strong>
                    <input type="number" step="0.1" placeholder="Length"
                      onChange={e => { const u = [...walls]; u[idx].length = parseFloat(e.target.value) || 0; setWalls(u); }} />
                  </div>
                  <input type="file" multiple className="file-input" onChange={e => {
                    const u = [...walls]; u[idx].files = Array.from(e.target.files); setWalls(u);
                  }} />
                </div>
              ))}
            </div>

            <button onClick={handleGenerate} disabled={loading} className="main-btn">
              {loading ? "Stitching Photos..." : "Generate 3D Room"}
            </button>
          </div>
        ) : (
          <div className="result-side">
            <button onClick={() => setRoomData(null)} className="back-btn">⬅ Start New Room</button>

            {/* NEW FLOOR COLOR SECTION */}
            <div className="floor-selector">
              <p className="section-label">Floor Style</p>
              <div className="preset-grid">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => setFloorColor(p.color)}
                    style={{ backgroundColor: p.color, border: floorColor === p.color ? '2px solid #2563eb' : '1px solid #ddd' }}
                    className="color-chip"
                    title={p.name}
                  />
                ))}
              </div>
              <div className="custom-color-row">
                <span>Custom:</span>
                <input type="color" value={floorColor} onChange={(e) => setFloorColor(e.target.value)} />
              </div>
            </div>

            <div className="stats-card">
              <p>Height: <strong>{ceilingHeight}m</strong></p>
              <p>Walls: <strong>4</strong></p>
            </div>
          </div>
        )}
      </div>

      <div className="viewer-container">
        {roomData ? (
          <RoomViewer data={roomData} floorColor={floorColor} />
        ) : (
          <div className="placeholder">
            <div className="placeholder-icon">🏠</div>
            <h3>Ready to start?</h3>
            <p>Enter wall dimensions and upload photos <br /> to generate your 3D preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;