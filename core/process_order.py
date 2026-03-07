"""
Order processing orchestration for MyPhonicsBooks.

Coordinates the generation of personalised books:
1. Create book records in database
2. Generate story text
3. Validate against word bank
4. Generate comprehension questions
5. Generate worksheet content
6. (Later) Generate illustrations
7. (Later) Assemble PDF
8. (Later) Deliver to customer
"""

import json
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

from .user_db import (
    Order, Book, Child,
    get_order, get_child, get_books_for_order,
    create_book, update_book_story, update_book_status, update_order_status
)
from .generate_story_text import generate_story, StoryGenerationResult
from .generate_questions import generate_questions, QuestionsResult
from .generate_worksheet import generate_worksheet, get_word_lists, WorksheetResult
from .utils.story_templates import (
    get_template_ids, match_interest_to_template,
    get_lost_item_for_interest, get_default_location, get_random_weather
)


@dataclass
class BookGenerationResult:
    """Result of generating a single book."""
    success: bool
    book_id: int
    title: str
    story_pages: List[str]
    questions: List[Dict]
    worksheet: Dict
    word_lists: Dict
    error: Optional[str] = None


@dataclass
class OrderProcessingResult:
    """Result of processing a complete order."""
    success: bool
    order_id: int
    books: List[BookGenerationResult]
    error: Optional[str] = None


def build_personalisation(
    child: Child,
    template_id: str,
    friend_name: Optional[str] = None,
    location: Optional[str] = None
) -> Dict[str, str]:
    """
    Build personalisation dictionary for a book.

    Args:
        child: Child profile
        template_id: Story template being used
        friend_name: Optional friend/sibling name
        location: Optional location

    Returns:
        Personalisation dictionary
    """
    # Parse interests from JSON
    interests = []
    if child.interests:
        try:
            interests = json.loads(child.interests)
        except json.JSONDecodeError:
            interests = [child.interests]

    primary_interest = interests[0] if interests else "animals"

    # Build base personalisation
    personalisation = {
        "NAME": child.name,
        "FRIEND": friend_name or "Sam",
        "LOCATION": location or get_default_location(template_id),
        "WEATHER": get_random_weather(),
        "INTEREST": primary_interest
    }

    # Add template-specific personalisations
    if template_id == "lost_thing":
        item_data = get_lost_item_for_interest(primary_interest)
        personalisation["LOST_ITEM"] = item_data.get("LOST_ITEM", "special toy")
        personalisation["OWNER"] = "someone"
        personalisation["PLACE_1"] = "the bench"
        personalisation["PLACE_2"] = "the tree"
        personalisation["PERSON_1"] = friend_name or "a friend"

    elif template_id == "new_friend":
        personalisation["NEW_FRIEND"] = "Alex"
        personalisation["ACTIVITY"] = "play together"

    elif template_id == "pet_story":
        personalisation["PET_NAME"] = "Buddy"
        personalisation["PET_TYPE"] = "dog"
        personalisation["ACTIVITY"] = "run and play"

    elif template_id == "family_day":
        personalisation["FAMILY_MEMBER"] = "Mum"
        personalisation["DESTINATION"] = "the park"
        personalisation["ACTIVITY"] = "had a picnic"
        personalisation["MEMORY"] = "They saw a rainbow"

    return personalisation


def generate_book_title(
    template_id: str,
    personalisation: Dict[str, str]
) -> str:
    """Generate book title from template and personalisation."""
    name = personalisation.get("NAME", "Child")

    title_templates = {
        "adventure": f"{name}'s Big Adventure",
        "lost_thing": f"{name} and the Lost Thing",
        "new_friend": f"{name}'s New Friend",
        "big_day": f"{name}'s Special Day",
        "helper": f"{name} the Helper",
        "discovery": f"{name}'s Discovery",
        "pet_story": f"{name} and {personalisation.get('PET_NAME', 'the Pet')}",
        "sport_game": f"{name} Plays the Game",
        "weather_day": f"{name}'s Weather Day",
        "family_day": f"{name}'s Family Day Out"
    }

    return title_templates.get(template_id, f"{name}'s Story")


