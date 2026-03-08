/**
 * MyPhonics Tracker App
 * Reading progress tracking and assessment reminders
 */

const app = (() => {
    const booksData = {
        1: [
            { id: 'l1b1', title: 'First Sounds: Sam and Pat' },
            { id: 'l1b2', title: 'The Cat Sat' },
            { id: 'l1b3', title: 'Pin it Up' },
            { id: 'l1b4', title: 'The Big Red Pot' },
            { id: 'l1b5', title: 'Run, Jump, Hop' }
        ],
        2: [
            { id: 'l2b1', title: 'The Shop' },
            { id: 'l2b2', title: 'Buzz at the Zoo' },
            { id: 'l2b3', title: 'Yell and Yap' },
            { id: 'l2b4', title: 'Chat with Chip' },
            { id: 'l2b5', title: 'Ships and Fish' }
        ],
        3: [
            { id: 'l3b1', title: 'Rain, Rain' },
            { id: 'l3b2', title: 'The Brown Cow' },
            { id: 'l3b3', title: 'Day at the Beach' },
            { id: 'l3b4', title: 'Play and Stay' },
            { id: 'l3b5', title: 'The Farm' }
        ],
        4: [
            { id: 'l4b1', title: 'The Trip' },
            { id: 'l4b2', title: 'School Days' },
            { id: 'l4b3', title: 'The Park Adventure' },
            { id: 'l4b4', title: 'Helping at Home' },
            { id: 'l4b5', title: 'The Rainy Day' }
        ],
        5: [
            { id: 'l5b1', title: 'The Mystery Box' },
            { id: 'l5b2', title: 'A New Friend' },
            { id: 'l5b3', title: 'The Magic Tree' },
            { id: 'l5b4', title: 'Lost and Found' },
            { id: 'l5b5', title: 'The Big Race' }
        ],
        6: [
            { id: 'l6b1', title: 'Around the World' },
            { id: 'l6b2', title: 'Inventions' },
            { id: 'l6b3', title: 'The Time Machine' },
            { id: 'l6b4', title: 'Our Community' },
            { id: 'l6b5', title: 'The Final Chapter' }
        ]
    };

    // Maps book IDs to their interactive reader URLs
    const bookReaders = {
        'l5b1': 'books/5-1-the-mystery-box.html'
    };

    let state = {
        childName: '',
        currentLevel: 1,
        booksCompleted: {},
        assessments: {},
        lastAssessment: null,
        reminders: { daily: true, assessment: true, weekly: false },
        setupComplete: false
    };

    const loadState = () => {
        const saved = localStorage.getItem('myphonics-state');
        if (saved) state = { ...state, ...JSON.parse(saved) };
    };

    const saveState = () => {
        localStorage.setItem('myphonics-state', JSON.stringify(state));
    };

    const init = () => {
        loadState();
        setupNavigation();
        setupLevelSelector();
        render();
    };

    const setupNavigation = () => {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => showScreen(btn.dataset.screen));
        });
    };

    const setupLevelSelector = () => {
        document.querySelectorAll('.level-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.level-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                state.currentLevel = parseInt(opt.dataset.level);
            });
        });
    };

    const showScreen = (screenId) => {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenId);
        });
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.toggle('active', screen.id === screenId);
        });
        if (screenId === 'progress') renderProgress();
        if (screenId === 'books') renderBooks();
        if (screenId === 'assess') renderAssessments();
        if (screenId === 'settings') renderSettings();
    };

    const render = () => {
        const hasProfile = state.childName && state.setupComplete;
        document.getElementById('setup-required').style.display = hasProfile ? 'none' : 'block';
        document.getElementById('progress-content').style.display = hasProfile ? 'block' : 'none';
        document.getElementById('books-setup-required').style.display = hasProfile ? 'none' : 'block';
        document.getElementById('books-content').style.display = hasProfile ? 'block' : 'none';
        document.getElementById('assess-setup-required').style.display = hasProfile ? 'none' : 'block';
        document.getElementById('assess-content').style.display = hasProfile ? 'block' : 'none';

        if (hasProfile) {
            renderProgress();
            renderBooks();
            renderAssessments();
        }
        renderSettings();
    };

    const renderProgress = () => {
        const totalBooks = 30;
        const completed = Object.keys(state.booksCompleted).length;
        const percentage = Math.round((completed / totalBooks) * 100);
        
        const circle = document.getElementById('progress-fill');
        if (circle) circle.style.strokeDashoffset = 377 - (percentage / 100) * 377;
        
        document.getElementById('progress-percent').textContent = percentage + '%';
        document.getElementById('books-completed').textContent = completed;
        document.getElementById('days-reading').textContent = Math.max(1, completed * 2);
        
        const levelBooks = booksData[state.currentLevel] || [];
        const levelCompleted = levelBooks.filter(b => state.booksCompleted[b.id]).length;
        
        document.getElementById('current-level-badge').textContent = `Level ${state.currentLevel}`;
        document.getElementById('level-progress-text').textContent = 
            `${levelCompleted} of ${levelBooks.length} books completed`;
        
        renderAssessmentCard(levelBooks, levelCompleted);
    };

    const renderAssessmentCard = (books, completed) => {
        const card = document.getElementById('assessment-card');
        const dateEl = document.getElementById('next-assessment-date');
        const msgEl = document.getElementById('assessment-message');
        const btn = document.getElementById('assessment-btn');
        
        if (!card || !dateEl || !msgEl || !btn) return;
        
        const allCompleted = completed >= books.length;
        const hasAssessment = state.assessments[state.currentLevel];
        
        if (hasAssessment) {
            dateEl.textContent = 'Level Complete!';
            msgEl.textContent = `Assessment: ${hasAssessment.result}`;
            btn.textContent = state.currentLevel < 6 ? 'Start Next Level' : 'Graduate!';
            btn.disabled = false;
            btn.className = 'btn btn-success';
            btn.onclick = state.currentLevel < 6 ? advanceLevel : celebrateGraduation;
            card.className = 'card assessment-ready';
        } else if (allCompleted) {
            dateEl.textContent = 'Ready Now!';
            msgEl.textContent = 'All books completed. Take assessment to progress.';
            btn.textContent = 'Take Assessment';
            btn.disabled = false;
            btn.className = 'btn btn-success';
            btn.onclick = openAssessmentModal;
            card.className = 'card assessment-ready';
        } else {
            const remaining = books.length - completed;
            dateEl.textContent = `${remaining} book${remaining > 1 ? 's' : ''} left`;
            msgEl.textContent = `Complete ${remaining} more to unlock assessment.`;
            btn.textContent = 'Locked';
            btn.disabled = true;
            btn.className = 'btn';
            btn.style.background = '#e2e8f0';
            card.className = 'card assessment-card';
        }
    };

    const renderBooks = () => {
        const container = document.getElementById('books-list');
        if (!container) return;

        const books = booksData[state.currentLevel] || [];
        container.innerHTML = books.map(book => {
            const completed = state.booksCompleted[book.id];
            const hasReader = bookReaders[book.id];
            return `
                <div class="book-item ${completed ? 'completed' : ''}" onclick="app.toggleBook('${book.id}')">
                    <div class="book-icon">${completed ? '✓' : '📖'}</div>
                    <div class="book-info">
                        <div class="book-title">${book.title}</div>
                        <div class="book-status">${completed ? 'Completed' : 'Not read yet'}</div>
                    </div>
                    ${hasReader ? `<button class="read-btn" onclick="event.stopPropagation(); app.openBook('${book.id}')" aria-label="Read ${book.title}">Read</button>` : ''}
                    ${completed ? '<div class="checkmark">✓</div>' : ''}
                </div>
            `;
        }).join('');
    };

    const renderAssessments = () => {
        const container = document.getElementById('assessment-list');
        if (!container) return;
        
        let html = '';
        for (let level = 1; level <= 6; level++) {
            const assessment = state.assessments[level];
            const isCurrent = level === state.currentLevel;
            const status = assessment ? '✅ Passed' : (isCurrent ? '📝 Ready when books done' : (level < state.currentLevel ? '⏭️ Skipped' : '🔒 Locked'));
            
            html += `
                <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; background: ${isCurrent ? '#f0f9ff' : 'white'};">
                    <div style="font-weight: 600; display: flex; justify-content: space-between;">
                        <span>Level ${level} Assessment</span>
                        <span style="font-size: 13px; color: ${assessment ? '#16a34a' : '#64748b'};">${status}</span>
                    </div>
                    ${assessment ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px;">Result: ${assessment.result}</div>` : ''}
                </div>
            `;
        }
        container.innerHTML = html;
    };

    const renderSettings = () => {
        document.getElementById('child-name').value = state.childName || '';
        
        document.querySelectorAll('.level-option').forEach(opt => {
            opt.classList.toggle('selected', parseInt(opt.dataset.level) === state.currentLevel);
        });
        
        document.querySelectorAll('.toggle').forEach(toggle => {
            const type = toggle.id.replace('-reminder', '');
            toggle.classList.toggle('active', state.reminders[type]);
        });
    };

    // Actions
    const toggleBook = (bookId) => {
        if (state.booksCompleted[bookId]) {
            delete state.booksCompleted[bookId];
        } else {
            state.booksCompleted[bookId] = { completedAt: new Date().toISOString() };
        }
        saveState();
        renderProgress();
        renderBooks();
        
        // Check if assessment should be unlocked
        const books = booksData[state.currentLevel] || [];
        const completed = books.filter(b => state.booksCompleted[b.id]).length;
        if (completed === books.length) {
            notify('Assessment unlocked! You can now take the level test.');
        }
    };

    const saveProfile = () => {
        const name = document.getElementById('child-name').value.trim();
        if (!name) {
            alert('Please enter your child\'s name');
            return;
        }
        state.childName = name;
        state.setupComplete = true;
        saveState();
        render();
        showScreen('progress');
        notify('Profile saved! Welcome to MyPhonics.');
    };

    const toggleReminder = (type) => {
        state.reminders[type] = !state.reminders[type];
        saveState();
        renderSettings();
        
        if (state.reminders[type] && 'Notification' in window) {
            Notification.requestPermission();
        }
    };

    const openAssessmentModal = () => {
        document.getElementById('modal-level').textContent = state.currentLevel;
        document.getElementById('assessment-modal').classList.add('active');
    };

    const closeModal = () => {
        document.getElementById('assessment-modal').classList.remove('active');
    };

    const submitAssessment = (result) => {
        state.assessments[state.currentLevel] = {
            result: result,
            completedAt: new Date().toISOString()
        };
        state.lastAssessment = new Date().toISOString();
        saveState();
        closeModal();
        renderProgress();
        renderAssessments();
        
        const messages = {
            'excellent': '🎉 Amazing! Ready for next level!',
            'good': '⭐ Great job! Keep practicing!',
            'needs-work': '📚 Good effort! Re-read current books.'
        };
        notify(messages[result]);
    };

    const advanceLevel = () => {
        if (state.currentLevel < 6) {
            state.currentLevel++;
            saveState();
            render();
            notify(`Level ${state.currentLevel} started! New books unlocked.`);
        }
    };

    const celebrateGraduation = () => {
        notify('🎓 Congratulations! All 6 levels completed!');
    };

    const openBook = (bookId) => {
        const url = bookReaders[bookId];
        if (url) {
            window.location.href = url;
        }
    };

    const resetData = () => {
        if (confirm('Reset all data? This cannot be undone.')) {
            localStorage.removeItem('myphonics-state');
            location.reload();
        }
    };

    const notify = (message) => {
        // In-app notification
        const div = document.createElement('div');
        div.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1E40AF; color: white; padding: 16px 24px; border-radius: 12px; z-index: 1000; font-weight: 500;';
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
        
        // Push notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('MyPhonics', { body: message });
        }
    };

    // Initialize when DOM ready
    document.addEventListener('DOMContentLoaded', init);

    // Public API
    return {
        showScreen,
        toggleBook,
        openBook,
        saveProfile,
        toggleReminder,
        openAssessmentModal,
        closeModal,
        submitAssessment,
        advanceLevel,
        celebrateGraduation,
        resetData
    };
})();
