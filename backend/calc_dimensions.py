import numpy as np

def calculate_room_dimensions(json_data, camera_height=1.5, ceiling_height=3.0):
    """
    Robust calculation that filters outliers and handles tilt errors better.
    """
    if 'uv' not in json_data:
        raise ValueError("Invalid JSON: 'uv' missing")

    # 1. Extract Corners
    raw_points = sorted(json_data['uv'], key=lambda p: p[0])
    image_width = 1024
    corners = [] 

    # (Same grouping logic as before to find unique corners)
    if len(raw_points) > 0:
        current_group_x = [raw_points[0][0]]
        current_group_ys = [raw_points[0][1]]

        for i in range(1, len(raw_points)):
            curr_x_pixel = raw_points[i][0] * image_width
            prev_x_pixel = current_group_x[-1] * image_width
            
            if (curr_x_pixel - prev_x_pixel) < 20: # Group close points
                current_group_x.append(raw_points[i][0])
                current_group_ys.append(raw_points[i][1])
            else:
                avg_x = sum(current_group_x) / len(current_group_x)
                ceil_v = min(current_group_ys)
                floor_v = max(current_group_ys)
                corners.append({'x': avg_x, 'ceil': ceil_v, 'floor': floor_v})
                current_group_x = [raw_points[i][0]]
                current_group_ys = [raw_points[i][1]]
                
        avg_x = sum(current_group_x) / len(current_group_x)
        corners.append({'x': avg_x, 'ceil': min(current_group_ys), 'floor': max(current_group_ys)})

    # 2. Setup Heights
    h_cam = float(camera_height)
    h_ceil = float(ceiling_height)
    h_upper = h_ceil - h_cam 

    wall_depths = []

    # 3. Smart Calculation Loop
    for i in range(len(corners)):
        c1 = corners[i]
        c2 = corners[(i + 1) % len(corners)]
        
        # --- FLOOR CALC ---
        # We take the lowest point (max value) to be safe against wavy stitches
        max_floor_v = max(c1['floor'], c2['floor']) 
        angle_down = (max_floor_v - 0.5) * np.pi
        
        # Clamp angle to prevent infinity/negative errors
        if angle_down < 0.05: angle_down = 0.05 
        depth_floor = h_cam / np.tan(angle_down)

        # --- CEILING CALC ---
        min_ceil_v = min(c1['ceil'], c2['ceil'])
        angle_up = (0.5 - min_ceil_v) * np.pi
        
        if angle_up < 0.05: angle_up = 0.05
        depth_ceil = h_upper / np.tan(angle_up)

        # --- WEIGHTED MERGE ---
        # We trust Floor 70% and Ceiling 30% usually, 
        # but if one is wildly different (> 2m diff), we assume the smaller one is correct.
        
        diff = abs(depth_floor - depth_ceil)
        
        if diff > 2.0:
            # If they disagree by 2m, pick the smaller one (safer assumption for rooms)
            final_depth = min(depth_floor, depth_ceil)
        else:
            # Weighted Average (Trust floor slightly more)
            final_depth = (depth_floor * 0.6) + (depth_ceil * 0.4)

        # --- HARD LIMIT CLAMP ---
        # If math says wall is 20m away, it's likely a glitch. Cap it at 10m.
        if final_depth > 12.0: final_depth = 12.0
        
        wall_depths.append(final_depth)

    # 4. Compute Area (Simple Rectangle Approximation)
    if len(wall_depths) >= 4:
        # Average opposite walls to smooth out "Wavy" errors
        dim_1 = (wall_depths[0] + wall_depths[2]) / 2.0 * 2 # Full span
        dim_2 = (wall_depths[1] + wall_depths[3]) / 2.0 * 2
        
        # Note: In a pure rectangle, distance to wall is Half the length.
        # So Length = (Dist_Wall_1 + Dist_Wall_3)
        
        length = wall_depths[0] + wall_depths[2]
        breadth = wall_depths[1] + wall_depths[3]
        
        area = length * breadth
    else:
        length, breadth, area = 0, 0, 0

    return {
        "status": "success",
        "parameters": { "ceiling_height": h_ceil, "camera_height": h_cam },
        "results": {
            "length": round(length, 2),
            "breadth": round(breadth, 2),
            "area": round(area, 2),
            "wall_depths": [round(w, 2) for w in wall_depths]
        },
        "corners": corners
    }