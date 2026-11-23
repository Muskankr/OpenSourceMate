# syntax=docker/dockerfile:1
FROM node:22-alpine

# Install libc6-compat for Turbo / SWC compatibility on Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Copy package specifications for cached dependency installation
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci

# Copy application source code
COPY . .

# Ensure ownership by non-root node user
RUN chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 3000

# Health check to ensure Next.js is serving traffic
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start Next.js development server binding to 0.0.0.0:3000
CMD ["npm", "run", "dev"]
