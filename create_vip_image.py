
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

# Define paths
input_path = r"C:/Users/Administrator/.gemini/antigravity/brain/994d9995-1e18-41d1-bb67-129146487571/uploaded_image_1770794577731.jpg"
output_path = r"C:/Users/Administrator/.gemini/antigravity/brain/994d9995-1e18-41d1-bb67-129146487571/vip_tip_output.jpg"

try:
    # Load image
    img = Image.open(input_path)
    
    # 1. Resize Logic for Telegram ( Mobile Optimization )
    # Telegram compresses images > 1280px usually. 
    # Let's target a width of 1080px (standard mobile width) maintaining aspect ratio.
    target_width = 1080
    if img.width != target_width:
        aspect_ratio = img.height / img.width
        target_height = int(target_width * aspect_ratio)
        img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        print(f"Resized image to {target_width}x{target_height}")
    
    width, height = img.size
    
    # Calculate regions (Same logic as before, scaled to new size)
    # Area to hide: Tips
    top_cutoff = int(height * 0.22) 
    bottom_cutoff = int(height * 0.68) 
    
    # 2. "Slicky" Hiding Method: Gaussian Blur + Dark Overlay
    
    # Crop the region to blur
    box = (0, top_cutoff, width, bottom_cutoff)
    region = img.crop(box)
    
    # Apply strong blur
    blurred_region = region.filter(ImageFilter.GaussianBlur(radius=30))
    
    # Apply dark overlay on top of blur (to make text pop)
    # 50% opacity black
    dark_overlay = Image.new('RGBA', blurred_region.size, (0, 0, 0, 100))
    blurred_region = blurred_region.convert('RGBA')
    blurred_region = Image.alpha_composite(blurred_region, dark_overlay)
    
    # Paste back onto main image
    img.paste(blurred_region, box)
    
    # Prepare to draw text
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    draw = ImageDraw.Draw(img)

    # Add "VIP TIP" text
    font = None
    try:
        # Windows usually has arial
        font_path = "arialbd.ttf" # Bold
        font_size = int(width * 0.15) # Scaled font size
        font = ImageFont.truetype(font_path, font_size)
    except IOError:
        font = ImageFont.load_default()

    text = "VIP TIP"
    
    # Get text size
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except AttributeError:
         text_width, text_height = draw.textsize(text, font=font)

    text_x = (width - text_width) / 2
    # Vertically center in the blurred region
    text_y = top_cutoff + ((bottom_cutoff - top_cutoff - text_height) / 2) - 40 # Up a bit

    # Draw Text with a Neon Green Color and Outline/Shadow
    # SpringGreen: (0, 255, 127)
    text_color = (0, 255, 127, 255) 
    
    # Draw outline (stroke)
    outline_color = (0, 0, 0, 255)
    stroke_width = 4 # Thicker stroke for resized image
    
    for x_offset in range(-stroke_width, stroke_width + 1):
        for y_offset in range(-stroke_width, stroke_width + 1):
            draw.text((text_x + x_offset, text_y + y_offset), text, font=font, fill=outline_color)

    # Draw main text
    draw.text((text_x, text_y), text, font=font, fill=text_color)
    
    # Add "UNLOCK TO REVEAL" below
    try:
        font_small = ImageFont.truetype("arialbd.ttf", int(width * 0.05))
    except:
        font_small = ImageFont.load_default()
        
    subtext = "UNLOCK TO REVEAL"
    try:
        bbox_s = draw.textbbox((0, 0), subtext, font=font_small)
        st_width = bbox_s[2] - bbox_s[0]
        st_height = bbox_s[3] - bbox_s[1]
    except AttributeError:
        st_width, st_height = draw.textsize(subtext, font=font_small)
        
    st_x = (width - st_width) / 2
    st_y = text_y + text_height + 25 # Spacing
    
    # Stroke for subtext
    stroke_width_s = 2
    for x_offset in range(-stroke_width_s, stroke_width_s + 1):
        for y_offset in range(-stroke_width_s, stroke_width_s + 1):
             draw.text((st_x + x_offset, st_y + y_offset), subtext, font=font_small, fill=outline_color)

    draw.text((st_x, st_y), subtext, font=font_small, fill=(255, 255, 255, 255))
    
    # Add "LOCK" Icon (Simulated with simple shapes/emoji if unavailable, but shapes are safer)
    # Drawing a simple padlock shape above the text
    lock_x_center = width / 2
    lock_y_bottom = text_y - 20
    
    # Lock body (Rectangle)
    lock_width = int(width * 0.1)
    lock_height = int(lock_width * 0.8)
    lock_rect = [
        lock_x_center - lock_width/2, 
        lock_y_bottom - lock_height, 
        lock_x_center + lock_width/2, 
        lock_y_bottom
    ]
    
    # Lock shackle (Arc)
    shackle_radius = lock_width / 2
    shackle_bbox = [
        lock_x_center - shackle_radius, 
        lock_y_bottom - lock_height - shackle_radius, 
        lock_x_center + shackle_radius, 
        lock_y_bottom - lock_height + shackle_radius
    ]
    
    # Draw Lock
    # Shackle
    draw.arc(shackle_bbox, start=180, end=0, fill=(255, 215, 0, 255), width=8) # Gold
    # Verticals for shackle
    draw.line([lock_x_center - shackle_radius, lock_y_bottom - lock_height, lock_x_center - shackle_radius, lock_y_bottom - lock_height - shackle_radius/2], fill=(255, 215, 0, 255), width=8)
    draw.line([lock_x_center + shackle_radius, lock_y_bottom - lock_height, lock_x_center + shackle_radius, lock_y_bottom - lock_height - shackle_radius/2], fill=(255, 215, 0, 255), width=8)

    # Body
    draw.rounded_rectangle(lock_rect, radius=10, fill=(255, 215, 0, 255), outline=(0,0,0,255), width=2)
    
    # Keyhole
    draw.ellipse([lock_x_center - 5, lock_y_bottom - lock_height/2 - 5, lock_x_center + 5, lock_y_bottom - lock_height/2 + 5], fill='black')


    # Save
    if img.mode == 'RGBA':
        img = img.convert('RGB') # Remove alpha for JPG
    img.save(output_path, quality=95)
    print(f"Successfully saved to {output_path}")

except Exception as e:
    print(f"Error: {e}")
