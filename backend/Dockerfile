# ==============================================================================
# STAGE 1: Builder
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root manifest and workspace manifests for efficient caching
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy shared source and build it first
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# Copy backend source and compile TypeScript
COPY backend/ ./backend/
RUN npm run build --workspace=backend

# Prune devDependencies for production image
RUN npm prune --production

# ==============================================================================
# STAGE 2: Production Runner
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Security: Install curl for container health check & add non-root user
RUN apk add --no-cache curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S packleader -u 1001

ENV NODE_ENV=production
ENV PORT=3000

# Copy root node_modules and built workspaces
COPY --from=builder --chown=packleader:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=packleader:nodejs /app/shared/dist ./shared/dist
COPY --from=builder --chown=packleader:nodejs /app/shared/package.json ./shared/package.json
COPY --from=builder --chown=packleader:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=packleader:nodejs /app/backend/package.json ./backend/package.json
COPY --from=builder --chown=packleader:nodejs /app/package.json ./package.json

USER packleader

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

WORKDIR /app/backend

CMD ["node", "dist/index.js"]
