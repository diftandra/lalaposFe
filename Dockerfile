# syntax=docker/dockerfile:1
# Lala PoS frontend: the Angular app is built inside Docker (Node 16, required by
# Angular 13), then served by nginx on 4200. nginx proxies /lala-pos/ to the
# backend service (see nginx.conf), so run it through lalapos-be/docker-compose.yml.

# ─── Build ────────────────────────────────────────────────────────────────────
FROM node:16-alpine AS build
WORKDIR /app

# Install dependencies first: reused until package*.json changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
RUN npm run build -- --configuration production

# ─── Runtime ──────────────────────────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/lala-pos/ /usr/share/nginx/html
EXPOSE 4200
