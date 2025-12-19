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
		INSERT INTO artha.users (email, created_at, updated_at) 
		VALUES ($1, NOW(), NOW()) 
		ON CONFLICT (email) DO UPDATE SET 
            last_login_at = NOW(),
            updated_at = NOW()
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
		INSERT INTO artha.verification_tokens (token_hash, user_id, expiry) 
		VALUES ($1, $2, $3)`

	_, err = r.DB.SQL.ExecContext(ctx, tokenQuery, hash[:], userID, time.Now().Add(15*time.Minute))

	return plainToken, err
}

func (r *UserRepository) UpdateName(ctx context.Context, userID, firstName, lastName string) error {
	query := `
		UPDATE artha.users 
		SET first_name = $1, last_name = $2, updated_at = NOW() 
		WHERE id = $3`

	_, err := r.DB.SQL.ExecContext(ctx, query, firstName, lastName, userID)
	return err
}

func (r *UserRepository) GetByToken(ctx context.Context, plainToken string) (string, error) {
	// 1. Hash the provided plain token to match what's in the DB
	hash := sha256.Sum256([]byte(plainToken))

	var userID string
	// 2. Find the token and ensure it hasn't expired
	query := `
		SELECT user_id FROM artha.verification_tokens 
		WHERE token_hash = $1 AND expiry > NOW()`

	err := r.DB.SQL.QueryRowContext(ctx, query, hash[:]).Scan(&userID)
	if err != nil {
		return "", err // Token not found or expired
	}

	// 3. Delete the token so it can't be used again (Single Use)
	_, _ = r.DB.SQL.ExecContext(ctx, "DELETE FROM artha.verification_tokens WHERE token_hash = $1", hash[:])

	return userID, nil
}
