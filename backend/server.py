import os
import shutil
import cv2
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# FIX: Disable OpenCL to prevent GPU command queue errors
cv2.ocl.setUseOpenCL(False)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "output"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

def stitch_images(image_paths, output_path):
    images = []
    for p in image_paths:
        img = cv2.imread(p)
        if img is not None:
            # Resize for stability on mobile/low-ram systems
            h, w = img.shape[:2]
            if w > 1800:
                img = cv2.resize(img, (1800, int(h * 1800 / w)))
            images.append(img)

    if len(images) < 2:
        if len(images) == 1:
            cv2.imwrite(output_path, images[0])
            return True
        return False

    stitcher = cv2.Stitcher_create(mode=cv2.Stitcher_PANORAMA)
    try:
        status, panorama = stitcher.stitch(images)
        if status == cv2.Stitcher_OK:
            cv2.imwrite(output_path, panorama)
            return True
    except:
        pass
    
    # Fallback if stitching fails
    cv2.imwrite(output_path, images[0])
    return False

@app.post("/process-room")
async def process_room(request: Request):
    try:
        form = await request.form()
        for folder in [UPLOAD_DIR, OUTPUT_DIR]:
            for f in os.listdir(folder):
                os.remove(os.path.join(folder, f))

        files = form.getlist("files")
        paths = []
        for file in files:
            p = os.path.join(UPLOAD_DIR, file.filename)
            with open(p, "wb") as b:
                shutil.copyfileobj(file.file, b)
            paths.append(p)

        output_filename = "room_texture.jpg"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        stitch_images(paths, output_path)

        return {
            "status": "success",
            "panorama_url": f"http://localhost:8000/output/{output_filename}?t={int(time.time())}"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)