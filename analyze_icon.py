from PIL import Image
import collections

def analyze_colors():
    path = r"c:\Users\Administrator\projects\bookiesmasters\public\bookiesmasters_cleaned.png"
    try:
        img = Image.open(path).convert("RGBA")
    except Exception as e:
        print(f"Error: {e}")
        return

    # Sample pixels
    pixels = img.getdata()
    
    # Count unique colors
    color_counts = collections.Counter(pixels)
    
    print(f"Total unique colors: {len(color_counts)}")
    print("Most common 20 colors (R, G, B, A): Count")
    for color, count in color_counts.most_common(20):
        print(f"{color}: {count}")

    # Check corners specifically (often where background is)
    w, h = img.size
    corners = [
        (0, 0), (w-1, 0), (0, h-1), (w-1, h-1)
    ]
    print("\nCorner colors:")
    for x, y in corners:
        p = img.getpixel((x, y))
        print(f"({x}, {y}): {p}")

if __name__ == "__main__":
    analyze_colors()
