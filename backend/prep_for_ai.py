import cv2
import numpy as np

# --- CONFIG ---
INPUT_FILE = 'room_panorama_result.jpg'
OUTPUT_FILE = 'ai_input.jpg'
# Standard AI Input Size (2:1 ratio)
TARGET_W = 1024
TARGET_H = 512
# ----------------

img = cv2.imread(INPUT_FILE)
if img is None:
    print("Error: Input file not found.")
else:
    h, w = img.shape[:2]
    
    # 1. Resize the stitch to fit nicely in the "middle band" of the 360 view
    # We assume your phone photo covers about 60-70% of the vertical view
    new_h = int(TARGET_H * 0.6) 
    scale = new_h / h
    new_w = int(w * scale)
    
    resized_stitch = cv2.resize(img, (new_w, new_h))
    
    # 2. Create the Black Canvas (The "Blind" areas)
    canvas = np.zeros((TARGET_H, TARGET_W, 3), dtype=np.uint8)
    
    # 3. Paste the stitch in the center
    y_offset = (TARGET_H - new_h) // 2
    x_offset = (TARGET_W - new_w) // 2
    
    # Safety check: if stitch is wider than canvas, crop it (rare for 2 walls)
    if x_offset < 0:
        print("Warning: Image too wide, cropping sides.")
        x_offset = 0
        resized_stitch = resized_stitch[:, :TARGET_W]
        new_w = TARGET_W

    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized_stitch
    
    cv2.imwrite(OUTPUT_FILE, canvas)
    print(f"Success! Saved {OUTPUT_FILE}. Upload this to the AI.")