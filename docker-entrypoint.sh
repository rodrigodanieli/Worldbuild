#!/bin/sh
set -e

echo "======================================================"
echo "🏰 WorldBuild Hub - Inicializando Container Self-Hosted"
echo "======================================================"

mkdir -p /app/packages/database/prisma
mkdir -p /app/packages/database/data
mkdir -p /app/apps/web/public/uploads

SCHEMA_FILE="/app/packages/database/prisma/schema.prisma"

# Detecta se o banco configurado é PostgreSQL ou SQLite
if echo "$DATABASE_URL" | grep -qE '^postgres(ql)?://'; then
  echo "🐘 Modo detectado: PostgreSQL"
  echo "⚙️ Configurando provider do Prisma para PostgreSQL..."
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA_FILE"

  echo "⏳ Aguardando banco PostgreSQL responder..."
  node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    async function wait() {
      for (let i = 1; i <= 30; i++) {
        try {
          await prisma.$connect();
          console.log("✅ Conexão com PostgreSQL estabelecida com sucesso!");
          await prisma.$disconnect();
          process.exit(0);
        } catch (e) {
          console.log("   [" + i + "/30] Aguardando PostgreSQL ficar pronto...");
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      console.error("❌ Falha ao conectar no PostgreSQL após 60 segundos.");
      process.exit(1);
    }
    wait();
  '

  echo "📦 Sincronizando schema do banco no PostgreSQL..."
  pnpm --filter @worldbuild/database exec prisma generate
  pnpm --filter @worldbuild/database exec prisma db push --skip-generate

  # Verifica se o banco já possui usuários cadastrados
  SHOULD_SEED=$(node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    async function check() {
      try {
        const count = await prisma.user.count();
        if (count === 0) process.stdout.write("yes");
      } catch (e) {
        process.stdout.write("no");
      } finally {
        await prisma.$disconnect();
      }
    }
    check();
  ')

  if [ "$SHOULD_SEED" = "yes" ]; then
    echo "🌱 Banco PostgreSQL sem usuários. Executando seed inicial da campanha..."
    pnpm --filter @worldbuild/database db:seed || true
  fi

else
  echo "📦 Modo detectado: SQLite (Zero Infra / Leve)"
  echo "⚙️ Garantindo provider do Prisma como SQLite..."
  sed -i 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA_FILE"

  DB_FILE=$(echo "$DATABASE_URL" | sed 's/^file://')
  if [ -z "$DB_FILE" ]; then
    DB_FILE="/app/packages/database/data/dev.db"
  fi
  IS_NEW_DB=0
  if [ ! -f "$DB_FILE" ] && [ ! -f "/app/packages/database/prisma/dev.db" ]; then
    IS_NEW_DB=1
  fi
    IS_NEW_DB=1
  fi

  echo "📦 Sincronizando schema do banco SQLite..."
  pnpm --filter @worldbuild/database exec prisma generate
  pnpm --filter @worldbuild/database exec prisma db push --skip-generate

  if [ $IS_NEW_DB -eq 1 ]; then
    echo "🌱 Novo banco SQLite criado. Executando seed inicial com usuários de teste..."
    pnpm --filter @worldbuild/database db:seed || true
  fi
fi

echo "======================================================"
echo "✅ WorldBuild pronto para uso!"
echo "🌐 Acesse no seu navegador: http://localhost:${PORT:-3000}"
echo "======================================================"

cd /app/apps/web
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
