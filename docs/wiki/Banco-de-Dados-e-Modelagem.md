# 🗄️ Modelagem do Banco de Dados & DER

O modelo de dados do **WorldBuild Hub** foi estruturado com o **Prisma ORM**, garantindo integridade referencial, deleções em cascata para evitar dados órfãos e suporte dinâmico tanto a **SQLite** quanto a **PostgreSQL**.

---

## 📊 Diagrama de Entidade-Relacionamento (DER)

```mermaid
erDiagram
    User ||--o{ World : "possui (owner)"
    User ||--o{ Page : "cria"
    User ||--o{ Card : "cria"
    User ||--o{ ProjectMedia : "envia"
    User ||--o| UserSettings : "configurações"

    World ||--o{ Board : "contém"
    World ||--o{ Card : "possui"
    World ||--o{ CardTag : "define tags"
    World ||--o{ Page : "contém"
    World ||--o{ WorldMap : "possui mapas"
    World ||--o{ WorldShare : "compartilha"
    World ||--o{ ProjectMedia : "armazena mídias"

    CardTag ||--o{ Card : "classifica"
    CardTag ||--o{ CardTagTemplate : "templates da tag"

    Card ||--o{ CardAsset : "anexos do card"

    Page ||--o{ PageRelation : "origem relação"
    Page ||--o{ PageRelation : "destino relação"
    Page ||--o{ PageShare : "compartilhamento direto"
    Page ||--o{ MapPin : "vinculado a pino"

    WorldMap ||--o{ MapPin : "contém pinos"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string avatarUrl
        datetime createdAt
    }

    World {
        string id PK
        string ownerId FK
        string name
        string slug UK
        string coverImage
        string whiteboardData
        boolean isPublic
    }

    Board {
        string id PK
        string worldId FK
        string name
        string description
        string data
        datetime createdAt
        datetime updatedAt
    }

    Card {
        string id PK
        string worldId FK
        string ownerId FK
        string tagId FK
        string title
        string slug
        string category
        string coverImage
        string icon
        string customFields
        string properties
        string contentMarkdown
        string contentJson
    }

    CardTag {
        string id PK
        string worldId FK
        string name
        string color
    }

    CardTagTemplate {
        string id PK
        string tagId FK
        string name
        string customFields
        string defaultProperties
    }

    Page {
        string id PK
        string worldId FK
        string ownerId FK
        string title
        string slug
        string parentId FK
        string contentMarkdown
        string properties
        boolean isSecret
    }

    ProjectMedia {
        string id PK
        string projectId FK
        string userId FK
        string originalName
        string hash
        string filename
        string format
        string mediaType
        int sizeBytes
        string resource
        string url
    }
```

---

## 📑 Dicionário das Principais Tabelas

### 1. `World` (Mundos / Projetos)
Representa um universo de RPG ou projeto de criação de mundo.
* `id`: Chave primária única (UUID).
* `ownerId`: Chave estrangeira para o `User` proprietário do mundo.
* `name`: Nome do universo (ex: *Reino de Eldoria*).
* `slug`: Identificador único amigável para URLs.
* `whiteboardData`: Estado serializado legado do quadro, migrado para a tabela `Board`.

### 2. `Board` (Quadros de Relacionamentos)
Armazena a disposição espacial de nós e conexões do Whiteboard do projeto.
* `id`: Chave primária única (UUID).
* `worldId`: Chave estrangeira com deleção em cascata (`onDelete: Cascade`).
* `name`: Nome do quadro (ex: *Quadro Principal*, *Intrigas da Corte*).
* `data`: JSON serializado contendo o array de nós (`nodes`) e arestas (`edges`) do React Flow.

### 3. `Card` (Cartões da Campanha)
Cartões com campos de contexto dinâmicos e conteúdo em markdown.
* `tagId`: Referência opcional à tag do card (`CardTag`).
* `customFields`: Definição JSON dos campos deste card (rótulo, tipo, tamanho).
* `properties`: Valores preenchidos dos campos estruturados (ex: `{"fld_1": "Valefundo"}`).
* `contentMarkdown`: Conteúdo textual principal, incluindo menções TipTap (`data-id`).

### 4. `CardTag` & `CardTagTemplate` (Tags e Templates Dinâmicos)
Permite a customização de categorias por projeto com cores e esquemas salvos.
* `CardTag.color`: Cor hexadecimal associada à tag (ex: `#38bdf8`).
* `CardTagTemplate`: Múltiplos modelos pré-configurados associados a uma mesma tag.

### 5. `Page` & `PageRelation` (Wiki de Campanha)
Documentação hierárquica em árvore de páginas.
* `parentId`: Auto-relacionamento para criação de subpáginas em árvore infinita.
* `isSecret`: Flag que oculta a página para usuários com permissão de jogador.
* `PageRelation`: Conexões semânticas entre páginas (ex: *capital de*, *aliado de*).

### 6. `ProjectMedia` (Gestão Central de Arquivos)
Armazenamento centralizado de mídias enviadas para o projeto.
* `hash`: Identificador criptográfico único do arquivo para evitar conflitos de nomes.
* `resource`: Classificação no formato `[RECURSO]_[FERRAMENTA]` (ex: `banner_card`, `avatar_card`, `pagina_wiki`).
* `url`: Link público de acesso (`/uploads/<hash>.<ext>`).

---

## 🔄 Flexibilidade de Bancos de Dados

O schema Prisma foi desenhado para ser agnóstico quanto ao mecanismo de persistência:
* No **SQLite**, campos do tipo JSON são armazenados como colunas `TEXT` serializadas, consumindo o mínimo de espaço.
* No **PostgreSQL**, o mesmo schema é mapeado com excelente indexação, aproveitando as constraints relacionais e transações ACID.
