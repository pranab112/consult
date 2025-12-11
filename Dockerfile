# Use official Node.js image
FROM node:20-alpine AS builder

# Force rebuild - cache bust
ENV REBUILD_DATE=2025-12-11-8

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --production=false
RUN cd backend && npm ci --production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN cd backend && npm ci --production

# Start the application
CMD ["npm", "start"]