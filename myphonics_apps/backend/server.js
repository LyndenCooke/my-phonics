require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const Stripe = require('stripe');

const app = express();
const port = 8000;

// Initialize Stripe with the secret key from the environment
// Make sure to set STRIPE_SECRET_KEY in your .env
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// Mock assessment state
// Mock assessment state
const sessions = {};
const WORD_BANK = {
    1: ['s', 'a', 't', 'cat', 'the'],
    2: ['sh', 'ch', 'frog', 'stop', 'said'],
    3: ['ai', 'ee', 'boat', 'night', 'was'],
    4: ['stomp', 'crust', 'blim', 'fent', 'some'],
    5: ['a-e', 'ay', 'bake', 'ploat', 'their'],
    6: ['tion', 'cious', 'action', 'precious', 'through']
};

function generateQuestion(level) {
    const safeLevel = Math.min(Math.max(level, 1), 6);
    const bank = WORD_BANK[safeLevel];
    const word = bank[Math.floor(Math.random() * bank.length)];
    const types = ['sound', 'word', 'nonsense', 'tricky'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        id: 'q_' + Date.now() + '_' + Math.random(),
        stage: type,
        prompt: word,
        level: safeLevel
    };
}

app.post('/api/assessment/start', (req, res) => {
    const { child_name, starting_level } = req.body;
    const sessionId = Date.now().toString();
    const startLevel = parseInt(starting_level, 10) || 1;

    sessions[sessionId] = {
        level: startLevel,
        failures: 0,
        questionsInLevel: 0
    };

    res.json({
        session_id: sessionId,
        current_question: generateQuestion(startLevel),
        progress: { current_level: startLevel },
        is_complete: false
    });
});

app.post('/api/assessment/answer', (req, res) => {
    const { session_id, correct } = req.body;
    const session = sessions[session_id];
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.questionsInLevel++;
    if (!correct) session.failures++;

    // "until they fail 3 times that's when they stick at a level"
    if (session.failures >= 3) {
        return res.json({
            is_complete: true,
            result_level: session.level,
            progress: { current_level: session.level },
            current_question: null
        });
    }

    // Advance to next level after 4 questions in current level without failing out
    if (session.questionsInLevel >= 4) {
        session.level++;
        session.failures = 0;
        session.questionsInLevel = 0;

        // Cap at level 6 success
        if (session.level > 6) {
            return res.json({
                is_complete: true,
                result_level: 6,
                progress: { current_level: 6 },
                current_question: null
            });
        }
    }

    res.json({
        is_complete: false,
        current_question: generateQuestion(session.level),
        progress: { current_level: session.level }
    });
});

/*
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { priceId, bookData } = req.body;

        if (!priceId) {
            return res.status(400).json({ error: 'Price ID is required' });
        }

        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'hosted',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // Pass the bookData to metadata so we can use it in webhooks later
            payment_intent_data: {
                metadata: {
                    ...bookData,
                }
            },
            mode: 'payment',
            // Return URLs
            success_url: `http://localhost:5173/download?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/`,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});
*/

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
