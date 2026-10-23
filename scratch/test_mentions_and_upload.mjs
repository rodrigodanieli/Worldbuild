import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b\\scratch\\edge_prof_features_final";
const ARTIFACT_DIR = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("1. Authenticating test user...");
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mestre@worldbuild.com", password: "mestre123" }),
  });
  const cookieHeader = loginRes.headers.get("set-cookie");

  console.log("2. Testing multipart media upload (/api/upload)...");
  // Cria um pequeno arquivo de imagem PNG de teste
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEcQHsW0Y21QAAAABJRU5ErkJggg==",
    "base64"
  );

  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const bodyBuffer = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="pageId"\r\n\r\npage-valefundo\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="mapa_vale_fundo.png"\r\nContent-Type: image/png\r\n\r\n`),
    samplePngBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await fetch("http://localhost:3000/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Cookie: cookieHeader,
    },
    body: bodyBuffer,
  });

  const uploadJson = await uploadRes.json();
  console.log("Upload response:", uploadJson);

  // Consulta lista de assets da página
  const listRes = await fetch("http://localhost:3000/api/pages/page-valefundo/assets", {
    headers: { Cookie: cookieHeader },
  });
  const listJson = await listRes.json();
  console.log("Assets in database for page-valefundo:", listJson.assets.length);

  // Prepara documento com @menção interativa para captura
  const pageWithMention = `<h1>Reino de Eldoria - Valefundo</h1><p>Esta fortaleza é o lar de <span data-type="mention" data-id="page-kaelen" data-label="Kaelen Sombra-da-Noite" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer hover:bg-amber-500/25 transition not-prose mention-badge">@Kaelen Sombra-da-Noite</span> e do templo subterrâneo da <span data-type="mention" data-id="page-tumba" data-label="Masmorras da Tumba Esquecida" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer hover:bg-amber-500/25 transition not-prose mention-badge">@Masmorras da Tumba Esquecida</span>.</p><p>Abaixo encontra-se a cartografia anexada:</p><img src="${uploadJson.url}" alt="Mapa de Valefundo" class="rounded-2xl max-w-full my-4 border border-slate-800 shadow-2xl" />`;

  await fetch("http://localhost:3000/api/pages/page-valefundo", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: "Reino de Eldoria - Valefundo",
      contentMarkdown: pageWithMention,
    }),
  });

  console.log("3. Launching Edge headless to capture UI...");
  const edge = spawn(EDGE_PATH, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${USER_DATA}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ]);

  let connected = false;
  let targetWsUrl = null;

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch("http://127.0.0.1:9222/json/list");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        targetWsUrl = list[0].webSocketDebuggerUrl;
        connected = true;
        break;
      }
    } catch (e) {}
  }

  if (!connected) {
    console.error("Could not connect to DevTools port 9222");
    edge.kill();
    process.exit(1);
  }

  const ws = new WebSocket(targetWsUrl);
  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  await send("Page.enable");
  await send("Network.enable");

  await send("Network.setCookie", {
    name: "worldbuild_session",
    value: "usr-mestre-01",
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 1. Tela da Wiki com imagem inserida e menções
  console.log("Navigating to page-valefundo...");
  await send("Page.navigate", { url: "http://localhost:3000/project/world-eldoria-01/wiki/page-valefundo" });
  await sleep(3000);

  const mainShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "wiki-page-with-media-and-mentions.png"), Buffer.from(mainShot.data, "base64"));
  console.log("Saved wiki-page-with-media-and-mentions.png");

  // 2. Abrir o Drawer de Mídias clicando no botão "Mídias"
  console.log("Opening Media Drawer...");
  await send("Runtime.evaluate", {
    expression: `
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mídias'));
      if (btn) btn.click();
    `,
  });
  await sleep(1000);

  const drawerShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "wiki-media-drawer.png"), Buffer.from(drawerShot.data, "base64"));
  console.log("Saved wiki-media-drawer.png");

  // Fecha o drawer
  await send("Runtime.evaluate", {
    expression: `
      const closeBtn = document.querySelector('button[type="button"] svg.lucide-x')?.closest('button');
      if (closeBtn) closeBtn.click();
    `,
  });
  await sleep(600);

  // 3. Clicar na menção @Kaelen Sombra-da-Noite para abrir o menu de 3 ações
  console.log("Clicking @ mention badge...");
  await send("Runtime.evaluate", {
    expression: `
      const badge = document.querySelector('.mention-badge');
      if (badge) badge.click();
    `,
  });
  await sleep(800);

  const mentionMenuShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "wiki-mention-action-menu.png"), Buffer.from(mentionMenuShot.data, "base64"));
  console.log("Saved wiki-mention-action-menu.png");

  // 4. Clicar em "Visualizar em pop-up (Leitura)" para abrir o modal de preview
  console.log("Clicking preview in pop-up...");
  await send("Runtime.evaluate", {
    expression: `
      const previewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Visualizar em pop-up'));
      if (previewBtn) previewBtn.click();
    `,
  });
  await sleep(1200);

  const previewShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "wiki-mention-preview-modal.png"), Buffer.from(previewShot.data, "base64"));
  console.log("Saved wiki-mention-preview-modal.png");

  ws.close();
  edge.kill();
  console.log("All automated tests and visual captures completed successfully!");
}

run().catch((err) => {
  console.error("Error in test script:", err);
  process.exit(1);
});
