# ==============================================================================
# OpenSourceMate Frontend Dockerfile (Next.js)
# ==============================================================================
# Multi-stage build with non-root security user (node:22-alpine)
# ==============================================================================

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=development

EXPOSE 3000

# Non-root user (node is uid 1000 in alpine)
USER node

CMD ["npm", "run", "dev"]
