package postgres

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"time"
)

// UserRepository is a "service" that uses the DB connection from db.go
type UserRepository struct {
	DB *ArthaDB
}

func NewUserRepository(db *ArthaDB) *UserRepository {
	return &UserRepository{DB: db}
}

// CreateMagicLink handles the database logic for initiating a signup/login.
func (r *UserRepository) CreateMagicLink(ctx context.Context, email string) (string, error) {
	// 1. Upsert the user (Insert if not exists, do nothing if they do)
	// We use RETURNING id to get the UUID for the token table
	var userID string
	query := `
		INSERT INTO users (email, created_at, updated_at) 
		VALUES ($1, NOW(), NOW()) 
		ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
		RETURNING id`

	err := r.DB.SQL.QueryRowContext(ctx, query, email).Scan(&userID)
	if err != nil {
		return "", err
	}

	// 2. Generate a high-entropy random token
	randomBytes := make([]byte, 16)
	_, err = rand.Read(randomBytes)
	if err != nil {
		return "", err
	}
	// Encode to string for the URL
	plainToken := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)

	// 3. Hash the token for storage (Security Best Practice)
	hash := sha256.Sum256([]byte(plainToken))

	// 4. Store in verification_tokens table (expires in 15 mins)
	tokenQuery := `
		INSERT INTO verification_tokens (token_hash, user_id, expiry) 
		VALUES ($1, $2, $3)`

	_, err = r.DB.SQL.ExecContext(ctx, tokenQuery, hash[:], userID, time.Now().Add(15*time.Minute))

	return plainToken, err
}
