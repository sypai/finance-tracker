package data

type SignupRequest struct {
	Email string `json:"email"`
}

type APIResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
