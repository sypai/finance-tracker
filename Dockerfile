# Dockerfile (in project root)

# Stage 1: Build the Go application
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files
# We reference the files relative to the project root
COPY backend/go.mod backend/go.sum ./

# Copy the rest of the source code
COPY backend/ ./backend/

# Build the application
# We use CGO_ENABLED=0 to ensure the binary is statically linked and portable
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /go_app backend/cmd/api/main.go

# Stage 2: Create the final minimal image
FROM alpine:latest AS final

# Expose the port (Render will map this)
EXPOSE 4000

# Copy the compiled binary from the builder stage
COPY --from=builder /go_app /usr/local/bin/go_app

# Run the application
ENTRYPOINT ["/usr/local/bin/go_app"]