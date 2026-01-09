import torch
import cv2
import numpy as np
import sys
import os
from simple_lama_inpainting import SimpleLama
from ultralytics import FastSAM
from PIL import Image

# Add HorizonNet to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'models/HorizonNet'))

class RoomPipeline:
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"🚀 Pipeline initialized on {self.device}")

    def clear_vram(self, model):
        del model
        torch.cuda.empty_cache()

    def process_room(self, image_path):
        print(f"📂 Processing: {image_path}")
        
        # --- STEP 1: CLEAN ROOM (Remove Furniture) ---
        print("🧹 Detect Furniture (FastSAM)...")
        
        # 1. Load Original Image to get exact size
        original_img = Image.open(image_path)
        W, H = original_img.size
        
        # 2. Run FastSAM
        model_sam = FastSAM('FastSAM-s.pt')
        results = model_sam(image_path, device=self.device, conf=0.4, imgsz=1024, retina_masks=True)
        
        if results[0].masks is None:
            print("⚠️ No furniture detected. Using original image.")
            clean_path = image_path
        else:
            # 3. Extract and Combine Masks
            masks = results[0].masks.data.cpu().numpy()
            combined_mask = np.sum(masks, axis=0)
            combined_mask = (combined_mask > 0).astype(np.uint8) * 255
            
            # 4. CRITICAL FIX: Resize Mask to match Original Image Size
            mask_image = Image.fromarray(combined_mask).convert('L')
            if mask_image.size != (W, H):
                print(f"📏 Resizing mask from {mask_image.size} to {(W, H)}")
                mask_image = mask_image.resize((W, H), Image.NEAREST)
            
            self.clear_vram(model_sam) # FREE VRAM

            # 5. Run Inpainting (LaMa)
            print("🎨 Inpainting Walls (LaMa)...")
            lama = SimpleLama()
            clean_img = lama(original_img, mask_image)
            
            clean_path = image_path.replace(".jpg", "_clean.jpg").replace(".png", "_clean.png")
            clean_img.save(clean_path)
            self.clear_vram(lama) # FREE VRAM

        # --- STEP 2: GET GEOMETRY (HorizonNet) ---
        print("🏗️ Building 3D Shell (HorizonNet)...")
        
        # Get the clean filename (e.g., room_123_clean.jpg)
        final_filename = os.path.basename(clean_path)
        
        # ... inside process_room ...

        # MOCK DATA: Let's create a RECTANGULAR room (not square)
        # These numbers represent positions on the 360 panorama (0.0 to 1.0)
        # A rectangle has alternating short and long sides.
        
        geometry_data = {
            "floor_corners": [
                [0.10, 0.6],  # Corner 1
                [0.30, 0.6],  # Corner 2 (Short wall, distance 0.20)
                [0.60, 0.6],  # Corner 3 (Long wall, distance 0.30)
                [0.80, 0.6]   # Corner 4 (Short wall, distance 0.20)
            ],
            "ceiling_corners": [
                [0.10, 0.4], [0.30, 0.4], [0.60, 0.4], [0.80, 0.4]
            ],
            "image_url": f"temp/{final_filename}" 
        }
        
        print(f"✅ Returning RECTANGLE data: {geometry_data['image_url']}")
        return geometry_data
