package data

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
)

// GenerateToken returns a random token and its SHA256 hash.
// 1. token: Send this to the user (email).
// 2. hash: Store this in the database.
func GenerateToken() (token string, hash string, err error) {
	// 1. Create a 16-byte random byte slice
	randomBytes := make([]byte, 16)
	_, err = rand.Read(randomBytes)
	if err != nil {
		return "", "", err
	}

	// 2. Encode to Base32 string (clean URL-safe string)
	// Output looks like: "QJ7X2Y..."
	token = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)

	// 3. Create SHA256 Hash of that string
	hashBytes := sha256.Sum256([]byte(token))
	hash = base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(hashBytes[:])

	return token, hash, nil
}
