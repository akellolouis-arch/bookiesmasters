from PIL import Image
import numpy as np

def clean_and_generate():
    input_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_icon_only.png"
    
    try:
        img = Image.open(input_path).convert("RGBA")
        print(f"Loaded {input_path}")
    except Exception as e:
        print(f"Error: {e}")
        return

    data = np.array(img)
    
    # Define "dark" background threshold
    # Based on analysis: Background is around (10-25, 24-30, 25-40)
    # Let's say any pixel where all R, G, B are < 60 is background
    # We should be careful not to cut off dark parts of the logo if it has shading.
    # But usually logos on dark backgrounds are bright.
    
    limit = 60
    r, g, b, a = data.T
    
    # mask: True where pixel is dark (background)
    background_mask = (r < limit) & (g < limit) & (b < limit)
    
    # Set alpha to 0 for background pixels
    data[..., 3][background_mask.T] = 0
    
    # Create new image from modified data
    img_clean = Image.fromarray(data)
    
    # Crop to content (trim transparent space)
    bbox = img_clean.getbbox()
    if bbox:
        img_clean = img_clean.crop(bbox)
        print(f"Cropped to bounding box: {bbox}")
    
    clean_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_cleaned.png"
    img_clean.save(clean_path)
    print(f"Saved clean icon to {clean_path}")
    
    # ---------------------------------------------------------
    # Now generate the requested 1080x1080 versions
    # ---------------------------------------------------------
    
    size = 1080
    
    # 1. Transparent
    canvas_trans = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # Resize clean icon to fit
    target_dim = int(size * 0.85)
    w, h = img_clean.size
    ratio = w / h
    
    if w > h:
        new_w = target_dim
        new_h = int(new_w / ratio)
    else:
        new_h = target_dim
        new_w = int(new_h * ratio)
        
    icon_resized = img_clean.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    
    canvas_trans.paste(icon_resized, (x, y), icon_resized)
    out_trans = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_logo_transparent_1080.png"
    canvas_trans.save(out_trans)
    print(f"Regenerated transparent logo: {out_trans}")
    
    # 2. Black Background
    # User wants "dark background" - pure black is safest and requested earlier
    canvas_black = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    canvas_black.paste(icon_resized, (x, y), icon_resized)
    
    out_black = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_logo_black_1080.png"
    canvas_black.save(out_black)
    print(f"Regenerated black bg logo: {out_black}")

if __name__ == "__main__":
    clean_and_generate()
