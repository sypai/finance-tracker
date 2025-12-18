package handlers

import (
	"artha_backend/internal/data"
	"artha_backend/internal/data/postgres"
	"encoding/json"
	"log"
	"net/http"
)

type AuthHandler struct {
	UserRepo *postgres.UserRepository
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

	// LOGIC FOR SENDING EMAIL GOES HERE
	// For now, we'll log it so you can copy/paste it into your browser to test!
	log.Printf("MAGIC LINK for %s: http://localhost:4000/api/v1/verify?token=%s", req.Email, plainToken)

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"message": "If you have an account, a link has been sent."})
}
