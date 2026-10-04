# -------------------------------------------------------
# Stage 1: Build the React/Vite app
# VITE_API_URL is intentionally left EMPTY so all /api/*
# requests are relative — nginx proxies them to the backend.
# This avoids baking a backend URL into the bundle.
# -------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer cached separately)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Build with VITE_API_URL="" so fetch("/api/...") hits the same origin.
# nginx on port 80 will proxy /api/* → Spring Boot backend.
RUN VITE_API_URL="" npm run build

# -------------------------------------------------------
# Stage 2: Serve with nginx
# -------------------------------------------------------
FROM nginx:1.27-alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built React SPA
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom nginx config (with /api proxy + SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
