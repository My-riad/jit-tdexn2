# Builder stage for compiling TypeScript and installing dependencies
FROM node:18-slim AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy tsconfig.json and source code
COPY tsconfig.json ./
COPY src ./src

# Copy common module from parent directory
COPY ../common ./common

# Build the application using npm run build
RUN npm run build

# Prune development dependencies
RUN npm prune --production

# Production stage with minimal dependencies and security enhancements
FROM node:18-slim

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Set working directory
WORKDIR /usr/src/app

# Expose port 3000
EXPOSE 3000

# Install curl for health check
RUN apt-get update && apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user 'nodeuser'
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Change ownership of application files to nodeuser
RUN chown -R nodeuser:nodeuser /usr/src/app

# Switch to nodeuser for security
USER nodeuser

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD curl --fail http://localhost:3000/health || exit 1

# Add metadata labels
LABEL maintainer="Freight Optimization Team" \
      description="Cache Service for the AI-driven Freight Optimization Platform" \
      version="1.0.0"

# Set the default command to start the service
ENTRYPOINT ["node", "dist/index.js"]