# MyPhonicsBooks Telegram Bot — Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM USER                            │
│           (Sends messages via Telegram app)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Message received
┌─────────────────────────────────────────────────────────────┐
│           TELEGRAM BOT (python-telegram-bot)                │
│  • Async polling (runs indefinitely)                        │
│  • Shows typing indicator while processing                  │
│  • Handles commands (/start, /help, /parent, etc.)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Extract message
┌─────────────────────────────────────────────────────────────┐
│            STATE MANAGEMENT (In-Memory Dict)                │
│  user_state[user_id] = {                                    │
│    "mode": "parent",        # Current mode                  │
│    "history": {                                             │
│      "parent": [...],       # Messages in parent mode       │
│      "production": [...],   # Messages in production mode   │
│      "marketing": [...]     # Messages in marketing mode    │
│    }                                                         │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Get history for current mode
┌─────────────────────────────────────────────────────────────┐
│              SYSTEM PROMPT LOADER                           │
│  Load from prompts/{parent|production|marketing}_prompt.md  │
│  Fall back to inline if files missing                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ System prompt + history + user message
┌─────────────────────────────────────────────────────────────┐
│          ANTHROPIC API (Claude Sonnet 4)                    │
│  messages.create(                                           │
│    model="claude-sonnet-4-20250514",                        │
│    system=system_prompt,                                    │
│    messages=messages_with_history,                          │
│    max_tokens=2048                                          │
│  )                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Response from Claude
┌─────────────────────────────────────────────────────────────┐
│            RESPONSE PROCESSING                              │
│  • Add to history                                           │
│  • Split if > 4096 characters                               │
│  • Parse MarkdownV2 (fallback to plain text)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓ Send back to Telegram
┌─────────────────────────────────────────────────────────────┐
│                  TELEGRAM USER                              │
│             (Receives Claude's response)                    │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### User State Structure

```python
user_state = {
  12345: {  # Telegram user ID
    "mode": "parent",  # Current active mode
    "history": {
      "parent": [
        {"role": "user", "content": "What is Level 2?"},
        {"role": "assistant", "content": "Level 2 is Longer Sounds..."},
        ...  # Up to 20 messages per mode
      ],
      "production": [
        # Separate history for production mode
      ],
      "marketing": [
        # Separate history for marketing mode
      ]
    }
  },
  67890: {
    # Another user's state
  }
}
```

### Key Properties

- **Per-user:** Each user has independent state and history
- **Per-mode:** Each mode maintains separate conversation history
- **Max history:** Keep last 20 messages per mode (80 with both user and assistant)
- **Session-based:** History lost when bot restarts (acceptable for dev/personal use)

## Message Flow

### Step 1: Message Received

```python
async def handle_message(update, context):
    user_id = update.effective_user.id
    user_message = update.message.text
    state = get_user_state(user_id)
    current_mode = state["mode"]  # Get current mode for this user
```

### Step 2: Show Typing Indicator

```python
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id,
        action=ChatAction.TYPING
    )
```

### Step 3: Build Message Context

```python
    history = get_current_history(user_id)  # Get history for current mode
    messages = history.copy()
    messages.append({"role": "user", "content": user_message})
    
    system_prompt = PROMPTS[current_mode]  # Load system prompt for current mode
```

### Step 4: Call Claude

```python
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=system_prompt,
        messages=messages
    )
```

### Step 5: Update History

```python
    assistant_message = response.content[0].text
    add_to_history(user_id, "user", user_message)
    add_to_history(user_id, "assistant", assistant_message)
```

### Step 6: Send Response

```python
    message_chunks = split_message(assistant_message)
    for chunk in message_chunks:
        try:
            await update.message.reply_text(
                chunk,
                parse_mode=ParseMode.MARKDOWN_V2
            )
        except:
            await update.message.reply_text(chunk)  # Fallback to plain text
```

## Command Handlers

### Mode Switching

```python
async def parent_mode(update, context):
    await switch_mode(update, context, "parent")

async def production_mode(update, context):
    await switch_mode(update, context, "production")

async def marketing_mode(update, context):
    await switch_mode(update, context, "marketing")

async def switch_mode(update, context, new_mode):
    user_id = update.effective_user.id
    state = get_user_state(user_id)
    state["mode"] = new_mode  # Update mode
    # History is preserved because it's per-mode
```

### History Management

```python
def get_current_history(user_id):
    """Get history for the currently active mode."""
    state = get_user_state(user_id)
    return state["history"][state["mode"]]

def add_to_history(user_id, role, content):
    """Add message to the current mode's history."""
    state = get_user_state(user_id)
    state["history"][state["mode"]].append({
        "role": role,
        "content": content
    })
    # Trim to MAX_HISTORY if needed
    if len(state["history"][state["mode"]]) > MAX_HISTORY * 2:
        state["history"][state["mode"]] = state["history"][state["mode"]][-MAX_HISTORY*2:]

def clear_history(user_id):
    """Clear history for the current mode."""
    state = get_user_state(user_id)
    state["history"][state["mode"]] = []
```

## System Prompts

### How They Work

1. **Loaded at startup:** Prompts are read from files in `prompts/` directory
2. **Per-mode:** Each mode has a dedicated system prompt
3. **Always included:** System prompt sent with every API call
4. **Sent with context:** System prompt + conversation history + user message

### System Prompt Content

Each prompt contains:

- **Voice/tone guidelines:** How to speak to users
- **Knowledge base:** Specific facts the mode needs to know
- **Constraints:** What to do and not do
- **Examples:** Sometimes example responses
- **Brand guidelines:** British English, forbidden words, etc.

### Example System Prompt Structure

```
You are the MyPhonicsBooks [Role].

## Brand Voice Rules
- British English...
- Tone...
- Trust phrases...

## Knowledge Base
### Level 1
- Graphemes: ...
- Tricky words: ...
- Word count: ...

## What You Can Do
1. ...
2. ...

## What You Must Not Do
1. ...
2. ...

## Response Style
- ...
```

## Error Handling

### API Errors

```python
try:
    response = client.messages.create(...)
except APIError as e:
    await update.message.reply_text(
        f"Sorry, I encountered an error: {str(e)}\n\nPlease try again."
    )
    logger.error(f"Claude API error: {e}")
```

### Missing Credentials

```python
if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not set in environment")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY not set in environment")
```

### Missing Prompt Files

```python
try:
    PROMPTS = {
        "parent": (PROMPT_DIR / "parent_chat_prompt.md").read_text(),
        ...
    }
except FileNotFoundError as e:
    logger.warning(f"Prompt file not found: {e}. Using fallback.")
    PROMPTS = {
        "parent": "You are the MyPhonicsBooks Reading Helper...",
        ...
    }
```

### Markdown Fallback

```python
try:
    await update.message.reply_text(chunk, parse_mode=ParseMode.MARKDOWN_V2)
except:
    await update.message.reply_text(chunk)  # Plain text fallback
```

## Key Design Decisions

### 1. Async Throughout

- Uses `async def` and `await` for all operations
- Non-blocking Telegram polling
- Allows multiple users simultaneously

### 2. Direct API Calls

- No FastAPI server needed
- Direct Anthropic API calls
- Simpler deployment for personal/small use

### 3. Per-Mode History

- Switching modes doesn't lose context
- Users can work across modes without losing previous conversations
- Each mode maintains its own conversation thread

### 4. In-Memory State

- Fast and simple for personal/dev use
- Lost on restart (acceptable)
- Can be upgraded to database for production scale

### 5. System Prompts from Files

- Easy to update without touching code
- Prompts can be long (and they are)
- Fallback to inline if files missing (robust)

### 6. Message Splitting

- Telegram has 4096 character limit
- Responses are split and sent as multiple messages
- Preserves readability

## Scalability Path

### Current (Personal Use)
- In-memory state
- Runs on developer's machine
- Single Telegram user (or few users)
- History lost on restart

### Medium Scale
- SQLite database for state persistence
- Deployed to Render or Railway
- Multiple Telegram users
- Persistent conversation history

### Large Scale
- PostgreSQL database
- Redis for caching and rate limiting
- Message queue (Celery/RabbitMQ)
- Load balancing with multiple bot instances
- User authentication
- Per-user rate limits
- Archived conversation analytics

Current implementation is architecture for "Personal Use" but designed to be scalable.

## Testing Checklist

- [x] Bot starts without errors
- [x] Commands registered properly
- [x] State created correctly for new users
- [x] Mode switching works
- [x] History maintained per-mode
- [x] API calls work with Anthropic
- [x] Long messages split correctly
- [x] Error handling works
- [x] Logging captures activity
- [x] British English in prompts
- [x] Type hints on all functions
- [x] Async/await properly used

