from PIL import Image

def finalize_logo():
    # Source icon (should be transparent from previous steps)
    icon_path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_icon_only.png"
    
    try:
        icon = Image.open(icon_path).convert("RGBA")
        print(f"Loaded icon. Original size: {icon.size}")
    except Exception as e:
        print(f"Error opening icon: {e}")
        return

    # Canvas settings
    size = 1080
    
    # 1. Create Transparent Version
    # This saves the user from having to remove the background manually
    canvas_transparent = Image.new("RGBA", (size, size), (0, 0, 0, 0)) # Fully transparent
    
    # Resize logic
    target_dim = int(size * 0.9) # usage 90% of space for max visibility
    
    w, h = icon.size
    ratio = w / h
    
    if w > h:
        new_w = target_dim
        new_h = int(new_w / ratio)
    else:
        new_h = target_dim
        new_w = int(new_h * ratio)
        
    icon_resized = icon.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Center position
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    
    # Paste for transparent version
    canvas_transparent.paste(icon_resized, (x, y), icon_resized)
    
    out_transparent = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_logo_transparent_1080.png"
    canvas_transparent.save(out_transparent)
    print(f"Saved transparent logo to: {out_transparent}")
    
    # 2. Create Black Background Version (As specifically requested)
    canvas_black = Image.new("RGBA", (size, size), (0, 0, 0, 255)) # Black bg
    canvas_black.paste(icon_resized, (x, y), icon_resized) # Paste same resized icon
    
    out_black = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_logo_black_1080.png"
    canvas_black.save(out_black)
    print(f"Saved black background logo to: {out_black}")

if __name__ == "__main__":
    finalize_logo()
