# Build stage
FROM node:18-slim AS builder
WORKDIR /app

# Copy package files to leverage layer caching
COPY package*.json ./
RUN npm ci

# Copy application source and config
COPY tsconfig.json ./
COPY src/ ./src/

# Copy common module - Note: This requires building from a context that includes the common directory
# Typically, this would be done by building from the parent directory:
# docker build -t tracking-service -f tracking-service/Dockerfile .
COPY ../common/ ../common/

# Build the application
RUN npm run build

# Run tests to verify the build
RUN npm test

# Production stage
FROM node:18-slim
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user and set ownership
RUN useradd -r trackinguser && \
    chown -R trackinguser:trackinguser /app

# Switch to non-root user
USER trackinguser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port for the service
EXPOSE 3000

# Define the command to start the application
CMD ["node", "dist/index.js"]