// backend/internal/handlers/sync.go

package handlers

import (
	"artha_backend/internal/data/postgres"
	"net/http"
)

// SyncHandler holds the DB connection pool.
type SyncHandler struct {
	DB *postgres.DB
}

// NewSyncHandler creates a new handler instance.
func NewSyncHandler(db *postgres.DB) *SyncHandler {
	return &SyncHandler{DB: db}
}

// ServeHTTP implements the http.Handler interface for the POST /api/v1/sync route.
func (h *SyncHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// PLACEHOLDER: Full logic comes later.
	w.WriteHeader(http.StatusNotImplemented)
	w.Write([]byte("Sync endpoint is live but not yet fully implemented."))
}
