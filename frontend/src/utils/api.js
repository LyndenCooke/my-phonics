export const generateBookPreview = async (bookData) => {
    // Mock API call to backend
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
        const priceMap = {
            'single': 'price_1T4PAFAertTaNZcqWbbR3nX6', // One Customised Book
            'pack': 'price_987654321', // Replace with actual Price ID for Level Pack
            'programme': 'price_abcdefghi', // Replace with actual Price ID for Full Programme
        };

        // Use the product ID from the screenshot if single
        if (purchaseType === 'single') {
            // Price ID map already handles this
        }

        const response = await fetch('http://localhost:3001/api/create-checkout-session', {
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
            throw new Error('Network response was not ok');
        }

        const session = await response.json();
        return { url: session.url };

    } catch (error) {
        console.error("Error creating checkout session:", error);
        throw error;
    }
};
