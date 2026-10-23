#!/usr/bin/env bash
# =========================================================================
# 🏰 WorldBuild Hub - Instalador Automático para Self-Hosting
# Compatível com Linux, macOS e Windows WSL
# =========================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}${BOLD}"
echo "  __        __         _     _ ____        _ _     _   _   _       _     "
echo "  \ \      / /__  _ __| | __| | __ ) _   _(_) | __| | | | | |_   _| |__  "
echo "   \ \ /\ / / _ \| '__| |/ _\` |  _ \| | | | | |/ _\` | | |_| | | | | '_ \ "
echo "    \ V  V / (_) | |  | | (_| | |_) | |_| | | | (_| | |  _  | |_| | |_) |"
echo "     \_/\_/ \___/|_|  |_|\__,_|____/ \__,_|_|_|\__,_| |_| |_|\__,_|_.__/ "
echo -e "${NC}"
echo -e "${BOLD}Instalador Automático para Self-Hosting (Docker Compose)${NC}"
echo -e "========================================================================="
echo ""

# 1. Verifica pré-requisitos do sistema
echo -e "${YELLOW}🔍 Verificando pré-requisitos do ambiente...${NC}"

if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker não foi encontrado no sistema.${NC}"
    echo "Por favor, instale o Docker antes de continuar: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose não foi encontrado.${NC}"
    echo "Por favor, instale o plugin do Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker e Docker Compose detectados com sucesso!${NC}\n"

# 2. Escolha do Banco de Dados
echo -e "${BOLD}⚙️ Escolha a modalidade do banco de dados:${NC}"
echo -e "  ${CYAN}1) SQLite${NC}     - Ultra-leve, zero infraestrutura extra (Recomendado para VPS básica, Raspberry Pi ou pequenos grupos)"
echo -e "  ${CYAN}2) PostgreSQL${NC} - Alta concorrência, banco de dados dedicado em container (Ideal para servidores maiores e múltiplos mestres)"
echo ""

read -rp "Selecione a opção desejada [1 ou 2] (Padrão: 1): " DB_CHOICE
DB_CHOICE=${DB_CHOICE:-1}

# 3. Definição da Porta HTTP
read -rp "Porta para rodar o WorldBuild no host (Padrão: 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}

# 4. Geração de Segredo de Sessão Aleatório
RANDOM_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 36 2>/dev/null || date +%s | sha256sum | base64 | head -c 36)

# 5. Criação das pastas de dados persistentes locais
echo -e "\n${YELLOW}📁 Criando diretórios persistentes para dados e mídias...${NC}"
mkdir -p ./data/db
mkdir -p ./data/uploads
mkdir -p ./data/postgres

# 6. Geração do arquivo .env
echo -e "${YELLOW}📝 Gerando arquivo .env de configuração...${NC}"

if [ "$DB_CHOICE" = "2" ]; then
    POSTGRES_PASS=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 24 2>/dev/null || echo "worldbuild_secure_pass_$(date +%s)")
    cat <<EOF > .env
PORT=${APP_PORT}
NODE_ENV=production
SESSION_SECRET=${RANDOM_SECRET}

# Configuração PostgreSQL
DATABASE_URL="postgresql://worldbuild:${POSTGRES_PASS}@postgres:5432/worldbuild?schema=public"
POSTGRES_USER=worldbuild
POSTGRES_PASSWORD=${POSTGRES_PASS}
POSTGRES_DB=worldbuild
POSTGRES_PORT=5432
COMPOSE_PROFILES=postgres
EOF
    COMPOSE_CMD="docker compose --profile postgres"
    echo -e "${GREEN}✅ Configuração PostgreSQL gravada no .env.${NC}"
else
    cat <<EOF > .env
PORT=${APP_PORT}
NODE_ENV=production
SESSION_SECRET=${RANDOM_SECRET}

# Configuração SQLite (Zero Infra)
DATABASE_URL="file:/app/packages/database/data/dev.db"
EOF
    COMPOSE_CMD="docker compose"
    echo -e "${GREEN}✅ Configuração SQLite gravada no .env.${NC}"
fi

# 7. Inicialização dos Containers via Docker Compose
echo -e "\n${CYAN}🚀 Subindo containers com Docker Compose...${NC}"
$COMPOSE_CMD up -d --build

echo -e "\n${GREEN}=========================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 WorldBuild Hub instalado e iniciado com sucesso!${NC}"
echo -e "${GREEN}=========================================================================${NC}"
echo ""
echo -e "🌐 Acesse no seu navegador: ${CYAN}${BOLD}http://localhost:${APP_PORT}${NC}"
echo ""
echo -e "${BOLD}🔑 Contas de Demonstração pré-configuradas:${NC}"
echo -e "   • ${BOLD}Mestre:${NC}  mestre@worldbuild.com  (Senha: mestre123)"
echo -e "   • ${BOLD}Jogador:${NC} jogador@rpg.com        (Senha: jogador123)"
echo ""
echo -e "${BOLD}📋 Comandos Úteis do Docker:${NC}"
echo -e "   • Ver logs em tempo real:   ${CYAN}$COMPOSE_CMD logs -f${NC}"
echo -e "   • Parar a aplicação:        ${CYAN}$COMPOSE_CMD down${NC}"
echo -e "   • Reiniciar a aplicação:    ${CYAN}$COMPOSE_CMD restart${NC}"
echo ""
echo -e "${YELLOW}📖 Documentação Completa disponível na pasta 'docs/' ou na Wiki do GitHub.${NC}"
echo -e "========================================================================="
