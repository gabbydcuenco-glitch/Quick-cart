# ---- base: pinned image; dependency files first for layer caching ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- test: Jenkins runs "docker build --target test"; a lint error fails the build ----
FROM base AS test
COPY . .
RUN npm run lint

# Vite development server behind the same public reverse proxy.
FROM base AS development
COPY . .
ENV VITE_BUILD_NUMBER=dev
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080", "--strictPort"]

# ---- build: compile the React app (the Jenkins build number is printed in the footer) ----
FROM base AS build
COPY . .
ARG BUILD_NUMBER=dev
ENV VITE_BUILD_NUMBER=$BUILD_NUMBER
RUN npm run build

# ---- production: only static files, served by non-root Nginx ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
