FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY src ./src
COPY package*.json ./
EXPOSE 3001
CMD ["node", "src/app.js"]