// backend/cmd/api/main.go

package main

import (
	"log"
	"net/http" // ADD
	"os"

	"artha_backend/internal/config"
	"artha_backend/internal/data/postgres"
	"artha_backend/internal/server" // ADD
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file (for dev)
	if os.Getenv("ENV") != "production" {
		// NOTE: Assumes you are running 'go run cmd/api/main.go' from the project root
		if err := godotenv.Load(); err != nil {
			log.Println("Note: Could not load .env file. Falling back to OS environment.")
		}
	}

	// 1. Load config and CHECK FOR ERROR IMMEDIATELY
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Configuration error: %v", err)
	}

	// 2. Connect to DB
	dsn := cfg.DSN
	db, err := postgres.NewDB(dsn)
	if err != nil {
		log.Fatalf("could not connect to database: %v", err)
	}
	defer db.Close()

	// In main.go after db is initialized:
	userRepo := postgres.NewUserRepository(db)

	log.Println("Database connection established")

	// 3. Initialize and Start Server
	srv := server.NewServer(db, cfg, userRepo)

	log.Printf("Starting server on port %d...", cfg.Port)

	// ListenAndServe blocks until the server shuts down
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed to start: %v", err)
	}
}
