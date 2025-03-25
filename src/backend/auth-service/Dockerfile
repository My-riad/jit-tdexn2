# Stage 1: Build stage
FROM node:18-slim AS builder
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./
# Copy source code
COPY src/ ./src/
# Copy common module for shared utilities and configurations
COPY ../common/ ../common/

# Build the TypeScript application
RUN npm run build
# Run tests to ensure build validity
RUN npm test

# Stage 2: Production stage
FROM node:18-slim
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files for production dependency installation
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port for the Authentication Service
EXPOSE 3001

# Define the command to start the application
CMD ["node", "dist/index.js"]