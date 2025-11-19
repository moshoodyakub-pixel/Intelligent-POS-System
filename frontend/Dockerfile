# Stage 1: build
FROM node:18-alpine as builder

WORKDIR /app
<<<<<<< Updated upstream

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

=======
COPY package*.json ./
RUN npm install --legacy-peer-deps --silent
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
>>>>>>> Stashed changes
CMD ["nginx", "-g", "daemon off;"]
