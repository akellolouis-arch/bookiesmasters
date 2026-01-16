from PIL import Image, ImageEnhance
import numpy as np

def generate_transparent_v2():
    # Use the High-Res Sharp version (which is already transparent and enhanced)
    source_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_sharp.png"
    
    try:
        img = Image.open(source_path).convert("RGBA")
        print(f"Loaded {source_path} size: {img.size}")
    except Exception as e:
        print(f"Error: {e}")
        return

    # 1. Prepare Canvas
    size = 1080
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0)) # Transparent
    
    # 2. Resize source to fit
    # Source is likely taller than wide (1336x1632) or similar.
    # Fit within e.g. 1000x1000 to have a small margin
    target_dim = 1000
    w, h = img.size
    ratio = w / h
    
    if w > h:
        new_w = target_dim
        new_h = int(new_w / ratio)
    else:
        new_h = target_dim
        new_w = int(new_h * ratio)
        
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 3. Center
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    
    canvas.paste(img_resized, (x, y))
    
    output_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_transparent_v2.png"
    canvas.save(output_path)
    print(f"Saved Transparent V2 logo to {output_path}")

if __name__ == "__main__":
    generate_transparent_v2()
