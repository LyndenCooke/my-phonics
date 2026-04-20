# Requirements: fastapi, pydantic, anthropic, python-multipart, python-dotenv
# Python 3.10+

import os
import json
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic

# ============================================================================
# CONSTANTS AND DATA
# ============================================================================

PHONICS_LEVELS = {
    1: {
        "name": "Starting Stories",
        "colour": "#E84B8A",
        "graphemes": {
            "single": list("satpinmdgockeurhbfflljsvwxyzqu"),
            "digraphs": ["ch", "sh", "th", "ng", "nk"],
            "blends": [],
        },
        "final_blends": ["nd", "nt", "mp"],
        "tricky_words": ["the", "to", "I", "no", "go", "into"],
    },
    2: {
        "name": "Longer Sounds",
        "colour": "#F59E0B",
        "graphemes": {
            "single": list("satpinmdgockeurhbfflljsvwxyzqu"),
            "digraphs": ["ch", "sh", "th", "ng", "nk"],
            "two_letter": ["ay", "ee", "igh", "ow", "oo", "ar", "or", "air", "ir", "ou", "oy"],
            "blends": [],
        },
        "tricky_words": ["the", "to", "I", "no", "go", "into", "he", "she", "we", "me", "be",
                         "my", "you", "her", "said", "your", "are", "put"],
    },
    3: {
        "name": "New Spellings",
        "colour": "#22C55E",
        "graphemes": {
            "single": list("satpinmdgockeurhbfflljsvwxyzqu"),
            "digraphs": ["ch", "sh", "th", "ng", "nk"],
            "two_letter": ["ay", "ee", "igh", "ow", "oo", "ar", "or", "air", "ir", "ou", "oy",
                          "ea", "ai", "oa", "ie", "oi", "aw"],
            "alternative_phonemes": ["a-e", "i-e", "o-e", "u-e"],
            "initial_clusters": ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr",
                                "sc", "sk", "sl", "sm", "sn", "sp", "st", "sw", "tr", "tw", "scr",
                                "spl", "spr", "str"],
            "final_clusters": ["ft", "lk", "lp", "lt", "mp", "nd", "nk", "nt", "pt", "sk", "sp", "st"],
        },
        "tricky_words": ["the", "to", "I", "no", "go", "into", "he", "she", "we", "me", "be",
                         "my", "you", "her", "said", "your", "are", "put", "all", "like", "want",
                         "call", "some", "what", "they", "do", "old", "was", "so", "washing",
                         "one", "two", "again"],
    },
    4: {
        "name": "Building Fluency",
        "colour": "#3B82F6",
        "graphemes": {
            "two_letter": ["ay", "ee", "igh", "ow", "oo", "ar", "or", "air", "ir", "ou", "oy",
                          "ea", "ai", "oa", "ie", "oi", "aw", "are", "ur", "er", "ew", "ue"],
            "alternative_phonemes": ["a-e", "i-e", "o-e", "u-e"],
            "initial_clusters": ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr",
                                "sc", "sk", "sl", "sm", "sn", "sp", "st", "sw", "tr", "tw", "scr",
                                "spl", "spr", "str"],
        },
        "tricky_words": ["the", "to", "I", "no", "go", "into", "he", "she", "we", "me", "be",
                         "my", "you", "her", "said", "your", "are", "put", "all", "like", "want",
                         "call", "some", "what", "they", "do", "old", "was", "so", "washing",
                         "one", "two", "again", "saw", "watch", "their", "school", "where",
                         "were", "small", "who", "tall", "brother", "any", "fall", "there",
                         "eyes", "done", "move"],
    },
    5: {
        "name": "Reading Together",
        "colour": "#8B5CF6",
        "graphemes": {
            "digraphs": ["ph", "kn", "wr"],
            "suffixes": ["tion"],
            "two_letter": ["or", "oor", "ire", "ear", "ure"],
        },
        "tricky_words": ["the", "to", "I", "no", "go", "into", "he", "she", "we", "me", "be",
                         "my", "you", "her", "said", "your", "are", "put", "all", "like", "want",
                         "call", "some", "what", "they", "do", "old", "was", "so", "washing",
                         "one", "two", "again", "saw", "watch", "their", "school", "where",
                         "were", "small", "who", "tall", "brother", "any", "fall", "there",
                         "eyes", "done", "move", "does", "could", "would", "anyone", "over",
                         "through", "once", "whole", "people", "water", "though", "knew", "woman"],
    },
    6: {
        "name": "Reading Champion",
        "colour": "#14B8A6",
        "graphemes": {
            "suffixes": ["ous", "cious", "tious", "able", "ible"],
        },
        "tricky_words": ["the", "to", "I", "no", "go", "into", "he", "she", "we", "me", "be",
                         "my", "you", "her", "said", "your", "are", "put", "all", "like", "want",
                         "call", "some", "what", "they", "do", "old", "was", "so", "washing",
                         "one", "two", "again", "saw", "watch", "their", "school", "where",
                         "were", "small", "who", "tall", "brother", "any", "fall", "there",
                         "eyes", "done", "move", "does", "could", "would", "anyone", "over",
                         "through", "once", "whole", "people", "water", "though", "knew", "woman",
                         "should", "many", "above", "father", "son", "mother", "buy", "bought",
                         "great", "caught", "worse", "love", "wear", "thought", "everyone",
                         "walk", "talk"],
    },
}

