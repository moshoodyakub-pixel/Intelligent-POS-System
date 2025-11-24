# Stage 1: build
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --silent
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
