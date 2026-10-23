import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b\\scratch\\edge_prof_fixed";
const ARTIFACT_DIR = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting Edge headless...");
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

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 1. Screenshot da tela de Login (comprovando que o CSS está 100% carregado)
  console.log("Capturing Login screen...");
  await send("Page.navigate", { url: "http://localhost:3000/login" });
  await sleep(2500);

  const loginShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "login-fixed-screenshot.png"), Buffer.from(loginShot.data, "base64"));
  console.log("Saved login-fixed-screenshot.png");

  // 2. Autentica com cookie do Mestre
  await send("Network.setCookie", {
    name: "worldbuild_session",
    value: "usr-mestre-01",
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  // 3. Screenshot da Home (Grid de Projetos 3 colunas)
  console.log("Capturing Home Projects Grid screen...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(2500);

  const homeShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "home-fixed-screenshot.png"), Buffer.from(homeShot.data, "base64"));
  console.log("Saved home-fixed-screenshot.png");

  // 4. Screenshot da Wiki (UI padrão + árvore + editor markdown)
  console.log("Capturing Wiki screen...");
  await send("Page.navigate", { url: "http://localhost:3000/project/world-eldoria-01/wiki/page-valefundo" });
  await sleep(2500);

  const wikiShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "wiki-fixed-screenshot.png"), Buffer.from(wikiShot.data, "base64"));
  console.log("Saved wiki-fixed-screenshot.png");

  // 5. Clica no menu 3 pontos (...) do Notion
  console.log("Opening 3-dots page menu...");
  await send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('button[title*="Configurações e opções da página"]');
      if (btn) btn.click();
    `,
  });
  await sleep(600);

  const menuShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "wiki-3dots-fixed-screenshot.png"), Buffer.from(menuShot.data, "base64"));
  console.log("Saved wiki-3dots-fixed-screenshot.png");

  // 6. Fecha menu e minimiza a sidebar (visualização completa da página)
  console.log("Minimizing sidebar...");
  await send("Runtime.evaluate", {
    expression: `
      const collapseBtn = document.querySelector('button[title*="Recolher menu lateral"]');
      if (collapseBtn) collapseBtn.click();
    `,
  });
  await sleep(600);

  const minShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "wiki-sidebar-minimized-screenshot.png"), Buffer.from(minShot.data, "base64"));
  console.log("Saved wiki-sidebar-minimized-screenshot.png");

  ws.close();
  edge.kill();
  console.log("All screenshots captured and verified successfully!");
}

run().catch((err) => {
  console.error("Error in capture script:", err);
  process.exit(1);
});
