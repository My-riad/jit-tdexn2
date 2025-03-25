# Build stage
FROM node:18-slim AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/
# Copy common module if needed by the service
COPY ../common/ ../common/

# Build the TypeScript application
RUN npm run build
# Run tests to ensure build validity
RUN npm test

# Production stage
FROM node:18-slim
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install wget for health check
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user for improved security
RUN useradd -m appuser
USER appuser

# Expose port for the API Gateway service
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Define the command to start the application
CMD ["node", "dist/index.js"]