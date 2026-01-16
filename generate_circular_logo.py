from PIL import Image, ImageDraw, ImageOps, ImageEnhance
import numpy as np

def create_circular_logo():
    # Load clean icon (using the SHARP version now)
    icon_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_sharp.png"
    try:
        icon = Image.open(icon_path).convert("RGBA")
    except Exception as e:
        print(f"Error: {e}")
        return

    size = 1080
    bg_color = (0, 0, 0, 255) # Black
    
    # Create main canvas (transparent)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    
    # Defined circle dimensions
    margin = 40
    circle_bbox = [margin, margin, size - margin, size - margin]
    
    # 1. Draw Black Circle
    draw.ellipse(circle_bbox, fill=bg_color)
    
    # REMOVED GOLD BORDER AS REQUESTED
    # The user wants "greenish between letters" to be black. 
    # By placing the strictly cleaned logo (transparent) onto this black circle,
    # the gaps will show the black background.

    # 3. Place "BM" icon
    # Resize to fit nicely inside the circle (e.g., 65% of canvas)
    target_dim = int(size * 0.65)
    
    w, h = icon.size
    ratio = w / h
    
    if w > h:
        new_w = target_dim
        new_h = int(new_w / ratio)
    else:
        new_h = target_dim
        new_w = int(new_h * ratio)
        
    icon_resized = icon.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # SHARPEN after resize to remove blur from downscaling
    # This ensures "pixel clear" edges
    enhancer = ImageEnhance.Sharpness(icon_resized)
    icon_resized = enhancer.enhance(1.5)
    
    # Center
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    
    # Create final composite
    canvas.paste(icon_resized, (x, y), icon_resized)
    
    # 4. Save
    out_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_logo_circle.png"
    canvas.save(out_path)
    print(f"Saved circular sleek logo to: {out_path}")

if __name__ == "__main__":
    create_circular_logo()
