import os
import shutil
import json
import subprocess
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import your custom modules
from image_processing import stitch_and_process
from calc_dimensions import calculate_room_dimensions

app = FastAPI()

# 1. CORS Setup (So React can talk to this)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Setup Directories
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "output"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mount output so frontend can see result images if needed
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

@app.post("/process-room")
async def process_room(
    files: List[UploadFile] = File(...),
    ceilingHeight: float = Form(3.0),
    cameraHeight: float = Form(1.5)
):
    """
    Full Pipeline: Upload -> Stitch -> AI Inference -> Math -> JSON
    """
    try:
        # --- STEP 1: HANDLE UPLOADS ---
        print(f"1. Receiving {len(files)} images...")
        saved_file_paths = []
        
        # Clear old uploads to avoid mixing rooms
        for f in os.listdir(UPLOAD_DIR):
            os.remove(os.path.join(UPLOAD_DIR, f))

        for file in files:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb+") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_file_paths.append(file_path)

        # --- STEP 2: STITCHING & PREP ---
        print("2. Stitching images...")
        # This returns the path to the AI-ready image (e.g., 'output/ai_input_raw.png')
        ai_image_path = stitch_and_process(saved_file_paths, output_folder=OUTPUT_DIR)
        
        print("3. Running HorizonNet AI...")

        # 1. Get Absolute Paths
        # Since we are changing directories to run the AI, we need full paths 
        # so the script knows exactly where the files are.
        abs_ai_image_path = os.path.abspath(ai_image_path)
        abs_output_dir = os.path.abspath(OUTPUT_DIR)
        
        # 2. Build the Command
        # We run "inference.py" directly because we will tell subprocess 
        # to start INSIDE the "HorizonNet" folder.
        command = [
            "python", "inference.py",          # Run local script
            "--pth", "horizonnet.pth",         # Local weight file (case sensitive!)
            "--img_glob", abs_ai_image_path,   # Full path to input
            "--output_dir", abs_output_dir,    # Full path to output
            "--visualize"
        ]
        
        # 3. Run with cwd="HorizonNet"
        # This makes the AI think it's running from inside its own folder,
        # which fixes all the "ModuleNotFoundError: No module named 'model'" errors.
        result = subprocess.run(
            command, 
            cwd="HorizonNet",  # <--- CRITICAL CHANGE
            capture_output=True, 
            text=True
        )
        
        if result.returncode != 0:
            print("AI Error:", result.stderr)
            raise HTTPException(status_code=500, detail=f"HorizonNet Failed: {result.stderr}")
        

        # --- STEP 4: LOAD AI RESULT ---
        # HorizonNet usually names the JSON based on the input filename.
        # If input was "ai_input_raw.png", output is usually "ai_input_raw.json" inside output dir.
        json_filename = os.path.basename(ai_image_path).replace(".png", ".json").replace(".jpg", ".json")
        json_path = os.path.join(OUTPUT_DIR, json_filename)
        
        if not os.path.exists(json_path):
            raise FileNotFoundError(f"AI finished but JSON not found at {json_path}")
            
        with open(json_path, 'r') as f:
            ai_data = json.load(f)

        # --- STEP 5: CALCULATE DIMENSIONS ---
        print("4. Calculating Walls...")
        final_data = calculate_room_dimensions(
            json_data=ai_data,
            camera_height=cameraHeight,
            ceiling_height=ceilingHeight
        )
        
        # Add the image path so the frontend can display the panorama texture
        final_data["panorama_url"] = f"http://localhost:8000/output/{os.path.basename(ai_image_path)}"

        return final_data

    except Exception as e:
            print(f"Pipeline Error: {e}")
            return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Run from the 'server' folder
    uvicorn.run(app, host="0.0.0.0", port=8000)