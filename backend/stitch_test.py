import cv2
import os
import sys


cv2.ocl.setUseOpenCL(False)  # <--- THIS IS THE FIX


def stitch_images(image_folder):
    print(f"--- Loading images from '{image_folder}' ---")
    
    # 1. Load Images
    image_paths = [os.path.join(image_folder, f) for f in os.listdir(image_folder) 
                   if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    images = []
    for path in image_paths:
        img = cv2.imread(path)
        if img is not None:
            images.append(img)
            # Optional: Resize images to speed up processing if they are 4K+
            # img = cv2.resize(img, (0,0), fx=0.5, fy=0.5) 
    
    if len(images) < 2:
        print("Error: Need at least 2 images to stitch.")
        return

    print(f"Found {len(images)} images. Starting stitching process...")
    print("This may take a minute depending on image resolution...")

    # 2. Initialize the Stitcher
    # mode=0 is for PANORAMA (ideal for rotating from one spot)
    # mode=1 is for SCANS (ideal for scanning a flat document, usually not for rooms)
    stitcher = cv2.Stitcher_create(mode=cv2.Stitcher_PANORAMA)

    # 3. Run the Stitching
    status, panorama = stitcher.stitch(images)

    # 4. Check Results
    if status == cv2.Stitcher_OK:
        print(">>> SUCCESS: Panorama created successfully!")
        
        # Save the result
        output_filename = 'room_panorama_result.jpg'
        cv2.imwrite(output_filename, panorama)
        print(f"Saved merged image to: {output_filename}")
        
        # Show the result (resizing for screen display)
        screen_res = (1280, 720)
        scale_width = screen_res[0] / panorama.shape[1]
        scale_height = screen_res[1] / panorama.shape[0]
        scale = min(scale_width, scale_height)
        
        window_width = int(panorama.shape[1] * scale)
        window_height = int(panorama.shape[0] * scale)
        
        resized_pano = cv2.resize(panorama, (window_width, window_height))
        cv2.imshow('Stitched Result', resized_pano)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
    else:
        print(">>> FAILED: Could not stitch images.")
        
        # Error Code Explanations
        errors = {
            1: "ERR_NEED_MORE_IMGS: Not enough distinctive features to match.",
            2: "ERR_HOMOGRAPHY_EST_FAIL: Could not figure out the perspective shift.",
            3: "ERR_CAMERA_PARAMS_ADJUST_FAIL: Geometric alignment failed."
        }
        print(f"Error Code: {status}")
        print(f"Reason: {errors.get(status, 'Unknown Error')}")
        print("\nTip: Ensure photos overlap by at least 30% and have visible texture (not just plain white walls).")

# Run the function
if __name__ == "__main__":
    # Create a folder named 'test_photos' next to this script and put your images there
    folder_name = "testpic" 
    
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
        print(f"Created folder '{folder_name}'. Please put your photos inside and run again.")
    else:
        stitch_images(folder_name)