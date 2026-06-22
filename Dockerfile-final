# Multi-stage build para otimizar tamanho
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependências
COPY package.json package-lock.json ./

# Instalar
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

# ============================================================================
# Stage 2: Runtime (Produção)
FROM node:20-alpine

WORKDIR /app

# Instalar servidor estático
RUN npm install -g serve

# Copiar build
COPY --from=builder /app/dist ./dist

# Porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando
CMD ["serve", "-s", "dist", "-l", "3000"]
