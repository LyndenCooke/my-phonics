"""
Story templates for MyPhonicsBooks.

Defines the 10 fixed story templates that form the backbone of the system.
Each template has 8 scenes with placeholders for personalisation.

Templates are moulds, not suggestions. The AI fills in the variables
and generates decodable text, but the structure is fixed.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass

# Base path for data files
DATA_DIR = Path(__file__).parent.parent.parent / "data"
TEMPLATES_DIR = DATA_DIR / "story_templates"


@dataclass
class Scene:
    """A single scene in a story template."""
    page: int
    scene_number: int
    outline: str
    illustration_brief: str
    emotional_tone: str


@dataclass
class StoryTemplate:
    """A complete story template with 8 scenes."""
    template_id: str
    template_name: str
    core_arc: str
    emotional_beat: str
    personalisation_slots: Dict[str, str]
    scenes: List[Scene]
    comprehension_questions: Dict[str, str]
    writing_worksheet: Dict[str, str]
    interest_mappings: Dict[str, Dict[str, str]]


# The 10 story templates - metadata
TEMPLATE_METADATA = {
    "adventure": {
        "name": "The Adventure",
        "core_arc": "Child goes somewhere new and discovers something exciting",
        "emotional_beat": "Courage and curiosity"
    },
    "lost_thing": {
        "name": "The Lost Thing",
        "core_arc": "Child finds and returns something to its owner",
        "emotional_beat": "Responsibility and kindness"
    },
    "new_friend": {
        "name": "The New Friend",
        "core_arc": "Child meets someone different and forms a friendship",
        "emotional_beat": "Acceptance and friendship"
    },
    "big_day": {
        "name": "The Big Day",
        "core_arc": "Birthday, first day, or special event",
        "emotional_beat": "Excitement and anticipation"
    },
    "helper": {
        "name": "The Helper",
        "core_arc": "Child solves a problem for someone else",
        "emotional_beat": "Empathy and resourcefulness"
    },
    "discovery": {
        "name": "The Discovery",
        "core_arc": "Child finds a secret or hidden place",
        "emotional_beat": "Wonder and imagination"
    },
    "pet_story": {
        "name": "The Pet Story",
        "core_arc": "Child and animal companion share an experience",
        "emotional_beat": "Care and companionship"
    },
    "sport_game": {
        "name": "The Sport/Game",
        "core_arc": "Child participates in a competition or team activity",
        "emotional_beat": "Perseverance and teamwork"
    },
    "weather_day": {
        "name": "The Weather Day",
        "core_arc": "Rain, snow, or sunshine changes the day's plans",
        "emotional_beat": "Adaptability and fun"
    },
    "family_day": {
        "name": "The Family Day",
        "core_arc": "Trip or outing with family members",
        "emotional_beat": "Belonging and togetherness"
    }
}


def load_template(template_id: str) -> Optional[StoryTemplate]:
    """
    Load a story template from JSON file.

    Args:
        template_id: Template identifier (e.g., "lost_thing")

    Returns:
        StoryTemplate object or None if not found
    """
    template_file = TEMPLATES_DIR / f"{template_id}.json"

    if not template_file.exists():
        return None

    with open(template_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    scenes = [
        Scene(
            page=s["page"],
            scene_number=s["scene_number"],
            outline=s["outline"],
            illustration_brief=s["illustration_brief"],
            emotional_tone=s["emotional_tone"]
        )
        for s in data["scenes"]
    ]

    return StoryTemplate(
        template_id=data["template_id"],
        template_name=data["template_name"],
        core_arc=data["core_arc"],
        emotional_beat=data["emotional_beat"],
        personalisation_slots=data["personalisation_slots"],
        scenes=scenes,
        comprehension_questions=data["comprehension_questions"],
        writing_worksheet=data["writing_worksheet"],
        interest_mappings=data["interest_mappings"]
    )


def get_template_ids() -> List[str]:
    """Get list of all template IDs."""
    return list(TEMPLATE_METADATA.keys())


def get_template_metadata(template_id: str) -> Optional[Dict]:
    """Get metadata for a template without loading full data."""
    return TEMPLATE_METADATA.get(template_id)


def get_all_template_metadata() -> Dict[str, Dict]:
    """Get metadata for all templates."""
    return TEMPLATE_METADATA


def match_interest_to_template(interest: str) -> str:
    """
    Match a child's interest to the best-fit story template.

    Args:
        interest: Interest keyword (e.g., "dinosaurs", "space")

    Returns:
        Template ID that best matches the interest
    """
    # Interest to template mapping
    INTEREST_TEMPLATE_MAP = {
        "dinosaurs": "discovery",
        "space": "adventure",
        "unicorns": "new_friend",
        "football": "sport_game",
        "animals": "pet_story",
        "baking": "helper",
        "nature": "discovery",
        "vehicles": "adventure",
        "music": "big_day",
        "art": "discovery"
    }

    return INTEREST_TEMPLATE_MAP.get(interest.lower(), "adventure")


def get_lost_item_for_interest(interest: str) -> Dict[str, str]:
    """
    Get the lost item details for a given interest.

    Used for "The Lost Thing" template personalisation.

    Args:
        interest: Interest keyword

    Returns:
        Dict with LOST_ITEM and flavour_detail
    """
    # Load from lost_thing.json if available
    template = load_template("lost_thing")
    if template and interest.lower() in template.interest_mappings:
        return template.interest_mappings[interest.lower()]

    # Default mappings
    DEFAULT_MAPPINGS = {
        "dinosaurs": {
            "LOST_ITEM": "toy dinosaur",
            "flavour_detail": "The dinosaur had a long tail and big teeth."
        },
        "space": {
            "LOST_ITEM": "shiny rocket toy",
            "flavour_detail": "The rocket had stars on the side."
        },
        "unicorns": {
            "LOST_ITEM": "soft unicorn toy",
            "flavour_detail": "The unicorn was pink with a silver horn."
        },
        "football": {
            "LOST_ITEM": "red football boot",
            "flavour_detail": "The boot was red with white stripes."
        },
        "animals": {
            "LOST_ITEM": "small stuffed rabbit",
            "flavour_detail": "The rabbit had long floppy ears."
        },
        "baking": {
            "LOST_ITEM": "little baking book",
            "flavour_detail": "The book had a cake on the front."
        },
        "nature": {
            "LOST_ITEM": "bug jar with a lid",
            "flavour_detail": "The jar had holes in the lid for air."
        },
        "vehicles": {
            "LOST_ITEM": "blue toy car",
            "flavour_detail": "The car had four black wheels."
        },
        "music": {
            "LOST_ITEM": "small drum",
            "flavour_detail": "The drum had a red top and a stick."
        },
        "art": {
            "LOST_ITEM": "set of crayons",
            "flavour_detail": "The crayons were all the colours of the rainbow."
        }
    }

    return DEFAULT_MAPPINGS.get(interest.lower(), {
        "LOST_ITEM": "special toy",
        "flavour_detail": "The toy was very special."
    })


def fill_template_placeholders(
    template: StoryTemplate,
    personalisation: Dict[str, str]
) -> List[str]:
    """
    Fill template scene outlines with personalisation variables.

    Args:
        template: The story template
        personalisation: Dict of placeholder values (NAME, FRIEND, LOCATION, etc.)

    Returns:
        List of filled scene outlines (8 strings)
    """
    filled_scenes = []

    for scene in template.scenes:
        outline = scene.outline

        # Replace all placeholders
        for key, value in personalisation.items():
            placeholder = f"[{key}]"
            outline = outline.replace(placeholder, value)

        filled_scenes.append(outline)

    return filled_scenes


# Default locations for each template
DEFAULT_LOCATIONS = {
    "adventure": "the park",
    "lost_thing": "the park",
    "new_friend": "school",
    "big_day": "home",
    "helper": "the garden",
    "discovery": "the woods",
    "pet_story": "home",
    "sport_game": "the field",
    "weather_day": "the garden",
    "family_day": "the beach"
}


def get_default_location(template_id: str) -> str:
    """Get default location for a template if parent doesn't specify."""
    return DEFAULT_LOCATIONS.get(template_id, "the park")


# Weather options
WEATHER_OPTIONS = ["sunny", "warm", "bright", "cool", "fresh"]


def get_random_weather() -> str:
    """Get a random weather word suitable for all levels."""
    import random
    return random.choice(WEATHER_OPTIONS)
