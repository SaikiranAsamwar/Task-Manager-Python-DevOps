# Multi-stage build: Stage 1 - Prepare static files
FROM node:18-alpine AS builder

WORKDIR /app

# Copy frontend files
COPY . .

# Optional: If you need to build frontend assets (e.g., with npm/webpack)
# Uncomment these lines if you have a build process:
# RUN npm install
# RUN npm run build
# The built files would be in dist/ or build/ directory

# Stage 2 - Production Nginx server
FROM nginx:alpine

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy frontend files from builder stage
COPY --from=builder /app/templates /usr/share/nginx/html/templates
COPY --from=builder /app/css /usr/share/nginx/html/css
COPY --from=builder /app/js /usr/share/nginx/html/js

# Create cache directory
RUN mkdir -p /var/cache/nginx

# Expose port 80 for HTTP (and 443 for HTTPS if needed)
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
