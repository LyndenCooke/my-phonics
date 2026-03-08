import { useState, useEffect } from 'react'

const booksData = {
  1: [
    { id: 'l1b1', title: 'First Sounds: Sam and Pat' },
    { id: 'l1b2', title: 'The Cat Sat' },
    { id: 'l1b3', title: 'Pin it Up' },
    { id: 'l1b4', title: 'The Big Red Pot' },
    { id: 'l1b5', title: 'Run, Jump, Hop' },
  ],
  2: [
    { id: 'l2b1', title: 'The Shop' },
    { id: 'l2b2', title: 'Buzz at the Zoo' },
    { id: 'l2b3', title: 'Yell and Yap' },
    { id: 'l2b4', title: 'Chat with Chip' },
    { id: 'l2b5', title: 'Ships and Fish' },
  ],
  3: [
    { id: 'l3b1', title: 'Rain, Rain' },
    { id: 'l3b2', title: 'The Brown Cow' },
    { id: 'l3b3', title: 'Day at the Beach' },
    { id: 'l3b4', title: 'Play and Stay' },
    { id: 'l3b5', title: 'The Farm' },
  ],
  4: [
    { id: 'l4b1', title: 'The Trip' },
    { id: 'l4b2', title: 'School Days' },
    { id: 'l4b3', title: 'The Park Adventure' },
    { id: 'l4b4', title: 'Helping at Home' },
    { id: 'l4b5', title: 'The Rainy Day' },
  ],
  5: [
    { id: 'l5b1', title: 'The Mystery Box' },
    { id: 'l5b2', title: 'A New Friend' },
    { id: 'l5b3', title: 'The Magic Tree' },
    { id: 'l5b4', title: 'Lost and Found' },
    { id: 'l5b5', title: 'The Big Race' },
  ],
  6: [
    { id: 'l6b1', title: 'Around the World' },
    { id: 'l6b2', title: 'Inventions' },
    { id: 'l6b3', title: 'The Time Machine' },
    { id: 'l6b4', title: 'Our Community' },
    { id: 'l6b5', title: 'The Final Chapter' },
  ],
}

const bookReaders = {
  l5b1: '/books/5-1-the-mystery-box.html',
}

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('myphonics-state')
    return saved
      ? JSON.parse(saved)
      : {
          childName: '',
          currentLevel: 1,
          booksCompleted: {},
          assessments: {},
          reminders: { daily: true, assessment: true, weekly: false },
          setupComplete: false,
        }
  })

  useEffect(() => {
    localStorage.setItem('myphonics-state', JSON.stringify(state))
  }, [state])

  const books = booksData[state.currentLevel] || []
  const completedCount = Object.keys(state.booksCompleted).length
  const levelCompleted = books.filter((b) => state.booksCompleted[b.id]).length

  if (!state.setupComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Welcome to MyPhonics
          </h1>
          <p className="text-slate-500 mb-8">
            Set up your child's profile to begin their reading journey.
          </p>
          <p className="text-sm text-slate-400">
            Visit the{' '}
            <a href="/index.html" className="text-primary-600 underline">
              classic version
            </a>{' '}
            for full setup.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary-600 to-accent-500 text-white px-5 py-6">
        <h1 className="font-display text-2xl font-bold">MyPhonics</h1>
        <p className="opacity-90 text-sm">
          {state.childName}'s reading journey
        </p>
      </header>

      {/* Progress */}
      <div className="p-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-display font-bold text-slate-900 mb-3">
            Level {state.currentLevel}
          </h2>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-accent-500 rounded-full transition-all"
              style={{
                width: `${(levelCompleted / books.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {levelCompleted} of {books.length} books completed
          </p>
        </div>

        {/* Books */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-display font-bold text-slate-900 mb-4">
            Books
          </h2>
          <div className="space-y-3">
            {books.map((book) => {
              const done = state.booksCompleted[book.id]
              const hasReader = bookReaders[book.id]
              return (
                <div
                  key={book.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    done
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-slate-50'
                  }`}
                  onClick={() =>
                    setState((s) => {
                      const next = { ...s, booksCompleted: { ...s.booksCompleted } }
                      if (next.booksCompleted[book.id]) {
                        delete next.booksCompleted[book.id]
                      } else {
                        next.booksCompleted[book.id] = {
                          completedAt: new Date().toISOString(),
                        }
                      }
                      return next
                    })
                  }
                >
                  <div
                    className={`w-10 h-12 rounded flex items-center justify-center text-white text-lg flex-shrink-0 ${
                      done
                        ? 'bg-gradient-to-br from-green-500 to-green-400'
                        : 'bg-gradient-to-br from-primary-600 to-accent-500'
                    }`}
                  >
                    {done ? '✓' : '📖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {book.title}
                    </div>
                    <div
                      className={`text-xs ${done ? 'text-green-600' : 'text-slate-400'}`}
                    >
                      {done ? 'Completed' : 'Not read yet'}
                    </div>
                  </div>
                  {hasReader && (
                    <a
                      href={hasReader}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-accent-500 text-white text-xs font-semibold rounded-lg flex-shrink-0"
                    >
                      Read
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <div className="font-display text-2xl font-bold text-primary-600">
              {completedCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Books Read</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <div className="font-display text-2xl font-bold text-primary-600">
              {Object.keys(state.assessments).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Assessments</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
