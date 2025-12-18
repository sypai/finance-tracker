// frontend/src/js/utils/api.js

// Replace this with your actual Render URL from your dashboard
export const API_BASE_URL = "https://artha-backend-rf71.onrender.com";

/**
 * Checks the health of the backend server.
 * Backend endpoint: GET /health
 */
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text(); // Your backend sends "OK"
        return data === "OK";
    } catch (error) {
        console.error("Backend health check failed:", error);
        return false;
    }
}

export async function getMe() {
    const token = localStorage.getItem('artha_jwt');
    if (!token) throw new Error("No session found");

    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('artha_jwt');
        }
        throw new Error("Failed to fetch user profile");
    }

    return await response.json();
}