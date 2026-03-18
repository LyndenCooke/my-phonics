"""
User database for MyPhonicsBooks.

MVP implementation using SQLite.
Production will migrate to Supabase.

Tables:
- users: User accounts
- children: Child profiles (linked to users)
- orders: Book orders
- books: Generated books
"""

import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from contextlib import contextmanager

# Database location
DB_DIR = Path(__file__).parent.parent / "db"
DB_PATH = DB_DIR / "myphonicsbooks.db"


@dataclass
class User:
    """User account."""
    id: Optional[int] = None
    email: str = ""
    name: str = ""
    created_at: Optional[str] = None


@dataclass
class Child:
    """Child profile."""
    id: Optional[int] = None
    user_id: int = 0
    name: str = ""
    age: Optional[int] = None
    interests: Optional[str] = None  # JSON array
    current_level: int = 1
    created_at: Optional[str] = None


@dataclass
class Order:
    """Book order."""
    id: Optional[int] = None
    user_id: int = 0
    child_id: int = 0
    order_type: str = "single"  # single, level_pack, full_programme
    level: int = 1
    status: str = "pending"  # pending, processing, completed, failed
    stripe_payment_id: Optional[str] = None
    amount_pence: int = 0
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


@dataclass
class Book:
    """Generated book."""
    id: Optional[int] = None
    order_id: int = 0
    child_id: int = 0
    template_id: str = ""
    level: int = 1
    title: str = ""
    personalisation: Optional[str] = None  # JSON object
    story_text: Optional[str] = None  # JSON array of pages
    pdf_path: Optional[str] = None
    status: str = "pending"  # pending, generating, completed, failed
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


@contextmanager
def get_connection():
    """Get database connection with automatic cleanup."""
    # Ensure database directory exists
    DB_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database():
    """Initialise the database schema."""
    with get_connection() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Children table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS children (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                age INTEGER,
                interests TEXT,
                current_level INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                child_id INTEGER NOT NULL,
                order_type TEXT DEFAULT 'single',
                level INTEGER DEFAULT 1,
                status TEXT DEFAULT 'pending',
                stripe_payment_id TEXT,
                amount_pence INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (child_id) REFERENCES children(id)
            )
        """)

        # Books table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                child_id INTEGER NOT NULL,
                template_id TEXT NOT NULL,
                level INTEGER NOT NULL,
                title TEXT,
                personalisation TEXT,
                story_text TEXT,
                pdf_path TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (child_id) REFERENCES children(id)
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_children_user ON children(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_books_order ON books(order_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_books_child ON books(child_id)")


# User operations
def create_user(email: str, name: str) -> User:
    """Create a new user."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, name) VALUES (?, ?)",
            (email, name)
        )
        user_id = cursor.lastrowid

    return get_user(user_id)


def get_user(user_id: int) -> Optional[User]:
    """Get user by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()

    if row:
        return User(
            id=row["id"],
            email=row["email"],
            name=row["name"],
            created_at=row["created_at"]
        )
    return None


def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()

    if row:
        return User(
            id=row["id"],
            email=row["email"],
            name=row["name"],
            created_at=row["created_at"]
        )
    return None


# Child operations
def create_child(
    user_id: int,
    name: str,
    age: Optional[int] = None,
    interests: Optional[List[str]] = None,
    level: int = 1
) -> Child:
    """Create a new child profile."""
    interests_json = json.dumps(interests) if interests else None

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO children (user_id, name, age, interests, current_level)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, name, age, interests_json, level)
        )
        child_id = cursor.lastrowid

    return get_child(child_id)


def get_child(child_id: int) -> Optional[Child]:
    """Get child by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM children WHERE id = ?", (child_id,))
        row = cursor.fetchone()

    if row:
        return Child(
            id=row["id"],
            user_id=row["user_id"],
            name=row["name"],
            age=row["age"],
            interests=row["interests"],
            current_level=row["current_level"],
            created_at=row["created_at"]
        )
    return None


def get_children_for_user(user_id: int) -> List[Child]:
    """Get all children for a user."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM children WHERE user_id = ?", (user_id,))
        rows = cursor.fetchall()

    return [
        Child(
            id=row["id"],
            user_id=row["user_id"],
            name=row["name"],
            age=row["age"],
            interests=row["interests"],
            current_level=row["current_level"],
            created_at=row["created_at"]
        )
        for row in rows
    ]


def update_child_level(child_id: int, level: int) -> None:
    """Update a child's reading level."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE children SET current_level = ? WHERE id = ?",
            (level, child_id)
        )


