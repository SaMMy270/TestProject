import React, { useState } from "react";
import Room from "./Room";
import Catalog from "./customized/Catalog";
import Billpop from "./customized/Billpop";
import Sidebar from "./customized/SIdebar";
import './customized/customized.css';


export default function Designer({ roomData, mode, onUpdate, onBack }) {
    const [furnitureList, setFurnitureList] = useState([]);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isBillOpen, setIsBillOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // View and Full Preview States
    const [viewMode, setViewMode] = useState('3D');
    const [isPreviewActive, setIsPreviewActive] = useState(false);

    // NEW: Save/Exit States
    const [shouldExport, setShouldExport] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const wallColor = roomData.wallColor || "#ffffff";
    const floorTexture = roomData.floorTexture || "plain";
    const totalCost = furnitureList.reduce((sum, item) => sum + (item.price || 0), 0);
    
    // Handle AI mode wall count (usually 4 for panorama)
    const wallCount = mode === 'AI' ? 4 : (roomData.shape === 'SQUARE' ? 4 : (roomData.shape === 'HEXAGON' ? 6 : 8));

    const rotateSelected = (deg) => {
        if (selectedIndex === null) return;
        const newList = [...furnitureList];
        const currentRot = newList[selectedIndex].rotation || 0;
        newList[selectedIndex].rotation = currentRot + (deg * Math.PI / 180);
        setFurnitureList(newList);
    };

    const togglePreview = () => {
        if (isPreviewActive) {
            setViewMode('3D');
            setIsPreviewActive(false);
        } else {
            setIsPreviewActive(true);
        }
    };

    // --- LOGIC FOR CLEARING DATA ON EXIT ---
    const handleExitWithoutSaving = () => {
        onUpdate({
            wallColor: "#ffffff",
            floorTexture: "plain",
            openings: [],
            projectTitle: "Untitled Project"
        });
        setFurnitureList([]);
        onBack();
    };

    const handleSaveAndExit = () => {
        setShouldExport(true); // Trigger GLB Download
    };

    return (
        <div className={`designer-root ${isPreviewActive ? 'preview-mode-active' : ''}`}>

            {/* EXIT CONFIRMATION DIALOG */}
            {showExitConfirm && (
                <div className="modal-overlay">
                    <div className="confirm-dialog">
                        <h3>Save Progress?</h3>
                        <p>Would you like to save your 3D model before exiting?</p>
                        <div className="dialog-buttons">
                            <button className="btn-secondary" onClick={() => setShowExitConfirm(false)}>Cancel</button>
                            <button className="btn-danger" onClick={handleExitWithoutSaving}>Don't Save</button>
                            <button className="btn-save-confirm" onClick={handleSaveAndExit}>Save & Exit</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="topbar">
                {/* Trigger Exit Dialog */}
                <button onClick={() => setShowExitConfirm(true)} className="btn-back">← Back</button>

                <div className="project-title-area">
                    {isEditingTitle ? (
                        <input
                            autoFocus
                            className="title-edit-input"
                            value={roomData.projectTitle || "Untitled Project"}
                            onBlur={() => setIsEditingTitle(false)}
                            onChange={(e) => onUpdate({ projectTitle: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                        />
                    ) : (
                        <h2 onClick={() => setIsEditingTitle(true)}>
                            {roomData.projectTitle || "Untitled Project"} <span className="edit-pencil">✏️</span>
                        </h2>
                    )}
                </div>

                <div className="view-controls-top">
                    <button
                        className={`preview-toggle-btn ${isPreviewActive ? 'active' : ''}`}
                        onClick={togglePreview}
                    >
                        {isPreviewActive ? "🛠️ Exit Preview" : "👁️ Full Preview"}
                    </button>

                    {isPreviewActive && (
                        <div className="preview-options fade-in">
                            <button className={viewMode === 'TOP' ? 'active' : ''} onClick={() => setViewMode('TOP')}>📐 Top</button>
                            <select value={viewMode.startsWith('WALL_') ? viewMode : ""} onChange={(e) => setViewMode(e.target.value)}>
                                <option value="" disabled>Select Wall...</option>
                                {[...Array(wallCount)].map((_, i) => (
                                    <option key={i} value={`WALL_${i}`}>Wall {i + 1} View</option>
                                ))}
                            </select>
                            <button className={viewMode === '3D' ? 'active' : ''} onClick={() => setViewMode('3D')}>🏠 Reset 3D</button>
                        </div>
                    )}

                    {/* THE SAVE BUTTON */}
                    <button className="btn-save-main" onClick={() => setShouldExport(true)}>
                        💾 Save
                    </button>
                </div>

                <button className="btn-bill" onClick={() => setIsBillOpen(true)}>
                    🛒 ₹{totalCost.toLocaleString()}
                </button>
            </header>

            <div className="main-content">
                {!isPreviewActive && (
                    <aside className="sidebar-left">
                        <Sidebar
                            wallColor={wallColor}
                            setWallColor={(col) => onUpdate({ wallColor: col })}
                            floorTexture={floorTexture}
                            setFloorTexture={(tex) => onUpdate({ floorTexture: tex })}
                            selectedIndex={selectedIndex}
                            rotateSelected={rotateSelected}
                        />
                    </aside>
                )}

                <section className="canvas-wrapper">
                    <Room
                     
                        panoramaUrl={roomData.panoramaUrl} 
                        
                        roomData={roomData}
                        mode={mode}
                        wallColor={wallColor}
                        floorTexture={floorTexture}
                        furnitureList={furnitureList}
                        setFurnitureList={setFurnitureList}
                        selectedModel={selectedCatalogItem}
                        setSelectedModel={setSelectedCatalogItem}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                        viewMode={viewMode}
                        isPreviewActive={isPreviewActive}
                        shouldExport={shouldExport}
                        onExportComplete={() => {
                            setShouldExport(false);
                            if (showExitConfirm) onBack(); 
                        }}
                    />
                </section>

                {!isPreviewActive && (
                    <aside className="sidebar-right">
                        <Catalog onSelect={setSelectedCatalogItem} selected={selectedCatalogItem} />
                    </aside>
                )}
            </div>

            {isBillOpen && (
                <Billpop
                    totalCost={totalCost}
                    items={furnitureList}
                    onClose={() => setIsBillOpen(false)}
                />
            )}
        </div>
    );
}