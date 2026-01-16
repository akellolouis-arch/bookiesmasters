from PIL import Image, ImageDraw, ImageEnhance
import numpy as np

def generate_final_v2():
    # Source used in Navbar
    source_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_icon_only.png"
    
    try:
        img = Image.open(source_path).convert("RGBA")
        print(f"Loaded {source_path} size: {img.size}")
    except Exception as e:
        print(f"Error: {e}")
        return

    # 1. Dark Background Replacement
    # The user wants "black background", getting rid of "greyish".
    # Instead of deleting the background, we will force it to Pure Black (0,0,0,255).
    # This preserves the anti-aliasing of the logo edges against the dark background.
    
    data = np.array(img)
    r, g, b, a = data.T
    
    # Identify background: Dark pixels
    # Based on analysis, background is around (10-30). Logo is bright.
    threshold = 50
    mask_bg = (r < threshold) & (g < threshold) & (b < threshold)
    
    # Change background pixels to Pure Black
    # We keep Alpha as is (255) to maintain the "black box" look inside the circle, 
    # but now it's PURE black to match the circle.
    data[..., 0][mask_bg.T] = 0 # R
    data[..., 1][mask_bg.T] = 0 # G
    data[..., 2][mask_bg.T] = 0 # B
    # Alpha remains 255.
    
    img_blackened = Image.fromarray(data)
    
    # 2. Enhance Brightness/Color as requested earlier
    # "make the greenish in our character more bright"
    enhancer_color = ImageEnhance.Color(img_blackened)
    img_enhanced = enhancer_color.enhance(2.0)
    
    # 3. Create Circular Canvas
    size = 1080
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0)) # Transparent outside circle
    draw = ImageDraw.Draw(canvas)
    
    # Draw huge black circle
    draw.ellipse([0, 0, size, size], fill=(0, 0, 0, 255))
    
    # 4. Resize and Place Logo
    # Downscale from 1024 to fit in 1080 circle? 
    # 1024 diagonal fits in 1080 circle?
    # W=1024, H=1024. Diagonal is ~1448. It won't fit without cropping corners.
    # We need to shrink it so the square fits INSIDE the circle.
    # Max square in circle d=1080 is side = 1080 / sqrt(2) = 763.
    
    target_side = 760
    img_resized = img_enhanced.resize((target_side, target_side), Image.Resampling.LANCZOS)
    
    # Center
    x = (size - target_side) // 2
    y = (size - target_side) // 2
    
    canvas.paste(img_resized, (x, y)) # Paste opaque image on black circle
    
    output_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_social_circle_v2.png"
    canvas.save(output_path)
    print(f"Saved V2 logo to {output_path}")

if __name__ == "__main__":
    generate_final_v2()
