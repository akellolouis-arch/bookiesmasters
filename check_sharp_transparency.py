from PIL import Image
import numpy as np

def check_transparency():
    try:
        img = Image.open(r"public\bookiesmasters_sharp.png").convert("RGBA")
        print(f"Loaded sharp logo. Size: {img.size}")
        
        # Check corners for transparency
        corners = [
            (0, 0), (0, img.height-1), (img.width-1, 0), (img.width-1, img.height-1)
        ]
        
        print("Corner pixels:")
        for x, y in corners:
            p = img.getpixel((x, y))
            print(f"({x}, {y}): {p}")
            
        # Check overall alpha
        data = np.array(img)
        alpha = data[..., 3]
        
        # Count 0 alpha
        transparent_count = np.sum(alpha == 0)
        total_pixels = img.width * img.height
        print(f"Transparent pixels: {transparent_count} / {total_pixels} ({transparent_count/total_pixels:.0%})")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_transparency()
