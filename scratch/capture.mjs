import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b\\scratch\\edge_prof_wiki";
const ARTIFACT_DIR = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting Edge headless for wiki visual verification...");
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

  // 1. Captura da tela da Wiki atualizada com árvore de subpáginas e barra com atalhos e status
  console.log("Navigating to Wiki page...");
  await send("Page.navigate", { url: "http://localhost:3000/project/world-eldoria-01/wiki/page-valefundo" });
  await sleep(3000);

  const wikiShot = await send("Page.captureScreenshot", { format: "png" });
  const wikiPath = path.join(ARTIFACT_DIR, "wiki-tree-autosave-screenshot.png");
  fs.writeFileSync(wikiPath, Buffer.from(wikiShot.data, "base64"));
  console.log("Saved wiki screenshot to:", wikiPath);

  // 2. Captura da tela dos Projetos Grid (Home)
  console.log("Navigating to Projects Dashboard...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(2500);

  const dashShot = await send("Page.captureScreenshot", { format: "png" });
  const dashPath = path.join(ARTIFACT_DIR, "projects-grid-screenshot.png");
  fs.writeFileSync(dashPath, Buffer.from(dashShot.data, "base64"));
  console.log("Saved projects dashboard screenshot to:", dashPath);

  ws.close();
  edge.kill();
  console.log("Done!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
