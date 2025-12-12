// internal/config/config.go

package config

import (
	"errors"
	"os"
)

// Config holds all application configuration settings.
type Config struct {
	Port      int    // Server port (e.g., 4000)
	DSN       string // Database Source Name (DSN)
	JWTSecret string // JWT signing key
	// ... add any other configuration variables here
}

// Load loads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		// 1. Database DSN (Must be present)
		DSN: os.Getenv("DATABASE_URL"),

		// 2. JWT Secret (Must be present)
		JWTSecret: os.Getenv("JWT_SECRET"),

		// 3. Port (Can have a default)
		Port: 4000,
	}

	// Check for required variables
	if cfg.DSN == "" {
		return nil, errors.New("DATABASE_URL environment variable is not set")
	}
	// if cfg.JWTSecret == "" {
	// 	return nil, errors.New("JWT_SECRET environment variable is not set")
	// }

	// // Optional: Parse PORT environment variable if it exists
	// if p := os.Getenv("PORT"); p != "" {
	// 	// In a production app, you would use strconv.Atoi and handle errors here
	// 	// For simplicity, we assume a correct integer for now.
	// 	// For proper error handling, see step B.
	// }

	return cfg, nil
}
