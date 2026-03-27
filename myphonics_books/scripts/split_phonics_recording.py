#!/usr/bin/env python3
"""
Split the recorded phonics sounds WAV into individual phoneme MP3 files.

Uses ffmpeg silence detection, merges fragmented segments, then maps
linearly to the known sound order (Level 1 announcement, L1 sounds,
Level 2 announcement, L2 sounds, etc.)
"""

import subprocess
import re
import os

INPUT_WAV = r"C:\Users\ASUS\myphonicsbooks\myphonics_books\phonics-fun-hub\phonics sounds.wav"
OUTPUT_DIR = r"C:\Users\ASUS\myphonicsbooks\myphonics_books\phonics-fun-hub\public\sounds"

# Linear sequence: announcement, sounds, announcement, sounds, ...
# Must match the order in the recording and assessmentData.ts
SEQUENCE = [
    ('skip', 'Level 1'),
    ('sound', 's'), ('sound', 'a'), ('sound', 't'), ('sound', 'p'),
    ('sound', 'i'), ('sound', 'n'), ('sound', 'm'), ('sound', 'd'),
    ('sound', 'g'), ('sound', 'o'), ('sound', 'c'), ('sound', 'k'),
    ('sound', 'ck'), ('sound', 'e'), ('sound', 'u'), ('sound', 'r'),
    ('sound', 'h'), ('sound', 'b'), ('sound', 'f'), ('sound', 'ff'),
    ('sound', 'l'), ('sound', 'll'), ('sound', 'ss'), ('sound', 'j'),
    ('sound', 'v'), ('sound', 'w'), ('sound', 'x'), ('sound', 'y'),
    ('sound', 'z'), ('sound', 'zz'), ('sound', 'qu'), ('sound', 'ch'),
    ('sound', 'sh'), ('sound', 'th'), ('sound', 'ng'), ('sound', 'nk'),
    ('skip', 'Level 2'),
    ('sound', 'ay'), ('sound', 'ee'), ('sound', 'igh'),
    ('sound', 'ow'), ('skip', 'ow_cow'),  # ow (cow) same sound, skip
    ('sound', 'oo_moon'), ('sound', 'oo_look'),
    ('sound', 'ar'), ('sound', 'or'), ('sound', 'air'), ('sound', 'ir'),
    ('sound', 'ou'), ('sound', 'oy'),
    ('skip', 'Level 3'),
    ('sound', 'ea'), ('sound', 'a_e'), ('sound', 'i_e'), ('sound', 'o_e'),
    ('sound', 'u_e'), ('sound', 'oi'), ('sound', 'aw'), ('sound', 'ai'),
    ('sound', 'oa'), ('sound', 'ie'),
    ('skip', 'Level 4'),
    ('sound', 'are'), ('sound', 'ur'), ('sound', 'er'), ('sound', 'ew'),
    ('sound', 'ue'),
    ('skip', 'Level 5'),
    ('sound', 'ore'), ('sound', 'oor'), ('sound', 'ire'), ('sound', 'ear'),
    ('sound', 'ure'), ('sound', 'tion'), ('sound', 'ph'), ('sound', 'kn'),
    ('sound', 'wr'),
    ('skip', 'Level 6'),
    ('sound', 'ous'), ('sound', 'cious'), ('sound', 'tious'),
    ('sound', 'able'), ('sound', 'ible'),
]


def run_silence_detect(wav_path, noise_db=-35, min_silence_dur=0.25):
    cmd = [
        'ffmpeg', '-i', wav_path,
        '-af', f'silencedetect=noise={noise_db}dB:d={min_silence_dur}',
        '-f', 'null', '-'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    silence_starts = []
    silence_ends = []
    for line in result.stderr.split('\n'):
        m = re.search(r'silence_start:\s*([\d.]+)', line)
        if m:
            silence_starts.append(float(m.group(1)))
        m = re.search(r'silence_end:\s*([\d.]+)', line)
        if m:
            silence_ends.append(float(m.group(1)))

    probe = subprocess.run(
        ['ffprobe', '-i', wav_path, '-show_format', '-v', 'quiet'],
        capture_output=True, text=True
    )
    duration = float(re.search(r'duration=([\d.]+)', probe.stdout).group(1))
    return silence_starts, silence_ends, duration


def build_segments(silence_starts, silence_ends, duration, min_seg_dur=0.02):
    segments = []
    for i, sil_end in enumerate(silence_ends):
        seg_start = sil_end
        next_starts = [s for s in silence_starts if s > sil_end - 0.001]
        seg_end = next_starts[0] if next_starts else duration
        seg_dur = seg_end - seg_start
        if seg_dur >= min_seg_dur:
            segments.append({'start': seg_start, 'end': seg_end, 'dur': seg_dur})
    return segments


def merge_close_segments(segments, max_gap=0.35):
    if not segments:
        return segments
    merged = [dict(segments[0])]
    for seg in segments[1:]:
        gap = seg['start'] - merged[-1]['end']
        if gap < max_gap:
            merged[-1]['end'] = seg['end']
            merged[-1]['dur'] = merged[-1]['end'] - merged[-1]['start']
        else:
            merged.append(dict(seg))
    return merged


def extract_clip(wav_path, start, end, output_path, pad=0.05):
    clip_start = max(0, start - pad)
    clip_duration = (end - start) + 2 * pad

    # Normalize volume to -3dB peak, no fade (clips are too short for fades)
    cmd = [
        'ffmpeg', '-y', '-i', wav_path,
        '-ss', str(clip_start),
        '-t', str(clip_duration),
        '-af', 'loudnorm=I=-16:TP=-3:LRA=11',
        '-ac', '1', '-ar', '44100', '-b:a', '128k',
        output_path
    ]
    subprocess.run(cmd, capture_output=True, text=True)


def main():
    print(f"Input:  {INPUT_WAV}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Silence detection
    print("Running silence detection...")
    sil_starts, sil_ends, duration = run_silence_detect(INPUT_WAV)

    # Build and merge segments
    raw_segments = build_segments(sil_starts, sil_ends, duration)
    segments = merge_close_segments(raw_segments, max_gap=0.35)
    print(f"Found {len(segments)} segments (expected {len(SEQUENCE)})")
    print()

    if len(segments) != len(SEQUENCE):
        print(f"WARNING: segment count ({len(segments)}) != expected ({len(SEQUENCE)})")
        print("Showing mapping for review:")
        for i, seg in enumerate(segments):
            label = SEQUENCE[i] if i < len(SEQUENCE) else ('?', '?')
            print(f"  [{i:3d}] {seg['start']:7.2f}-{seg['end']:7.2f}s "
                  f"(dur={seg['dur']:.3f}s) -> {label[0]}: {label[1]}")
        print()
        resp = input("Continue anyway? (y/n): ")
        if resp.lower() != 'y':
            return

    # Extract clips
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    extracted = 0
    skipped = 0

    for i, (action, name) in enumerate(SEQUENCE):
        if i >= len(segments):
            print(f"  MISSING segment for {name}")
            continue

        seg = segments[i]

        if action == 'skip':
            print(f"  SKIP  {name:12s} at {seg['start']:.2f}-{seg['end']:.2f}s")
            skipped += 1
            continue

        output_path = os.path.join(OUTPUT_DIR, f"{name}.mp3")
        print(f"  SAVE  {name:12s} -> {name}.mp3  ({seg['start']:.2f}-{seg['end']:.2f}s)")
        extract_clip(INPUT_WAV, seg['start'], seg['end'], output_path)
        extracted += 1

    print(f"\nDone! Extracted {extracted} phoneme clips, skipped {skipped}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