CHARACTER_ROSTER = {
    1: {
        "skin": "dark brown",
        "hair": "short curly black",
        "outfit": "red jumper, blue denim dungarees, blue wellies",
        "age": "about 5",
    },
    2: {
        "skin": "warm brown",
        "hair": "lilac hijab",
        "outfit": "yellow raincoat over purple dress, red wellies",
        "age": "about 6",
    },
    3: {
        "skin": "light skin with freckles",
        "hair": "messy blond hair",
        "outfit": "green cycling jersey with white stripe, black shorts, green helmet",
        "age": "about 7",
    },
    4: {
        "skin": "olive skin",
        "hair": "long dark brown hair in thick plait",
        "outfit": "orange hoodie, dark grey leggings, brown muddy boots",
        "age": "about 7",
    },
    5: {
        "skin": "light brown skin",
        "hair": "short curly brown hair",
        "outfit": "blue fleece jacket over white t-shirt, khaki trousers, brown walking boots",
        "age": "about 8",
    },
    6: {
        "skin": "East Asian features",
        "hair": "neat black bob haircut",
        "outfit": "teal cardigan over white blouse, dark blue pleated skirt, white socks, black shoes, woven sun hat",
        "age": "about 8",
    },
}

WORD_COUNT_LIMITS = {
    1: {"min": 40, "max": 80, "story_pages": 6, "words_per_page": (3, 5),
        "sentences_per_page": 1},
    2: {"min": 80, "max": 130, "story_pages": 8, "words_per_page": (8, 14),
        "sentences_per_page": 2},
    3: {"min": 130, "max": 200, "story_pages": 8, "words_per_page": (10, 27),
        "sentences_per_page": (2, 3)},
    4: {"min": 200, "max": 280, "story_pages": 8, "words_per_page": (21, 44),
        "sentences_per_page": (3, 4)},
    5: {"min": 280, "max": 380, "story_pages": 8, "words_per_page": (32, 65),
        "sentences_per_page": (4, 5)},
    6: {"min": 380, "max": 500, "story_pages": 8, "words_per_page": (50, 90),
        "sentences_per_page": (5, 6)},
}

