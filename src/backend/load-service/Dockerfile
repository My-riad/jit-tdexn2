# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Copy common module if needed by this service
COPY ../common/ ../common/

# Build the TypeScript application
RUN npm run build

# Run tests to ensure the build is valid
RUN npm test

# Production stage
FROM node:18-slim

# Create app directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN groupadd -r loadservice && \
    useradd -r -g loadservice -s /bin/false loadservice && \
    chown -R loadservice:loadservice /app

# Switch to non-root user
USER loadservice

# Expose port used by the service
EXPOSE 3003

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3003/health || exit 1

# Define the command to start the service
CMD ["node", "dist/index.js"]