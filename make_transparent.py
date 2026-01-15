from PIL import Image
import os

def remove_black_background(input_path, output_path, threshold=15):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # item is (r, g, b, a)
            # Check if pixel is close to black
            if item[0] <= threshold and item[1] <= threshold and item[2] <= threshold:
                # Make it transparent
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Process the files
files = [
    ("public/logo.png", "public/logo.png"),
    ("public/bookiesmasters_icon_only.png", "public/bookiesmasters_icon_only.png")
    # Not processing the banner as it should have a background
]

for inp, out in files:
    if os.path.exists(inp):
        remove_black_background(inp, out)
    else:
        print(f"File not found: {inp}")
