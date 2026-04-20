"""
Generate phoneme sound WAV files using audio synthesis.
Fricatives = filtered noise, nasals = hum, vowels = formants, plosives = bursts.
Then use edge-tts for multi-letter sounds (digraphs, long vowels) where word-text works.
"""
import asyncio
import os
import struct
import wave
import numpy as np
from scipy.signal import butter, lfilter
import edge_tts

OUTPUT_DIR = r"C:\Users\ASUS\myphonicsbooks\myphonics_books\phonics-fun-hub\public\sounds"
SAMPLE_RATE = 44100
VOICE = "en-GB-SoniaNeural"


def bandpass(data, low, high, sr=SAMPLE_RATE, order=5):
    nyq = sr / 2
    b, a = butter(order, [low / nyq, high / nyq], btype='band')
    return lfilter(b, a, data)


def lowpass(data, cutoff, sr=SAMPLE_RATE, order=5):
    nyq = sr / 2
    b, a = butter(order, cutoff / nyq, btype='low')
    return lfilter(b, a, data)


def highpass(data, cutoff, sr=SAMPLE_RATE, order=3):
    nyq = sr / 2
    b, a = butter(order, cutoff / nyq, btype='high')
    return lfilter(b, a, data)


def fade(data, fade_in_ms=10, fade_out_ms=50):
    """Apply fade in/out to avoid clicks."""
    fade_in = int(SAMPLE_RATE * fade_in_ms / 1000)
    fade_out = int(SAMPLE_RATE * fade_out_ms / 1000)
    data[:fade_in] *= np.linspace(0, 1, fade_in)
    data[-fade_out:] *= np.linspace(1, 0, fade_out)
    return data


def normalize(data, level=0.7):
    peak = np.max(np.abs(data))
    if peak > 0:
        data = data * (level / peak)
    return data


def save_wav(filename, data):
    filepath = os.path.join(OUTPUT_DIR, filename)
    data = normalize(fade(data))
    pcm = (data * 32767).astype(np.int16)
    with wave.open(filepath, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())
    size = os.path.getsize(filepath)
    print(f"  OK  {filename:16s} ({size:,} bytes)")


