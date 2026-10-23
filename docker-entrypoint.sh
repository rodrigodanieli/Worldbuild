#!/bin/sh
set -e

echo "======================================================"
echo "🏰 WorldBuild - Inicializando Container de Produção"
echo "======================================================"

mkdir -p /app/packages/database/prisma
mkdir -p /app/apps/web/public/uploads

# Se o banco de dados não existir, cria e executa migrações + seed
if [ ! -f /app/packages/database/prisma/dev.db ]; then
  echo "📦 Banco de dados não encontrado. Criando SQLite e aplicando migrações..."
  pnpm --filter @worldbuild/database exec prisma migrate deploy
  echo "🌱 Executando seed inicial da campanha..."
  pnpm --filter @worldbuild/database db:seed || true
else
  echo "🔄 Banco de dados SQLite detectado. Sincronizando migrações..."
  pnpm --filter @worldbuild/database exec prisma migrate deploy || true
fi

echo "======================================================"
echo "✅ WorldBuild pronto para uso!"
echo "🌐 Acesse no seu navegador: http://localhost:3000"
echo "======================================================"

cd /app/apps/web
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
