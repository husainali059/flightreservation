# Multi-stage: build client and server, then run server (client served by same process or separate in production)
FROM node:20-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
RUN npm ci

# Build shared
FROM base AS build-shared
COPY --from=deps /app/node_modules ./node_modules
COPY shared ./shared
WORKDIR /app/shared
RUN npm run build

# Build client
FROM base AS build-client
COPY --from=deps /app/node_modules ./node_modules
COPY client ./client
COPY shared ./shared
COPY --from=build-shared /app/shared/dist ./shared/dist
WORKDIR /app/client
ENV VITE_API_URL=/api
RUN npm run build

# Build server
FROM base AS build-server
COPY --from=deps /app/node_modules ./node_modules
COPY server ./server
COPY shared ./shared
COPY --from=build-shared /app/shared/dist ./shared/dist
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY server ./server
COPY --from=build-server /app/server/dist ./server/dist
COPY --from=build-server /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=build-client /app/client/dist ./client/dist
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "dist/index.js"]
