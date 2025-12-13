// backend/internal/config/config.go

package config

import (
	"errors"
	"os"
	"strconv" // ADD: Import for robust number parsing
)

// Config holds all application configuration settings.
type Config struct {
	Port      int    // Server port (e.g., 4000)
	DSN       string // Database Source Name (DSN)
	JWTSecret string // JWT signing key
}

// Load loads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		DSN:       os.Getenv("DATABASE_URL"), //
		JWTSecret: os.Getenv("JWT_SECRET"),
		Port:      4000, // Default port for local/dev
	}

	// 1. Check for REQUIRED variables
	if cfg.DSN == "" {
		return nil, errors.New("DATABASE_URL environment variable is not set")
	}
	// // ENABLE JWT_SECRET CHECK
	// if cfg.JWTSecret == "" {
	// 	return nil, errors.New("JWT_SECRET environment variable is not set")
	// }

	// 2. Robust PORT parsing for hosting services (like Render)
	if p := os.Getenv("PORT"); p != "" {
		portInt, err := strconv.Atoi(p)
		if err != nil {
			return nil, errors.New("PORT environment variable is not a valid integer")
		}
		cfg.Port = portInt
	}

	return cfg, nil
}
