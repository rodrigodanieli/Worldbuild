# 🔌 Referência de APIs & Integrações

O **WorldBuild Hub** disponibiliza um conjunto completo de endpoints RESTful para consulta, criação e automação programática dos seus universos.

Todas as rotas de API residem sob o prefixo `/api/` e utilizam o formato **JSON** para requisições e respostas.

---

## 🔒 Autenticação & Sessão

A autenticação é gerenciada através de cookies seguros de sessão (`worldbuild_session`).

### 1. `POST /api/auth/login`
Realiza o login de um usuário existente.
* **Corpo da Requisição:**
  ```json
  {
    "email": "mestre@worldbuild.com",
    "password": "sua-senha-aqui"
  }
  ```
* **Resposta (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-uuid",
      "name": "Mestre dos Magos",
      "email": "mestre@worldbuild.com"
    }
  }
  ```

### 2. `POST /api/auth/register`
Registra uma nova conta de usuário no sistema.

### 3. `GET /api/auth/me`
Retorna os dados do usuário logado na sessão ativa.

---

## 🗂️ Cards de Campanha & Tags

### 1. `GET /api/cards?worldId={projectId}`
Lista todos os cards do projeto ordenados por data de criação.

### 2. `POST /api/cards`
Cria um novo card de campanha.
* **Corpo da Requisição:**
  ```json
  {
    "worldId": "world-uuid",
    "title": "Dragão Vermelho Ignis",
    "category": "Monstros",
    "tagId": "tag-uuid-opcional",
    "contentMarkdown": "# Detalhes do Monstro..."
  }
  ```

### 3. `PUT /api/cards/{cardId}`
Atualiza campos, conteúdo em markdown ou capa do card.
* **Corpo da Requisição:**
  ```json
  {
    "title": "Novo Título",
    "contentMarkdown": "# Conteúdo atualizado com @Menção...",
    "properties": {
      "fld_idade": "350 anos",
      "fld_origem": "card:2b5de6c2"
    }
  }
  ```

### 4. `GET /api/cards/tags?worldId={projectId}`
Lista as tags personalizadas e suas cores cadastradas para o projeto.

### 5. `POST /api/cards/tags/{tagId}/templates`
Salva uma configuração de campos de contexto como um novo template reutilizável para a tag.

---

## 📊 Boards de Relacionamentos

### 1. `GET /api/projects/{projectId}/boards`
Lista todos os quadros criados para o projeto. Se nenhum quadro existir, cria o padrão "Quadro Principal" automaticamente.

### 2. `POST /api/projects/{projectId}/boards`
Cria um novo quadro no projeto.
* **Corpo da Requisição:**
  ```json
  {
    "name": "Relações de Facções",
    "description": "Mapeamento das guildas e seus líderes",
    "data": { "nodes": [], "edges": [] }
  }
  ```

### 3. `PUT /api/projects/{projectId}/boards/{boardId}`
Atualiza o nome, descrição ou o estado serializado dos nós e arestas (`data`).

### 4. `DELETE /api/projects/{projectId}/boards/{boardId}`
Exclui um quadro do projeto (não permite a exclusão se for o único quadro restante).

---

## 📖 Páginas da Wiki

### 1. `GET /api/pages?worldId={projectId}`
Retorna a árvore hierárquica de páginas da campanha.

### 2. `POST /api/pages`
Cria um novo artigo na wiki.
* **Corpo da Requisição:**
  ```json
  {
    "worldId": "world-uuid",
    "title": "História Antiga de Eldoria",
    "parentId": null,
    "contentMarkdown": "# Introdução Histórica...",
    "isSecret": false
  }
  ```

### 3. `PUT /api/pages/{pageId}`
Atualiza título, propriedades estruturadas ou texto markdown do artigo.

---

## 🖼️ Upload Universal de Mídias

### 1. `POST /api/upload`
Endpoint assíncrono para ingestão de arquivos (imagens, banners, avatares e mapas).
* **Tipo:** `multipart/form-data`
* **Campos do Formulário:**
  * `file`: Arquivo binário a ser enviado.
  * `projectId`: ID do projeto proprietário da mídia.
  * `resource`: Identificador do recurso no formato `[RECURSO]_[FERRAMENTA]` (ex: `banner_card`, `avatar_card`, `pagina_wiki`, `markdown_card`).
* **Resposta (201 Created):**
  ```json
  {
    "success": true,
    "url": "/uploads/fce66c433277cdc6c9651e14.jpg",
    "media": {
      "id": "media-uuid",
      "originalName": "mapa_mundo.jpg",
      "hash": "fce66c433277cdc6c9651e14",
      "format": "image/jpeg",
      "sizeBytes": 204850,
      "resource": "banner_card"
    }
  }
  ```

### 2. `GET /api/media?projectId={id}&resource={resource}`
Consulta a galeria de mídias já enviadas para aquele projeto filtradas pelo contexto desejado (ideal para reutilização rápida de banners ou avatares já existentes).
