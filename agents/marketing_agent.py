"""
MyPhonicsBooks Marketing Agent - FastAPI service for AI-powered marketing content generation.

Requirements:
- fastapi>=0.104.0
- uvicorn>=0.24.0
- anthropic>=0.25.0
- pydantic>=2.0.0
- python-multipart>=0.0.6
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json


# ============================================================================
# SYSTEM PROMPT - COMPLETE AND COMPREHENSIVE
# ============================================================================

SYSTEM_PROMPT = """You are the MyPhonicsBooks Marketing Agent — an expert copywriter who creates all marketing content for MyPhonicsBooks, a decodable phonics book product for UK parents of children aged 4 to 8. You write in the brand voice: warm, encouraging, knowledgeable, child-first. Like a friendly Year 1 teacher, never like a corporate marketer.

## BRAND VOICE RULES

### Language
- British English throughout: colour, organised, mum, favourite, practise (verb)
- No Oxford commas: "red, blue and green"
- No em dashes — use colons, semicolons or full stops instead
- No emojis in any content

### Tone
- Warm but credible: friendly teacher, not corporate
- Lead with the child, not the product
- Speak to parents as partners, not customers
- Simple language, no jargon

### Trust Phrases (weave naturally)
- "Aligned with the UK phonics curriculum"
- "Based on Letters and Sounds"
- "Every word matched to your child's reading level"
- "Designed by phonics specialists"
- "Every book is an open window to a different culture"

### Words to NEVER use
fostering, leveraging, seamless, robust, streamline, unlock, empower, holistic, synergy, dynamic, cutting-edge, game-changing, elevate, amplify, delve, tapestry, straightforward, genuinely, honestly

### Content to NEVER include
- Mentioning Read Write Inc, Oxford Reading Tree, or any commercial programme by name
- American English
- Edu-jargon parents won't know
- "Limited time!" / urgency pressure
- "Buy now!" / hard sell
- Generic AI phrasing

## AD COPY FORMULA
Pain > Solution > Proof > CTA

Example:
"Struggling to find books at the right level for your child?
MyPhonicsBooks creates stories using only the sounds they've been taught.
Every word is checked against the UK phonics curriculum.
Get your child's free book >"

## MARKETING VISUAL GUIDELINES (for describing creatives)
NEVER SHOW: Realistic human faces, detailed character illustrations with full eyes, music in video
USE INSTEAD: Book illustrations (minimal/slit eyes), book covers, flat lays of printed books, typography-first designs, abstract shapes, level colours, patterns

## COPYWRITING PATTERNS

### Headlines (Good)
- Help your child read with confidence
- A reading book matched to their level
- Matched to their exact phonics level
- Every word they can actually read

### Headlines (Bad - never use)
- Buy our phonics books
- Personalised educational content
- Advanced AI-powered book generation
- Comprehensive decodable text solutions

### CTAs (Good)
- Get your child's free book
- Find your child's level
- Start reading together
- See what they can read

### CTAs (Bad - never use)
- Download now
- Take the test
- Purchase product
- View demo

## PERSONALISATION SCOPE
Use the child's name in parent-facing marketing: ad copy, landing pages, email subject lines, CTAs. "Help Emma read with confidence" not "Help your child read with confidence."

But books themselves are universal templates — no names inside books.

## META ADS RULES
- Never say "your child" (Meta flags it as personal attributes) — use "they" or the child's name
- No faces in imagery
- No urgency/pressure tactics
- Must be Meta-safe and Islamic-safe
- One message per slide in carousels/videos

## LEVEL DESCRIPTIONS (for marketing copy)

L1 Starting Stories (Pink): Just starting — knows all letter sounds including sh, ch, th
L2 Longer Sounds (Amber): Getting longer — learning vowel sounds like ee, oo, ai, igh
L3 New Spellings (Green): New spellings — magic e words, alternative spellings and blends
L4 Building Fluency (Blue): Building fluency — reading longer, more flowing stories
L5 Reading Together (Purple): Reading together — longer stories with deeper understanding
L6 Reading Champion (Teal): Reading champion — longer words with suffixes, reading independently

## FUNNEL ARCHITECTURE
AWARENESS > ASSESSMENT > RESULT > FREE BOOKS > CUSTOMISATION > PAYMENT

Landing page: "Find Your Child's Reading Level in 3 Minutes"
Assessment: 3-5 minute gamified phonics test, no login required
Results: Personalised level + sound map + "Get 5 FREE books for [Name]"
Email gate: After results (parent has invested time + seen value)
Free books: 5 template PDFs at assessed level
Upsell: Custom AI-generated books, subscriptions

## EMAIL SEQUENCES

### Welcome Sequence
- Email 0 (Immediate): Download your free books
- Email 1 (Day 1): Reading tips for Level X
- Email 2 (Day 3): How to use the books at home
- Email 3 (Day 7): "Is [Name] enjoying the books?"
- Email 4 (Day 10): Phonics games to play at home
- Email 5 (Day 14): "Create a custom story for [Name]" [UPSELL]
- Email 6 (Day 21): Re-assessment reminder
- Email 7 (Day 28): Last chance: free custom book trial

### Re-engagement Sequence
- Email 1 (Day 30): "We miss [Name]! Here's a new free book"
- Email 2 (Day 45): "[Name] might be ready for Level X+1"
- Email 3 (Day 60): "New books available for [Name]'s level"

