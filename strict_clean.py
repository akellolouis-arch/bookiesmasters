from PIL import Image, ImageColor
import numpy as np

def strict_clean():
    # Start from the previously "cleaned" version as it already has the main background removed, 
    # but we need to tackle the "greenish" edges.
    input_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_cleaned.png"
    # Actually, let's go back to source 'bookiesmasters_icon_only.png' to be safe, 
    # or use the clean one if it's easier. Let's use the clean one.
    
    try:
        img = Image.open(input_path).convert("RGBA")
        print(f"Loaded {input_path}")
    except Exception as e:
        print(f"Error: {e}")
        return

    data = np.array(img)
    r, g, b, a = data.T
    
    # Logic to identify "Logo" vs "Background/Noise"
    # Analysis shows the logo is very bright (R,G,B > 200), often light green/white.
    # The noise/background is dark (max channel < 90).
    
    # Simple brightness threshold
    # If a pixel is bright enough, keep it. Otherwise, transparent.
    
    threshold = 120
    
    # Mask of pixels to KEEP
    # Keep if ANY channel is > threshold? Or if average is high?
    # The artifact is (26, 86, 48) -> Green is 86.
    # The logo is (221, 254, 225) -> Green is 254.
    # So G > 120 is a safe bet.
    
    mask_keep = (r > threshold) | (g > threshold) | (b > threshold)
    
    # Invert to get mask to REMOVE
    mask_remove = ~mask_keep
    
    # Set alpha to 0 for pixels to remove
    data[..., 3][mask_remove.T] = 0
    
    img_strict = Image.fromarray(data)
    
    output_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_strict.png"
    img_strict.save(output_path)
    print(f"Saved strict clean logo to {output_path}")

if __name__ == "__main__":
    strict_clean()
