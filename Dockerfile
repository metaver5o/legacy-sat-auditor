# =========================================================================
# STAGE 1: Build & Dependency Resolution
# =========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifest
COPY package.json ./

# Install only production dependencies without requiring a lockfile
RUN npm install --omit=dev

# =========================================================================
# STAGE 2: Lightweight Production Runtime
# =========================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5555

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs server.js index.html package.json ./

USER nodejs
EXPOSE 5555

CMD ["node", "server.js"]