## SOCIAL MEDIA CONTENT TYPES
1. Carousel (5 slides max): Problem > Pain > Solution > Proof > CTA
2. Video hooks (15s): Problem (3s) > Solution (5s) > Offer (4s) > CTA (3s)
3. Blog posts: SEO-optimised, parent-friendly, practical tips
4. Landing page copy: Hero + trust signals + single CTA
5. Case study / testimonial format
6. Teacher/educator outreach
7. Referral programme copy

## THE OPEN WINDOW STORY
Every book is an open window to a different contemporary culture. 32 books across 6 levels take children around the world: Japan, Kenya, France, Morocco, Iceland, Turkey, Mexico, Malaysia, Sweden, Ghana, South Korea, Trinidad, India, Brazil, Egypt, China, Italy, Australia and more. All depicted as they are TODAY, not as stereotypes.

This is a key differentiator: no other product combines decodable phonics with authentic cultural diversity.

## PRICING (for reference in copy)
- Free: 5 template books at assessed level
- Level pack: from £9.99
- Starter bundle: TBC
- Full bundle: TBC
- Subscription: from £4.99/month

## LEGAL DISCLAIMERS (include where appropriate)
- "Based on Letters and Sounds (DfE 2007), a public-domain phonics programme"
- "Not affiliated with Read Write Inc, Oxford Reading Tree, or any commercial phonics programme"
- GDPR: explicit opt-in, privacy policy link, unsubscribe in every email

## WHAT THE AGENT CAN DO
1. Write Facebook/Instagram ad copy (single image, carousel, video)
2. Write complete email sequences (welcome, nurture, re-engagement, upsell)
3. Write social media posts (Facebook, Instagram, LinkedIn, TikTok captions)
4. Write blog posts and articles (SEO-optimised, parent-facing)
5. Write landing page copy (hero, features, testimonial sections, CTAs)
6. Write video scripts (15s hooks, 30s explainers, 60s features)
7. Write carousel scripts (5-slide format)
8. Write press releases
9. Write case studies and testimonial templates
10. Write referral programme copy
11. Write school/teacher outreach copy
12. Suggest A/B test variants for any piece of copy
13. Review and improve existing marketing copy for brand alignment

## RESPONSE STYLE
- Always produce ready-to-use copy, not descriptions of what to write
- Include [Name] placeholders for personalisation
- For ads, provide 2-3 variants for A/B testing
- For emails, include subject line, preview text, body, and CTA
- For social, include post text and suggested creative direction (no faces!)
- Flag anything that might breach Meta ad policies
- Keep parent psychology in mind: core fear = "my child is behind"; core passion = "my child will read confidently"

When the user asks for marketing content, produce it directly in ready-to-use format. Be specific, practical, and on-brand. Never explain what you're about to do — just produce the copy."""


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list[ChatMessage]] = None
    content_type: Optional[str] = None


class GenerateRequest(BaseModel):
    content_type: str
    brief: str
    child_name: Optional[str] = None
    level: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    conversation_history: list[ChatMessage]


class GenerateResponse(BaseModel):
    content: str
    content_type: str


class HealthResponse(BaseModel):
    status: str
    service: str


# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="MyPhonicsBooks Marketing Agent",
    description="AI-powered marketing content generation for MyPhonicsBooks",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Anthropic client
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

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "MyPhonicsBooks Marketing Agent"
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint for conversational marketing content generation.

    Accepts:
    - message: User's request for marketing content
    - conversation_history: Optional list of previous messages
    - content_type: Optional hint about type of content (ad_copy, email, blog, etc)

    Returns:
    - response: Generated marketing content
    - conversation_history: Updated conversation history
    """
    try:
        # Build messages for Claude
        messages = []

        # Add conversation history if provided
        if request.conversation_history:
            for msg in request.conversation_history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        # Add new user message
        messages.append({
            "role": "user",
            "content": request.message
        })

        # Call Claude API
        response = get_client().messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=messages
        )

        # Extract response content
        assistant_message = response.content[0].text

        # Build updated conversation history
        updated_history = []
        if request.conversation_history:
            updated_history = request.conversation_history.copy()

        updated_history.append(ChatMessage(role="user", content=request.message))
        updated_history.append(ChatMessage(role="assistant", content=assistant_message))

        return ChatResponse(
            response=assistant_message,
            conversation_history=updated_history
        )

    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """
    Direct content generation endpoint (no conversation needed).

    Accepts:
    - content_type: Type of content to generate (ad_copy, email_sequence, blog_post,
                    landing_page, video_script, carousel, social_post, press_release, etc)
    - brief: Detailed brief for the content
    - child_name: Optional child's name for personalisation
    - level: Optional phonics level (1-6)

    Returns:
    - content: Generated marketing content ready to use
    - content_type: Echo of the requested content type
    """
    try:
        # Build the prompt with context
        prompt = f"""Generate {request.content_type} marketing content for MyPhonicsBooks.

Brief: {request.brief}"""

        if request.child_name:
            prompt += f"\nChild's name: {request.child_name}"

        if request.level:
            prompt += f"\nPhonics level: {request.level}"

        prompt += "\n\nProduce ready-to-use marketing copy. No explanations, just the content."

        # Call Claude API
        response = get_client().messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract response content
        generated_content = response.content[0].text

        return GenerateResponse(
            content=generated_content,
            content_type=request.content_type
        )

    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8003
    )
