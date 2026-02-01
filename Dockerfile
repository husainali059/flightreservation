# Build stage for monorepo
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy all workspace source
COPY shared ./shared
COPY server ./server
COPY client ./client

# Install all dependencies in root (npm workspaces)
RUN npm install --verbose

# Build shared
RUN npm run -w shared build

# Build server  
RUN npm run -w server build

# Build client
RUN npm run -w client build

# Runtime stage - lean production image
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV CLIENT_DIR=/app/client/dist

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma

# Copy root node_modules from builder (contains all workspace deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy built server code
COPY --from=builder /app/server/dist ./server/dist

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Generate Prisma client in runtime image
RUN cd /app/server && npx prisma generate

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start script - just start server (migrations already applied in Supabase)
CMD ["sh", "-c", "node /app/server/dist/index.js"]