from PIL import Image
import numpy as np

def analyze_social_square():
    path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_social_square.png"
    try:
        img = Image.open(path).convert("RGBA")
        print(f"Loaded {path} size: {img.size}")
    except Exception as e:
        print(f"Error: {e}")
        return

    data = np.array(img)
    alpha = data[..., 3]
    
    # Check for content segments horizontally
    col_has_pixels = np.any(alpha > 0, axis=0)
    
    segments = []
    in_segment = False
    start = 0
    
    for x in range(len(col_has_pixels)):
        if col_has_pixels[x]:
            if not in_segment:
                start = x
                in_segment = True
        else:
            if in_segment:
                segments.append((start, x))
                in_segment = False
                
    if in_segment:
        segments.append((start, len(col_has_pixels)))
        
    print(f"Horizontal segments found: {segments}")
    
    # If we find 2 distinct segments (Icon + Text), we are in business.
    # Usually Icon is left, Text is right.

if __name__ == "__main__":
    analyze_social_square()
