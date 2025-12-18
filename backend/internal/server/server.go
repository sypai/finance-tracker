// backend/internal/server/server.go

package server

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"artha_backend/internal/config"
	"artha_backend/internal/data/postgres"
	"artha_backend/internal/handlers"
	"artha_backend/internal/middleware"
)

// NewServer sets up the router and returns the configured http.Server.
func NewServer(db *postgres.ArthaDB, cfg *config.Config, userRepo *postgres.UserRepository) *http.Server {

	// --- 1. Initialize Handlers ---
	// syncHandler := handlers.NewSyncHandler(db)

	// --- 2. Create the Router using http.NewServeMux() ---
	mux := http.NewServeMux()

	// --- 3. Register Routes (using Go 1.22 pattern) ---

	// Health Check Route (Public)
	mux.HandleFunc("GET /health", middleware.HealthCheck)

	// Inside NewServer func
	authHandler := handlers.AuthHandler{UserRepo: userRepo}

	// Register the route
	mux.HandleFunc("POST /api/v1/auth/magic-link", authHandler.HandleMagicLinkRequest)

	// Add this next to your signup route
	mux.HandleFunc("GET /api/v1/auth/verify", authHandler.HandleVerify)

	// // Example Protected Route
	// authenticatedSyncHandler := middleware.Authenticate(syncHandler)

	// Register the route with middleware
	mux.Handle("GET /api/v1/users/me", middleware.Authenticate(http.HandlerFunc(authHandler.HandleGetMe), cfg))
	// mux.Handle("POST /api/v1/sync", authenticatedSyncHandler)

	// --- 4. Chain the Middlewares ---
	// The order matters: from outermost (first called) to innermost (last called before handler)
	var finalHandler http.Handler = mux
	finalHandler = middleware.Logger(finalHandler)
	finalHandler = middleware.EnableCORS(finalHandler)

	// --- 5. Create the HTTP Server ---
	srv := &http.Server{
		Addr:         ":" + strconv.Itoa(cfg.Port), // Bind to the port from configuration
		Handler:      finalHandler,
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	log.Printf("Server configured to run on address: %s", srv.Addr)

	return srv
}
