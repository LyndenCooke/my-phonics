"""Generate all audio files needed for the assessment.

Uses edge-tts with British English voice for all words.
Also generates missing phoneme sounds (ph, kn, wr, ue).
"""
import asyncio
import os
import edge_tts

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'phonics-fun-hub', 'public', 'sounds')
VOICE = "en-GB-RyanNeural"  # British male child-friendly voice

# Missing phoneme sounds — use phonetic approximations
MISSING_SOUNDS = {
    'ph': 'f',        # ph says /f/
    'kn': 'n',        # kn says /n/
    'wr': 'r',        # wr says /r/
    'ue': 'oo',       # ue says /oo/ as in blue
}

# All words from the assessment item bank (real words, alien words, tricky words, speedy reading)
WORDS = {
    # Level 1
    'sat', 'pin', 'dig', 'mop', 'cup', 'hug', 'check', 'fish', 'shop', 'thin', 'ring', 'quack',
    'teg', 'mip', 'fod', 'gub', 'hin', 'jat', 'zog', 'vum', 'cheb', 'shog', 'thep', 'quab',
    'the', 'to', 'no', 'go', 'into',  # 'I' handled separately
    'in', 'am', 'red', 'bin', 'yes', 'and', 'get', 'him', 'not', 'but', 'big', 'had',
    # Level 2
    'day', 'jeep', 'sight', 'low', 'cow', 'moon', 'look', 'park', 'fork', 'fair', 'fir', 'shout', 'boy',
    'tay', 'deeg', 'migh', 'gow', 'yow', 'hoond', 'jook', 'narp', 'mork', 'gair', 'zir', 'fout', 'noy',
    'he', 'she', 'we', 'me', 'be', 'my', 'you', 'her', 'said', 'your', 'are', 'put',
    'with', 'off', 'will', 'his', 'them', 'that', 'have', 'long', 'this', 'back', 'much',
    # Level 3
    'cake', 'bike', 'stone', 'flute', 'coin', 'straw', 'snail', 'boat', 'pie', 'reach',
    'grafe', 'stime', 'broak', 'cloi', 'frawl', 'snaid', 'bleam', 'dripe', 'joap', 'spie',
    'all', 'like', 'want', 'call', 'some', 'what', 'they', 'do', 'old', 'was', 'so', 'one', 'two', 'again',
    'lots', 'black', 'went', 'stop', 'green', 'tree', 'make', 'came', 'play', 'round', 'feel', 'about',
    # Level 4
    'stare', 'turn', 'fern', 'chew', 'true', 'brown', 'turnip', 'market', 'flower',
    'skare', 'clurn', 'blert', 'brewn', 'plue', 'jown', 'norp', 'pight', 'clow', 'zair',
    'saw', 'watch', 'their', 'school', 'where', 'were', 'small', 'who', 'tall', 'brother', 'any', 'there', 'eyes', 'done', 'move',
    'rest', 'smell', 'soft', 'stay', 'which', 'first', 'down', 'house', 'after', 'every', 'other',
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
}

# Add "I" separately (needs special handling — file name)
WORDS.add('I')


async def generate_word(word: str, output_path: str):
    """Generate audio for a single word using edge-tts."""
    communicate = edge_tts.Communicate(word, VOICE, rate="-20%")
    await communicate.save(output_path)


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Generate missing phoneme sounds
    print("=== Generating missing phoneme sounds ===")
    for grapheme, speak_as in MISSING_SOUNDS.items():
        path = os.path.join(OUTPUT_DIR, f'{grapheme}.mp3')
        if os.path.exists(path):
            print(f"  SKIP {grapheme} (already exists)")
            continue
        # For phonemes, we copy the sound from an existing one if possible
        existing = os.path.join(OUTPUT_DIR, f'{speak_as}.mp3')
        if os.path.exists(existing):
            import shutil
            shutil.copy2(existing, path)
            print(f"  COPIED {grapheme} <- {speak_as}")
        else:
            print(f"  GENERATING {grapheme} (speak as '{speak_as}')")
            await generate_word(speak_as, path)

    # 2. Generate word audio
    print(f"\n=== Generating word audio ({len(WORDS)} words) ===")

    # Use 'words' subdirectory for word audio
    words_dir = os.path.join(OUTPUT_DIR, 'words')
    os.makedirs(words_dir, exist_ok=True)

    generated = 0
    skipped = 0
    failed = 0

    for word in sorted(WORDS):
        # File name: lowercase, replace spaces
        filename = word.lower().replace(' ', '_') + '.mp3'
        path = os.path.join(words_dir, filename)

        if os.path.exists(path):
            skipped += 1
            continue

        try:
            await generate_word(word, path)
            generated += 1
            if generated % 20 == 0:
                print(f"  Generated {generated} words...")
        except Exception as e:
            print(f"  FAILED: {word} - {e}")
            failed += 1

    print(f"\nDone! Generated: {generated}, Skipped: {skipped}, Failed: {failed}")
    print(f"Sound files: {OUTPUT_DIR}")
    print(f"Word files: {words_dir}")


if __name__ == '__main__':
    asyncio.run(main())
