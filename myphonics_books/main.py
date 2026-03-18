"""
MyPhonicsBooks API Server

FastAPI backend for personalised phonics reading books.
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import execution modules
from core.user_db import (
    User, Child, Order, Book,
    create_user, get_user, get_user_by_email,
    create_child, get_child, get_children_for_user, update_child_level,
    create_order, get_order, get_books_for_order, get_books_for_child
)
from core.utils.level_config import (
    get_level_config, get_all_level_configs, get_level_description,
    LEVEL_DESCRIPTIONS
)
from core.utils.story_templates import (
    get_template_ids, get_all_template_metadata, match_interest_to_template
)
from core.utils.word_bank import get_word_bank_stats
from core.validate_word_bank import validate_story_text, quick_validate
from core.process_order import (
    create_single_book_order, create_level_pack_order, process_order
)
from generate_book import generate_book_pdf

# Create FastAPI app
app = FastAPI(
    title="MyPhonicsBooks API",
    description="Personalised phonics reading books for children",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Pydantic Models ==============

class UserCreate(BaseModel):
    email: EmailStr
    name: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str


class ChildCreate(BaseModel):
    name: str
    age: Optional[int] = None
    interests: Optional[List[str]] = None
    level: int = 1


class ChildResponse(BaseModel):
    id: int
    user_id: int
    name: str
    age: Optional[int]
    interests: Optional[List[str]]
    current_level: int


class LevelInfo(BaseModel):
    level: int
    name: str
    description: str
    colour_code: str


class TemplateInfo(BaseModel):
    id: str
    name: str
    core_arc: str
    emotional_beat: str


class BookOrderRequest(BaseModel):
    user_id: int
    child_id: int
    template_id: str
    level: int
    friend_name: Optional[str] = None
    location: Optional[str] = None


class LevelPackOrderRequest(BaseModel):
    user_id: int
    child_id: int
    level: int
    friend_name: Optional[str] = None
    location: Optional[str] = None


class OrderResponse(BaseModel):
    order_id: int
    status: str
    message: str


class ValidateTextRequest(BaseModel):
    text: str
    level: int


class ValidationResponse(BaseModel):
    valid: bool
    level: int
    total_words: int
    failed_words: List[str]


# ============== Routes ==============

@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "MyPhonicsBooks API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# ---------- User Routes ----------

@app.post("/users", response_model=UserResponse)
async def create_user_endpoint(user: UserCreate):
    """Create a new user account."""
    # Check if email already exists
    existing = get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = create_user(user.email, user.name)
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name
    )


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user_endpoint(user_id: int):
    """Get user by ID."""
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name
    )


# ---------- Child Routes ----------

@app.post("/users/{user_id}/children", response_model=ChildResponse)
async def create_child_endpoint(user_id: int, child: ChildCreate):
    """Create a child profile for a user."""
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_child = create_child(
        user_id=user_id,
        name=child.name,
        age=child.age,
        interests=child.interests,
        level=child.level
    )

    import json
    interests = None
    if new_child.interests:
        try:
            interests = json.loads(new_child.interests)
        except json.JSONDecodeError:
            interests = [new_child.interests]

    return ChildResponse(
        id=new_child.id,
        user_id=new_child.user_id,
        name=new_child.name,
        age=new_child.age,
        interests=interests,
        current_level=new_child.current_level
    )


@app.get("/users/{user_id}/children", response_model=List[ChildResponse])
async def get_children_endpoint(user_id: int):
    """Get all children for a user."""
    children = get_children_for_user(user_id)

    import json
    result = []
    for child in children:
        interests = None
        if child.interests:
            try:
                interests = json.loads(child.interests)
            except json.JSONDecodeError:
                interests = [child.interests]

        result.append(ChildResponse(
            id=child.id,
            user_id=child.user_id,
            name=child.name,
            age=child.age,
            interests=interests,
            current_level=child.current_level
        ))

    return result


@app.put("/children/{child_id}/level")
async def update_child_level_endpoint(child_id: int, level: int):
    """Update a child's reading level."""
    child = get_child(child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    if level < 1 or level > 6:
        raise HTTPException(status_code=400, detail="Level must be 1-6")

    update_child_level(child_id, level)
    return {"message": f"Level updated to {level}"}


# ---------- Level and Template Routes ----------

@app.get("/levels", response_model=List[LevelInfo])
async def get_levels():
    """Get all reading levels with descriptions."""
    configs = get_all_level_configs()
    result = []

    for level, config in configs.items():
        result.append(LevelInfo(
            level=level,
            name=config.name,
            description=LEVEL_DESCRIPTIONS[level],
            colour_code=config.colour_code
        ))

    return result


@app.get("/templates", response_model=List[TemplateInfo])
async def get_templates():
    """Get all available story templates."""
    metadata = get_all_template_metadata()
    return [
        TemplateInfo(
            id=tid,
            name=data["name"],
            core_arc=data["core_arc"],
            emotional_beat=data["emotional_beat"]
        )
        for tid, data in metadata.items()
    ]


@app.get("/templates/match/{interest}")
async def match_template(interest: str):
    """Get best-fit template for an interest."""
    template_id = match_interest_to_template(interest)
    return {"interest": interest, "template_id": template_id}


# ---------- Order Routes ----------

@app.post("/orders/single", response_model=OrderResponse)
async def create_single_order(
    request: BookOrderRequest,
    background_tasks: BackgroundTasks
):
    """Create an order for a single book."""
    # Validate template
    if request.template_id not in get_template_ids():
        raise HTTPException(status_code=400, detail="Invalid template ID")

    # Validate level
    if request.level < 1 or request.level > 6:
        raise HTTPException(status_code=400, detail="Level must be 1-6")

    # Create order
    try:
        order_id = create_single_book_order(
            user_id=request.user_id,
            child_id=request.child_id,
            template_id=request.template_id,
            level=request.level
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Process order in background
    background_tasks.add_task(
        process_order,
        order_id,
        request.friend_name,
        request.location
    )

    return OrderResponse(
        order_id=order_id,
        status="processing",
        message="Book generation started"
    )


@app.post("/orders/level-pack", response_model=OrderResponse)
async def create_level_pack_order_endpoint(
    request: LevelPackOrderRequest,
    background_tasks: BackgroundTasks
):
    """Create an order for a level pack (10 books)."""
    if request.level < 1 or request.level > 6:
        raise HTTPException(status_code=400, detail="Level must be 1-6")

    try:
        order_id = create_level_pack_order(
            user_id=request.user_id,
            child_id=request.child_id,
            level=request.level
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Process order in background
    background_tasks.add_task(
        process_order,
        order_id,
        request.friend_name,
        request.location
    )

    return OrderResponse(
        order_id=order_id,
        status="processing",
        message="Level pack generation started (10 books)"
    )


@app.get("/orders/{order_id}")
async def get_order_status(order_id: int):
    """Get order status and books."""
    order = get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    books = get_books_for_order(order_id)

    return {
        "order_id": order.id,
        "status": order.status,
        "order_type": order.order_type,
        "level": order.level,
        "books": [
            {
                "id": book.id,
                "title": book.title,
                "template_id": book.template_id,
                "status": book.status
            }
            for book in books
        ]
    }


# ---------- Validation Routes ----------

@app.post("/validate", response_model=ValidationResponse)
async def validate_text(request: ValidateTextRequest):
    """Validate text against the word bank for a level."""
    if request.level < 1 or request.level > 6:
        raise HTTPException(status_code=400, detail="Level must be 1-6")

    result = validate_story_text(request.text, request.level)

    return ValidationResponse(
        valid=result.valid,
        level=request.level,
        total_words=result.total_words,
        failed_words=[fw["word"] for fw in result.failed_words]
    )


@app.get("/word-bank/stats/{level}")
async def get_word_bank_statistics(level: int):
    """Get word bank statistics for a level."""
    if level < 1 or level > 6:
        raise HTTPException(status_code=400, detail="Level must be 1-6")

    return get_word_bank_stats(level)


# ---------- Children's Books ----------

@app.get("/children/{child_id}/books")
async def get_child_books(child_id: int):
    """Get all books generated for a child."""
    child = get_child(child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    books = get_books_for_child(child_id)

    return {
        "child_id": child_id,
        "child_name": child.name,
        "books": [
            {
                "id": book.id,
                "title": book.title,
                "template_id": book.template_id,
                "level": book.level,
                "status": book.status,
                "pdf_path": book.pdf_path
            }
            for book in books
        ]
    }


# ---------- Free Book Funnel ----------

class FreeBookRequest(BaseModel):
    child_name: str
    level: int
    email: EmailStr


# ============== Assessment Models ==============

class AssessmentStartRequest(BaseModel):
    """Start a new assessment session."""
    child_name: Optional[str] = None
    starting_level: Optional[int] = 1


class AssessmentAnswerRequest(BaseModel):
    """Submit an answer to an assessment question."""
    session_id: str
    question_id: str
    correct: bool


class AssessmentQuestion(BaseModel):
    """A question in the assessment."""
    id: str
    stage: str  # sound, word, nonsense, tricky
    level: int
    prompt: str  # The grapheme, word, or instruction
    audio_hint: Optional[str] = None


class AssessmentSessionResponse(BaseModel):
    """Current state of an assessment session."""
    session_id: str
    current_question: Optional[AssessmentQuestion]
    progress: dict
    is_complete: bool
    result_level: Optional[int] = None


@app.post("/api/free-book")
async def create_free_book(request: FreeBookRequest, background_tasks: BackgroundTasks):
    """Generate a free book PDF for lead capture.

    1. Validate input
    2. Save email + child data to SQLite
    3. Generate PDF in background
    4. Return download URL
    """
    # Validate level
    if request.level < 1 or request.level > 6:
        raise HTTPException(status_code=400, detail="Level must be 1-6")

    # Validate child name
    child_name = request.child_name.strip()
    if not child_name or len(child_name) > 50:
        raise HTTPException(status_code=400, detail="Please provide a valid name")

    # Create or find user
    existing_user = get_user_by_email(request.email)
    if existing_user:
        user = existing_user
    else:
        user = create_user(request.email, request.email.split("@")[0])

    # Create child profile
    child = create_child(
        user_id=user.id,
        name=child_name,
        age=None,
        interests=None,
        level=request.level
    )

    # Generate PDF (synchronous for MVP — fast enough with static content)
    import asyncio
    try:
        pdf_path = await generate_book_pdf(
            child_name=child_name,
            level=request.level,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Book generation failed: {str(e)}")

    # Return download URL (serve static file)
    filename = pdf_path.name
    download_url = f"/books/{filename}"

    return {
        "success": True,
        "download_url": download_url,
        "child_name": child_name,
        "level": request.level,
    }


# Serve generated books as static files
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json
import uuid
import random

BOOKS_DIR = Path(__file__).parent / "output" / "books"
BOOKS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/books", StaticFiles(directory=str(BOOKS_DIR)), name="books")


# ============== Assessment Routes ==============

# In-memory session store (use Redis in production)
assessment_sessions: dict = {}

# Load assessment data
GRAPHEMES_PATH = Path(__file__).parent / "data" / "graphemes_by_level.json"
TRICKY_WORDS_PATH = Path(__file__).parent / "data" / "tricky_words_by_level.json"
WORD_BANKS_DIR = Path(__file__).parent / "data" / "word_banks"

def load_json_file(path: Path) -> dict:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

# Load phonics data at startup
graphemes_data = load_json_file(GRAPHEMES_PATH)
tricky_words_data = load_json_file(TRICKY_WORDS_PATH)

def get_assessment_word_bank(level: int) -> list:
    """Load word bank for a level."""
    path = WORD_BANKS_DIR / f"level_{level}_words.json"
    if path.exists():
        data = load_json_file(path)
        return data.get("words", [])
    return []

def generate_nonsense_word(level: int) -> str:
    """Generate a pseudo-word for decoding practice."""
    level_key = f"level_{level}"
    graphemes = graphemes_data.get(level_key, graphemes_data.get("level_1", {}))
    all_graphemes = graphemes.get("cumulative_graphemes", graphemes.get("graphemes", []))

    consonants = [g for g in all_graphemes if g in "bcdfghjklmnpqrstvwxyz" and len(g) == 1]
    vowels = [g for g in all_graphemes if g in "aeiou"]

    if not consonants or not vowels:
        consonants = ["t", "p", "s", "m", "n"]
        vowels = ["a", "i", "o", "e", "u"]

    return random.choice(consonants) + random.choice(vowels) + random.choice(consonants)


class AssessmentSession:
    """Manages state for a single assessment."""

    def __init__(self, session_id: str, child_name: str = None, starting_level: int = 1):
        self.session_id = session_id
        self.child_name = child_name
        self.current_level = max(1, min(6, starting_level))  # Clamp to 1-6
        self.current_stage = "sound"  # sound → word → nonsense → tricky
        self.questions_in_group = 0
        self.correct_in_group = 0
        self.incorrect_in_level = 0  # Track failures at current level
        self.total_questions = 0
        self.total_correct = 0
        self.is_complete = False
        self.result_level = None
        self.current_question = None
        self.question_pool = []
        self._prepare_questions()

    def _prepare_questions(self):
        """Prepare question pool for current level and stage."""
        level_key = f"level_{self.current_level}"

        if self.current_stage == "sound":
            level_data = graphemes_data.get(level_key, {})
            graphemes = level_data.get("graphemes", level_data.get("cumulative_graphemes", []))[:20]
            self.question_pool = [{"type": "sound", "prompt": g} for g in graphemes]

        elif self.current_stage == "word":
            words = get_assessment_word_bank(self.current_level)[:30]
            random.shuffle(words)
            self.question_pool = [{"type": "word", "prompt": w} for w in words[:10]]

        elif self.current_stage == "nonsense":
            self.question_pool = [
                {"type": "nonsense", "prompt": generate_nonsense_word(self.current_level)}
                for _ in range(5)
            ]

        elif self.current_stage == "tricky":
            tricky = tricky_words_data.get(level_key, {}).get("new_tricky_words", [])[:10]
            self.question_pool = [{"type": "tricky", "prompt": w} for w in tricky]

        random.shuffle(self.question_pool)
        self.questions_in_group = 0
        self.correct_in_group = 0

    def get_next_question(self) -> Optional[dict]:
        """Get the next question or None if stage/level complete."""
        if self.is_complete:
            return None

        if self.questions_in_group >= 5:
            self._evaluate_progress()
            if self.is_complete:
                return None

        if not self.question_pool:
            self._advance_stage()
            if self.is_complete:
                return None

        if self.question_pool:
            q = self.question_pool.pop(0)
            self.current_question = {
                "id": f"{self.current_stage}_{self.current_level}_{self.total_questions}",
                "stage": self.current_stage,
                "level": self.current_level,
                "prompt": q["prompt"],
                "audio_hint": f"Can you read this {self.current_stage}?"
            }
            return self.current_question

        return None

    def record_answer(self, correct: bool):
        """Record an answer and update progress."""
        self.total_questions += 1
        self.questions_in_group += 1
        if correct:
            self.total_correct += 1
            self.correct_in_group += 1
        else:
            self.incorrect_in_level += 1
            # Stop at 3 failures in a level - this is their ceiling
            if self.incorrect_in_level >= 3:
                self._complete_assessment()

    def _evaluate_progress(self):
        """Evaluate progress after 5 questions."""
        if self.is_complete:
            return

        accuracy = self.correct_in_group / 5 if self.questions_in_group >= 5 else 0

        if accuracy >= 0.8:  # 4/5 or better - advance
            self._advance_stage()
        elif accuracy >= 0.4:  # 2-3/5 - borderline, try 3 more
            self.questions_in_group = 2
            self.correct_in_group = 0
        else:  # 0-1/5 - this is their ceiling
            self._complete_assessment()

    def _advance_stage(self):
        """Move to next stage or level."""
        if self.is_complete:
            return

        stages = ["sound", "word", "nonsense", "tricky"]
        current_idx = stages.index(self.current_stage)

        if current_idx < len(stages) - 1:
            self.current_stage = stages[current_idx + 1]
            self._prepare_questions()
        else:
            if self.current_level < 6:
                self.current_level += 1
                self.current_stage = "sound"
                self.incorrect_in_level = 0  # Reset failure count for new level
                self._prepare_questions()
            else:
                self._complete_assessment()

    def _complete_assessment(self):
        """Mark assessment as complete and set result."""
        self.is_complete = True
        self.result_level = self.current_level

    def get_progress(self) -> dict:
        """Get current progress summary."""
        return {
            "current_level": self.current_level,
            "current_stage": self.current_stage,
            "questions_answered": self.total_questions,
            "accuracy": self.total_correct / self.total_questions if self.total_questions > 0 else 0,
            "stage_progress": f"{self.questions_in_group}/5"
        }


@app.post("/api/assessment/start", response_model=AssessmentSessionResponse)
async def start_assessment(request: AssessmentStartRequest):
    """Start a new assessment session."""
    session_id = str(uuid.uuid4())
    starting_level = request.starting_level or 1
    session = AssessmentSession(session_id, request.child_name, starting_level)
    assessment_sessions[session_id] = session

    question = session.get_next_question()

    return AssessmentSessionResponse(
        session_id=session_id,
        current_question=AssessmentQuestion(**question) if question else None,
        progress=session.get_progress(),
        is_complete=session.is_complete,
        result_level=session.result_level
    )


@app.post("/api/assessment/answer", response_model=AssessmentSessionResponse)
async def submit_assessment_answer(request: AssessmentAnswerRequest):
    """Submit an answer and get the next question."""
    session = assessment_sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    session.record_answer(request.correct)
    question = session.get_next_question()

    return AssessmentSessionResponse(
        session_id=request.session_id,
        current_question=AssessmentQuestion(**question) if question else None,
        progress=session.get_progress(),
        is_complete=session.is_complete,
        result_level=session.result_level
    )


@app.get("/api/assessment/{session_id}/result")
async def get_assessment_result(session_id: str):
    """Get the final result of an assessment."""
    session = assessment_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    if not session.is_complete:
        raise HTTPException(status_code=400, detail="Assessment not yet complete")

    level_key = f"level_{session.result_level}"
    level_info = graphemes_data.get(level_key, {})

    return {
        "session_id": session_id,
        "result_level": session.result_level,
        "level_name": level_info.get("name", f"Level {session.result_level}"),
        "total_questions": session.total_questions,
        "total_correct": session.total_correct,
        "accuracy": session.total_correct / session.total_questions if session.total_questions > 0 else 0,
        "recommendation": f"We recommend starting with Level {session.result_level} books."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
