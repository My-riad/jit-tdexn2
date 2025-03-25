# Build stage: compile TypeScript code
FROM node:18-slim AS builder
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application and run tests
RUN npm run build
RUN npm test

# Production stage: create minimal production image
FROM node:18-slim
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Configure health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Expose port for the Market Intelligence Service
EXPOSE 3000

# Define the command to start the application
CMD ["node", "dist/index.js"]