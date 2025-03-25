# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy configuration files
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Copy common module if needed
COPY ../common/ ../common/

# Build the application
RUN npm run build

# Run tests to ensure build validity
RUN npm test

# Production stage
FROM node:18-slim

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files for production
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user to run the application
RUN groupadd -r loadmatcher && useradd -r -g loadmatcher loadmatcher
USER loadmatcher

# Expose the service port
EXPOSE 3004

# Define health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3004/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]