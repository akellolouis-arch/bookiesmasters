from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import numpy as np

def generate_text_logo():
    # 1. Load v2 logo to sample colors
    ref_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_transparent_v2.png"
    try:
        ref_img = Image.open(ref_path).convert("RGBA")
        print(f"Loaded reference {ref_path}")
    except Exception as e:
        print(f"Error loading reference: {e}")
        return

    # Extract gradient colors
    # We want a vertical gradient. 
    # Let's find the bounding box of the non-transparent content to sample accurately.
    bbox = ref_img.getbbox()
    if not bbox:
        print("Reference image is empty!")
        return
        
    ref_content = ref_img.crop(bbox)
    w_ref, h_ref = ref_content.size
    
    # Sample Top, Middle, Bottom colors
    # Center (w//2) might be the gap between "B" and "M" which is empty or white highlight.
    # Let's sample at 30% width (inside the "B").
    sample_x = int(w_ref * 0.33)
    
    # Use 10% percentile heights
    y_top = int(h_ref * 0.15)
    y_mid = int(h_ref * 0.5)
    y_bot = int(h_ref * 0.85)
    
    # helper to get average color of a small region around point
    def get_avg_color(img, x, y, size=15):
        box = (max(0, x-size), max(0, y-size), min(img.width, x+size), min(img.height, y+size))
        region = img.crop(box)
        pixels = np.array(region)
        # Filter transparent
        # also filter pure white/black if possible to get the "color"
        valid_pixels = pixels[pixels[..., 3] > 0]
        if len(valid_pixels) == 0: return (0, 0, 0, 0) # Invalid
        mean = np.mean(valid_pixels, axis=0)
        return tuple(mean.astype(int))

    c_top = get_avg_color(ref_content, sample_x, y_top)
    c_mid = get_avg_color(ref_content, sample_x, y_mid)
    c_bot = get_avg_color(ref_content, sample_x, y_bot)
    
    print(f"Gradient extracted: Top={c_top}, Mid={c_mid}, Bot={c_bot}")
    
    # Fallback to hardcoded vibrant greens if sampling fails (e.g. returns white/black)
    # Based on previous analysis:
    # Bright Green: (0, 255, 128) approx
    # Dark Green: (0, 100, 50)
    
    def is_boring(c):
        # returns true if color is essentially greyscale
        return abs(c[0] - c[1]) < 20 and abs(c[1] - c[2]) < 20
        
    if is_boring(c_mid) or c_mid[3] == 0:
        print("Sampling failed or found greyscale. Using hardcoded vibrant greens.")
        c_top = (200, 255, 220, 255) # Very light mint
        c_mid = (0, 255, 150, 255)   # Vibrant Green
        c_bot = (0, 100, 50, 255)    # Dark Green
    
    # 2. Text Generation
    text = "BOOKIESMASTERS"
    font_size = 130 # Slightly smaller to allow for effects
    
    # Try using Impact which is more "Logo-like", blocky and stylish
    try:
        font = ImageFont.truetype("impact.ttf", font_size)
    except:
        try:
            print("Impact font not found, trying Arial Bold.")
            font = ImageFont.truetype("arialbd.ttf", font_size)
        except:
            print("Arial not found, using default.")
            font = ImageFont.load_default()

    # Calculate text size
    dummy_draw = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bbox_text = dummy_draw.textbbox((0, 0), text, font=font)
    text_w = bbox_text[2] - bbox_text[0]
    text_h = bbox_text[3] - bbox_text[1]
    
    # Padding for stroke and shear
    pad = 100
    w_canvas = text_w + 2 * pad
    h_canvas = text_h + 2 * pad
    
    # 3. Create Gradient & Stroke
    
    # STROKE LAYER (Outer Border)
    # The icon usually has a rim. Let's make a Green rim (Mid color) or White?
    # Given the gradient is light->green, a dark green or black stroke makes it pop.
    # User said "stylish like our icon". The icon has a thin bevel.
    # Let's simple add a "Stroke" by drawing the text slightly larger or multiple times.
    
    stroke_color = (0, 0, 0, 255) # Black outline for contrast? Or Dark Green?
    # Let's use the bottom dark green color for the stroke to match the theme.
    stroke_color = tuple([int(x/2) for x in c_bot[:3]]) + (255,) # Darker version of bot
    stroke_width = 8
    
    # Create canvas
    canvas = Image.new("RGBA", (w_canvas, h_canvas), (0,0,0,0))
    draw = ImageDraw.Draw(canvas)
    
    # Draw Stroke (Draw text multiple times at offsets)
    # text_x, text_y center
    tx = (w_canvas - text_w) // 2
    ty = (w_canvas - h_canvas) // 2 # Wait h_canvas is height
    ty = pad # Simple padding top
    
    # To center vertically properly
    ty = (h_canvas - text_h) // 2
    
    # Draw stroke
    for ox in range(-stroke_width, stroke_width+1):
        for oy in range(-stroke_width, stroke_width+1):
            if ox*ox + oy*oy <= stroke_width*stroke_width: # Circular stroke
                draw.text((tx+ox, ty+oy), text, font=font, fill=stroke_color)
    
    # 4. Create Gradient Fill for Inner Text
    # Same gradient logic as before
    gradient = Image.new("RGBA", (w_canvas, h_canvas))
    grad_draw = ImageDraw.Draw(gradient)
    
    for y in range(h_canvas):
        ratio = y / h_canvas
        if ratio < 0.5:
            local_ratio = ratio * 2
            r = int(c_top[0] + (c_mid[0] - c_top[0]) * local_ratio)
            g = int(c_top[1] + (c_mid[1] - c_top[1]) * local_ratio)
            b = int(c_top[2] + (c_mid[2] - c_top[2]) * local_ratio)
        else:
            local_ratio = (ratio - 0.5) * 2
            r = int(c_mid[0] + (c_bot[0] - c_mid[0]) * local_ratio)
            g = int(c_mid[1] + (c_bot[1] - c_mid[1]) * local_ratio)
            b = int(c_mid[2] + (c_bot[2] - c_mid[2]) * local_ratio)
        grad_draw.line([(0, y), (w_canvas, y)], fill=(r, g, b, 255))

    # Mask for inner text
    mask_img = Image.new("L", (w_canvas, h_canvas), 0)
    mask_draw = ImageDraw.Draw(mask_img)
    mask_draw.text((tx, ty), text, font=font, fill=255)
    
    # Composite Gradient onto Text shape
    inner_text = Image.new("RGBA", (w_canvas, h_canvas), (0,0,0,0))
    inner_text.paste(gradient, (0, 0), mask_img)
    
    # Paste inner text ON TOP of stroke
    canvas.alpha_composite(inner_text)
    
    # 5. Apply Shear (Italic/Sporty look)
    # Transform: x' = x + shear * y
    # shear factor ~0.2
    
    shear_factor = 0.2
    # Transform data: (a, b, c, d, e, f) -> x' = ax + by + c, y' = dx + ey + f
    # Shear x based on y: new_x = x - factor * y
    matrix = (1, -shear_factor, 0, 0, 1, 0)
    
    # We need to expand canvas to fit the skewed result?
    # Image.transform with Image.AFFINE crops to original size by default.
    # Let's make the canvas wider first?
    # Actually just saving it might clip if we don't handle size. A shear of 0.2 on height 200 is 40px shift.
    # Our padding (100) should cover it.
    
    img_sheared = canvas.transform(
        (w_canvas, h_canvas),
        Image.Transform.AFFINE,
        (1, shear_factor, -h_canvas * shear_factor * 0.5, 0, 1, 0), # Inverse matrix for transform
        Image.Resampling.BICUBIC
    )
    
    # Crop to content
    bbox = img_sheared.getbbox()
    if bbox:
        img_sheared = img_sheared.crop(bbox)
    
    # 6. Enhance Pop
    enhancer = ImageEnhance.Contrast(img_sheared)
    final_text = enhancer.enhance(1.1)
    
    out_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_text_v2.png"
    final_text.save(out_path)
    print(f"Saved styled text logo to {out_path}")

if __name__ == "__main__":
    generate_text_logo()
