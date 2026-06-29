# TanStack Start SSR — multi-stage build
# Nitro preset: node-server → output em .output/server/index.mjs

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/.output ./.output

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://localhost:8080/api/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

CMD ["node", ".output/server/index.mjs"]
