import React, { useState } from 'react';

const ImageUpload = ({ onResult }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [ceilingHeight, setCeilingHeight] = useState(2.8);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length < 2) {
      setError("Please select at least 2 overlapping photos to create a panorama.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    // Append all selected files to the 'files' key (matches FastAPI List[UploadFile])
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    // Append metadata
    formData.append('ceilingHeight', ceilingHeight);
    formData.append('cameraHeight', 1.5); // Default camera height

    try {
      const response = await fetch('http://localhost:8000/process-room', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        // Pass the AI data and the height back to the parent (App.js)
        onResult(data, ceilingHeight);
      } else {
        setError(data.message || "AI Inference failed.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Could not connect to the backend server. Make sure it is running at localhost:8000");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Step 1: Upload Room Photos</h2>
        <p style={styles.hint}>
          Take photos while standing in the <b>center</b> of the room, rotating in a circle. 
          Ensure there is overlap between each photo.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.dropZone}>
          <label style={styles.label}>Select Photos</label>
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileChange} 
            style={styles.fileInput}
          />
          {selectedFiles.length > 0 && (
            <p style={styles.fileCount}>
              ✅ {selectedFiles.length} files ready
            </p>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Ceiling Height (meters): </label>
          <input
            type="number" 
            step="0.1"
            min="1.0"
            max="10.0"
            value={ceilingHeight}
            onChange={(e) => setCeilingHeight(parseFloat(e.target.value))}
            style={styles.numberInput}
          />
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <button 
          type="submit" 
          disabled={isLoading} 
          style={isLoading ? styles.buttonDisabled : styles.button}
        >
          {isLoading ? (
            <span style={styles.loaderText}>⚙️ Analyzing Room Geometry...</span>
          ) : (
            "Generate 3D View"
          )}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '450px',
    margin: '20px auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  title: { margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.5rem' },
  hint: { fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  dropZone: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  label: { fontSize: '0.95rem', fontWeight: '600', color: '#334155' },
  fileInput: { fontSize: '0.85rem', width: '100%' },
  fileCount: { fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', margin: '5px 0 0 0' },
  inputGroup: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: '0 5px'
  },
  numberInput: { 
    padding: '8px', 
    width: '80px', 
    borderRadius: '6px', 
    border: '1px solid #cbd5e1',
    textAlign: 'center'
  },
  errorBox: {
    padding: '10px',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '6px',
    fontSize: '0.85rem',
    border: '1px solid #fee2e2'
  },
  button: {
    marginTop: '10px',
    padding: '14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background 0.2s'
  },
  buttonDisabled: {
    marginTop: '10px',
    padding: '14px',
    backgroundColor: '#94a3b8',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'not-allowed',
    fontSize: '1rem'
  },
  loaderText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }
};

export default ImageUpload;