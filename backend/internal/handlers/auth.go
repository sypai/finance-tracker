package handlers

import (
	"artha_backend/internal/config"
	"artha_backend/internal/data"
	"artha_backend/internal/data/postgres"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	UserRepo *postgres.UserRepository
	Cfg      *config.Config
}

func (h *AuthHandler) HandleMagicLinkRequest(w http.ResponseWriter, r *http.Request) {
	var req data.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	// Generate the token and store in DB
	plainToken, err := h.UserRepo.CreateMagicLink(r.Context(), req.Email)
	if err != nil {
		log.Printf("Error creating magic link: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Use h.Cfg.BackendURL instead of "http://localhost:4000"
	magicLink := fmt.Sprintf("%s/api/v1/auth/verify?token=%s", h.Cfg.BackendURL, plainToken)
	log.Printf(">>> MAGIC LINK for %s: %s", req.Email, magicLink)

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"message": "If you have an account, a link has been sent."})
}

func (h *AuthHandler) HandleVerify(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Token is required", http.StatusBadRequest)
		return
	}

	// 1. Check token in DB
	userID, err := h.UserRepo.GetByToken(r.Context(), token)
	if err != nil {
		log.Printf("Verification failed: %v", err)
		http.Redirect(w, r, "https://finance-tracker-one-umber.vercel.app/signin.html?error=invalid_token", http.StatusSeeOther)
		return
	}

	// 2. Generate Session JWT
	sessionToken, err := h.GenerateToken(userID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// --- NEW INTELLIGENCE START ---
	// 3. Check if user profile is complete (Do they have a first name?)
	// We query the DB quickly to see who they are.
	var firstName sql.NullString // Use NullString to safely handle NULLs
	err = h.UserRepo.DB.SQL.QueryRowContext(r.Context(), "SELECT first_name FROM artha.users WHERE id = $1", userID).Scan(&firstName)

	// Default destination
	baseURL := "https://finance-tracker-one-umber.vercel.app" // Or your localhost for testing
	redirectURL := baseURL + "/dashboard.html"

	// If name is invalid or empty, send them to Welcome (Onboarding)
	if err == nil && (!firstName.Valid || firstName.String == "") {
		redirectURL = baseURL + "/welcome.html"
	}
	// --- NEW INTELLIGENCE END ---

	// 4. Redirect with token
	finalURL := fmt.Sprintf("%s?token=%s", redirectURL, sessionToken)
	http.Redirect(w, r, finalURL, http.StatusSeeOther)
}

func (h *AuthHandler) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	// Get userID from the context
	userID := r.Context().Value("userID").(string)

	var user struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
	}

	// --- FIX IS HERE: use COALESCE(first_name, '') ---
	// This converts NULL to "" so Go doesn't crash
	query := "SELECT id, email, COALESCE(first_name, '') FROM artha.users WHERE id = $1"

	err := h.UserRepo.DB.SQL.QueryRowContext(r.Context(), query, userID).Scan(&user.ID, &user.Email, &user.FirstName)

	if err != nil {
		// Log the actual error for debugging
		log.Printf("Error fetching user: %v", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	// 1. Get UserID from Context (set by Authenticate middleware)
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Decode Request
	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// 3. Update Database
	err := h.UserRepo.UpdateName(r.Context(), userID, req.FirstName, req.LastName)
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Profile updated"})
}

func (h *AuthHandler) GenerateToken(userID string) (string, error) {
	// Create the claims
	claims := jwt.MapClaims{
		"sub": userID,                                    // Subject (User ID)
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(), // Expires in 7 days
		"iat": time.Now().Unix(),                         // Issued at
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Use the secret from your config
	return token.SignedString([]byte(h.Cfg.JWTSecret))
}
