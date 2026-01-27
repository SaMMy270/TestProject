import React, { useState } from 'react';
import './AiUpload.css';

const FIXED_WALLS = [
    { id: 0, name: "Front Wall" },
    { id: 1, name: "Right Wall" },
    { id: 2, name: "Back Wall" },
    { id: 3, name: "Left Wall" }
];

export default function AIUploadPage({ onSuccess, onBack }) {
    const [loading, setLoading] = useState(false);
    const [ceilingHeight, setCeilingHeight] = useState(2.5);
    const [walls, setWalls] = useState(FIXED_WALLS.map(w => ({ ...w, length: 3.0, files: [] })));

    const handleGenerate = async () => {
        setLoading(true);
        const formData = new FormData();
        walls.forEach(w => w.files.forEach(f => formData.append('files', f)));

        try {
            const res = await fetch('http://localhost:8000/process-room', { method: 'POST', body: formData });
            const data = await res.json();
            // Instead of setRoomData here, we send it "up" to App.js
            onSuccess({ ...data, walls, ceilingHeight });
        } catch (err) {
            alert("Backend Error: Check if server is running on localhost:8000");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sidebar">
            <button onClick={onBack} className="back-btn">⬅ Back</button>
            <h2 className="brand-logo">PlanPro 3D</h2>
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
                                    onChange={e => {
                                        const u = [...walls];
                                        u[idx].length = parseFloat(e.target.value) || 0;
                                        setWalls(u);
                                    }} />
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
        </div>
    );
}