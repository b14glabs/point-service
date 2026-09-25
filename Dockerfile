# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

RUN mkdir -p /app/certs && \
    wget -q https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    -O /app/certs/global-bundle.pem

# Only copy necessary files from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

EXPOSE 3001
CMD ["node", "./dist/index.js"]
