import { ProjectMediaItem } from "@/components/cards/card-context-types";

export interface UploadMediaOptions {
  file: File | Blob;
  projectId: string;
  resource: string; // e.g. "banner_card", "avatar_card", "markdown_card", "pagina_wiki", "markdown_wiki"
  cardId?: string;
  pageId?: string;
  customFilename?: string;
}

export interface UploadMediaResponse {
  success: boolean;
  url: string;
  media: ProjectMediaItem;
  error?: string;
}

/**
 * Realiza upload assíncrono e universal de imagem, vídeo ou áudio para o servidor.
 */
export async function uploadUniversalMedia({
  file,
  projectId,
  resource,
  cardId,
  pageId,
  customFilename,
}: UploadMediaOptions): Promise<UploadMediaResponse> {
  const formData = new FormData();
  
  // Garante que é enviado como File com nome
  if (file instanceof File) {
    formData.append("file", file);
  } else {
    const ext = file.type.startsWith("image/")
      ? "png"
      : file.type.startsWith("video/")
      ? "mp4"
      : file.type.startsWith("audio/")
      ? "mp3"
      : "bin";
    const name = customFilename || `pasted_media_${Date.now()}.${ext}`;
    formData.append("file", file, name);
  }

  formData.append("projectId", projectId);
  formData.append("resource", resource);
  if (cardId) formData.append("cardId", cardId);
  if (pageId) formData.append("pageId", pageId);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao enviar arquivo de mídia");
  }

  return await res.json();
}

/**
 * Extrai arquivos de imagem, vídeo ou áudio da área de transferência (Ctrl+V / Paste)
 */
export function extractMediaFromClipboard(event: React.ClipboardEvent | ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item.type.startsWith("image/") ||
      item.type.startsWith("video/") ||
      item.type.startsWith("audio/")
    ) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  return null;
}
