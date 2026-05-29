
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urljoin
import os

url = "https://hematologia.farmacia.ufg.br/"
output = Path("downloads")
output.mkdir(exist_ok=True)

html = requests.get(url).text
soup = BeautifulSoup(html, "html.parser")

imgs = soup.find_all("img")

for i, img in enumerate(imgs):
    src = img.get("src")
    if not src:
        continue

    img_url = urljoin(url, src)

    try:
        data = requests.get(img_url).content
        ext = os.path.splitext(img_url)[-1]
        if ext == "":
            ext = ".jpg"

        with open(output / f"img_{i}{ext}", "wb") as f:
            f.write(data)

        print("baixado:", img_url)

    except Exception as e:
        print(e)
