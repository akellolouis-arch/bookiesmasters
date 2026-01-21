
import os
import requests

def download_file(url, filename):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, stream=True)
        response.raise_for_status()
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

os.makedirs("public/assets", exist_ok=True)

# Cole Palmer (Chelsea) - Source: footyrenders/similar
download_file("https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Cole_Palmer_Chelsea_vs_Brighton_2024.jpg/400px-Cole_Palmer_Chelsea_vs_Brighton_2024.jpg", "public/assets/cole_palmer.jpg")

# Jairo (Pafos) - Harder to find transparent, getting a best-guess image or placeholder
# Using a generic Pafos image or searching specifically for Jairo if we had a direct URL.
# Since I can't browse, I'll use a placeholder for Jairo if the direct link fails, but I will try a likely predictable one or a generic football player silhouette if I must.
# actually let's try to get the Pafos Logo again properly first as a fallback
download_file("https://upload.wikimedia.org/wikipedia/en/2/23/Pafos_FC_logo.png", "public/assets/pafos_logo.png")

# UCL Background - Real one this time if possible, or high quality stadium
download_file("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/UEFA_Champions_League_logo_2.svg/512px-UEFA_Champions_League_logo_2.svg.png", "public/assets/ucl_logo.png")
