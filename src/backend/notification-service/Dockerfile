# Build stage
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies for build and testing
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Copy common module which may be referenced in tsconfig.json
COPY ../common/ ../common/

# Build the TypeScript application
RUN npm run build

# Run tests to ensure build validity
RUN npm test

# Production stage
FROM node:18-slim

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files for production dependency installation
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN groupadd -r notifyuser && useradd -r -g notifyuser notifyuser

# Set proper permissions
RUN chown -R notifyuser:notifyuser /app

# Switch to non-root user
USER notifyuser

# Expose port for the Notification Service
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3006/health || exit 1

# Define the command to start the application
CMD ["node", "dist/index.js"]