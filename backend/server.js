require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const port = 3001;

// Initialize Stripe with the secret key from the environment
// Make sure to set STRIPE_SECRET_KEY in your .env
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
