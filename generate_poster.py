from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

def create_poster():
    # Canvas
    W, H = 1080, 1080 
    
    # Background: UCL Logo or Generic UCL Blue
    # We want a stadium. If we have ucl_logo.png, we can use it, but a stadium is better.
    # Let's fallback to the previous AI BG but *overlay* real players if possible, 
    # OR create a new composite bg.
    # Let's use a Dark Blue Gradient + UCL Logo pattern if no stadium.
    background = Image.new("RGBA", (W, H), "#0f172a")
    
    # Draw simple stadium-like glare
    draw = ImageDraw.Draw(background)
    draw.ellipse((0, -200, W, 600), fill="#1e3a8a", outline=None)
    draw.ellipse((200, 0, W-200, 400), fill="#1d4ed8", outline=None)
    
    # Try to load UCL Background if previously downloaded or just use the gradient
    ai_bg_path = r"C:/Users/Administrator/.gemini/antigravity/brain/0b251477-d41d-4409-94fb-73cc8733dacc/chelsea_pafos_faceoff_bg_1768971438546.png"
    if os.path.exists(ai_bg_path):
         bg_img = Image.open(ai_bg_path).convert("RGBA").resize((W, H))
         background.paste(bg_img, (0,0))
    
    # Load Players (Generated Renders)
    # Cole Palmer
    try:
        palmer_path = r"C:/Users/Administrator/.gemini/antigravity/brain/0b251477-d41d-4409-94fb-73cc8733dacc/cole_palmer_render_1768972282760.png"
        if os.path.exists(palmer_path):
            palmer = Image.open(palmer_path).convert("RGBA")
            # Resize
            p_size = 700
            palmer = palmer.resize((p_size, p_size)) 
            
            # Create soft radial mask for blending (as it has black background)
            mask = Image.new("L", (p_size, p_size), 0)
            draw_mask = ImageDraw.Draw(mask)
            # Center white, fade to black edges
            for r in range(p_size//2, 0, -10):
                alpha = int(255 * (r / (p_size/2)))
                # Actually we want inner opaque, outer transparent
                # This simple loop is tricky. Let's do a simple ellipse gradient
                pass
            
            # Simple circular mask
            draw_mask.ellipse((20, 20, p_size-20, p_size-20), fill=255)
            # Add feathering (blur) to mask
            mask = mask.filter(ImageFilter.GaussianBlur(10))
            
            # Place Left
            background.paste(palmer, (-100, 200), mask)
    except Exception as e:
        print(f"Palmer Error: {e}")

    # Jairo (Pafos)
    try:
        jairo_path = r"C:/Users/Administrator/.gemini/antigravity/brain/0b251477-d41d-4409-94fb-73cc8733dacc/jairo_pafos_render_1768972311042.png"
        if os.path.exists(jairo_path):
            jairo = Image.open(jairo_path).convert("RGBA")
            jairo = jairo.resize((700, 700))
            
            mask = Image.new("L", (700, 700), 0)
            draw_mask = ImageDraw.Draw(mask)
            draw_mask.ellipse((20, 20, 680, 680), fill=255)
            mask = mask.filter(ImageFilter.GaussianBlur(10))
            
            # Place Right
            background.paste(jairo, (W-600, 200), mask)
    except Exception as e:
        print(f"Jairo Error: {e}")

    draw = ImageDraw.Draw(background)

    # Fonts
    try:
        font_header = ImageFont.truetype("impact.ttf", 150) # Taller
        font_big_num = ImageFont.truetype("arialbd.ttf", 130)
        font_btn = ImageFont.truetype("arialbd.ttf", 55)
        font_footer = ImageFont.truetype("arialbd.ttf", 30)
    except:
        font_header = ImageFont.load_default()
        font_big_num = ImageFont.load_default()
        font_btn = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    # 1. HEADER: "CHAMPIONS LEAGUE" in Light Green (Brand Color)
    brand_green = "#4ade80" # Tailwind green-400 matches site usage
    header_text = "CHAMPIONS LEAGUE"
    
    # Shadow/Stroke helper
    def draw_text_with_stroke(text, x, y, font, text_color, stroke_color, stroke_width, anchor="mm"):
        # Stroke
        for adj in range(-stroke_width, stroke_width+1):
            for adj2 in range(-stroke_width, stroke_width+1):
                draw.text((x+adj, y+adj2), text, font=font, fill=stroke_color, anchor=anchor)
        # Main
        draw.text((x, y), text, font=font, fill=text_color, anchor=anchor)

    # Draw Header (condensed to fit?)
    draw_text_with_stroke("CHAMPIONS", W//2, 80, font_header, brand_green, "black", 4)
    draw_text_with_stroke("LEAGUE", W//2, 210, font_header, brand_green, "black", 4)
    
    # 2. MATCH INFO (Center Strip)
    y_center = H - 350
    
    # Layout:
    # Time (Top)
    # VS (Middle)
    # Stadium (Bottom)
    
    # All fonts match VS (font_btn = 55)
    # We might want them slightly larger or keep 55? 55 is good.
    
    # Time
    draw_text_with_stroke("23:00", W//2, y_center - 50, font_btn, brand_green, "black", 2)
    
    # VS
    draw_text_with_stroke("vs", W//2, y_center + 50, font_btn, "white", "black", 2)
    
    # Left Text (Odds) - Keep them on sides
    draw_text_with_stroke("1.25", W//2 - 250, y_center, font_big_num, "white", "black", 4)
    # Right Text (Odds)
    draw_text_with_stroke("8.50", W//2 + 250, y_center, font_big_num, "white", "black", 4)

    # 3. BUTTON
    btn_w, btn_h = 500, 100
    btn_x = (W - btn_w) // 2
    btn_y = H - 200
    draw.rectangle([btn_x, btn_y, btn_x+btn_w, btn_y+btn_h], outline=brand_green, width=5, fill="#0f172a")
    draw.text((W//2, btn_y + btn_h//2), "View Statistics", font=font_btn, fill=brand_green, anchor="mm")
    
    # 4. FOOTER
    draw.rectangle([0, H-60, W, H], fill="black")
    draw.text((W//2, H-30), "www.bookiesmasters.com", font=font_footer, fill="white", anchor="mm")

    out_path = "match_poster_real_players.png"
    background.save(out_path)
    print(f"Poster saved to {out_path}")

if __name__ == "__main__":
    create_poster()
