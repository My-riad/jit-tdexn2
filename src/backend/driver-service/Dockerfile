# Build stage - version 18.18.0 as of Oct 2023
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files for layer caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Run tests to verify build
RUN npm test

# Production stage
FROM node:18-slim

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user to run the application
RUN mkdir -p /app/node_modules && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port for the Driver Service
EXPOSE 3002

# Health check to verify service is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3002/health || exit 1

# Define the command to start the application
CMD ["node", "dist/index.js"]