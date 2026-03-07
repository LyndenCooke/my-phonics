# MyPhonics App — Claude Code Upgrade Instructions

## Overview
This is a React + Vite PWA project that needs award-winning design and UX optimization.

## Current State
- Basic HTML/JS version works at `/public/`
- React scaffold created with Vite + Tailwind + PWA plugin
- Structure ready for components in `/src/`

## Skills to Activate in Claude Code

### 1. **Frontend Design 3** (Already Installed)
Location: `/root/.openclaw/workspace/skills/frontend-design-3/SKILL.md`
- Bold, distinctive aesthetics — avoid generic "AI slop"
- Typography: Unique font pairings, not Inter/Roboto
- Color: Sharp accents, cohesive palette
- Motion: CSS animations, orchestrated page loads
- Spatial: Asymmetry, overlap, grid-breaking layouts

### 2. **UI/UX Design** (Already Installed)
Location: `/root/.openclaw/workspace/skills/ui-ux-design/SKILL.md`
- Mobile-first (320px start)
- 8px spacing system
- Shadcn/ui + Tailwind patterns
- Micro-interactions (hover: 1.05x scale)
- WCAG 2.2 accessibility
- Focus states, ARIA labels

### 3. **Frontend Performance** (Install if needed)
- Image optimization
- Code splitting
- Lazy loading
- Bundle analysis

### 4. **Design System Creation** (Install if needed)
- Component library
- Token consistency
- Design patterns

---

## Design Requirements

### Brand Identity
- **Name:** MyPhonics
- **Mission:** Helping parents teach children to read
- **Tone:** Warm, encouraging, professional-but-friendly
- **Target:** Culturally-diverse parents, ages 25-40

### Color Palette (MyPhonics)
```css
--primary-600: #1E40AF;  /* Deep blue */
--accent-500: #06B6D4;   /* Cyan */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--bg: #f8fafc;
--surface: #ffffff;
```

### Typography
- **Display:** Poppins (headings, hero text)
- **Body:** DM Sans (UI, body text)
- **Scale:** Mobile-first sizing

### Key Screens to Design

#### 1. Progress Screen
- Large circular progress indicator (animated)
- Current level card with visual hierarchy
- Assessment status (locked/unlocked/due)
- Stats: Books read, days reading, streak

#### 2. Books Screen
- Grid of book cards
- Completion states (in progress, completed)
- Tap to toggle with animation
- Visual feedback (checkmark animation)

#### 3. Assessment Screen
- Level timeline/progress bar
- Assessment cards with status
- Result history
- Next assessment countdown

#### 4. Settings Screen
- Child profile form
- Level selector (visual grid)
- Reminder toggles (styled switches)
- Book purchase tracker

---

## Animation Requirements

### Page Transitions
- Slide between tabs (300ms, ease-out)
- Fade in content on load
- Staggered children animation

### Micro-interactions
- Button press: scale 0.95
- Button hover: scale 1.05
- Card tap: ripple effect
- Toggle switches: spring animation
- Progress circle: stroke-dasharray animation

### Celebrations
- Book completion: confetti burst (small)
- Level complete: screen-wide celebration
- Assessment pass: badge unlock animation

---

## Technical Architecture

### Data Model
```typescript
interface State {
  childName: string;
  currentLevel: 1 | 2 | 3 | 4 | 5 | 6;
  booksCompleted: Record<string, { completedAt: string }>;
  assessments: Record<number, { result: 'excellent' | 'good' | 'needs-work', completedAt: string }>;
  reminders: { daily: boolean; assessment: boolean; weekly: boolean };
  setupComplete: boolean;
}
```

### Books Data
```typescript
const booksData = {
  1: [
    { id: 'l1b1', title: 'First Sounds: Sam and Pat' },
    { id: 'l1b2', title: 'The Cat Sat' },
    // ... 5 books per level
  ],
  // ... 6 levels
};
```

### Component Structure
```
src/
├── components/
│   ├── ProgressCircle.tsx      # Animated SVG circle
│   ├── BookCard.tsx            # Individual book item
│   ├── AssessmentCard.tsx      # Assessment status card
│   ├── LevelBadge.tsx          # Current level indicator
│   ├── Navigation.tsx          # Bottom tab nav
│   ├── Toggle.tsx              # Custom toggle switch
│   └── Confetti.tsx            # Celebration effect
├── pages/
│   ├── Progress.tsx            # Main dashboard
│   ├── Books.tsx               # Book list
│   ├── Assessments.tsx         # Assessment history
│   └── Settings.tsx            # Configuration
├── context/
│   └── AppContext.tsx          # State management
├── utils/
│   ├── storage.ts              # localStorage helpers
│   └── notifications.ts        # Push notification API
└── assets/
    └── icons/                  # App icons
```

---

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90
- Bundle Size: < 100KB gzipped
- Works offline: Yes (PWA)

---

## Accessibility Requirements

- All interactive elements keyboard accessible
- Focus indicators visible (3:1 contrast)
- ARIA labels for icons and buttons
- Reduced motion support
- WCAG 2.2 AA compliant

---

## Award-Winning Design Principles

1. **Delight:** Every interaction should feel rewarding
2. **Clarity:** Parent should instantly understand progress
3. **Efficiency:** Minimal taps to complete actions
4. **Consistency:** Same patterns throughout
5. **Personality:** Unique to MyPhonics, not generic

---

## Files to Read First

1. `/root/.openclaw/workspace/skills/frontend-design-3/SKILL.md`
2. `/root/.openclaw/workspace/skills/ui-ux-design/SKILL.md`
3. `/root/.openclaw/workspace/myphonics-app/public/app.js` (current logic)
4. `/root/.openclaw/workspace/myphonics-app/public/index.html` (current UI)

---

## Build Commands

```bash
cd /root/.openclaw/workspace/myphonics-app
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## Success Criteria

- [ ] Beautiful, distinctive visual design (not generic)
- [ ] Smooth 60fps animations
- [ ] Perfect mobile experience (touch targets 44px+)
- [ ] Works offline after first load
- [ ] Lighthouse score > 90
- [ ] Accessibility passes WCAG AA
- [ ] Parents love using it (delight factor)

---

**Make it unforgettable.**
