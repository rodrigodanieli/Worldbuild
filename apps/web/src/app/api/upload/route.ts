import { NextResponse } from "next/server";
import { prisma } from "@worldbuild/database";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let projectId = formData.get("projectId") as string | null;
    const pageId = formData.get("pageId") as string | null;
    const cardId = formData.get("cardId") as string | null;
    let resource = (formData.get("resource") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    let page = null;
    let card = null;

    if (pageId) {
      page = await prisma.page.findUnique({
        where: { id: pageId },
        include: { world: { include: { shares: true } } },
      });
      if (page) {
        projectId = projectId || page.worldId;
        if (!resource) resource = "pagina_wiki";
      }
    } else if (cardId) {
      card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { world: { include: { shares: true } } },
      });
      if (card) {
        projectId = projectId || card.worldId;
        if (!resource) resource = "markdown_card";
      }
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Identificador do projeto (projectId), página ou card é obrigatório" },
        { status: 400 }
      );
    }

    // Valida permissão do usuário no projeto
    const world = await prisma.world.findUnique({
      where: { id: projectId },
      include: { shares: true },
    });

    if (!world) {
      return NextResponse.json({ error: "Projeto de campanha não encontrado" }, { status: 404 });
    }

    const isOwner = world.ownerId === currentUser.id;
    const isEditor = world.shares.some(
      (s) =>
        (s.sharedWithEmail === currentUser.email || s.sharedWithUserId === currentUser.id) &&
        s.role !== "viewer"
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json(
        { error: "Sem permissão para adicionar mídias neste projeto" },
        { status: 403 }
      );
    }

    // Validação universal de tipo: Imagem, Vídeo ou Áudio
    const mimeType = file.type || "application/octet-stream";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");
    const isAudio = mimeType.startsWith("audio/");

    if (!isImage && !isVideo && !isAudio) {
      return NextResponse.json(
        { error: "Formato de arquivo não suportado. Permitido apenas imagens, vídeos e áudios." },
        { status: 400 }
      );
    }

    const mediaType: "image" | "video" | "audio" = isImage
      ? "image"
      : isVideo
      ? "video"
      : "audio";

    // Padrão de recurso default se não especificado
    if (!resource) {
      resource = isImage ? "banner_card" : "markdown_wiki";
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gera hash único SHA-256 para nome do arquivo
    const hash = crypto.createHash("sha256").update(buffer).digest("hex").substring(0, 24);
    
    // Obtém extensão original
    let ext = path.extname(file.name).toLowerCase();
    if (!ext) {
      if (isImage) ext = ".png";
      else if (isVideo) ext = ".mp4";
      else if (isAudio) ext = ".mp3";
      else ext = ".bin";
    }

    const uniqueFilename = `${hash}${ext}`;

    // Garante que o diretório public/uploads exista
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, uniqueFilename);

    // Salva o arquivo no disco do servidor
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;

    // Salva na tabela unificada de mídias do projeto
    const media = await prisma.projectMedia.create({
      data: {
        projectId: world.id,
        userId: currentUser.id,
        originalName: file.name,
        hash,
        filename: uniqueFilename,
        format: mimeType,
        mediaType,
        sizeBytes: buffer.length,
        resource,
        url: publicUrl,
      },
    });

    // Mantém compatibilidade com assets legados se especificado pageId ou cardId
    if (page) {
      await prisma.pageAsset.create({
        data: {
          pageId: page.id,
          userId: currentUser.id,
          filename: uniqueFilename,
          originalName: file.name,
          mimeType,
          mediaType: isVideo ? "video" : "image",
          sizeBytes: buffer.length,
          url: publicUrl,
        },
      }).catch(() => {});
    } else if (card) {
      await prisma.cardAsset.create({
        data: {
          cardId: card.id,
          userId: currentUser.id,
          filename: uniqueFilename,
          originalName: file.name,
          mimeType,
          mediaType: isVideo ? "video" : "image",
          sizeBytes: buffer.length,
          url: publicUrl,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      media,
      asset: media,
    });
  } catch (error) {
    console.error("Erro no fluxo universal de upload de mídia:", error);
    return NextResponse.json({ error: "Erro interno ao processar upload" }, { status: 500 });
  }
}
