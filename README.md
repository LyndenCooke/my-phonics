# MyPhonics Tracker App

A Progressive Web App (PWA) for parents to track their child's phonics reading progress.

## Features

- **Progress Tracking**: Visual progress circle showing overall and level-specific completion
- **Book Management**: Mark books as completed, see what's left
- **Assessment System**: Automatic reminders when assessment is ready (after 3+ books)
- **Level Progression**: Complete assessment to unlock next level
- **Reminders**: Push notifications for daily reading, assessments, weekly summaries
- **Offline Support**: Works without internet, saves data locally
- **6 Levels**: All 30 books across 6 phonics levels

## Files

```
myphonics-app/
├── public/
│   ├── index.html     # Main app UI
│   ├── app.js         # Application logic
│   ├── manifest.json  # PWA manifest
│   └── icon.svg       # App icon
├── api/               # (Future: backend API)
└── src/               # (Future: source files)
```

## How to Use

1. Open `index.html` in a web browser
2. Set up your child's profile (name + starting level)
3. Mark books as read by tapping them
4. When 3+ books in a level are complete, assessment unlocks
5. Take the assessment to progress to next level
6. Enable notifications for reminders

## Data Storage

All data is stored locally in the browser using localStorage. No server required.

## Future Enhancements

- Backend sync across devices
- Parent dashboard
- Audio book integration
- Progress sharing with teachers
- Subscription management

## Tech Stack

- Vanilla JavaScript (no frameworks)
- CSS3 with mobile-first design
- LocalStorage for data persistence
- PWA for installability
