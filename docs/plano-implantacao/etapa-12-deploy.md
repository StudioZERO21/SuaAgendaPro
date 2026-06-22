# ETAPA 12 — Deploy, VPS e CI/CD

**Status:** 🔴 Não iniciado  
**Prioridade:** Alta (produção)  
**Estimativa:** 3–4 dias  
**Dependências:** Todas as etapas anteriores

---

## Contexto

Os Dockerfiles (`Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`) já existem no projeto. Esta etapa configura o ambiente de produção em VPS, Nginx como reverse proxy, SSL, e pipeline CI/CD automático via GitHub Actions.

---

## Objetivo

App rodando em produção na VPS com HTTPS, deploy automático via push no GitHub, Supabase cloud configurado, backups automáticos e monitoramento básico.

---

## Arquitetura de Produção

```
Internet → Cloudflare (CDN + DDoS) 
  → Nginx (443/SSL) 
    → App Docker (porta 3000)
    → Supabase Cloud (externo)
    → Evolution Go Docker (WhatsApp)

VPS (mínimo: 2vCPU, 4GB RAM, 40GB SSD)
├── nginx (reverse proxy)
├── certbot (Let's Encrypt SSL)
├── suaagendapro (app Docker)
└── evolution-go (WhatsApp)
```

---

## Checklist de Execução

### Supabase Cloud (Produção)
- [ ] Criar projeto no Supabase Cloud (app.supabase.com)
- [ ] Aplicar todas as migrations no projeto cloud:
  ```bash
  supabase db push --db-url postgresql://...
  ```
- [ ] Copiar variáveis de ambiente do Supabase Cloud
- [ ] Configurar RLS e testar em produção
- [ ] Habilitar backups automáticos (diários)
- [ ] Configurar e-mail templates (confirmação, reset senha)

### Dockerfile de Produção
- [ ] Revisar `Dockerfile` para build multi-stage:
  ```dockerfile
  # Stage 1: Build
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json .
  RUN npm ci --production=false
  COPY . .
  RUN npm run build
  
  # Stage 2: Runtime
  FROM node:20-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  COPY --from=builder /app/.output .
  EXPOSE 3000
  CMD ["node", "server/index.mjs"]
  ```
- [ ] Verificar que `npm run build` gera `.output/` corretamente (TanStack Start/Nitro)
- [ ] Testar imagem Docker localmente:
  ```bash
  docker build -t suaagendapro:prod .
  docker run -p 3000:3000 --env-file .env suaagendapro:prod
  ```
- [ ] Imagem < 500MB (usar Alpine)

### docker-compose.yml (Produção)
- [ ] Criar `docker-compose.prod.yml`:
  ```yaml
  version: '3.8'
  services:
    app:
      image: suaagendapro:latest
      restart: always
      ports:
        - "3000:3000"
      env_file: .env.production
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
        interval: 30s
        timeout: 10s
        retries: 3
  ```

### Configuração da VPS

**Setup inicial (rodar via SSH):**
- [ ] Instalar Docker + Docker Compose
- [ ] Instalar Nginx
- [ ] Instalar Certbot
- [ ] Criar usuário não-root `deployer`
- [ ] Configurar SSH key para deploy automático
- [ ] Abrir portas: 22 (SSH), 80 (HTTP), 443 (HTTPS)

**Nginx (`/etc/nginx/sites-available/suaagendapro`):**
- [ ] Criar config de Nginx:
  ```nginx
  server {
    listen 80;
    server_name suaagenda.pro www.suaagenda.pro;
    return 301 https://$host$request_uri;
  }
  
  server {
    listen 443 ssl http2;
    server_name suaagenda.pro www.suaagenda.pro;
    
    ssl_certificate /etc/letsencrypt/live/suaagenda.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/suaagenda.pro/privkey.pem;
    
    location / {
      proxy_pass http://localhost:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_cache_bypass $http_upgrade;
    }
  }
  ```
- [ ] SSL com Let's Encrypt: `certbot --nginx -d suaagenda.pro -d www.suaagenda.pro`
- [ ] Auto-renovação SSL: `crontab -e → 0 3 * * * certbot renew`

### Variáveis de Ambiente Produção (`.env.production`)
- [ ] `SUPABASE_URL` (cloud)
- [ ] `SUPABASE_PUBLISHABLE_KEY` (cloud)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (cloud, NUNCA expor no client)
- [ ] `MP_CLIENT_ID`, `MP_CLIENT_SECRET` (produção MP)
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
- [ ] `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- [ ] Guardar no GitHub Secrets

### GitHub Actions (CI/CD)
- [ ] Criar `.github/workflows/deploy.yml`:
  ```yaml
  name: Deploy to Production
  on:
    push:
      branches: [main]
  
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        
        - name: Build Docker image
          run: docker build -t suaagendapro:${{ github.sha }} .
        
        - name: Push to Registry
          run: |
            echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
            docker push suaagendapro:${{ github.sha }}
        
        - name: Deploy to VPS
          uses: appleboy/ssh-action@v1
          with:
            host: ${{ secrets.VPS_HOST }}
            username: deployer
            key: ${{ secrets.VPS_SSH_KEY }}
            script: |
              docker pull suaagendapro:${{ github.sha }}
              docker-compose -f docker-compose.prod.yml up -d --no-deps app
              docker image prune -f
  ```
- [ ] Adicionar GitHub Secrets no repositório
- [ ] Testar pipeline: push na main → deploy automático

### Health Check
- [ ] Criar rota `src/routes/api/health.ts`:
  ```typescript
  // Retorna { status: 'ok', timestamp: '...' }
  // Verifica conexão com Supabase
  ```
- [ ] Nginx verifica `/api/health` a cada 30s
- [ ] UptimeRobot (gratuito) monitorando https://suaagenda.pro/api/health

### Domínio e DNS
- [ ] Apontar DNS: `A record` → IP da VPS
- [ ] `CNAME www` → `suaagenda.pro`
- [ ] Aguardar propagação (até 48h)
- [ ] Verificar HTTPS funcionando

### Verificações Pós-Deploy
- [ ] App acessível em https://suaagenda.pro
- [ ] Login e cadastro funcionam em produção
- [ ] Supabase cloud conectado
- [ ] Mercado Pago com credenciais de produção
- [ ] WhatsApp com instância de produção
- [ ] PWA instalável na URL de produção
- [ ] Lighthouse score ≥ 85 em produção

---

## Arquivos a Criar/Editar

```
Dockerfile                               ← EDITAR (otimizar)
docker-compose.prod.yml                  ← CRIAR
.github/workflows/deploy.yml             ← CRIAR
src/routes/api/health.ts                 ← CRIAR
nginx/suaagendapro.conf                  ← CRIAR (no servidor)
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- App rodando em https://suaagenda.pro com HTTPS
- Deploy automático funciona via GitHub Actions
- Todas as integrações funcionando em produção
- Monitoramento ativo (UptimeRobot)
- Backups Supabase configurados
