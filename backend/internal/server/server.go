package server

import (
	"fmt"
	"net/http"
	"time"

	"artha_backend/internal/config"
	"artha_backend/internal/data/postgres"
	"artha_backend/internal/handlers"
	"artha_backend/internal/middleware"
)

func NewServer(db *postgres.ArthaDB, cfg *config.Config, userRepo *postgres.UserRepository) *http.Server {

	// --- CRITICAL FIX HERE ---
	// You must pass 'Cfg: cfg' so the handler can access BackendURL and JWTSecret
	authHandler := &handlers.AuthHandler{
		UserRepo: userRepo,
		Cfg:      cfg,
	}
	// -------------------------

	mux := http.NewServeMux()

	// --- Public Routes ---
	mux.HandleFunc("GET /health", middleware.HealthCheck)
	mux.HandleFunc("POST /api/v1/auth/magic-link", authHandler.HandleMagicLinkRequest)
	mux.HandleFunc("GET /api/v1/auth/verify", authHandler.HandleVerify)

	// --- Protected Routes (Require Login) ---
	// We wrap these with the Authenticate middleware
	mux.Handle("GET /api/v1/users/me", middleware.Authenticate(http.HandlerFunc(authHandler.HandleGetMe), cfg))
	mux.Handle("PUT /api/v1/users/profile", middleware.Authenticate(http.HandlerFunc(authHandler.HandleUpdateProfile), cfg))

	// Middleware Stack (Logger -> Mux)
	// Note: CORS is handled in main.go, so we just wrap with Logger here
	var handler http.Handler = mux
	handler = middleware.Logger(handler)

	return &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      handler,
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
}
