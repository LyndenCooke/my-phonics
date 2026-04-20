# MyPhonicsBooks Telegram Bot

A Telegram bot for Lynden at MyPhonicsBooks that provides three AI agent modes for parent support, book production, and marketing content creation.

## Quick Start

### 1. Install Dependencies

```bash
pip install python-telegram-bot>=20.0 anthropic>=0.25.0 python-dotenv
```

### 2. Get Your Credentials

**Telegram Bot Token:**
- Chat with [@BotFather](https://t.me/botfather) on Telegram
- Create a new bot with `/newbot`
- Copy the HTTP API token

**Anthropic API Key:**
- Visit [console.anthropic.com](https://console.anthropic.com)
- Create an API key in your account settings

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env`:

```
ANTHROPIC_API_KEY=your-anthropic-key-here
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
```

### 4. Run the Bot

```bash
python telegram_bot.py
```

The bot will start polling Telegram for messages. It will run until you stop it with Ctrl+C.

## Features

### Three AI Modes

Switch between modes with commands:

- **/parent** — Parent Chat mode: Answer questions about phonics levels, book recommendations, assessment results, and reading tips. Friendly, teacher-like tone.

- **/production** — Production mode: Help create books, validate phonics, generate image prompts, and guide the 9-step production pipeline.

- **/marketing** — Marketing mode: Write marketing copy, emails, social posts, landing pages, and video scripts in brand voice.

### Commands

- **/start** — Welcome message explaining the three modes
- **/help** — Show all available commands
- **/parent** — Switch to Parent Chat mode
- **/production** — Switch to Production mode
- **/marketing** — Switch to Marketing mode
- **/mode** — Show current active mode
- **/clear** — Clear conversation history for the current mode

Just type a regular message to chat with Claude in the active mode.

## How It Works

### State Management

Each user has their own separate conversation history for each mode. Switching modes doesn't lose context because each mode maintains its own message history.

**Example:**
- User switches to Parent mode → chats about Level 3 books
- User switches to Marketing mode → writes some ad copy
- User switches back to Parent mode → can still discuss Level 3 books from where they left off

### Message History

- Each mode keeps the last 20 messages (40 including both user and assistant)
- Older messages are discarded to manage token usage
- Use `/clear` to manually reset history for the current mode

### Long Messages

If Claude's response is longer than Telegram's 4096 character limit, the bot automatically splits it into multiple messages.

## System Prompts

The bot loads system prompts from files in the `prompts/` directory:

- `prompts/parent_chat_prompt.md` — Parent Chat mode instructions
- `prompts/production_prompt.md` — Production mode instructions
- `prompts/marketing_prompt.md` — Marketing mode instructions

If prompt files are missing, the bot will fall back to minimal inline prompts.

### Prompt Contents

Each prompt includes:

**Parent Chat:**
- Complete phonics level data (graphemes, tricky words, word counts)
- Book catalogue
- Assessment guidance
- What the agent can and cannot do

**Production:**
- 9-step production pipeline
- Complete phonics level specs with all graphemes
- Character roster guidelines
- Cultural authenticity requirements
- Story writing engagement criteria

**Marketing:**
- Brand voice rules (British English, tone, trust phrases, forbidden words)
- Ad copy formula and headline patterns
- Visual guidelines
- Output formats (ads, email, landing pages, social, video, blog, press release)

## Code Architecture

### Key Components

**State Store (`user_state` dict)**
```python
{
  user_id: {
    "mode": "parent",  # current active mode
    "history": {
      "parent": [],      # messages for parent mode
      "production": [],  # messages for production mode
      "marketing": []    # messages for marketing mode
    }
  }
}
```

**Message Flow**

1. User sends text message → `handle_message()`
2. Get user's current mode and history
3. Show "typing" indicator
4. Call Claude API with:
   - System prompt for the current mode
   - Conversation history
   - User's message
5. Add Claude's response to history
6. Split response if needed and send back

**Handlers**

- `start()` — /start command
- `help_command()` — /help command
- `switch_mode()` — /parent, /production, /marketing
- `show_mode()` — /mode command
- `clear_command()` — /clear command
- `handle_message()` — Regular text messages

## Error Handling

The bot handles:

- **Missing environment variables** — Raises clear error on startup
- **Missing prompt files** — Logs warning and uses fallback prompts
- **API errors** — Catches Anthropic API errors and sends user-friendly error message
- **Telegram errors** — General exception handler
- **Markdown parsing errors** — Falls back to plain text if MarkdownV2 fails

## Logging

The bot logs:

- Bot startup
- Mode switches (with user ID)
- History clears (with user ID and mode)
- API errors and other exceptions
- Message summaries (first 50 characters)

Check the console output to debug issues.

## British English

The bot uses British English throughout, including:

- Colour, organised, mum, favourite, practise (verb)
- No Oxford commas
- No em dashes

This is enforced in the system prompts for each mode.

## Scalability Notes

**Current Design:**
- Uses in-memory state store (lost on restart)
- No database persistence
- Single-threaded message handling
- Suitable for single user or small group

**For Production Scaling:**
- Replace `user_state` dict with a database (PostgreSQL, Redis, etc.)
- Add request queuing for high-volume usage
- Consider async message handling with task queues
- Implement user authentication/authorization
- Add rate limiting per user
- Archive conversation history

## Troubleshooting

**Bot doesn't respond:**
- Check that `TELEGRAM_BOT_TOKEN` is set correctly
- Verify the bot is running (`python telegram_bot.py`)
- Check console logs for errors

**Prompts not loading:**
- Verify `prompts/` directory exists in same location as bot
- Check that all three `.md` files are present
- Check file permissions (must be readable)

**API key errors:**
- Verify `ANTHROPIC_API_KEY` is correct and valid
- Check that your API key has available credits
- Look at console logs for specific error messages

**Telegram errors:**
- Verify bot token is correct
- Check that the bot hasn't been deleted in @BotFather
- Verify your internet connection

## Dependencies

See `requirements.txt` for all dependencies. Install with:

```bash
pip install -r requirements.txt
```

Key packages:

- `python-telegram-bot` (v20+) — async Telegram API client
- `anthropic` — Claude API client
- `python-dotenv` — environment variable management

## Author

Created for Lynden at MyPhonicsBooks

## License

Proprietary — MyPhonicsBooks
