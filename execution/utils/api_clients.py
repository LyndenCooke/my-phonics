"""
API client initialization for MyPhonicsBooks.

Centralised setup for all external APIs:
- Anthropic (Claude) for text generation
- OpenAI (DALL-E) for image generation
- Stripe for payments
- Resend for email
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_anthropic_client():
    """Get Anthropic client for Claude API."""
    try:
        from anthropic import Anthropic
    except ImportError:
        raise ImportError("anthropic package not installed. Run: pip install anthropic")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    return Anthropic(api_key=api_key)


def get_openai_client():
    """Get OpenAI client for DALL-E API."""
    try:
        from openai import OpenAI
    except ImportError:
        raise ImportError("openai package not installed. Run: pip install openai")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    return OpenAI(api_key=api_key)


def get_stripe_client():
    """Get Stripe client for payments."""
    try:
        import stripe
    except ImportError:
        raise ImportError("stripe package not installed. Run: pip install stripe")

    api_key = os.getenv("STRIPE_SECRET_KEY")
    if not api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    stripe.api_key = api_key
    return stripe


def get_resend_client():
    """Get Resend client for email delivery."""
    try:
        import resend
    except ImportError:
        raise ImportError("resend package not installed. Run: pip install resend")

    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        raise ValueError("RESEND_API_KEY environment variable not set")

    resend.api_key = api_key
    return resend


def get_supabase_client():
    """Get Supabase client for database/storage."""
    try:
        from supabase import create_client
    except ImportError:
        raise ImportError("supabase package not installed. Run: pip install supabase")

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables required")

    return create_client(url, key)


# Configuration helpers
def get_image_engine() -> str:
    """Get the configured image generation engine."""
    return os.getenv("IMAGE_ENGINE", "dalle")


def get_storage_backend() -> str:
    """Get the configured storage backend."""
    return os.getenv("STORAGE_BACKEND", "sqlite")


def get_max_validation_retries() -> int:
    """Get maximum retries for phonics validation."""
    return int(os.getenv("MAX_VALIDATION_RETRIES", "3"))


def is_level_packs_enabled() -> bool:
    """Check if level packs are enabled."""
    return os.getenv("ENABLE_LEVEL_PACKS", "true").lower() == "true"


def is_full_programme_enabled() -> bool:
    """Check if full programme is enabled."""
    return os.getenv("ENABLE_FULL_PROGRAMME", "false").lower() == "true"
