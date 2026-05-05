# ── Stage 1: Build React Client ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/client

# Install dependencies first (layer cache)
COPY client/package.json client/package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY client/ ./
# Build production bundle. Since we'll serve it from the same Express server,
# REACT_APP_API_URL can be omitted so it uses relative paths (/)
RUN npm run build

# ── Stage 2: Serve Express + React ──────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app/server

# Install server production dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./

# Copy built React client from Stage 1 into the server's public folder
COPY --from=builder /app/client/build ./public

EXPOSE 5000

CMD ["node", "server.js"]
