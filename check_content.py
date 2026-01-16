from PIL import Image
import numpy as np

def check_content():
    files = [
        r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_strict.png",
        r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_logo_circle.png"
    ]
    
    for f in files:
        print(f"Checking {f}...")
        try:
            img = Image.open(f).convert("RGBA")
            data = np.array(img)
            
            # Check for non-transparent pixels
            alpha = data[..., 3]
            visible_pixels = np.sum(alpha > 0)
            print(f"  Visible pixels (alpha > 0): {visible_pixels}")
            
            if visible_pixels > 0:
                # Check for color variance (not just all black)
                # Count pixels that are not black (R,G,B > 10)
                r, g, b = data[..., 0], data[..., 1], data[..., 2]
                non_black = np.sum((r > 10) | (g > 10) | (b > 10))
                print(f"  Non-black visible pixels: {non_black}")
                
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    check_content()
