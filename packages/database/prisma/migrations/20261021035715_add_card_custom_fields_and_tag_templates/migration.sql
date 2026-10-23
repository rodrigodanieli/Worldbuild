-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "tagId" TEXT,
    "icon" TEXT DEFAULT 'credit-card',
    "coverImage" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "properties" TEXT NOT NULL DEFAULT '{}',
    "customFields" TEXT NOT NULL DEFAULT '[]',
    "contentMarkdown" TEXT NOT NULL DEFAULT '',
    "contentJson" TEXT NOT NULL DEFAULT '{}',
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Card_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Card_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Card_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CardTag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Card" ("category", "contentJson", "contentMarkdown", "coverImage", "createdAt", "icon", "id", "isSecret", "ownerId", "properties", "slug", "tagId", "tags", "title", "updatedAt", "worldId") SELECT "category", "contentJson", "contentMarkdown", "coverImage", "createdAt", "icon", "id", "isSecret", "ownerId", "properties", "slug", "tagId", "tags", "title", "updatedAt", "worldId" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE INDEX "Card_worldId_slug_idx" ON "Card"("worldId", "slug");
CREATE INDEX "Card_ownerId_idx" ON "Card"("ownerId");
CREATE INDEX "Card_tagId_idx" ON "Card"("tagId");
CREATE TABLE "new_CardTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#38bdf8',
    "templateFields" TEXT NOT NULL DEFAULT '[]',
    "defaultBanner" TEXT,
    "defaultAvatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CardTag_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CardTag" ("color", "createdAt", "id", "name", "updatedAt", "worldId") SELECT "color", "createdAt", "id", "name", "updatedAt", "worldId" FROM "CardTag";
DROP TABLE "CardTag";
ALTER TABLE "new_CardTag" RENAME TO "CardTag";
CREATE INDEX "CardTag_worldId_idx" ON "CardTag"("worldId");
CREATE UNIQUE INDEX "CardTag_worldId_name_key" ON "CardTag"("worldId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
