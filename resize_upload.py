from PIL import Image
import os

def resize_image():
    input_path = r"C:/Users/Administrator/.gemini/antigravity/brain/0b251477-d41d-4409-94fb-73cc8733dacc/uploaded_image_1768974551560.jpg"
    output_path = r"C:/Users/Administrator/.gemini/antigravity/brain/0b251477-d41d-4409-94fb-73cc8733dacc/resized_photo.jpg"
    
    if not os.path.exists(input_path):
        print(f"Error: File not found at {input_path}")
        return

    try:
        img = Image.open(input_path)
        print(f"Original size: {img.size}")
        
        # Resize to 1500x1000 exactly as requested
        # Note: This ignores aspect ratio, which conforms to strict "resize to X*Y" requests
        new_size = (1500, 1000)
        resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        resized_img.save(output_path, quality=95)
        print(f"Success: Image resized to {new_size} and saved to {output_path}")
        
    except Exception as e:
        print(f"Failed to resize: {e}")

if __name__ == "__main__":
    resize_image()
