# ---- base: pinned slim image; dependency files first for layer caching ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- test: Jenkins runs "docker build --target test"; a failing test fails the build ----
FROM base AS test
RUN npm ci
COPY . .
RUN npm test

# ---- production: small image, no dev dependencies, non-root user ----
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 3003
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3003/health || exit 1
USER node
CMD ["node", "src/server.js"]
