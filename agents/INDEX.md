# MyPhonicsBooks Telegram Bot - File Index

## Start Here

New to this project? Start with these files in this order:

1. **SETUP_INSTRUCTIONS.md** (5 min read)
   - How to install and run the bot
   - Step-by-step setup for Lynden
   - Testing instructions

2. **TELEGRAM_BOT_README.md** (10 min read)
   - Complete feature documentation
   - How to use the bot
   - Troubleshooting guide

3. **telegram_bot.py** (20 min read)
   - The bot code itself
   - Well-commented and documented
   - Ready to deploy

## Complete File Guide

### Bot Code
- **telegram_bot.py** — Main bot file (376 lines)
  - Async Telegram bot using python-telegram-bot v20+
  - Three AI agent modes
  - State management and conversation history
  - Error handling and logging
  - Ready to run: `python telegram_bot.py`

### System Prompts (Knowledge Bases)
Each mode has its own system prompt file:

- **prompts/parent_chat_prompt.md** (150 lines)
  - Parent Chat mode knowledge base
  - All phonics level data (6 levels)
  - Book catalogue
  - Assessment guidance
  - Brand voice: warm, teacher-like

- **prompts/production_prompt.md** (156 lines)
  - Production mode knowledge base
  - 9-step production pipeline
  - Phonics validation rules
  - Character roster guidelines
  - Cultural authenticity requirements

- **prompts/marketing_prompt.md** (100 lines)
  - Marketing mode knowledge base
  - Brand voice rules
  - Ad copy formula
  - Output formats (ads, email, landing pages, etc.)

### Documentation

**Getting Started:**
- **SETUP_INSTRUCTIONS.md** (245 lines)
  - Install dependencies
  - Get Telegram and Anthropic credentials
  - Configure .env
  - Run the bot
  - Test it
  - Customisation guide

**Using the Bot:**
- **TELEGRAM_BOT_README.md** (254 lines)
  - Feature overview
  - Commands explained
  - How it works (state, history, modes)
  - Architecture explanation
  - Error handling
  - Scalability notes
  - Troubleshooting

**Understanding the System:**
- **ARCHITECTURE.md** (383 lines)
  - System design diagram
  - State management structure
  - Message flow walkthrough
  - Command handler explanations
  - Error handling patterns
  - Design decisions
  - Scalability path

**Project Overview:**
- **DELIVERABLES.md** (266 lines)
  - Complete manifest of what was delivered
  - Requirements checklist (all met)
  - Key features list
  - File locations
  - Testing verification
  - Versions and dependencies

- **INDEX.md** (this file)
  - Guide to all files
  - Quick reference

### Configuration
- **.env.example**
  - Template for credentials
  - Copy to .env and fill in your values
  - Two variables:
    - ANTHROPIC_API_KEY
    - TELEGRAM_BOT_TOKEN

## Quick Reference

### Installation
```bash
pip install python-telegram-bot>=20.0 anthropic>=0.25.0 python-dotenv
```

### Setup
```bash
cp .env.example .env
# Edit .env with your credentials
python telegram_bot.py
```

### Commands
- `/start` — Welcome message
- `/help` — Show all commands
- `/parent` — Switch to Parent Chat mode
- `/production` — Switch to Production mode
- `/marketing` — Switch to Marketing mode
- `/mode` — Show current mode
- `/clear` — Clear conversation history

### Three Modes
- **Parent Chat** — Warm teacher helping parents with phonics
- **Production** — Expert creating decodable books
- **Marketing** — Copywriter creating brand-voice content

### Key Features
- Three switchable AI modes
- Per-user conversation history
- Per-mode history (doesn't lose context when switching)
- Direct Anthropic API (no server needed)
- Async throughout
- Error handling
- British English
- Production-ready code

## Documentation by Purpose

### For Setup
→ **SETUP_INSTRUCTIONS.md**

### For Using the Bot
→ **TELEGRAM_BOT_README.md**

### For Understanding How It Works
→ **ARCHITECTURE.md**

### For Understanding What Was Delivered
→ **DELIVERABLES.md**

### For Looking at the Code
→ **telegram_bot.py**

### For Understanding Each Mode
→ **prompts/parent_chat_prompt.md**
→ **prompts/production_prompt.md**
→ **prompts/marketing_prompt.md**

## File Sizes

- telegram_bot.py: 13 KB (376 lines)
- prompts/parent_chat_prompt.md: 6.6 KB (150 lines)
- prompts/production_prompt.md: 6.3 KB (156 lines)
- prompts/marketing_prompt.md: 3.9 KB (100 lines)
- TELEGRAM_BOT_README.md: 7 KB (254 lines)
- SETUP_INSTRUCTIONS.md: 5 KB (245 lines)
- ARCHITECTURE.md: 8 KB (383 lines)
- DELIVERABLES.md: 4 KB (266 lines)
- .env.example: <1 KB

**Total: ~60 KB of code and documentation**

## Navigation Tips

1. **I just want to run it:**
   → Read SETUP_INSTRUCTIONS.md

2. **I want to understand the features:**
   → Read TELEGRAM_BOT_README.md

3. **I want to modify the code:**
   → Read ARCHITECTURE.md, then telegram_bot.py

4. **I want to change the prompts:**
   → Edit the files in prompts/

5. **I want to understand what was delivered:**
   → Read DELIVERABLES.md

6. **I want to understand the design:**
   → Read ARCHITECTURE.md

7. **I'm having problems:**
   → Check TELEGRAM_BOT_README.md Troubleshooting section

## Status

✓ Complete and ready to use
✓ All requirements met
✓ Syntax validated
✓ Fully documented
✓ Production-ready

For Lynden at MyPhonicsBooks
Created: 29 March 2026
