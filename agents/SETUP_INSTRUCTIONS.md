# MyPhonicsBooks Telegram Bot — Setup Instructions for Lynden

## What You've Got

A complete Telegram bot for MyPhonicsBooks with three AI agent modes that connect directly to Claude. No FastAPI, no servers — just pure async Python.

**Files Created:**

1. `telegram_bot.py` — The bot itself (13 KB, fully documented)
2. `TELEGRAM_BOT_README.md` — Complete documentation
3. `prompts/parent_chat_prompt.md` — Parent Chat mode instructions
4. `prompts/production_prompt.md` — Production mode instructions
5. `prompts/marketing_prompt.md` — Marketing mode instructions
6. `.env.example` — Template for your credentials (updated to include Telegram token)

## Step-by-Step Setup

### 1. Get Your Telegram Bot Token

This takes 2 minutes.

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Give it a name (e.g., "MyPhonicsBooks Agent")
4. Give it a username (e.g., "@myphonicsbooks_agent")
5. Copy the **HTTP API token** (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Log in with your Anthropic account
3. Go to Account Settings or API Keys section
4. Create a new API key
5. Copy it (looks like `sk-ant-v3-something...`)

### 3. Install Python Dependencies

```bash
cd /sessions/charming-nifty-meitner/mnt/myphonicsbooks/agents
pip install python-telegram-bot>=20.0 anthropic>=0.25.0 python-dotenv
```

Or if you have a `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 4. Create Your .env File

```bash
cp .env.example .env
```

Then open `.env` in your editor and fill in your credentials:

```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
TELEGRAM_BOT_TOKEN=123456:your-actual-token-here
```

**Important:** Never commit `.env` to git. It's already in `.gitignore`.

### 5. Run the Bot

```bash
python telegram_bot.py
```

You should see:

```
INFO:telegram.ext.Application:Application started
```

The bot is now running and waiting for messages!

### 6. Test It

1. Find your bot on Telegram (search for the username you created in @BotFather)
2. Send `/start`
3. You should get a welcome message with the three modes
4. Send a test message — Claude should respond

## How to Use the Bot

### Switching Modes

Send one of these commands:

- `/parent` — Parent Chat: help with phonics, book recommendations, reading tips
- `/production` — Production: create books, validate phonics, run the pipeline
- `/marketing` — Marketing: write ad copy, emails, social posts, landing pages

### Available Commands

- `/start` — Welcome message
- `/help` — Show all commands
- `/mode` — Show which mode you're currently in
- `/clear` — Clear conversation history for this mode
- Just type normally to chat with Claude

### Example Workflows

**As a Parent:**
```
/parent
"My daughter is halfway through Level 2. What sounds should she know by now?"
```

**As Production:**
```
/production
"I want to write a Level 3 story set in Thailand. Give me a cultural brief first."
```

**As Marketing:**
```
/marketing
"Write an ad for Instagram about helping kids find their reading level."
```

## How It Works

### The Three Modes

Each mode has its own AI personality and knowledge base:

1. **Parent Chat**
   - Warm, teacher-like tone
   - Knows all phonics levels, graphemes, tricky words, book catalogue
   - Can explain reading tips, assessment results, recommend levels
   - British English throughout

2. **Production**
   - Expert in the 9-step book production pipeline
   - Can write and QA stories for phonics accuracy
   - Generates cultural briefs and image prompts for illustrators
   - Understands character rosters and cultural authenticity requirements

3. **Marketing**
   - Expert copywriter for education market
   - Writes in brand voice: warm, teacher-like, never corporate
   - Creates ads, emails, social posts, landing pages, video scripts
   - Knows brand guidelines (no Oxford commas, British English, forbidden words)

### Conversation History

- Each mode keeps its own separate conversation history
- Switch modes without losing context
- History kept in memory (lasts as long as the bot is running)
- Use `/clear` to manually reset history
- **Note:** History is lost when the bot restarts (see "Scaling" below)

### Message Flow

1. You send a message
2. Bot shows "typing" indicator
3. Bot sends message + history to Claude with the system prompt for your current mode
4. Claude responds
5. Response is added to history and sent back to you
6. If response is too long, it's split into multiple Telegram messages

## Customisation

### Change the Model

Edit `telegram_bot.py`, line 53:

```python
MODEL = "claude-sonnet-4-20250514"
```

Options:
- `"claude-opus-4-1-20250805"` — Most capable (slower, more expensive)
- `"claude-sonnet-4-20250514"` — Balanced (current)
- `"claude-haiku-4-5-20251001"` — Fastest (cheaper)

### Change History Limits

Edit line 54:

```python
MAX_HISTORY = 20  # Keep last 20 messages (40 including assistant responses)
```

Lower numbers = fewer tokens, less context. Higher = more context, more tokens.

### Add a Fourth Mode

1. Create a new prompt file in `prompts/`
2. Add it to the `PROMPTS` dict in `telegram_bot.py`
3. Add a new handler function like `async def my_new_mode()`
4. Register it with `application.add_handler()`

## For Production Use

If you scale this beyond personal use:

- **Persistence:** Add a database (PostgreSQL, Redis) instead of in-memory dict
- **Scaling:** Use a proper hosting service (AWS Lambda, Render, Railway)
- **Rate limits:** Add per-user rate limiting
- **Backups:** Archive conversation histories to a database
- **Security:** Add user authentication if needed

But for now, this setup works great for you as Lynden.

## Troubleshooting

**Bot doesn't start:**
- Check `.env` file exists and has correct format
- Check both `TELEGRAM_BOT_TOKEN` and `ANTHROPIC_API_KEY` are set
- Run `python telegram_bot.py` from the correct directory
- Check console output for error messages

**Bot doesn't respond:**
- Check that you've sent a message (not a slash command)
- Check internet connection
- Check API key is valid (test at console.anthropic.com)
- Check bot token is correct (test at https://api.telegram.org/botYOUR_TOKEN/getMe)

**Messages don't arrive:**
- Check bot is actually running (look for "Application started" message)
- Try sending `/start` — this always works if bot is running
- Check console logs for error messages

**Long responses get cut off:**
- Bot automatically splits long responses into multiple messages
- This is normal Telegram behavior (4096 character limit per message)

**History seems to be lost:**
- Conversation history is in memory and lost when bot restarts
- This is fine for single-user dev setup
- For production, you'd need a database

## Questions?

All code is well-commented. Key sections:

- **State management:** Lines 78-118
- **Command handlers:** Lines 261-347
- **Message handler:** Lines 350-413
- **Main loop:** Lines 416-430

Good luck, Lynden! Enjoy your new bot.
