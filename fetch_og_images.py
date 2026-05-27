"""
fetch_og_images.py

Fetches restaurant photos from each restaurant's own website and updates
image_url in backend/data.csv. Tries twitter:image first (usually a food/
atmosphere shot), falls back to og:image. Skips logos by checking image
dimensions (logos tend to be small or square, food photos are large/landscape).

Usage:
    python3 fetch_og_images.py
"""

import re
import struct
import time
import urllib.request
import urllib.parse
import pandas as pd

DATA_PATH = "backend/data.csv"
TIMEOUT = 8
DELAY = 0.15
MIN_WIDTH = 400   # skip images narrower than this (likely logos/icons)
MIN_PIXELS = 200_000  # skip images smaller than ~450x450 (likely logos)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

LOGO_KEYWORDS = re.compile(
    r"(favicon)[^/]*\.(png|jpg|jpeg|gif|svg|webp)",
    re.IGNORECASE,
)

META_PATTERNS = [
    # twitter:image (usually a featured food/atmosphere photo)
    re.compile(r'<meta[^>]+name=["\']twitter:image:src["\'][^>]+content=["\']([^"\']+)["\']', re.IGNORECASE),
    re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image:src["\']', re.IGNORECASE),
    re.compile(r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']', re.IGNORECASE),
    re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']', re.IGNORECASE),
    # og:image fallback
    re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', re.IGNORECASE),
    re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', re.IGNORECASE),
]

# og:image:width/height tags for quick size check without downloading the image
OG_WIDTH_RE = re.compile(r'<meta[^>]+property=["\']og:image:width["\'][^>]+content=["\'](\d+)["\']', re.IGNORECASE)
OG_WIDTH_RE2 = re.compile(r'<meta[^>]+content=["\'](\d+)["\'][^>]+property=["\']og:image:width["\']', re.IGNORECASE)
OG_HEIGHT_RE = re.compile(r'<meta[^>]+property=["\']og:image:height["\'][^>]+content=["\'](\d+)["\']', re.IGNORECASE)
OG_HEIGHT_RE2 = re.compile(r'<meta[^>]+content=["\'](\d+)["\'][^>]+property=["\']og:image:height["\']', re.IGNORECASE)


def make_absolute(img: str, base_url: str) -> str:
    if img.startswith("//"):
        return "https:" + img
    if img.startswith("/"):
        parsed = urllib.parse.urlparse(base_url)
        return f"{parsed.scheme}://{parsed.netloc}{img}"
    return img


def get_image_dimensions(url: str) -> tuple[int, int] | None:
    """Read just enough bytes to extract width/height from JPEG or PNG."""
    try:
        req = urllib.request.Request(url, headers={**HEADERS, "Range": "bytes=0-4095"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = resp.read(4096)

        # PNG: 8-byte signature + IHDR chunk, width at bytes 16-19, height at 20-23
        if data[:8] == b'\x89PNG\r\n\x1a\n' and len(data) >= 24:
            w, h = struct.unpack(">II", data[16:24])
            return w, h

        # JPEG: scan for SOF0/SOF2 marker (0xFF 0xC0 or 0xFF 0xC2)
        i = 2
        while i < len(data) - 8:
            if data[i] == 0xFF and data[i+1] in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", data[i+5:i+9])
                return w, h
            # skip marker
            if data[i] == 0xFF and i + 3 < len(data):
                length = struct.unpack(">H", data[i+2:i+4])[0]
                i += 2 + length
            else:
                i += 1
    except Exception:
        pass
    return None


def is_good_photo(img_url: str, html: str) -> bool:
    """Return True if the image is likely a food/space photo, not a logo."""
    if LOGO_KEYWORDS.search(img_url):
        return False


    # Try og:image:width/height from HTML first (fast, no extra request)
    wm = OG_WIDTH_RE.search(html) or OG_WIDTH_RE2.search(html)
    hm = OG_HEIGHT_RE.search(html) or OG_HEIGHT_RE2.search(html)
    if wm and hm:
        w, h = int(wm.group(1)), int(hm.group(1))
        if w < MIN_WIDTH or w * h < MIN_PIXELS:
            return False
        return True

    # Fall back to fetching image header bytes
    dims = get_image_dimensions(img_url)
    if dims:
        w, h = dims
        if w < MIN_WIDTH or w * h < MIN_PIXELS:
            return False
    return True


def fetch_best_image(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            chunk = resp.read(40_000).decode("utf-8", errors="ignore")
    except Exception:
        return None

    for pattern in META_PATTERNS:
        m = pattern.search(chunk)
        if not m:
            continue
        img = make_absolute(m.group(1).strip(), url)
        if not img.startswith("http"):
            continue
        if is_good_photo(img, chunk):
            return img

    return None


def main():
    df = pd.read_csv(DATA_PATH)
    updated = 0
    skipped = 0
    no_website = 0

    for i, row in df.iterrows():
        name = row["name"]
        website = row.get("website", "")

        if not isinstance(website, str) or not website.strip():
            no_website += 1
            print(f"[{i+1}/{len(df)}] {name} — no website")
            continue

        print(f"[{i+1}/{len(df)}] {name} ...", end=" ", flush=True)
        img = fetch_best_image(website.strip())

        if img:
            df.at[i, "image_url"] = img
            updated += 1
            print(f"OK ({img[:80]})")
        else:
            skipped += 1
            print("no photo found — will use cuisine fallback")

        time.sleep(DELAY)

    df.to_csv(DATA_PATH, index=False)
    print(f"\nDone. Updated: {updated}, No photo: {skipped}, No website: {no_website}")


if __name__ == "__main__":
    main()