def process_single_book(
    book: Book,
    child: Child,
    friend_name: Optional[str] = None,
    location: Optional[str] = None
) -> BookGenerationResult:
    """
    Process a single book generation.

    Args:
        book: Book record from database
        child: Child profile
        friend_name: Optional friend name
        location: Optional location

    Returns:
        BookGenerationResult
    """
    try:
        # Update status to generating
        update_book_status(book.id, "generating")

        # Build personalisation
        personalisation = build_personalisation(
            child,
            book.template_id,
            friend_name,
            location
        )

        # Generate story text
        story_result = generate_story(
            template_id=book.template_id,
            personalisation=personalisation,
            level=book.level
        )

        if not story_result.success:
            update_book_status(book.id, "failed")
            return BookGenerationResult(
                success=False,
                book_id=book.id,
                title=book.title,
                story_pages=[],
                questions=[],
                worksheet={},
                word_lists={},
                error=story_result.error
            )

        # Save story text to database
        update_book_story(book.id, story_result.pages)

        # Generate questions
        questions_result = generate_questions(
            story_pages=story_result.pages,
            personalisation=personalisation,
            level=book.level,
            template_id=book.template_id
        )

        questions = []
        if questions_result.success:
            questions = [asdict(q) for q in questions_result.questions]

        # Generate worksheet
        worksheet_result = generate_worksheet(
            story_pages=story_result.pages,
            personalisation=personalisation,
            level=book.level
        )

        worksheet = {}
        if worksheet_result.success and worksheet_result.content:
            worksheet = asdict(worksheet_result.content)

        # Get word lists
        word_lists = get_word_lists(story_result.pages, book.level)

        # Update status to completed (will change when PDF is added)
        update_book_status(book.id, "completed")

        return BookGenerationResult(
            success=True,
            book_id=book.id,
            title=book.title,
            story_pages=story_result.pages,
            questions=questions,
            worksheet=worksheet,
            word_lists=word_lists
        )

    except Exception as e:
        update_book_status(book.id, "failed")
        return BookGenerationResult(
            success=False,
            book_id=book.id,
            title=book.title,
            story_pages=[],
            questions=[],
            worksheet={},
            word_lists={},
            error=str(e)
        )


def process_order(
    order_id: int,
    friend_name: Optional[str] = None,
    location: Optional[str] = None
) -> OrderProcessingResult:
    """
    Process a complete order.

    For single books, generates one book.
    For level packs, generates 10 books (all templates at one level).
    For full programme, generates 60 books (all templates at all levels).

    Args:
        order_id: Order ID to process
        friend_name: Optional friend name for personalisation
        location: Optional location for personalisation

    Returns:
        OrderProcessingResult
    """
    # Get order
    order = get_order(order_id)
    if not order:
        return OrderProcessingResult(
            success=False,
            order_id=order_id,
            books=[],
            error="Order not found"
        )

    # Get child
    child = get_child(order.child_id)
    if not child:
        return OrderProcessingResult(
            success=False,
            order_id=order_id,
            books=[],
            error="Child not found"
        )

    # Update order status
    update_order_status(order_id, "processing")

    # Get books for this order
    books = get_books_for_order(order_id)

    # Process each book
    results = []
    all_success = True

    for book in books:
        result = process_single_book(
            book=book,
            child=child,
            friend_name=friend_name,
            location=location
        )
        results.append(result)
        if not result.success:
            all_success = False

    # Update order status
    final_status = "completed" if all_success else "failed"
    update_order_status(order_id, final_status)

    return OrderProcessingResult(
        success=all_success,
        order_id=order_id,
        books=results
    )


def create_single_book_order(
    user_id: int,
    child_id: int,
    template_id: str,
    level: int
) -> int:
    """
    Create an order for a single book.

    Args:
        user_id: User ID
        child_id: Child ID
        template_id: Story template
        level: Reading level

    Returns:
        Order ID
    """
    from .user_db import create_order

    # Get child for title generation
    child = get_child(child_id)
    if not child:
        raise ValueError(f"Child not found: {child_id}")

    # Create order
    order = create_order(
        user_id=user_id,
        child_id=child_id,
        order_type="single",
        level=level,
        amount_pence=499  # GBP 4.99
    )

    # Build personalisation for title
    personalisation = build_personalisation(child, template_id)
    title = generate_book_title(template_id, personalisation)

    # Create book record
    create_book(
        order_id=order.id,
        child_id=child_id,
        template_id=template_id,
        level=level,
        title=title,
        personalisation=personalisation
    )

    return order.id


def create_level_pack_order(
    user_id: int,
    child_id: int,
    level: int
) -> int:
    """
    Create an order for a level pack (10 books at one level).

    Args:
        user_id: User ID
        child_id: Child ID
        level: Reading level

    Returns:
        Order ID
    """
    from .user_db import create_order

    child = get_child(child_id)
    if not child:
        raise ValueError(f"Child not found: {child_id}")

    # Create order
    order = create_order(
        user_id=user_id,
        child_id=child_id,
        order_type="level_pack",
        level=level,
        amount_pence=2499  # GBP 24.99
    )

    # Create book records for all 10 templates
    for template_id in get_template_ids():
        personalisation = build_personalisation(child, template_id)
        title = generate_book_title(template_id, personalisation)

        create_book(
            order_id=order.id,
            child_id=child_id,
            template_id=template_id,
            level=level,
            title=title,
            personalisation=personalisation
        )

    return order.id


if __name__ == "__main__":
    print("Order processing module loaded successfully.")
    print(f"Available templates: {get_template_ids()}")
