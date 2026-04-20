"""
MyPhonicsBooks Telegram Bot

A Telegram bot that connects to Claude API and provides three AI agent modes:
- Parent Chat: Reading help and phonics guidance
- Production: Book creation and production pipeline
- Marketing: Marketing copy and content creation

Requirements:
- python-telegram-bot>=20.0
- anthropic>=0.25.0
- python-dotenv

Environment variables:
- TELEGRAM_BOT_TOKEN: Telegram bot token from @BotFather
- ANTHROPIC_API_KEY: Anthropic API key
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

import asyncio
from telegram import Update, Chat
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from telegram.constants import ParseMode, ChatAction
from dotenv import load_dotenv
from anthropic import Anthropic, APIError

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONSTANTS
# ============================================================================

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not set in environment")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY not set in environment")

MODEL = "claude-sonnet-4-20250514"
MAX_HISTORY = 20  # Keep last 20 messages per mode
MAX_MESSAGE_LENGTH = 4096  # Telegram's message length limit

# Load system prompts from files
PROMPT_DIR = Path(__file__).parent / "prompts"

try:
    PROMPTS = {
        "parent": (PROMPT_DIR / "parent_chat_prompt.md").read_text(),
        "production": (PROMPT_DIR / "production_prompt.md").read_text(),
        "marketing": (PROMPT_DIR / "marketing_prompt.md").read_text(),
    }
except FileNotFoundError as e:
    logger.warning(f"Prompt file not found: {e}. Using inline prompts instead.")
    PROMPTS = {
        "parent": "You are the MyPhonicsBooks Reading Helper — a warm, knowledgeable phonics assistant.",
        "production": "You are the MyPhonicsBooks Production Agent — an expert AI assistant for creating decodable phonics books.",
        "marketing": "You are the MyPhonicsBooks Marketing Agent — an expert copywriter who creates marketing content.",
    }

# ============================================================================
# STATE MANAGEMENT
# ============================================================================

# In-memory state store: {user_id: {"mode": "parent", "history": {...}}}
user_state: Dict = {}


def get_user_state(user_id: int) -> Dict:
    """Get or create user state."""
    if user_id not in user_state:
        user_state[user_id] = {
            "mode": "parent",
            "history": {
                "parent": [],
                "production": [],
                "marketing": []
            }
        }
    return user_state[user_id]


def get_current_history(user_id: int) -> List:
    """Get conversation history for the current mode."""
    state = get_user_state(user_id)
    return state["history"][state["mode"]]


def add_to_history(user_id: int, role: str, content: str):
    """Add message to conversation history for the current mode."""
    state = get_user_state(user_id)
    state["history"][state["mode"]].append({
        "role": role,
        "content": content
    })
    
    # Keep only last MAX_HISTORY messages
    if len(state["history"][state["mode"]]) > MAX_HISTORY * 2:
        state["history"][state["mode"]] = state["history"][state["mode"]][-MAX_HISTORY*2:]


def clear_history(user_id: int):
    """Clear conversation history for the current mode."""
    state = get_user_state(user_id)
    state["history"][state["mode"]] = []


def trim_message(text: str) -> str:
    """Trim message to Telegram's maximum length, splitting if necessary."""
    return text


def split_message(text: str, max_length: int = MAX_MESSAGE_LENGTH) -> List[str]:
    """Split a long message into multiple chunks."""
    if len(text) <= max_length:
        return [text]
    
    messages = []
    current = ""
    
    for paragraph in text.split("\n"):
        if len(current) + len(paragraph) + 1 > max_length:
            if current:
                messages.append(current.strip())
            current = paragraph
        else:
            current += "\n" + paragraph if current else paragraph
    
    if current:
        messages.append(current.strip())
    
    return messages


def escape_markdown_v2(text: str) -> str:
    """Escape special characters for MarkdownV2 formatting."""
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    return text


# ============================================================================
# COMMAND HANDLERS
# ============================================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a welcome message explaining the three modes."""
    user_id = update.effective_user.id
    get_user_state(user_id)  # Initialise user state
    
    welcome = """Welcome to the MyPhonicsBooks Agent\\.

I can help you in three ways:

`/parent` — Ask me about phonics levels, book recommendations, assessment results and reading tips\\. I speak like a friendly teacher\\.

`/production` — I help create books: write stories, validate phonics, generate image prompts and run the 9\\-step pipeline\\.

`/marketing` — I write marketing copy: ads, emails, social posts, landing pages, video scripts\\. All in brand voice\\.

Current mode: Parent Chat

Just type a message to get started\\."""
    
    await update.message.reply_text(welcome, parse_mode=ParseMode.MARKDOWN_V2)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show available commands."""
    help_text = """Available commands:

`/start` — Welcome message and overview

