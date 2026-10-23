import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b\\scratch\\edge_prof_markdown_refined";
const ARTIFACT_DIR = "C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Updating page in SQLite with user markdown...");
  const rawMarkdown = `# Reino dos magos Comece a registrar as localidades, facções, personagens e segredos desta campanha. Digite \`/\` para inserir blocos ou \`@\` para criar conexões.

dcsdcsd

cd,d

- dcsd
- dscsdc
- sdcsdc

# 1231

- Lista`;

  // Salva no banco via fetch
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mestre@worldbuild.com", password: "mestre123" }),
  });
  const cookieHeader = loginRes.headers.get("set-cookie");

  const saveRes = await fetch("http://localhost:3000/api/pages/page-valefundo", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: "Bem-vindo a Reino dos magoscvc",
      contentMarkdown: rawMarkdown,
    }),
  });

  const saveJson = await saveRes.json();
  console.log("Page saved successfully:", saveJson.success);

  // Agora abre o Edge headless para capturar screenshot
  console.log("Launching Edge headless...");
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

  console.log("Navigating to page-valefundo...");
  await send("Page.navigate", { url: "http://localhost:3000/project/world-eldoria-01/wiki/page-valefundo" });
  await sleep(3000);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  const outPath = path.join(ARTIFACT_DIR, "markdown-rendered-notion-style.png");
  fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
  console.log("Saved markdown-rendered-notion-style.png successfully to:", outPath);

  ws.close();
  edge.kill();
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
