# Build stage
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Copy common module (referenced in tsconfig.json)
COPY ../common/ ../common/

# Build the TypeScript application
RUN npm run build

# Run tests to ensure the build is valid
RUN npm test

# Production stage
FROM node:18-slim

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files for dependency installation
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/kafkajs ./node_modules/kafkajs
COPY --from=builder /app/node_modules/@kafkajs ./node_modules/@kafkajs

# Create a non-root user and switch to it
RUN groupadd -r eventbus && useradd -r -g eventbus eventbus
RUN chown -R eventbus:eventbus /app
USER eventbus

# Expose port for the Event Bus service
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3030/health || exit 1

# Define the command to start the application
CMD ["node", "dist/index.js"]