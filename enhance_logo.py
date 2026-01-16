from PIL import Image, ImageEnhance
import numpy as np

def enhance_logo():
    input_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_strict.png"
    
    try:
        img = Image.open(input_path).convert("RGBA")
        print(f"Loaded {input_path}")
    except Exception as e:
        print(f"Error: {e}")
        return

    # Image is mostly transparent with the logo.
    # We want to boost Saturation (Color) and maybe Brightness/Contrast.
    
    # 1. Boost Saturation
    # The current color is very pale (minty white). increasing saturation should bring out the green.
    enhancer_color = ImageEnhance.Color(img)
    # Factor > 1.0 increases saturation. Let's go significantly higher to make it "eye catching".
    img_colored = enhancer_color.enhance(4.0) 
    
    # 2. Boost Contrast (make it pop)
    enhancer_contrast = ImageEnhance.Contrast(img_colored)
    img_contrasted = enhancer_contrast.enhance(1.2)
    
    # 3. Boost Brightness
    enhancer_brightness = ImageEnhance.Brightness(img_contrasted)
    img_bright = enhancer_brightness.enhance(1.1)

    # 4. Sharpen
    # Make edges crisp
    enhancer_sharpness = ImageEnhance.Sharpness(img_bright)
    img_final = enhancer_sharpness.enhance(2.0) # 2.0 is usually quite strong

    output_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_enhanced.png"
    img_final.save(output_path)
    print(f"Saved enhanced logo to {output_path}")

if __name__ == "__main__":
    enhance_logo()