SYSTEM_PROMPT = """You are the MyPhonicsBooks Production Agent — an expert AI assistant for creating decodable phonics books. You work alongside Lynden (the creator) to produce high-quality, phonically accurate, culturally authentic children's reading books. You understand the complete 9-step production pipeline and enforce all quality checkpoints.

CRITICAL CONSTRAINT
Every word in every story MUST be decodable at the given level OR be a listed tricky word for that level. NO EXCEPTIONS. This is the single most important rule in the entire system.

THE OPEN WINDOW VISION
Every book is an open window to a different contemporary culture. Show cultures as they ARE today, not as the West imagines them. Tradition is the seasoning, not the main dish. The baseline is modern, comfortable, dignified daily life.

Acid test: Could a child FROM this culture see themselves in this book?

9-STEP PRODUCTION PIPELINE

Step 0: Cultural Research (cultural-researcher skill)
- Research the target culture BEFORE writing anything
- Produce a Cultural Brief with verified details
- Stereotype check, internal consistency check, dignity check
- Show contemporary reality, not postcard stereotypes

Step 1: Story Writing (phonics-story-writer skill)
- Every word decodable or listed tricky word
- Clear emotional journey: problem > tension > satisfying resolution
- Dear Zoo-style engagement hooks: page-turn cliffhangers, curiosity gaps, repetition with variation
- "Want to know what happens next" feeling on every page
- BAD example: "I dig in the mud. I hit a thing. It is a shell." (flat)
- GOOD example: "I had no hat. I was sad. (turn) I got Dad's hat. It was BIG! (turn) It fell off. No! (turn) Then Nan got me THIS hat. It fit!" (emotional stakes, pattern, payoff)

Step 2: Story QA (book-assessor skill)
- Phonics decomposition on EVERY word
- Verify engagement hooks present
- Check narrative makes sense
- PASS/FAIL verdict

Step 2b: Character Selection (illustration-director skill)
- Select from character roster (one per level)
- Verify outfit suits story context + cultural brief

Step 3a: Object Identification
- Analyse story text for recurring objects
- Define exact visual description ONCE per object

Step 3b: Image Prompts (illustration-director skill)
- Create hero prompt + scene prompts
- Object descriptions IDENTICAL across ALL prompts
- Art style: whimsical children's book illustration, hand-drawn cartoon, soft watercolour textured backgrounds, clean black-outlined characters
- Character eyes: SMALL OVAL/ALMOND SHAPE, SOLID DARK COLOUR FILL. NO iris, NO pupils, NO highlights, NO eyelashes
- NO text, words, letters, or numbers in ANY image

Step 4: Image Generation (art-generator skill)
- Hero injection pipeline is MANDATORY
- Generate hero reference ONCE (text-to-image, neutral pose, full body)
- Remove background (transparent PNG)
- Upload hero reference
- Inject hero into EVERY scene
- Image specs: Cover 768x1024 (3:4 portrait), Story pages 1024x768 (4:3 landscape), PNG format

Step 5: Image QA
- VIEW every image file
- Verify character face/outfit/hair same in all pages
- Verify key objects same colour/style in all appearances
- Verify eyes are simple ovals with solid fill
- FAIL = regenerate specific images

Step 6: Book Assembly (book-template-designer skill)
- PDF generation: generate_book.py > Jinja2 > Playwright > A5 PDF
- Font: Andika (SIL International) — single-storey 'a' and 'g'
- Page size: A5 portrait (148mm x 210mm), zero margin, full bleed

Step 7: Final QA (book-assessor skill)
- ALL 9 checks
- Compare to ultimate template
- Final PASS/FAIL verdict

BOOK STRUCTURES

12-page ditty (L1 only): Cover, Guide, Sounds+Words, 6 story pages, Activity+Draw, Writing Practice, Back Cover

16-page standard (L2-L6): Cover, Guide, Combined Reference, 8 story pages, Combined Activity, Writing Practice, Nonsense Words, Certificate, Back Cover

WORD COUNT LIMITS
L1: 3-5 words/page, 1 sentence/page, 40-80 total, 6 story pages
L2: 8-14 words/page, 2 sentences/page, 80-130 total, 8 pages
L3: 10-27 words/page, 2-3 sentences/page, 130-200 total, 8 pages
L4: 21-44 words/page, 3-4 sentences/page, 200-280 total, 8 pages
L5: 32-65 words/page, 4-5 sentences/page, 280-380 total, 8 pages
L6: 50-90 words/page, 5-6 sentences/page, 380-500 total, 8 pages

CURRICULUM STATUS
L1: COMPLETE (10 books). L2: COMPLETE (5 books). L3: 3/5 complete (3.4 Seoul + 3.5 Trinidad remaining). L4: COMPLETE (4 books). L5: 2/4 complete (5.3 Jaipur + 5.4 Salvador remaining). L6: 0/4 (Cairo, Guilin, Amalfi, Blue Mountains planned).

PLANNED BOOKS (remaining)
L3.4: Seoul, South Korea. Focus: oi, aw. Theme: dealing with criticism / bouncing back.
L3.5: Port of Spain, Trinidad. Focus: ai, oa. Theme: patience / joy of reunion.
L5.3: Jaipur, India. Focus: ure, tion. Theme: managing frustration / following instructions.
L5.4: Salvador, Brazil. Focus: review all L5. Theme: belonging / feeling different.
L6.1: Cairo, Egypt. Focus: ous. Theme: celebrating the familiar. Non-fiction feature: labels/signs.
L6.2: Guilin, China. Focus: able, ible. Theme: kindness to strangers. Non-fiction feature: letter/note.
L6.3: Amalfi Coast, Italy. Focus: cious, tious. Theme: trying new things. Non-fiction feature: recipe list.
L6.4: Blue Mountains, Australia. Focus: review all L6. Theme: siblings / humility. Non-fiction feature: diary entry.

PERSONALISATION SCOPE
Books are UNIVERSAL TEMPLATES — no specific character names. Characters are "the girl", "the boy", "Mum", "Dad". Personalisation (child's name) is for marketing only.

BRITISH ENGLISH
colour, organised, mum, favourite, practise (verb), licence (noun). Always.

WHAT THE AGENT CAN DO
1. Write stories for any level following all phonics rules and engagement hooks
2. Validate whether words are decodable at a given level
3. Generate image prompts following the illustration style guide
4. Run QA checks on stories (phonics accuracy, word counts, engagement)
5. Produce Cultural Briefs for planned books
6. Manage the production pipeline step by step
7. Generate nonsense words for the Nonsense Words page
8. Write comprehension questions for activity pages
9. Create writing practice content
10. Help plan remaining books in the curriculum

RESPONSE STYLE
- Be precise and technical — Lynden knows what he's doing
- When writing stories, always decompose every word to prove decodability
- Flag any word that might not be decodable with a warning
- Use tables for structured data (word lists, QA results)
- Be proactive about quality: if something doesn't meet the standard, say so"""


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    current_book: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_history: list[ChatMessage]


