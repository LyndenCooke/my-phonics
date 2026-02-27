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
from execution.user_db import (
    User, Child, Order, Book,
    create_user, get_user, get_user_by_email,
    create_child, get_child, get_children_for_user, update_child_level,
    create_order, get_order, get_books_for_order, get_books_for_child
)
from execution.utils.level_config import (
    get_level_config, get_all_level_configs, get_level_description,
    LEVEL_DESCRIPTIONS
)
from execution.utils.story_templates import (
    get_template_ids, get_all_template_metadata, match_interest_to_template
)
from execution.utils.word_bank import get_word_bank_stats
from execution.validate_word_bank import validate_story_text, quick_validate
from execution.process_order import (
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

BOOKS_DIR = Path(__file__).parent / "output" / "books"
BOOKS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/books", StaticFiles(directory=str(BOOKS_DIR)), name="books")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
