package main

import (
	"log"
	"os"
	// Assuming you have internal packages like these:
	"artha_backend/internal/config"
	"artha_backend/internal/data/postgres"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file (for dev)
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("Note: Could not load .env file. Falling back to OS environment.")
		}
	}

	// 1. Load config and CHECK FOR ERROR IMMEDIATELY
	cfg, err := config.Load()
	if err != nil {
		// Stop execution if configuration (like DSN) failed to load
		log.Fatalf("Configuration error: %v", err)
	}

	// 2. ONLY proceed if config loaded successfully (cfg is not nil)
	dsn := cfg.DSN // Now safe to access cfg.DSN

	// 3. Connect to DB and use := for the first declaration of db
	db, err := postgres.NewDB(dsn)
	if err != nil {
		// Stop execution if DB connection failed
		log.Fatalf("could not connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Database connection established")

}
