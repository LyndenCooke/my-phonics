const STRIPE_API_URL = import.meta.env.VITE_STRIPE_API_URL || 'http://localhost:3001';

export const generateBookPreview = async (bookData) => {
    // Mock API call to backend - will be replaced with real PDF generation
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                previewUrl: "mock-preview.pdf",
                taskId: "mock-task-id",
                bookTitle: `The Adventure of ${bookData.childName || 'the Hero'}`,
            });
        }, 2000);
    });
};

export const createCheckoutSession = async (purchaseType, bookData) => {
    try {
        // Map purchaseType to your Stripe Price IDs
        // TODO: Replace with actual Price IDs from Stripe dashboard
        const priceMap = {
            'single': import.meta.env.VITE_STRIPE_PRICE_SINGLE || 'price_single_book',
            'pack': import.meta.env.VITE_STRIPE_PRICE_PACK || 'price_level_pack',
            'programme': import.meta.env.VITE_STRIPE_PRICE_PROGRAMME || 'price_full_programme',
        };

        const response = await fetch(`${STRIPE_API_URL}/api/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: priceMap[purchaseType],
                bookData: bookData,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to create checkout session');
        }

        const session = await response.json();
        return { url: session.url };

    } catch (error) {
        console.error("Error creating checkout session:", error);
        throw error;
    }
};
