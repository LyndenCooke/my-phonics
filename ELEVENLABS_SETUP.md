# ElevenLabs Phoneme Voice Integration

## What This Does

Adds a speaker button to the assessment's **Sound Recognition** round. When tapped, it plays the phoneme sound (e.g., "sssss" for S) instead of the letter name ("esss").

## Current Implementation

The `PhonemePlayer` component includes:

1. **Browser TTS Fallback** (works immediately)
   - Uses `speechSynthesis` API
   - UK English voice when available
   - Slower rate (0.7x) for clarity
   - Mapped phonemes: S → "sssss", A → "aaaah", etc.

2. **ElevenLabs Integration** (optional upgrade)
   - Higher quality voices
   - More natural phoneme sounds
   - Requires API key

## Files Changed

| File | Change |
|------|--------|
| `src/components/PhonemePlayer.tsx` | New component - handles audio playback |
| `src/pages/Assessment.tsx` | Added PhonemePlayer to sound recognition round |

## How to Use (Browser TTS - Free)

Works immediately! No setup required. The browser's built-in text-to-speech will:
- Map S → "sssss" (phoneme)
- Map A → "aaaah" (phoneme)
- Use UK English voice if available
- Speak slowly for clarity

## Upgrade to ElevenLabs (Better Quality)

### Step 1: Get API Key
1. Sign up at https://elevenlabs.io
2. Get your API key from the dashboard
3. Free tier: 10,000 characters/month

### Step 2: Add API Key

**Option A: Environment Variable (Recommended)**
```bash
# .env file
VITE_ELEVENLABS_API_KEY=your_api_key_here
```

**Option B: Pass as Prop**
Modify `Assessment.tsx`:
```tsx
<PhonemePlayer 
  grapheme={currentItem.item_text} 
  apiKey="your_api_key_here"
  size="lg"
/>
```

### Step 3: Update Component (if using env var)

Modify `src/components/PhonemePlayer.tsx`:
```tsx
// Add at top
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// In the component, replace browser TTS with:
const { playPhoneme, isLoading } = useElevenLabs(ELEVENLABS_API_KEY);
```

## Phoneme Mapping

The component maps graphemes to phonetic pronunciations:

| Grapheme | Phoneme Sound | Example |
|----------|---------------|---------|
| S | "sssss" | snake |
| A | "aaaah" | apple |
| T | "ttttt" | tap |
| P | "ppppp" | pat |
| C | "kkkkk" | cat (hard C) |
| CH | "chchch" | chip |
| SH | "shshsh" | ship |
| TH | "ththth" | thin |
| AY | "ayyyyy" | day |
| EE | "eeeeee" | see |
| IGH | "iiiiii" | night |

Full mapping in `src/components/PhonemePlayer.tsx` → `PHONEME_MAP`

## Voice Options

### ElevenLabs Recommended Voices (UK English)

| Voice ID | Name | Quality |
|----------|------|---------|
| `EXAVITQu4vr4xnSDxMaL` | Sarah | ⭐⭐⭐⭐⭐ Clear, warm |
| `XB0fDUnXU5powFXDhCwa` | Rachel | ⭐⭐⭐⭐⭐ Natural |
| `pNInz6obpgDQGcFmaJgB` | Adam | ⭐⭐⭐⭐ Clear male |
| `AZnzlk1XvdvUeBnXmlld` | Domi | ⭐⭐⭐⭐ Warm |

Change voice in `PhonemePlayer.tsx`:
```tsx
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Your preferred voice
```

## Testing

1. Run the assessment
2. In the "Sound Recognition" round, you'll see a pink speaker button
3. Tap it to hear the phoneme sound
4. Verify S sounds like "sssss" not "esss"

## Browser Compatibility

| Browser | Browser TTS | ElevenLabs API |
|---------|-------------|----------------|
| Chrome | ✅ Yes | ✅ Yes |
| Safari | ✅ Yes | ✅ Yes |
| Firefox | ✅ Yes | ✅ Yes |
| Edge | ✅ Yes | ✅ Yes |

## Troubleshooting

### No Sound
- Check device volume
- Check browser permissions (may need to allow audio)
- Try tapping the speaker twice

### Wrong Sound (Letter Name Instead of Phoneme)
- Check the `PHONEME_MAP` includes your grapheme
- Add custom mapping if needed

### ElevenLabs Not Working
- Verify API key is correct
- Check character quota on ElevenLabs dashboard
- Check browser console for errors

## Cost Estimate

| Usage | Browser TTS | ElevenLabs (Free Tier) |
|-------|-------------|------------------------|
| 100 assessments/day | £0 | £0 (within 10k chars) |
| 1000 assessments/day | £0 | ~£5-10/month |
| 10,000 assessments/day | £0 | ~£50-100/month |

## Future Enhancements

- [ ] Pre-generate audio files for offline playback
- [ ] Cache ElevenLabs responses to reduce API calls
- [ ] Add animation (mouth shape) while playing
- [ ] Option to repeat sound automatically

## Notes

- The current implementation prioritizes getting it working quickly with browser TTS
- ElevenLabs upgrade is optional but recommended for production
- All phoneme mappings follow UK Letters and Sounds programme
