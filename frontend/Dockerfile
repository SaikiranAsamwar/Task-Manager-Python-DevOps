# Build stage
FROM nginx:alpine AS builder

WORKDIR /build
COPY . .

# Production stage
FROM nginx:alpine

COPY --from=builder /build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
