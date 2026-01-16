from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np

def make_super_sharp():
    input_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_strict.png"
    
    try:
        img = Image.open(input_path).convert("RGBA")
        print(f"Loaded {input_path} size: {img.size}")
    except Exception as e:
        print(f"Error: {e}")
        return

    # 1. Upscale significantly (4x)
    # Use Lanczos for smooth interpolation of curves before we sharpen them
    w, h = img.size
    scale = 4
    new_w, new_h = w * scale, h * scale
    
    img_large = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 2. Strong Enhancement before thresholding
    # Boost contrast to separate logo from any residual noise
    enhancer_contrast = ImageEnhance.Contrast(img_large)
    img_large = enhancer_contrast.enhance(1.5)
    
    # 3. Alpha Thresholding (The "Pixel Clear" Trick)
    # Convert to numpy to manipulate alpha channel directly
    data = np.array(img_large)
    r, g, b, a = data.T
    
    # Check pixels. If Alpha is > 100 (partially visible), make it 255 (Solid).
    # If Alpha is < 100, make it 0 (Invisible).
    # This removes the "blur" gradient at the edges.
    
    alpha_threshold = 120
    
    # Create crisp alpha mask
    new_a = np.where(a > alpha_threshold, 255, 0).astype(np.uint8)
    
    # Apply new alpha
    data[..., 3] = new_a.T
    
    # Also ensure color is uniform/saturated
    # Boost saturation of the solid pixels
    img_crisp = Image.fromarray(data)
    
    enhancer_color = ImageEnhance.Color(img_crisp)
    img_crisp = enhancer_color.enhance(3.0) # Make it vibrant per previous request
    
    # 4. Final Sharpen pass just to be sure
    enhancer_sharp = ImageEnhance.Sharpness(img_crisp)
    img_final = enhancer_sharp.enhance(1.2)

    output_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_sharp.png"
    img_final.save(output_path)
    print(f"Saved sharp high-res logo to {output_path} (Size: {img_final.size})")

if __name__ == "__main__":
    make_super_sharp()
