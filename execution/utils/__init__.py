"""
Utility modules for MyPhonicsBooks execution layer.
"""

from .level_config import (
    LevelConfig,
    get_level_config,
    get_all_level_configs,
    get_tricky_words,
    get_level_description,
    get_worksheet_config,
    LEVEL_DESCRIPTIONS,
    WORKSHEET_CONFIG
)

from .word_bank import (
    load_word_bank,
    load_tricky_words,
    get_permitted_words,
    is_word_permitted,
    get_word_status,
    find_level_for_word,
    get_word_bank_stats
)

from .tricky_words import (
    get_new_tricky_words,
    get_cumulative_tricky_words,
    is_tricky_word,
    get_tricky_words_for_story
)

from .story_templates import (
    StoryTemplate,
    Scene,
    load_template,
    get_template_ids,
    get_template_metadata,
    get_all_template_metadata,
    match_interest_to_template,
    get_lost_item_for_interest,
    fill_template_placeholders,
    get_default_location,
    get_random_weather
)

from .api_clients import (
    get_anthropic_client,
    get_openai_client,
    get_stripe_client,
    get_resend_client,
    get_image_engine,
    get_storage_backend,
    get_max_validation_retries
)

__all__ = [
    # Level config
    "LevelConfig",
    "get_level_config",
    "get_all_level_configs",
    "get_tricky_words",
    "get_level_description",
    "get_worksheet_config",
    "LEVEL_DESCRIPTIONS",
    "WORKSHEET_CONFIG",
    # Word bank
    "load_word_bank",
    "load_tricky_words",
    "get_permitted_words",
    "is_word_permitted",
    "get_word_status",
    "find_level_for_word",
    "get_word_bank_stats",
    # Tricky words
    "get_new_tricky_words",
    "get_cumulative_tricky_words",
    "is_tricky_word",
    "get_tricky_words_for_story",
    # Story templates
    "StoryTemplate",
    "Scene",
    "load_template",
    "get_template_ids",
    "get_template_metadata",
    "get_all_template_metadata",
    "match_interest_to_template",
    "get_lost_item_for_interest",
    "fill_template_placeholders",
    "get_default_location",
    "get_random_weather",
    # API clients
    "get_anthropic_client",
    "get_openai_client",
    "get_stripe_client",
    "get_resend_client",
    "get_image_engine",
    "get_storage_backend",
    "get_max_validation_retries"
]
