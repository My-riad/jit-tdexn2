# Build stage: compile TypeScript to JavaScript
FROM node:18-slim AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy TypeScript configuration
COPY tsconfig.json ./
# Copy source code
COPY src/ ./src/

# Build the TypeScript application
RUN npm run build
# Run tests to ensure build validity
RUN npm test

# Production stage: create the final image
FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy package files for production dependency installation
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port for the Integration Service
EXPOSE 3001
# Define the command to start the application
CMD ["node", "dist/index.js"]