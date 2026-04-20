"""
Download real human-recorded phoneme sounds from Phonics Hero.
These are clear British English phoneme pronunciations.
"""
import os
import urllib.request

OUTPUT_DIR = r"C:\Users\ASUS\myphonicsbooks\myphonics_books\phonics-fun-hub\public\sounds"
BASE_URL = "https://phonicshero.com/wp-content/uploads/"

# Map our grapheme filenames -> Phonics Hero filenames
# Phonics Hero uses clean names like s.mp3, sh.mp3, etc.
DOWNLOADS = {
    # Single consonants
    's': 's.mp3',
    't': 't.mp3',
    'p': 'p.mp3',
    'n': 'n.mp3',
    'm': 'm.mp3',
    'd': 'd.mp3',
    'g': 'g.mp3',
    'c': 'c.mp3',
    'k': 'k.mp3',
    'b': 'b.mp3',
    'f': 'f.mp3',
    'l': 'l.mp3',
    'h': 'h.mp3',
    'r': 'r.mp3',
    'j': 'j.mp3',
    'v': 'v.mp3',
    'w': 'w.mp3',
    'x': 'x.mp3',
    'y': 'y.mp3',
    'z': 'z.mp3',

    # Short vowels
    'a': 'a.mp3',
    'e': 'e.mp3',
    'i': 'i.mp3',
    'o': 'o.mp3',
    'u': 'u.mp3',

    # Doubled consonants
    'ff': 'ff.mp3',
    'll': 'll.mp3',
    'ss': 'ss.mp3',
    'zz': 'zz.mp3',
    'ck': 'ck.mp3',

    # Digraphs
    'sh': 'sh.mp3',
    'ch': 'ch.mp3',
    'th': 'th_unvoiced.mp3',  # /θ/ as in "think"
    'ng': 'ng.mp3',
    'qu': 'qu.mp3',

    # Set 2 - Long vowels
    'ee': 'ee.mp3',
    'igh': 'igh.mp3',
    'oa': 'oa.mp3',
    'ay': 'ay.mp3',
    'oo': 'oo.mp3',
}

# For sounds not on Phonics Hero, we keep the edge-tts versions
# (ay, ar, or, air, ir, ur, ou, oy, ai, ew, ie, ea, aw, are, er, oi,
#  ear, ure, tion, ore, oor, ire, split digraphs, suffixes, clusters)


def download_sound(grapheme: str, remote_filename: str):
    """Download a single sound file."""
    url = BASE_URL + remote_filename
    local_filename = grapheme + '.mp3'
    local_path = os.path.join(OUTPUT_DIR, local_filename)

    # Remove old WAV version if exists
    old_wav = os.path.join(OUTPUT_DIR, grapheme + '.wav')
    if os.path.exists(old_wav):
        os.remove(old_wav)
        print(f"  Removed old {grapheme}.wav")

    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req) as response:
            data = response.read()
            with open(local_path, 'wb') as f:
                f.write(data)
            print(f"  OK  {grapheme:8s} <- {remote_filename:20s} ({len(data):,} bytes)")
            return True
    except Exception as e:
        print(f"  FAIL {grapheme:8s} <- {remote_filename}: {e}")
        return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Downloading {len(DOWNLOADS)} phoneme sounds from Phonics Hero\n")

    success = 0
    fail = 0

    for grapheme, remote_file in DOWNLOADS.items():
        if download_sound(grapheme, remote_file):
            success += 1
        else:
            fail += 1

    print(f"\nDone: {success} downloaded, {fail} failed")
    print(f"\nRemaining sounds (edge-tts) kept as-is in {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
