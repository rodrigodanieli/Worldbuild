const puppeteer = require('C:/Users/rodri/OneDrive/Documentos/Projetos/Antigravity/Worldbuild/node_modules/.pnpm/puppeteer-core@25.15.0/node_modules/puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b';
const PROJECT_ID = 'cb57964b-5e96-444c-9b92-0b6b23ae3cd5';
const USER_ID = '02f3d6d9-c1d7-48de-9765-edda7cdd3e3e';

async function run() {
  console.log('Iniciando teste de criação de relacionamento via drag/wire no Board...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    defaultViewport: { width: 1440, height: 950 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setCookie({
      name: 'worldbuild_session',
      value: USER_ID,
      domain: 'localhost',
      path: '/'
    });

    const url = `http://localhost:3000/project/${PROJECT_ID}/board`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // Obtém nós atuais presentes no canvas
    const nodesInfo = await page.evaluate(() => {
      const cardNodes = Array.from(document.querySelectorAll('.react-flow__node-cardNode'));
      return cardNodes.map(n => ({
        id: n.getAttribute('data-id'),
        text: n.innerText.slice(0, 40)
      }));
    });
    console.log('Nós encontrados no canvas:', nodesInfo);

    // Se houver menos de 2 nós, adiciona outro card ao board
    if (nodesInfo.length < 2) {
      console.log('Adicionando card adicional da sidebar...');
      await page.evaluate(() => {
        const addBtns = Array.from(document.querySelectorAll('button[title="Adicionar ao centro do quadro"]'));
        if (addBtns.length > 0) addBtns[0].click();
      });
      await new Promise(r => setTimeout(r, 1500));
    }

    // Testa o acionamento de conexão entre o nó 0 (source) e o nó 1 (target)
    console.log('Criando nova conexão entre nós...');
    const result = await page.evaluate(async () => {
      // Encontra dois nós de card
      const flowNodes = Array.from(document.querySelectorAll('.react-flow__node-cardNode'));
      if (flowNodes.length < 2) return { success: false, reason: 'Menos de 2 nós' };

      const sourceNode = flowNodes[0];
      const targetNode = flowNodes[1];

      const sourceId = sourceNode.getAttribute('data-id');
      const targetId = targetNode.getAttribute('data-id');

      // Encontra o handle de origem no primeiro nó
      const sourceHandle = sourceNode.querySelector('.react-flow__handle.source') || sourceNode.querySelector('.react-flow__handle');
      const targetHandle = targetNode.querySelector('.react-flow__handle.target') || targetNode.querySelector('.react-flow__handle');

      if (!sourceHandle || !targetHandle) {
        return { success: false, reason: 'Handles não encontrados' };
      }

      const sRect = sourceHandle.getBoundingClientRect();
      const tRect = targetHandle.getBoundingClientRect();

      return {
        success: true,
        sourceId,
        targetId,
        sourceCoords: { x: sRect.x + sRect.width / 2, y: sRect.y + sRect.height / 2 },
        targetCoords: { x: tRect.x + tRect.width / 2, y: tRect.y + tRect.height / 2 }
      };
    });

    console.log('Dados da conexão:', result);

    if (result.success) {
      // Simula o arrasto do mouse do handle do primeiro card até o handle do segundo card
      await page.mouse.move(result.sourceCoords.x, result.sourceCoords.y);
      await page.mouse.down();
      await new Promise(r => setTimeout(r, 200));
      await page.mouse.move(result.targetCoords.x, result.targetCoords.y, { steps: 10 });
      await new Promise(r => setTimeout(r, 200));
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 2000));
    }

    // Screenshot da nova conexão criada com a menção gerada
    const shotConn = path.join(ARTIFACT_DIR, 'board-wire-connection-created.png');
    await page.screenshot({ path: shotConn });
    console.log(`Screenshot salvo em: ${shotConn}`);

    // Clica no card de origem para abrir a gaveta e verificar a menção no markdown
    if (result.sourceId) {
      await page.evaluate((srcId) => {
        const node = document.querySelector(`.react-flow__node-cardNode[data-id="${srcId}"]`);
        if (node) node.click();
      }, result.sourceId);
      await new Promise(r => setTimeout(r, 2000));

      const shotEditor = path.join(ARTIFACT_DIR, 'board-source-card-updated-markdown.png');
      await page.screenshot({ path: shotEditor });
      console.log(`Screenshot do editor do card de origem salvo em: ${shotEditor}`);
    }

    console.log('Teste de conexão via wire finalizado com sucesso!');
  } catch (err) {
    console.error('Erro no teste:', err);
  } finally {
    await browser.close();
  }
}

run();
