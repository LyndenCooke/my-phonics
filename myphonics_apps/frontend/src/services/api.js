/**
 * API service for MyPhonicsBooks
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Make an API request
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Request failed: ${response.status}`);
    }

    return response.json();
}

// ============== User & Child API ==============

export async function createUser(email, name) {
    return request('/users', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
    });
}

export async function getUser(userId) {
    return request(`/users/${userId}`);
}

export async function createChild(userId, childData) {
    return request(`/users/${userId}/children`, {
        method: 'POST',
        body: JSON.stringify(childData),
    });
}

export async function getChildren(userId) {
    return request(`/users/${userId}/children`);
}

export async function updateChildLevel(childId, level) {
    return request(`/children/${childId}/level?level=${level}`, {
        method: 'PUT',
    });
}

// ============== Level & Template API ==============

export async function getLevels() {
    return request('/levels');
}

export async function getTemplates() {
    return request('/templates');
}

export async function matchTemplate(interest) {
    return request(`/templates/match/${encodeURIComponent(interest)}`);
}

// ============== Assessment API ==============

export async function startAssessment(childName = null) {
    return request('/api/assessment/start', {
        method: 'POST',
        body: JSON.stringify({ child_name: childName }),
    });
}

export async function submitAssessmentAnswer(sessionId, questionId, correct) {
    return request('/api/assessment/answer', {
        method: 'POST',
        body: JSON.stringify({
            session_id: sessionId,
            question_id: questionId,
            correct,
        }),
    });
}

export async function getAssessmentResult(sessionId) {
    return request(`/api/assessment/${sessionId}/result`);
}

// ============== Order API ==============

export async function createSingleBookOrder(orderData) {
    return request('/orders/single', {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
}

export async function createLevelPackOrder(orderData) {
    return request('/orders/level-pack', {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
}

export async function getOrderStatus(orderId) {
    return request(`/orders/${orderId}`);
}

// ============== Free Book API ==============

export async function requestFreeBook(childName, level, email) {
    return request('/api/free-book', {
        method: 'POST',
        body: JSON.stringify({
            child_name: childName,
            level,
            email,
        }),
    });
}

// ============== Validation API ==============

export async function validateText(text, level) {
    return request('/validate', {
        method: 'POST',
        body: JSON.stringify({ text, level }),
    });
}

export async function getWordBankStats(level) {
    return request(`/word-bank/stats/${level}`);
}

// ============== Child Books API ==============

export async function getChildBooks(childId) {
    return request(`/children/${childId}/books`);
}

export default {
    createUser,
    getUser,
    createChild,
    getChildren,
    updateChildLevel,
    getLevels,
    getTemplates,
    matchTemplate,
    startAssessment,
    submitAssessmentAnswer,
    getAssessmentResult,
    createSingleBookOrder,
    createLevelPackOrder,
    getOrderStatus,
    requestFreeBook,
    validateText,
    getWordBankStats,
    getChildBooks,
};
