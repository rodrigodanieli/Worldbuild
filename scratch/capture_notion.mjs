import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b\\scratch\\edge_prof_notion";
const ARTIFACT_DIR = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting Edge headless for Notion experience verification...");
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
    console.error("Could not connect to Edge DevTools port 9222");
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

  // Autenticação com cookie da sessão do Mestre
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

  // 1. Tela da Wiki com Árvore e Barra Notion
  console.log("Navigating to Wiki page...");
  await send("Page.navigate", { url: "http://localhost:3000/project/world-eldoria-01/wiki/page-valefundo" });
  await sleep(3000);

  const wikiShot = await send("Page.captureScreenshot", { format: "png" });
  const wikiPath = path.join(ARTIFACT_DIR, "notion-wiki-full-screenshot.png");
  fs.writeFileSync(wikiPath, Buffer.from(wikiShot.data, "base64"));
  console.log("Saved full wiki screenshot to:", wikiPath);

  // 2. Abrir o Menu 3 Pontos (...) do Notion clicando nele
  console.log("Clicking Notion 3-dot menu...");
  await send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('button[title*="Configurações e opções da página"]');
      if (btn) btn.click();
    `,
  });
  await sleep(600);

  const menuShot = await send("Page.captureScreenshot", { format: "png" });
  const menuPath = path.join(ARTIFACT_DIR, "notion-menu-options-screenshot.png");
  fs.writeFileSync(menuPath, Buffer.from(menuShot.data, "base64"));
  console.log("Saved Notion menu screenshot to:", menuPath);

  // 3. Testar minimizar a sidebar (Recolher menu lateral para visualização completa)
  console.log("Clicking collapse sidebar button...");
  await send("Runtime.evaluate", {
    expression: `
      const collapseBtn = document.querySelector('button[title*="Recolher menu lateral"]');
      if (collapseBtn) collapseBtn.click();
    `,
  });
  await sleep(800);

  const collapsedShot = await send("Page.captureScreenshot", { format: "png" });
  const collapsedPath = path.join(ARTIFACT_DIR, "notion-collapsed-sidebar-screenshot.png");
  fs.writeFileSync(collapsedPath, Buffer.from(collapsedShot.data, "base64"));
  console.log("Saved collapsed sidebar screenshot to:", collapsedPath);

  ws.close();
  edge.kill();
  console.log("Notion experience captures completed!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
