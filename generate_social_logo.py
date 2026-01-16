from PIL import Image
import os

def generate_social_logo():
    # Source icon path
    icon_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_icon_only.png"
    
    if not os.path.exists(icon_path):
        print(f"Error: {icon_path} does not exist.")
        return

    try:
        icon = Image.open(icon_path).convert("RGBA")
        print(f"Loaded icon. Original size: {icon.size}")
    except Exception as e:
        print(f"Error opening icon: {e}")
        return

    # Target size for social media (1080x1080 is versatile and high quality)
    size = 1080
    bg_color = (0, 0, 0, 255) # Black background

    # Create square canvas
    canvas = Image.new("RGBA", (size, size), bg_color)
    
    # Calculate resize dimensions
    # use 80% to allow for circular cropping on some platforms
    target_dim = int(size * 0.8) 
    
    w, h = icon.size
    ratio = w / h
    
    if w > h:
        new_w = target_dim
        new_h = int(new_w / ratio)
    else:
        new_h = target_dim
        new_w = int(new_h * ratio)
        
    print(f"Resizing to: {new_w}x{new_h}")
    icon_resized = icon.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Center position
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    
    canvas.paste(icon_resized, (x, y), icon_resized)
    
    output_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_profile_1080.png"
    canvas.save(output_path)
    print(f"Saved social media logo to: {output_path}")

if __name__ == "__main__":
    generate_social_logo()
