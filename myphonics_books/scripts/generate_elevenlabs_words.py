"""Generate word audio using ElevenLabs API (British English voice).

Replaces edge-tts word audio with high-quality ElevenLabs TTS.
Reads API key from phonics-fun-hub/.env file.
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

print(f"API key: {API_KEY[:8]}...")

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'phonics-fun-hub', 'public', 'sounds', 'words')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ElevenLabs API config
BASE_URL = "https://api.elevenlabs.io/v1"

# First, list available voices to find a good British one
def list_voices():
    resp = requests.get(f"{BASE_URL}/voices", headers={"xi-api-key": API_KEY})
    resp.raise_for_status()
    voices = resp.json()["voices"]
    british = [v for v in voices if 'british' in str(v.get('labels', {})).lower()]
    print(f"\nFound {len(voices)} total voices, {len(british)} British/English")
    for v in british[:10]:
        labels = v.get('labels', {})
        print(f"  {v['voice_id'][:12]}  {v['name']:20s}  {labels}")
    return voices


def find_british_voice(voices):
    """Find a suitable British English voice."""
    # Look for British voices with specific keywords
    for v in voices:
        label_str = str(v.get('labels', {})).lower()
        if 'british' in label_str and ('young' in label_str or 'child' in label_str):
            print(f"\nSelected voice: {v['name']} ({v['voice_id']})")
            return v['voice_id']

    # Fallback: any British voice
    for v in voices:
        label_str = str(v.get('labels', {})).lower()
        if 'british' in label_str:
            print(f"\nSelected voice: {v['name']} ({v['voice_id']})")
            return v['voice_id']

    # Fallback: Charlotte (British, known good voice)
    for v in voices:
        if v['name'].lower() in ['charlotte', 'george', 'lily', 'alice']:
            print(f"\nSelected voice: {v['name']} ({v['voice_id']})")
            return v['voice_id']

    # Last resort: first voice
    print(f"\nUsing first voice: {voices[0]['name']} ({voices[0]['voice_id']})")
    return voices[0]['voice_id']


def generate_word(word: str, voice_id: str, output_path: str) -> bool:
    """Generate audio for a single word."""
    url = f"{BASE_URL}/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    data = {
        "text": word,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.75,
            "similarity_boost": 0.85,
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


# All words from the assessment
WORDS = sorted(set([
    # Level 1
    'sat', 'pin', 'dig', 'mop', 'cup', 'hug', 'check', 'fish', 'shop', 'thin', 'ring', 'quack',
    'teg', 'mip', 'fod', 'gub', 'hin', 'jat', 'zog', 'vum', 'cheb', 'shog', 'thep', 'quab',
    'the', 'to', 'I', 'no', 'go', 'into',
    'in', 'am', 'red', 'bin', 'yes', 'and', 'get', 'him', 'not', 'but', 'big', 'had',
    # Level 2
    'day', 'jeep', 'sight', 'low', 'cow', 'moon', 'look', 'park', 'fork', 'fair', 'fir', 'shout', 'boy',
    'tay', 'deeg', 'migh', 'gow', 'yow', 'hoond', 'jook', 'narp', 'mork', 'gair', 'zir', 'fout', 'noy',
    'he', 'she', 'we', 'me', 'be', 'my', 'you', 'her', 'said', 'your', 'are', 'put',
    'with', 'off', 'thin', 'will', 'his', 'them', 'that', 'have', 'long', 'this', 'back', 'much',
    # Level 3
    'cake', 'bike', 'stone', 'flute', 'coin', 'straw', 'snail', 'boat', 'pie', 'reach',
    'grafe', 'stime', 'broak', 'cloi', 'frawl', 'snaid', 'bleam', 'dripe', 'joap', 'spie',
    'all', 'like', 'want', 'call', 'some', 'what', 'they', 'do', 'old', 'was', 'so', 'one', 'two', 'again',
    'lots', 'black', 'went', 'stop', 'green', 'tree', 'make', 'came', 'play', 'round', 'feel', 'about',
    # Level 4
    'stare', 'turn', 'fern', 'chew', 'true', 'brown', 'turnip', 'market', 'flower',
    'skare', 'clurn', 'blert', 'brewn', 'plue', 'jown', 'norp', 'pight', 'clow', 'zair',
    'saw', 'watch', 'their', 'school', 'where', 'were', 'small', 'who', 'tall', 'brother', 'any', 'there', 'eyes', 'done', 'move',
    'rest', 'smell', 'soft', 'stay', 'which', 'first', 'your', 'down', 'house', 'after', 'every', 'other',
    # Level 5
    'shore', 'floor', 'fire', 'near', 'sure', 'station', 'phone', 'knee', 'write',
    'blore', 'gloor', 'brire', 'snear', 'plure', 'tration', 'phest', 'knib', 'wrop',
    'does', 'could', 'would', 'anyone', 'over', 'through', 'once', 'whole', 'people', 'water', 'though', 'knew', 'woman',
    'thing', 'right', 'night', 'sleep', 'know', 'quick', 'little', 'think', 'smart', 'more', 'before',
    # Level 6
    'famous', 'precious', 'cautious', 'readable', 'terrible', 'incredible', 'suspicious',
    'parvous', 'fricious', 'bontious', 'strable', 'plendible', 'marcious', 'gantible',
    'should', 'many', 'above', 'father', 'son', 'mother', 'buy', 'bought', 'great', 'caught', 'worse', 'love', 'wear', 'thought', 'everyone', 'walk', 'talk',
    'comfortable', 'invisible', 'operation', 'tomorrow', 'serious', 'remember', 'enormous', 'beautiful', 'different', 'important',
]))


def main():
    print("=== ElevenLabs Word Audio Generator ===\n")

    # List voices and select British one
    voices = list_voices()
    voice_id = find_british_voice(voices)

    print(f"\nGenerating {len(WORDS)} words...\n")

    generated = 0
    skipped = 0
    failed = 0

    for i, word in enumerate(WORDS):
        filename = word.lower().replace(' ', '_') + '.mp3'
        path = os.path.join(OUTPUT_DIR, filename)

        # Always regenerate (replacing edge-tts versions)
        if not generate_word(word, voice_id, path):
            failed += 1
            continue

        generated += 1
        if generated % 25 == 0:
            print(f"  Generated {generated}/{len(WORDS)} words...")
            # Small delay to respect rate limits
            time.sleep(0.5)

    print(f"\nDone! Generated: {generated}, Failed: {failed}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
