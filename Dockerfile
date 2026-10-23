# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base

# Dependências essenciais do sistema para SQLite, OpenSSL e Next.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instala o gerenciador de pacotes pnpm correspondente ao monorepo
RUN npm install -g pnpm@10.0.0

WORKDIR /app

# -------------------------------------------------------------
# Estágio de Compilação (Builder)
# -------------------------------------------------------------
FROM base AS builder

# Copia manifestos de configuração e código fonte do monorepo
# (.dockerignore garante que node_modules locais e caches não sejam copiados)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps

# Instala dependências do monorepo nativamente no Linux
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/packages/database/prisma/dev.db"

# Gera os artefatos do Prisma Client para o ambiente Linux
RUN pnpm --filter @worldbuild/database db:generate

# Compila os pacotes TypeScript (@worldbuild/*) e a aplicação Next.js
RUN pnpm build

# -------------------------------------------------------------
# Estágio Final de Execução (Runner)
# -------------------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/packages/database/prisma/dev.db"

# Copia todo o workspace já instalado, compilado e otimizado
COPY --from=builder /app ./

# Configura o script de inicialização do container
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Garante os diretórios de persistência
RUN mkdir -p /app/apps/web/public/uploads && \
    mkdir -p /app/packages/database/prisma

EXPOSE 3000

# Ponto de entrada que aplica migrações e sobe o Next.js
ENTRYPOINT ["docker-entrypoint.sh"]