`/parent` — Switch to parent chat mode

`/production` — Switch to production mode

`/marketing` — Switch to marketing mode

`/mode` — Show current mode

`/clear` — Clear conversation history for this mode

`/help` — Show this message

Just type any message to chat with Claude in the current mode\\."""
    
    await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN_V2)


async def switch_mode(update: Update, context: ContextTypes.DEFAULT_TYPE, new_mode: str) -> None:
    """Switch to a different agent mode."""
    user_id = update.effective_user.id
    state = get_user_state(user_id)
    old_mode = state["mode"]
    state["mode"] = new_mode
    
    mode_names = {
        "parent": "Parent Chat",
        "production": "Production",
        "marketing": "Marketing"
    }
    
    message = f"Switched to {mode_names[new_mode]} mode\\.\n\nYour conversation history is saved separately for each mode, so you can switch back and forth without losing context\\."
    await update.message.reply_text(message, parse_mode=ParseMode.MARKDOWN_V2)
    logger.info(f"User {user_id} switched from {old_mode} to {new_mode}")


async def parent_mode(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Switch to parent chat mode."""
    await switch_mode(update, context, "parent")


async def production_mode(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Switch to production mode."""
    await switch_mode(update, context, "production")


async def marketing_mode(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Switch to marketing mode."""
    await switch_mode(update, context, "marketing")


async def show_mode(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show the current mode."""
    user_id = update.effective_user.id
    state = get_user_state(user_id)
    
    mode_names = {
        "parent": "Parent Chat",
        "production": "Production",
        "marketing": "Marketing"
    }
    
    message = f"Current mode: {mode_names[state['mode']]}"
    await update.message.reply_text(message)


async def clear_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Clear conversation history for the current mode."""
    user_id = update.effective_user.id
    state = get_user_state(user_id)
    clear_history(user_id)
    
    mode_names = {
        "parent": "Parent Chat",
        "production": "Production",
        "marketing": "Marketing"
    }
    
    message = f"Cleared conversation history for {mode_names[state['mode']]} mode\\."
    await update.message.reply_text(message, parse_mode=ParseMode.MARKDOWN_V2)
    logger.info(f"User {user_id} cleared {state['mode']} history")


# ============================================================================
# MESSAGE HANDLER
# ============================================================================

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle text messages and send them to Claude."""
    user_id = update.effective_user.id
    user_message = update.message.text
    
    if not user_message:
        return
    
    state = get_user_state(user_id)
    current_mode = state["mode"]
    
    # Show typing indicator
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id,
        action=ChatAction.TYPING
    )
    
    try:
        # Build conversation messages
        history = get_current_history(user_id)
        messages = history.copy()
        messages.append({"role": "user", "content": user_message})
        
        # Get system prompt for the current mode
        system_prompt = PROMPTS[current_mode]
        
        # Call Claude API
        client = Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=messages
        )
        
        assistant_message = response.content[0].text
        
        # Add to conversation history
        add_to_history(user_id, "user", user_message)
        add_to_history(user_id, "assistant", assistant_message)
        
        # Split message if too long and send
        message_chunks = split_message(assistant_message)
        
        for i, chunk in enumerate(message_chunks):
            # Use MarkdownV2 for the first chunk (which usually has formatting)
            # but fall back to plain text if there are parsing issues
            try:
                await update.message.reply_text(
                    chunk,
                    parse_mode=ParseMode.MARKDOWN_V2
                )
            except Exception:
                # Fall back to plain text if markdown fails
                await update.message.reply_text(chunk)
        
        logger.info(f"User {user_id} ({current_mode}): {user_message[:50]}...")
        
    except APIError as e:
        error_message = f"API error: {str(e)}"
        logger.error(f"Claude API error for user {user_id}: {e}")
        await update.message.reply_text(
            f"Sorry, I encountered an error calling Claude: {str(e)}\n\nPlease try again in a moment\\.",
            parse_mode=ParseMode.MARKDOWN_V2
        )
    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        logger.error(f"Unexpected error for user {user_id}: {e}")
        await update.message.reply_text(
            f"Sorry, something went wrong: {str(e)}\n\nPlease try again\\.",
            parse_mode=ParseMode.MARKDOWN_V2
        )


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Start the bot."""
    # Create the Application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Add command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("parent", parent_mode))
    application.add_handler(CommandHandler("production", production_mode))
    application.add_handler(CommandHandler("marketing", marketing_mode))
    application.add_handler(CommandHandler("mode", show_mode))
    application.add_handler(CommandHandler("clear", clear_command))
    
    # Add message handler for all text messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Start the bot
    logger.info("Starting MyPhonicsBooks Telegram bot...")
    application.run_polling()


if __name__ == "__main__":
    main()