class ValidateWordRequest(BaseModel):
    word: str
    level: int


class DecompositionResult(BaseModel):
    word: str
    level: int
    decodable: bool
    decomposition: str
    reason: str


# ============================================================================
# PHONICS DECOMPOSITION LOGIC
# ============================================================================

def decompose_word(word: str, level: int) -> DecompositionResult:
    """
    Decompose a word into phonemes and check if it is decodable at the given level.
    Returns DecompositionResult with detailed breakdown.
    """
    word_lower = word.lower().strip()

    # Check if it's a tricky word
    tricky_words = PHONICS_LEVELS[level]["tricky_words"]
    if word_lower in tricky_words:
        return DecompositionResult(
            word=word,
            level=level,
            decodable=True,
            decomposition=f"'{word}' is a tricky word at Level {level}",
            reason="Listed tricky word",
        )

    # Build the available graphemes for this level
    level_data = PHONICS_LEVELS[level]
    available_graphemes = set()

    # Single letter graphemes
    if "single" in level_data["graphemes"]:
        available_graphemes.update(level_data["graphemes"]["single"])

    # Digraphs
    if "digraphs" in level_data["graphemes"]:
        available_graphemes.update(level_data["graphemes"]["digraphs"])

    # Two-letter phonemes
    if "two_letter" in level_data["graphemes"]:
        available_graphemes.update(level_data["graphemes"]["two_letter"])

    # Alternative phonemes (split versions for decomposition)
    if "alternative_phonemes" in level_data["graphemes"]:
        available_graphemes.update(level_data["graphemes"]["alternative_phonemes"])

    # Digraph variants for initial position
    if "initial_clusters" in level_data["graphemes"]:
        available_graphemes.update(level_data["graphemes"]["initial_clusters"])

    # Greedy left-to-right decomposition
    decomposition_parts = []
    i = 0
    while i < len(word_lower):
        matched = False

        # Try 4-letter combinations first (scr, spl, spr, str)
        if i + 4 <= len(word_lower):
            four_letter = word_lower[i:i+4]
            if four_letter in available_graphemes:
                decomposition_parts.append(four_letter)
                i += 4
                matched = True

        # Try 3-letter combinations
        if not matched and i + 3 <= len(word_lower):
            three_letter = word_lower[i:i+3]
            if three_letter in available_graphemes:
                decomposition_parts.append(three_letter)
                i += 3
                matched = True

        # Try 2-letter combinations
        if not matched and i + 2 <= len(word_lower):
            two_letter = word_lower[i:i+2]
            if two_letter in available_graphemes:
                decomposition_parts.append(two_letter)
                i += 2
                matched = True

        # Single letter
        if not matched:
            single = word_lower[i]
            if single in available_graphemes:
                decomposition_parts.append(single)
                i += 1
                matched = True

        # If we couldn't match anything, the word is not decodable
        if not matched:
            return DecompositionResult(
                word=word,
                level=level,
                decodable=False,
                decomposition=" + ".join(decomposition_parts) if decomposition_parts else "ERROR",
                reason=f"Cannot decode '{word_lower[i]}' at position {i}. Available graphemes: {', '.join(sorted(available_graphemes))}",
            )

    # Successfully decomposed the entire word
    decomposition_str = " + ".join(decomposition_parts)
    return DecompositionResult(
        word=word,
        level=level,
        decodable=True,
        decomposition=decomposition_str,
        reason="All graphemes available at this level",
    )


# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="MyPhonicsBooks Production Agent",
    description="Anthropic-powered agent for creating decodable phonics books",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise Anthropic client
# Lazy client initialisation
_client = None

def get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _client


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "MyPhonicsBooks Production Agent",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint. Accepts a message and optional conversation history.
    Returns the agent's response and updated conversation history.
    """
    try:
        # Build the messages for the API call
        messages = []

        # Add previous conversation history
        for msg in request.conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content,
            })

        # Add the current user message
        messages.append({
            "role": "user",
            "content": request.message,
        })

        # Make the API call to Claude
        response = get_client().messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=messages,
        )

        # Extract the response text
        assistant_message = response.content[0].text

        # Build updated conversation history
        updated_history = request.conversation_history + [
            ChatMessage(role="user", content=request.message),
            ChatMessage(role="assistant", content=assistant_message),
        ]

        return ChatResponse(
            response=assistant_message,
            conversation_history=updated_history,
        )

    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.post("/validate-word", response_model=DecompositionResult)
async def validate_word(request: ValidateWordRequest):
    """
    Validate whether a word is decodable at a given phonics level.
    Returns phonetic decomposition and decodability verdict.
    """
    try:
        # Validate level
        if request.level not in PHONICS_LEVELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid level. Must be 1-6.",
            )

        # Decompose the word
        result = decompose_word(request.word, request.level)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating word: {str(e)}")


@app.get("/phonics-levels")
async def get_phonics_levels():
    """
    Return the complete phonics data for all levels.
    """
    return {
        "levels": PHONICS_LEVELS,
        "character_roster": CHARACTER_ROSTER,
        "word_count_limits": WORD_COUNT_LIMITS,
    }


@app.get("/character-roster")
async def get_character_roster():
    """
    Return the character roster for all levels.
    """
    return CHARACTER_ROSTER


@app.post("/validate-story")
async def validate_story(request: dict):
    """
    Validate a complete story for phonics accuracy, word counts, and engagement.
    Expects: {level: int, pages: [{text: str}, ...]}
    """
    try:
        level = request.get("level")
        pages = request.get("pages", [])

        if not level or level not in PHONICS_LEVELS:
            raise HTTPException(status_code=400, detail="Invalid level")

        if not pages:
            raise HTTPException(status_code=400, detail="No pages provided")

        # Validate each page
        qa_results = []
        all_words = []

        for page_idx, page in enumerate(pages):
            text = page.get("text", "").strip()
            if not text:
                qa_results.append({
                    "page": page_idx + 1,
                    "status": "error",
                    "message": "Empty page",
                })
                continue

            words = text.split()
            all_words.extend(words)

            page_result = {
                "page": page_idx + 1,
                "text": text,
                "word_count": len(words),
                "words": [],
            }

            # Validate each word
            all_decodable = True
            for word in words:
                decomp = decompose_word(word, level)
                page_result["words"].append({
                    "word": word,
                    "decodable": decomp.decodable,
                    "decomposition": decomp.decomposition,
                })
                if not decomp.decodable:
                    all_decodable = False

            page_result["status"] = "pass" if all_decodable else "fail"
            qa_results.append(page_result)

        # Check word count limits
        total_words = len(all_words)
        limits = WORD_COUNT_LIMITS[level]

        return {
            "level": level,
            "total_words": total_words,
            "limits": limits,
            "within_limits": limits["min"] <= total_words <= limits["max"],
            "pages": qa_results,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating story: {str(e)}")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        log_level="info",
    )
