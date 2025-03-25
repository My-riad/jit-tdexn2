# Define the base image for the build stage
FROM node:18-slim AS builder

# Set the working directory for the build stage
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies including development dependencies
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Copy common module for shared utilities and types
COPY ../common/ ../common/

# Build the TypeScript application
RUN npm run build

# Run tests to ensure build validity
RUN npm test

# Define the base image for the production stage
FROM node:18-slim

# Set the working directory for the production stage
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files for production dependency installation
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Switch to non-root user for security
USER node

# Expose port for the Data Service
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Define the command to start the application
CMD ["node", "dist/index.js"]