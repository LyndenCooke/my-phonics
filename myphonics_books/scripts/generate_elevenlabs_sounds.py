"""Generate all phoneme sound files using ElevenLabs George voice.

Replaces Phonics Hero and edge-tts sounds with consistent ElevenLabs voice.
For phonemes, we use a carrier word approach — say just the sound in isolation.
"""
import os
import time
import requests

# Read API key from .env
ENV_PATH = os.path.join(os.path.dirname(__file__), '..', 'phonics-fun-hub', '.env')
API_KEY = None
with open(ENV_PATH) as f:
    for line in f:
        if line.startswith('ELEVENLABS_API_KEY='):
            API_KEY = line.strip().split('=', 1)[1].strip('"\'')
            break

if not API_KEY:
    raise ValueError("ELEVENLABS_API_KEY not found in .env")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'phonics-fun-hub', 'public', 'sounds')
BASE_URL = "https://api.elevenlabs.io/v1"
VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"  # George


def generate_sound(text: str, output_path: str) -> bool:
    url = f"{BASE_URL}/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    data = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.85,
            "similarity_boost": 0.90,
            "style": 0.0,
            "use_speaker_boost": True,
        }
    }
    try:
        resp = requests.post(url, json=data, headers=headers, timeout=30)
        if resp.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(resp.content)
            return True
        else:
            print(f"  ERROR {resp.status_code}: {resp.text[:100]}")
            return False
    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return False


# Phoneme sounds mapped to how George should say them
# Key = filename (without .mp3), Value = text to speak
SOUNDS = {
    # Single consonants - say the pure sound
    's': 'sss',
    't': 't',
    'p': 'p',
    'n': 'nnn',
    'm': 'mmm',
    'd': 'd',
    'g': 'g',
    'c': 'c',
    'k': 'c',
    'b': 'b',
    'f': 'fff',
    'l': 'lll',
    'h': 'h',
    'r': 'rrr',
    'j': 'j',
    'v': 'vvv',
    'w': 'w',
    'x': 'x',
    'y': 'y',
    'z': 'zzz',

    # Short vowels
    'a': 'a',
    'e': 'e',
    'i': 'i',
    'o': 'o',
    'u': 'u',

    # Doubled consonants (same sound as single)
    'ff': 'fff',
    'll': 'lll',
    'ss': 'sss',
    'zz': 'zzz',
    'ck': 'c',

    # Digraphs
    'sh': 'sh',
    'ch': 'ch',
    'th': 'th',
    'ng': 'ng',
    'nk': 'nk',
    'qu': 'qu',

    # Set 2 - Long vowels
    'ay': 'ay',
    'ee': 'ee',
    'igh': 'igh',
    'ow': 'ow',
    'oo': 'oo',           # generic oo (kept for backwards compat)
    'oo_moon': 'oo',      # long oo as in moon
    'oo_look': 'oo',      # short oo as in look — same text, different file
    'ar': 'ar',
    'or': 'or',
    'air': 'air',
    'ir': 'ir',
    'ou': 'ow',           # ou as in cow = same sound as ow
    'oy': 'oy',

    # Set 3 - Split digraphs and alternatives
    'ea': 'ee',           # ea says /ee/
    'a_e': 'ay',          # a-e says /ay/
    'i_e': 'igh',         # i-e says /igh/
    'o_e': 'oh',          # o-e says /oh/
    'u_e': 'oo',          # u-e says /oo/
    'oi': 'oy',           # oi says /oy/
    'aw': 'or',           # aw says /or/
    'ai': 'ay',           # ai says /ay/
    'oa': 'oh',           # oa says /oh/
    'ie': 'igh',          # ie says /igh/

    # Set 3 continued
    'are': 'air',         # are says /air/
    'ur': 'er',           # ur says /er/
    'er': 'er',
    'ew': 'oo',           # ew says /oo/
    'ue': 'oo',           # ue says /oo/

    # Level 5 sounds
    'ore': 'or',          # ore says /or/
    'oor': 'or',          # oor says /or/
    'ire': 'ire',
    'ear': 'ear',
    'ure': 'ure',
    'tion': 'shun',       # tion says /shun/
    'ph': 'fff',          # ph says /f/
    'kn': 'nnn',          # kn says /n/
    'wr': 'rrr',          # wr says /r/

    # Level 6 suffixes
    'ous': 'us',
    'cious': 'shus',
    'tious': 'shus',
    'able': 'able',
    'ible': 'ible',
}


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"=== Generating {len(SOUNDS)} phoneme sounds with ElevenLabs George ===\n")

    generated = 0
    failed = 0

    for filename, speak_text in SOUNDS.items():
        path = os.path.join(OUTPUT_DIR, f'{filename}.mp3')

        if not generate_sound(speak_text, path):
            failed += 1
            print(f"  FAILED: {filename}")
            continue

        generated += 1
        size = os.path.getsize(path)
        print(f"  {generated:3d}. {filename:12s} ('{speak_text}') -> {size:,} bytes")

        if generated % 20 == 0:
            time.sleep(0.5)

    print(f"\nDone! Generated: {generated}, Failed: {failed}")


if __name__ == '__main__':
    main()
