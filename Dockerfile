# Corrected Dockerfile (in project root)

# Stage 1: Build the Go application
# Fix 1: Using Go 1.23 to satisfy go.mod requirement
FROM golang:1.23-alpine AS builder 

# Fix 2: Copy ALL contents of the backend module into the /app directory
COPY backend/ /app/

# Set the working directory to the root of the Go module
WORKDIR /app

# Download dependencies
RUN go mod download

# Build the application
# We use the relative path to main.go from the module root (/app)
# cmd/api/main.go is now correct because we are in the module's root directory (/app)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /go_app cmd/api/main.go

# Stage 2: Create the final minimal image
FROM alpine:latest AS final

# Expose the port (Render will map this)
EXPOSE 4000

# Copy the compiled binary from the builder stage
COPY --from=builder /go_app /usr/local/bin/go_app

# Run the application
ENTRYPOINT ["/usr/local/bin/go_app"]