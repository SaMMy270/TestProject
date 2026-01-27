import React, { useState } from 'react';
import AIUploadPage from './components/AI/AiUpload';
import RoomViewer from "./components/AI/RoomViewer";
import RoomSelector from "./components/customized/RoomSelector";
import DimensionSetup from "./components/customized/DimensionSetup";
import OpeningsSetup from "./components/customized/OpeningSetup";
import Designer from "./components/Designer";
import './components/customized/customized.css';

function App() {
  // Steps: 'CHOICE', 'AI_UPLOAD', 'AI_VALIDATE', 'SELECTOR', 'DIMENSIONS', 'OPENINGS', 'DESIGNER'
  const [step, setStep] = useState('CHOICE');
  const [mode, setMode] = useState(null); // 'AI' or 'CUSTOM'
  const [roomData, setRoomData] = useState({ projectTitle: "Untitled Project", walls: [] });
  const updateRoomData = (newData) => {
    setRoomData(prev => ({ ...prev, ...newData }));
  };

  // Helper to determine if we should show full-screen 3D
  const isFullPage = step === 'AI_VALIDATE' || step === 'DESIGNER';
  const handleConfirmRoom = () => {
    // 1. We use the existing 'roomData' state (populated by AiUpload)
    // 2. We FORMAT it so Designer.js can read it easily
    const designerReadyData = {
      ...roomData,
      // Map AI 'results' to flat properties for Designer
      length: roomData.results?.length || 5,
      width: roomData.results?.breadth || 5,
      height: roomData.ceilingHeight || 2.5,
      panoramaUrl: roomData.panorama_url, // Ensure URL is passed
      mode: 'AI'
    };

    // 3. Update state and move to Designer
    setRoomData(designerReadyData);
    setStep('DESIGNER');
  };
  return (
    <div className={`App ${isFullPage ? 'full-flow' : ''}`}>

      {/* STEP 0: INITIAL CHOICE */}
      {step === 'CHOICE' && (
        <div className="choice-container">
          <h2 className="brand-logo">PlanPro 3D</h2>
          <h1>Choose Your Design Mode</h1>
          <div className="choice-grid">
            <div className="choice-card">
              <h3>Manual Designer</h3>
              <p>Build from scratch with custom shapes and dimensions.</p>
              <button className="main-btn" onClick={() => { setMode('CUSTOM'); setStep('SELECTOR'); }}>
                Fully Customize
              </button>
            </div>
            <div className="choice-card">
              <h3>AI Image Based</h3>
              <p>Upload room photos and let AI stitch your 3D environment.</p>
              <button className="main-btn" onClick={() => { setMode('AI'); setStep('AI_UPLOAD'); }}>
                Start AI Flow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- AI FLOW --- */}
      {step === 'AI_UPLOAD' && (
        <div className="main-container">
          <AIUploadPage
            onSuccess={(data) => { setRoomData(data); setStep('AI_VALIDATE'); }}
            onBack={() => setStep('CHOICE')}
          />
          {/* Placeholder for the right side during upload */}
          <div className="viewer-container">
            <div className="placeholder">
              <h3>Ready to start?</h3>
              <p>Upload photos to generate your 3D preview.</p>
            </div>
          </div>
        </div>
      )}

      {step === 'AI_VALIDATE' && (
        <div className="full-screen-viewer">
          <div className="viewer-wrapper">
            {/* These controls float ON TOP of the RoomViewer */}
            <div className="validation-controls">
              <button className="back-btn" onClick={() => setStep('AI_UPLOAD')}>
                Try Again
              </button>
              <button className="main-btn" onClick={handleConfirmRoom}>
                Looks Good! Add Furniture
              </button>
            </div>

            <RoomViewer data={roomData} />
          </div>
        </div>
      )
      }

      {/* --- CUSTOMIZED FLOW --- */}
      {
        step === 'SELECTOR' && (
          <RoomSelector onSelect={(shape) => { updateRoomData({ shape }); setStep('DIMENSIONS'); }} />
        )
      }

      {
        step === 'DIMENSIONS' && (
          <DimensionSetup
            data={roomData}
            onUpdate={updateRoomData}
            onNext={() => setStep('OPENINGS')}
            onBack={() => setStep('SELECTOR')}
          />
        )
      }

      {
        step === 'OPENINGS' && (
          <OpeningsSetup
            data={roomData}
            onUpdate={updateRoomData}
            onNext={() => setStep('DESIGNER')}
            onBack={() => setStep('DIMENSIONS')}
          />
        )
      }

      {/* --- SHARED FINAL STAGE --- */}
      {/* --- SHARED FINAL STAGE --- */}
      {step === 'DESIGNER' && (
        <Designer
          roomData={roomData}
          mode={mode}  // This will now be 'AI' or 'CUSTOM'
          onUpdate={updateRoomData}
          onBack={() => setStep('CHOICE')}
        />
      )}
    </div >
  );
}

export default App;