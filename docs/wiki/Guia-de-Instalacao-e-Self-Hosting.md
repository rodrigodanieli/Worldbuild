# 🚀 Guia de Instalação e Self-Hosting

Este guia cobre todos os passos necessários para hospedar sua própria instância do **WorldBuild Hub** em um servidor dedicado, VPS (como Hetzner, DigitalOcean, Oracle Cloud, AWS, Linode) ou mesmo em um computador local / Raspberry Pi.

---

## 📋 Requisitos Mínimos do Sistema

| Componente | Opção SQLite (Padrão) | Opção PostgreSQL |
| :--- | :--- | :--- |
| **CPU** | 1 vCPU | 1 ou 2 vCPUs |
| **Memória RAM** | 512 MB a 1 GB | 1 GB a 2 GB |
| **Armazenamento** | 2 GB + espaço para mídias | 5 GB + espaço para mídias |
| **Sistema Operacional** | Linux (Ubuntu, Debian, Fedora), macOS, Windows | Qualquer com Docker |
| **Software Necessário** | Docker Engine 24+ & Docker Compose v2 | Docker Engine & Compose |

---

## ⚡ Método 1: Instalação Automática (Recomendado)

O repositório inclui instaladores interativos prontos para configurar o ambiente em poucos segundos.

### No Linux / macOS / WSL:
```bash
git clone https://github.com/seu-usuario/worldbuild.git
cd worldbuild
chmod +x install.sh
./install.sh
```

### No Windows (PowerShell):
```powershell
git clone https://github.com/seu-usuario/worldbuild.git
cd worldbuild
.\install.ps1
```

O assistente solicitará:
1. **Banco de Dados:** Escolha entre `1` (SQLite) ou `2` (PostgreSQL).
2. **Porta da Aplicação:** Padrão `3000` (ou defina `80`, `8080`, etc.).
3. O instalador configurará o arquivo `.env`, criará as pastas persistentes e inicializará os containers.

---

## 🐳 Método 2: Instalação Manual com Docker Compose

Caso prefira gerenciar seus arquivos manualmente:

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/worldbuild.git
cd worldbuild
```

### 2. Configurar o Arquivo `.env`
Copie o modelo de exemplo:
```bash
cp .env.example .env
```

Edite o arquivo `.env` para ajustar os parâmetros desejados:

#### Cenário A: Usando SQLite (Zero Infraestrutura / Mais Leve)
```env
PORT=3000
NODE_ENV=production
SESSION_SECRET="coloque-uma-chave-secreta-forte-aqui-com-mais-de-32-chars"
DATABASE_URL="file:/app/packages/database/prisma/dev.db"
```

Inicie o container:
```bash
docker compose up -d --build
```

#### Cenário B: Usando PostgreSQL (Alta Concorrência)
```env
PORT=3000
NODE_ENV=production
SESSION_SECRET="coloque-uma-chave-secreta-forte-aqui-com-mais-de-32-chars"

DATABASE_URL="postgresql://worldbuild:senha_forte_do_postgres@postgres:5432/worldbuild?schema=public"
POSTGRES_USER=worldbuild
POSTGRES_PASSWORD=senha_forte_do_postgres
POSTGRES_DB=worldbuild
POSTGRES_PORT=5432
COMPOSE_PROFILES=postgres
```

Inicie o container com o perfil de PostgreSQL ativado:
```bash
docker compose --profile postgres up -d --build
```

---

## ⚖️ Comparativo: SQLite vs PostgreSQL

Para ajudá-lo a escolher a melhor arquitetura para o seu caso de uso:

| Critério | SQLite (Padrão) | PostgreSQL |
| :--- | :--- | :--- |
| **Consumo de Memória** | Quase zero RAM extra (executa no mesmo processo) | ~80 MB a 200 MB de RAM adicionais |
| **Complexidade de Infra** | 1 único container Docker | 2 containers em rede interna |
| **Armazenamento** | Arquivo único em `./data/db/dev.db` | Volume do PostgreSQL em `./data/postgres` |
| **Backup** | Basta copiar o arquivo `dev.db` | Via `pg_dump` ou backup do volume |
| **Ideal Para** | Uso pessoal, mesas de 1 a 10 pessoas, Raspberry Pi, VPS de $3/mês | Servidores públicos, comunidades abertas, centenas de usuários |

---

## 🌐 Configuração de Proxy Reverso & SSL / HTTPS

Para disponibilizar o WorldBuild em seu domínio público (ex: `https://meurpg.meudominio.com`), recomendamos um proxy reverso.

### Opção A: Caddy Server (HTTPS Automático com Let's Encrypt)
O Caddy é a opção mais simples. Crie um arquivo `Caddyfile`:

```caddy
meurpg.meudominio.com {
    reverse_proxy localhost:3000
}
```
Inicie com `caddy run` e ele gerará e renovará certificados SSL automaticamente!

### Opção B: Nginx
Arquivo `/etc/nginx/sites-available/worldbuild`:

```nginx
server {
    server_name meurpg.meudominio.com;

    client_max_body_size 100M; # Permite uploads de mapas e imagens pesadas

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Gere o certificado SSL com certbot:
```bash
sudo certbot --nginx -d meurpg.meudominio.com
```

---

## 💾 Backups e Recuperação de Desastres

Todos os dados da sua aplicação são salvos no diretório `./data/` na raiz do projeto:

* `./data/db/`: Arquivo de banco de dados SQLite (`dev.db`).
* `./data/uploads/`: Todas as imagens, capas, avatares e mapas enviados.
* `./data/postgres/`: Dados do banco PostgreSQL (caso utilize este modo).

### Criando um Backup Manual (Modo SQLite):
```bash
# Compacta a pasta de dados inteira com data e hora
tar -czvf "backup-worldbuild-$(date +%Y%m%d_%H%M%S).tar.gz" ./data
```

### Criando um Backup Manual (Modo PostgreSQL):
```bash
docker exec -t worldbuild-postgres pg_dump -U worldbuild worldbuild > "backup-db-$(date +%Y%m%d).sql"
tar -czvf "backup-uploads-$(date +%Y%m%d).tar.gz" ./data/uploads
```

### Script de Backup Automático no Cron:
Adicione ao seu `crontab -e`:
```bash
0 3 * * * cd /caminho/do/worldbuild && tar -czf "/backups/worldbuild-$(date +\%F).tar.gz" ./data
```

---

## 🔄 Atualização de Versão

Para atualizar o WorldBuild Hub para uma nova versão sem perder seus dados:

```bash
# 1. Puxe as atualizações do Git
git pull origin main

# 2. Reconstrua o container
docker compose build

# 3. Reinicie a aplicação
docker compose up -d
```
O script de inicialização do container executará automaticamente as migrações do banco de dados na inicialização, preservando 100% dos seus cartões, páginas e mapas.

---

## 🛠️ Comandos de Manutenção

* **Ver logs em tempo real:**
  ```bash
  docker compose logs -f worldbuild
  ```
* **Parar a aplicação:**
  ```bash
  docker compose down
  ```
* **Reiniciar a aplicação:**
  ```bash
  docker compose restart
  ```
* **Status dos containers:**
  ```bash
  docker compose ps
  ```
