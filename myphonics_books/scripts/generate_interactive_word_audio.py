"""Generate word audio for interactive books using ElevenLabs George voice.

Always uses George (JBFqnCBsd6RMkjVDRZzb) for consistency.
Output: public/sounds/words/{word}.mp3
"""
import os
import time
import requests

# Config
API_KEY = "sk_6bfdd8eaa155797a6757efe47623461577bf8efb8f9e5881"
GEORGE_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"
BASE_URL = "https://api.elevenlabs.io/v1"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'sounds', 'words')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Words that need slower speed (short words that play too fast)
SLOW_WORDS = {'i', 'a', 'I'}  # These get speed_alpha=0.6

def generate_word(word: str, output_path: str, slow: bool = False) -> bool:
    """Generate audio for a single word using George voice."""
    url = f"{BASE_URL}/text-to-speech/{GEORGE_VOICE_ID}"
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
            size_kb = os.path.getsize(output_path) / 1024
            print(f"  OK  ({size_kb:.0f}KB) {word}" + (" [SLOW]" if slow else ""))
            return True
        else:
            print(f"  ERROR {resp.status_code} for '{word}': {resp.text[:100]}")
            return False
    except Exception as e:
        print(f"  EXCEPTION for '{word}': {e}")
        return False


# All words used in interactive books L1.1-L1.5
# Real words
REAL_WORDS = [
    # L1.1
    'sit', 'mat', 'tap', 'rat', 'bat', 'pat', 'cat', 'fat', 'naps',
    'at', 'is', 'it', 'not', 'am',
    'sun', 'sock', 'six', 'sad', 'hat', 'cat', 'map', 'van',
    'tin', 'tap', 'ten', 'tub', 'pig', 'pan', 'pin', 'peg',
    'bin', 'dig', 'fin', 'zip', 'net', 'nut', 'nap', 'nod',
    # L1.2
    'dog', 'mud', 'mop', 'got', 'big', 'ran', 'mess', 'tub', 'mum',
    'in', 'on', 'me',
    'man', 'mix', 'mum', 'dip', 'dot', 'duck',
    'gap', 'gas', 'gum', 'gift', 'log', 'fog', 'hot', 'pot',
    # L1.3
    'fish', 'tank', 'wish', 'bag', 'cup', 'sad',
    'yes', 'can', 'get',
    'ship', 'shed', 'shop', 'sink', 'bank', 'ink',
    # L1.4
    'socks', 'check', 'red', 'bed', 'hen', 'pen', 'peck', 'pecks', 'kick', 'sock',
    'cap', 'cob', 'cab', 'kit', 'kid', 'keg', 'kip', 'lock', 'web',
    # L1.5
    'run', 'pup', 'hut', 'bush', 'rub', 'hug', 'hid', 'and',
    'bus', 'jug', 'rug', 'rat', 'rod', 'hat', 'hen', 'hop', 'bat', 'bed', 'bun',
    # Tricky words (all books)
    'I', 'a', 'the', 'is', 'no', 'go', 'have', 'happy', 'so', 'has',
]

# Nonsense/alien words
NONSENSE_WORDS = [
    # L1.1
    'sap', 'tas', 'pim', 'nit', 'tib', 'pag', 'nas', 'sib', 'nat', 'pis', 'tup', 'sut',
    # L1.2
    'mog', 'dop', 'gim', 'dom', 'gat', 'mig', 'god', 'dug', 'mab', 'gop', 'dit', 'meg',
    # L1.3
    'shim', 'fash', 'nush', 'gish', 'tink', 'donk', 'bunk', 'lenk', 'thud', 'chop', 'thib', 'quop',
    # L1.4
    'keb', 'ced', 'dek', 'kem', 'feck', 'veck', 'bick', 'ruck', 'cug', 'kib', 'nuck', 'teck',
    # L1.5
    'hup', 'rud', 'bup', 'reb', 'hib', 'rup', 'hab', 'besh', 'gub', 'mub', 'lub', 'vub',
]

# Words to force-regenerate (user reported bad quality)
FORCE_REGEN = {'i', 'no', 'socks', 'am', 'a'}


def main():
    all_words = sorted(set(w.lower() for w in REAL_WORDS + NONSENSE_WORDS))
    print(f"=== ElevenLabs Interactive Book Word Audio (George) ===")
    print(f"Total unique words: {len(all_words)}\n")

    ok = skip = fail = 0
    for word in all_words:
        path = os.path.join(OUTPUT_DIR, f"{word}.mp3")

        # Skip if exists and not in force-regen list
        if os.path.exists(path) and word not in FORCE_REGEN:
            skip += 1
            continue

        slow = word in SLOW_WORDS
        if generate_word(word, path, slow):
            ok += 1
        else:
            fail += 1
        time.sleep(0.3)  # Rate limit

    print(f"\nDone: {ok} generated, {skip} existed, {fail} failed")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