def voicing(duration, f0=120):
    """Generate a voiced signal (vocal cord vibration)."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Sawtooth-like glottal pulse
    signal = np.zeros_like(t)
    for h in range(1, 8):
        signal += (1.0 / h) * np.sin(2 * np.pi * f0 * h * t)
    return signal


def noise(duration):
    """Generate white noise."""
    return np.random.randn(int(SAMPLE_RATE * duration))


# === FRICATIVES (sustained filtered noise) ===

def gen_s(dur=0.6):
    """Voiceless alveolar fricative /s/ — high hissing."""
    n = noise(dur)
    return bandpass(n, 4000, 10000) * 0.4

def gen_z(dur=0.6):
    """Voiced alveolar fricative /z/ — buzzy hissing."""
    n = bandpass(noise(dur), 4000, 10000) * 0.3
    v = lowpass(voicing(dur, 120), 3000) * 0.3
    return n + v

def gen_f(dur=0.6):
    """Voiceless labiodental fricative /f/ — airy."""
    n = noise(dur)
    return bandpass(n, 1500, 8000) * 0.3

def gen_v(dur=0.6):
    """Voiced labiodental fricative /v/."""
    n = bandpass(noise(dur), 1500, 8000) * 0.2
    v = lowpass(voicing(dur, 120), 2000) * 0.4
    return n + v

def gen_th(dur=0.6):
    """Voiceless dental fricative /θ/ — soft lisp."""
    n = noise(dur)
    return bandpass(n, 1000, 6000) * 0.2

def gen_sh(dur=0.6):
    """Voiceless postalveolar fricative /ʃ/ — shushing."""
    n = noise(dur)
    return bandpass(n, 2000, 6000) * 0.4

def gen_h(dur=0.4):
    """Voiceless glottal fricative /h/ — breathy."""
    n = noise(dur)
    return bandpass(n, 500, 4000) * 0.2


# === NASALS (sustained low hum) ===

def gen_m(dur=0.6):
    """Bilabial nasal /m/ — lips-closed hum."""
    v = voicing(dur, 150)
    return lowpass(v, 500) * 0.5

def gen_n(dur=0.6):
    """Alveolar nasal /n/."""
    v = voicing(dur, 180)
    filt = lowpass(v, 700) * 0.4
    filt += bandpass(noise(dur), 200, 600) * 0.05
    return filt

def gen_ng(dur=0.6):
    """Velar nasal /ŋ/."""
    v = voicing(dur, 130)
    return lowpass(v, 400) * 0.5


# === VOWELS (formant synthesis) ===

def gen_vowel(dur, f1, f2, f0=180):
    """Synthesize a vowel using source-filter model."""
    t = np.linspace(0, dur, int(SAMPLE_RATE * dur), endpoint=False)
    # Source: glottal pulse train
    source = voicing(dur, f0)
    # Formants: resonances
    signal = bandpass(source, max(f1 - 100, 50), f1 + 100) * 0.5
    signal += bandpass(source, f2 - 150, f2 + 150) * 0.3
    return signal

def gen_a(dur=0.5):
    """/æ/ as in cat."""
    return gen_vowel(dur, 660, 1720)

def gen_e(dur=0.5):
    """/ɛ/ as in bed."""
    return gen_vowel(dur, 530, 1840)

def gen_i(dur=0.5):
    """/ɪ/ as in sit."""
    return gen_vowel(dur, 390, 1990)

def gen_o(dur=0.5):
    """/ɒ/ as in hot."""
    return gen_vowel(dur, 570, 840)

def gen_u(dur=0.5):
    """/ʌ/ as in cup."""
    return gen_vowel(dur, 640, 1190)


# === APPROXIMANTS (sustained but voiced) ===

def gen_r(dur=0.5):
    """/r/ — retroflex approximant."""
    v = voicing(dur, 150)
    return bandpass(v, 200, 2000) * 0.4

def gen_l(dur=0.5):
    """/l/ — lateral approximant."""
    v = voicing(dur, 160)
    filt = bandpass(v, 250, 2500) * 0.3
    filt += bandpass(v, 800, 1200) * 0.2
    return filt

def gen_w(dur=0.4):
    """/w/ — labial-velar approximant (oo->ah glide)."""
    v = voicing(dur, 140)
    t = np.linspace(0, 1, len(v))
    # Glide from /u/ formants to open
    f1 = 300 + 300 * t  # rises
    filt = np.zeros_like(v)
    chunk = len(v) // 20
    for i in range(20):
        s = i * chunk
        e = min(s + chunk, len(v))
        cf = f1[s]
        filt[s:e] = bandpass(v[s:e], max(cf - 100, 50), cf + 200)
    return filt * 0.4

def gen_y(dur=0.4):
    """/j/ — palatal approximant (ee->ah glide)."""
    v = voicing(dur, 170)
    return bandpass(v, 200, 2500) * 0.4


# === PLOSIVES (short burst — cannot be sustained) ===

def gen_plosive(dur=0.15, voiced=False, freq_low=500, freq_high=4000):
    """Generate a plosive: silence + burst."""
    silence = np.zeros(int(SAMPLE_RATE * 0.05))
    burst_dur = 0.04
    burst = bandpass(noise(burst_dur), freq_low, freq_high) * 0.6
    aspiration = bandpass(noise(0.06), 1000, 6000) * 0.2
    result = np.concatenate([silence, burst, aspiration])
    if voiced:
        voice_part = lowpass(voicing(len(result) / SAMPLE_RATE, 120), 1000) * 0.3
        result[:len(voice_part)] += voice_part[:len(result)]
    # Pad to minimum length
    min_len = int(SAMPLE_RATE * dur)
    if len(result) < min_len:
        result = np.concatenate([result, np.zeros(min_len - len(result))])
    return result

def gen_t(dur=0.15):
    return gen_plosive(dur, voiced=False, freq_low=2000, freq_high=8000)

def gen_p(dur=0.15):
    return gen_plosive(dur, voiced=False, freq_low=500, freq_high=3000)

def gen_k(dur=0.15):
    return gen_plosive(dur, voiced=False, freq_low=1000, freq_high=5000)

def gen_b(dur=0.15):
    return gen_plosive(dur, voiced=True, freq_low=500, freq_high=3000)

def gen_d(dur=0.15):
    return gen_plosive(dur, voiced=True, freq_low=1500, freq_high=6000)

def gen_g(dur=0.15):
    return gen_plosive(dur, voiced=True, freq_low=800, freq_high=4000)


# === AFFRICATES ===

def gen_ch(dur=0.3):
    """/tʃ/ — voiceless postalveolar affricate."""
    stop = gen_plosive(0.1, voiced=False, freq_low=1500, freq_high=5000)
    fric = gen_sh(0.2)
    return np.concatenate([stop, fric])

def gen_j_affricate(dur=0.3):
    """/dʒ/ — voiced postalveolar affricate."""
    stop = gen_plosive(0.1, voiced=True, freq_low=1500, freq_high=5000)
    fric = bandpass(noise(0.2), 2000, 6000) * 0.3
    v = lowpass(voicing(0.2, 120), 2000) * 0.2
    return np.concatenate([stop, fric + v])


# Map of synthesized sounds (WAV files)
SYNTH_SOUNDS = {
    # Fricatives
    's': gen_s, 'z': gen_z, 'f': gen_f, 'v': gen_v,
    'h': gen_h, 'sh': gen_sh, 'th': gen_th,
    # Nasals
    'm': gen_m, 'n': gen_n, 'ng': gen_ng,
    # Vowels
    'a': gen_a, 'e': gen_e, 'i': gen_i, 'o': gen_o, 'u': gen_u,
    # Approximants
    'r': gen_r, 'l': gen_l, 'w': gen_w, 'y': gen_y,
    # Plosives
    't': gen_t, 'p': gen_p, 'k': gen_k, 'c': gen_k,
    'b': gen_b, 'd': gen_d, 'g': gen_g,
    # Affricates
    'ch': gen_ch, 'j': gen_j_affricate,
    # Doubled = same sound
    'ff': gen_f, 'll': gen_l, 'ss': gen_s, 'zz': gen_z, 'ck': gen_k,
}

# Edge-TTS sounds (digraphs, long vowels, clusters — word-text works fine)
EDGE_TTS_SOUNDS = {
    'nk':  'nk',
    'qu':  'kwuh',
    # Long vowels
    'ay':  'ay',
    'ee':  'ee',
    'igh': 'eye',
    'ow':  'ow',
    'oo':  'oo',
    'ar':  'ar',
    'or':  'or',
    'air': 'air',
    'ir':  'er',
    'ur':  'er',
    'ou':  'ow',
    'oy':  'oy',
    # Set 3
    'ai':  'ay',
    'oa':  'oh',
    'ew':  'yoo',
    'ie':  'ee',
    'ea':  'ee',
    'aw':  'or',
    'are': 'air',
    'er':  'er',
    'oi':  'oy',
    'ear': 'ear',
    'ure': 'your',
    'tion':'shun',
    'ore': 'or',
    'oor': 'oor',
    'ire': 'ire',
    # Split digraphs
    'a_e': 'ay',
    'i_e': 'eye',
    'o_e': 'oh',
    'u_e': 'yoo',
    # Suffixes
    'ous': 'us',
    'able':'able',
    'ible':'ibble',
    'cious':'shus',
    'tious':'shus',
    # Clusters
    'st': 'st', 'sp': 'sp', 'nd': 'nd', 'nt': 'nt',
    'mp': 'mp', 'lk': 'lk', 'sk': 'sk',
    'bl': 'bl', 'cr': 'cr', 'fr': 'fr', 'gr': 'gr',
    'tr': 'tr', 'br': 'br', 'cl': 'cl', 'fl': 'fl',
    'pl': 'pl', 'sl': 'sl', 'sm': 'sm', 'sn': 'sn',
    'sw': 'sw', 'tw': 'tw', 'dr': 'dr', 'pr': 'pr',
    'sc': 'sc', 'str':'str', 'spr':'spr', 'scr':'scr',
}


async def generate_edge_sound(grapheme: str, text: str):
    filename = grapheme + '.mp3'
    filepath = os.path.join(OUTPUT_DIR, filename)
    try:
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(filepath)
        size = os.path.getsize(filepath)
        print(f"  OK  {filename:16s} ({size:,} bytes) [edge-tts]")
        return True
    except Exception as e:
        print(f"  FAIL {filename:16s} -> {e}")
        return False


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Delete old files
    for f in os.listdir(OUTPUT_DIR):
        os.remove(os.path.join(OUTPUT_DIR, f))

    print("=== Synthesized sounds (WAV) ===\n")
    for grapheme, gen_func in SYNTH_SOUNDS.items():
        filename = grapheme + '.wav'
        data = gen_func()
        save_wav(filename, data)

    print("\n=== Edge-TTS sounds (MP3) ===\n")
    for grapheme, text in EDGE_TTS_SOUNDS.items():
        await generate_edge_sound(grapheme, text)

    total = len(SYNTH_SOUNDS) + len(EDGE_TTS_SOUNDS)
    print(f"\nDone: {total} sounds generated")


if __name__ == '__main__':
    asyncio.run(main())
