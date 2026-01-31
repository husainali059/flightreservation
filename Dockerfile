# Build server
FROM node:18 AS build-server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server ./
RUN npm run build

# Build client  
FROM node:18 AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Runner
FROM node:18 AS runner
WORKDIR /app

COPY server/package*.json ./server/
COPY server/prisma ./server/prisma

COPY --from=build-server /app/server/dist ./server/dist
COPY --from=build-client /app/client/dist ./client/dist

WORKDIR /app/server
RUN npm install --production
RUN npx prisma generate

EXPOSE 3000
CMD ["npx", "prisma", "migrate", "deploy", "&&", "node", "dist/index.js"]