# Order operations
def create_order(
    user_id: int,
    child_id: int,
    order_type: str,
    level: int,
    amount_pence: int
) -> Order:
    """Create a new order."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO orders (user_id, child_id, order_type, level, amount_pence)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, child_id, order_type, level, amount_pence)
        )
        order_id = cursor.lastrowid

    return get_order(order_id)


def get_order(order_id: int) -> Optional[Order]:
    """Get order by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
        row = cursor.fetchone()

    if row:
        return Order(
            id=row["id"],
            user_id=row["user_id"],
            child_id=row["child_id"],
            order_type=row["order_type"],
            level=row["level"],
            status=row["status"],
            stripe_payment_id=row["stripe_payment_id"],
            amount_pence=row["amount_pence"],
            created_at=row["created_at"],
            completed_at=row["completed_at"]
        )
    return None


def update_order_status(order_id: int, status: str) -> None:
    """Update order status."""
    completed_at = datetime.utcnow().isoformat() if status == "completed" else None

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET status = ?, completed_at = ? WHERE id = ?",
            (status, completed_at, order_id)
        )


def update_order_payment(order_id: int, stripe_payment_id: str) -> None:
    """Update order with Stripe payment ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET stripe_payment_id = ? WHERE id = ?",
            (stripe_payment_id, order_id)
        )


# Book operations
def create_book(
    order_id: int,
    child_id: int,
    template_id: str,
    level: int,
    title: str,
    personalisation: Dict
) -> Book:
    """Create a new book record."""
    personalisation_json = json.dumps(personalisation)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO books (order_id, child_id, template_id, level, title, personalisation)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (order_id, child_id, template_id, level, title, personalisation_json)
        )
        book_id = cursor.lastrowid

    return get_book(book_id)


def get_book(book_id: int) -> Optional[Book]:
    """Get book by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
        row = cursor.fetchone()

    if row:
        return Book(
            id=row["id"],
            order_id=row["order_id"],
            child_id=row["child_id"],
            template_id=row["template_id"],
            level=row["level"],
            title=row["title"],
            personalisation=row["personalisation"],
            story_text=row["story_text"],
            pdf_path=row["pdf_path"],
            status=row["status"],
            created_at=row["created_at"],
            completed_at=row["completed_at"]
        )
    return None


def get_books_for_order(order_id: int) -> List[Book]:
    """Get all books for an order."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books WHERE order_id = ?", (order_id,))
        rows = cursor.fetchall()

    return [
        Book(
            id=row["id"],
            order_id=row["order_id"],
            child_id=row["child_id"],
            template_id=row["template_id"],
            level=row["level"],
            title=row["title"],
            personalisation=row["personalisation"],
            story_text=row["story_text"],
            pdf_path=row["pdf_path"],
            status=row["status"],
            created_at=row["created_at"],
            completed_at=row["completed_at"]
        )
        for row in rows
    ]


def get_books_for_child(child_id: int) -> List[Book]:
    """Get all books for a child."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books WHERE child_id = ?", (child_id,))
        rows = cursor.fetchall()

    return [
        Book(
            id=row["id"],
            order_id=row["order_id"],
            child_id=row["child_id"],
            template_id=row["template_id"],
            level=row["level"],
            title=row["title"],
            personalisation=row["personalisation"],
            story_text=row["story_text"],
            pdf_path=row["pdf_path"],
            status=row["status"],
            created_at=row["created_at"],
            completed_at=row["completed_at"]
        )
        for row in rows
    ]


def update_book_story(book_id: int, story_text: List[str]) -> None:
    """Update book with generated story text."""
    story_json = json.dumps(story_text)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE books SET story_text = ? WHERE id = ?",
            (story_json, book_id)
        )


def update_book_pdf(book_id: int, pdf_path: str) -> None:
    """Update book with PDF path."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE books SET pdf_path = ? WHERE id = ?",
            (pdf_path, book_id)
        )


def update_book_status(book_id: int, status: str) -> None:
    """Update book status."""
    completed_at = datetime.utcnow().isoformat() if status == "completed" else None

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE books SET status = ?, completed_at = ? WHERE id = ?",
            (status, completed_at, book_id)
        )


# Initialise database on module import
init_database()
