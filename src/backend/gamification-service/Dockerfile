# Build stage: Compile TypeScript code
FROM node:18-slim AS builder
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Copy shared modules (referenced in tsconfig.json)
COPY ../common/ ../common/
COPY ../event-bus/ ../event-bus/

# Build the application
RUN npm run build
# Run tests to verify build
RUN npm test

# Production stage: Create optimized image
FROM node:18-slim
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN groupadd -r gamification && \
    useradd -r -g gamification gamification
USER gamification

# Expose service port
EXPOSE 3004

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3004/health || exit 1

# Define the command to start the application
CMD ["node", "dist/index.js"]