from PIL import Image
import numpy as np

def get_exact_logo_color():
    path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_text_v2.png"
    try:
        img = Image.open(path).convert("RGBA")
        print(f"Loaded {path}")
    except Exception as e:
        print(f"Error: {e}")
        return

    # Crop to content
    bbox = img.getbbox()
    if not bbox: return
    content = img.crop(bbox)
    
    # Get center color (Mid-gradient)
    cx, cy = content.size[0] // 2, content.size[1] // 2
    
    # Sample a small area
    region = content.crop((cx-10, cy-10, cx+10, cy+10))
    data = np.array(region)
    # Filter valid
    valid = data[data[..., 3] > 0]
    
    if len(valid) > 0:
        avg = np.mean(valid, axis=0).astype(int)
        r, g, b, a = avg
        hex_code = f"#{r:02X}{g:02X}{b:02X}"
        print(f"Average Center Color: ({r}, {g}, {b}) -> {hex_code}")
        
    # Also find the "Brightest" green (max G)
    # This might be more what the user perceives as "The Color"
    
    pixels = np.array(content)
    # Flatten
    pixels = pixels.reshape(-1, 4)
    # Filter valid
    pixels = pixels[pixels[..., 3] > 0]
    
    # Sort by Green channel
    pixels = pixels[pixels[:, 1].argsort()]
    
    # Take top 10% brightest greens
    top_pixels = pixels[-100:] 
    avg_top = np.mean(top_pixels, axis=0).astype(int)
    r, g, b, a = avg_top
    hex_top = f"#{r:02X}{g:02X}{b:02X}"
    print(f"Brightest Green Peak: ({r}, {g}, {b}) -> {hex_top}")

if __name__ == "__main__":
    get_exact_logo_color()
