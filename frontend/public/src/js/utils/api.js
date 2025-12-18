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