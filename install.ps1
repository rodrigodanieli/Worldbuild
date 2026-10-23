# =========================================================================
# 🏰 WorldBuild Hub - Instalador Automático para Self-Hosting (Windows)
# =========================================================================

$ErrorActionPreference = "Stop"

Clear-Host
Write-Host "  __        __         _     _ ____        _ _     _   _   _       _     " -ForegroundColor Cyan
Write-Host "  \ \      / /__  _ __| | __| | __ ) _   _(_) | __| | | | | |_   _| |__  " -ForegroundColor Cyan
Write-Host "   \ \ /\ / / _ \| '__| |/ _` |  _ \| | | | | |/ _` | | |_| | | | | '_ \ " -ForegroundColor Cyan
Write-Host "    \ V  V / (_) | |  | | (_| | |_) | |_| | | | (_| | |  _  | |_| | |_) |" -ForegroundColor Cyan
Write-Host "     \_/\_/ \___/|_|  |_|\__,_|____/ \__,_|_|_|\__,_| |_| |_|\__,_|_.__/ " -ForegroundColor Cyan
Write-Host ""
Write-Host "Instalador Automático para Self-Hosting (Docker Compose)" -ForegroundColor Yellow
Write-Host "========================================================================="
Write-Host ""

# 1. Verifica pré-requisitos
Write-Host "🔍 Verificando se o Docker Desktop está em execução..." -ForegroundColor Yellow

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "❌ Docker não foi encontrado no PATH do sistema." -ForegroundColor Red
    Write-Host "Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    Exit 1
}

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ O serviço do Docker não parece estar rodando." -ForegroundColor Red
        Write-Host "Por favor, abra o Docker Desktop e aguarde inicializar antes de rodar o instalador." -ForegroundColor Red
        Exit 1
    }
} catch {
    Write-Host "❌ Erro ao comunicar com o Docker." -ForegroundColor Red
    Exit 1
}

Write-Host "✅ Docker Desktop detectado e ativo!" -ForegroundColor Green
Write-Host ""

# 2. Escolha do Banco de Dados
Write-Host "⚙️ Escolha a modalidade do banco de dados:" -ForegroundColor White
Write-Host "  1) SQLite" -ForegroundColor Cyan -NoNewline
Write-Host "     - Ultra-leve, zero infra extra (Ideal para uso pessoal e poupar recursos)"
Write-Host "  2) PostgreSQL" -ForegroundColor Cyan -NoNewline
Write-Host " - Alta concorrência, banco dedicado em container (Para servidores maiores)"
Write-Host ""

$dbChoice = Read-Host "Selecione a opção desejada [1 ou 2] (Padrão: 1)"
if ([string]::IsNullOrWhiteSpace($dbChoice)) { $dbChoice = "1" }

# 3. Porta da Aplicação
$appPort = Read-Host "Porta para rodar o WorldBuild no host (Padrão: 3000)"
if ([string]::IsNullOrWhiteSpace($appPort)) { $appPort = "3000" }

# 4. Geração de Segredo Aleatório
$bytes = New-Object byte[] 24
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
$randomSecret = [Convert]::ToBase64String($bytes) -replace '[^a-zA-Z0-9]', 'x'

# 5. Criação de pastas de dados
Write-Host "`n📁 Criando diretórios persistentes para dados e mídias..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "./data/db" | Out-Null
New-Item -ItemType Directory -Force -Path "./data/uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "./data/postgres" | Out-Null

# 6. Geração do .env
Write-Host "📝 Gerando arquivo .env de configuração..." -ForegroundColor Yellow

if ($dbChoice -eq "2") {
    $pgPassBytes = New-Object byte[] 16
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($pgPassBytes)
    $postgresPass = [Convert]::ToBase64String($pgPassBytes) -replace '[^a-zA-Z0-9]', 'a'

    $envContent = @"
PORT=$appPort
NODE_ENV=production
SESSION_SECRET=$randomSecret

# Configuração PostgreSQL
DATABASE_URL="postgresql://worldbuild:${postgresPass}@postgres:5432/worldbuild?schema=public"
POSTGRES_USER=worldbuild
POSTGRES_PASSWORD=$postgresPass
POSTGRES_DB=worldbuild
POSTGRES_PORT=5432
COMPOSE_PROFILES=postgres
"@
    Set-Content -Path ".env" -Value $envContent -Encoding UTF8
    $composeArgs = @("--profile", "postgres", "up", "-d", "--build")
    Write-Host "✅ Configuração PostgreSQL gravada no .env." -ForegroundColor Green
} else {
    $envContent = @"
PORT=$appPort
NODE_ENV=production
SESSION_SECRET=$randomSecret

# Configuração SQLite (Zero Infra)
DATABASE_URL="file:/app/packages/database/data/dev.db"
"@
    Set-Content -Path ".env" -Value $envContent -Encoding UTF8
    $composeArgs = @("up", "-d", "--build")
    Write-Host "✅ Configuração SQLite gravada no .env." -ForegroundColor Green
}

# 7. Executa Docker Compose
Write-Host "`n🚀 Subindo containers com Docker Compose..." -ForegroundColor Cyan
& docker compose @composeArgs

Write-Host "`n=========================================================================" -ForegroundColor Green
Write-Host "🎉 WorldBuild Hub instalado e iniciado com sucesso!" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Acesse no seu navegador: " -NoNewline
Write-Host "http://localhost:$appPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Contas de Demonstração pré-configuradas:" -ForegroundColor White
Write-Host "   • Mestre:  " -NoNewline -ForegroundColor White
Write-Host "mestre@worldbuild.com  (Senha: mestre123)" -ForegroundColor Yellow
Write-Host "   • Jogador: " -NoNewline -ForegroundColor White
Write-Host "jogador@rpg.com        (Senha: jogador123)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Comandos Úteis do Docker:" -ForegroundColor White
Write-Host "   • Ver logs em tempo real:   docker compose logs -f" -ForegroundColor Gray
Write-Host "   • Parar a aplicação:        docker compose down" -ForegroundColor Gray
Write-Host "   • Reiniciar a aplicação:    docker compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentação Completa disponível na pasta 'docs/' ou na Wiki do GitHub." -ForegroundColor Yellow
Write-Host "========================================================================="
