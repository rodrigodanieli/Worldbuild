const puppeteer = require('C:/Users/rodri/OneDrive/Documentos/Projetos/Antigravity/Worldbuild/node_modules/.pnpm/puppeteer-core@25.15.0/node_modules/puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\rodri\\.gemini\\antigravity\\brain\\00c8feab-237c-4532-8eb7-4eb8a53a521b';
const PROJECT_ID = 'cb57964b-5e96-444c-9b92-0b6b23ae3cd5';
const USER_ID = '02f3d6d9-c1d7-48de-9765-edda7cdd3e3e';

async function run() {
  console.log('Iniciando navegador Edge para testar novas funcionalidades do Board...');
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

    // 1. Navega para a nova rota /board (e testa redirect de /whiteboard se aplicável)
    const url = `http://localhost:3000/project/${PROJECT_ID}/board`;
    console.log(`Navegando para: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 1: Tela Inicial do Board com o novo menu "Board" e o Seletor de Boards
    const shot1 = path.join(ARTIFACT_DIR, 'board-initial-overview.png');
    await page.screenshot({ path: shot1 });
    console.log(`Screenshot 1 salvo em: ${shot1}`);

    // 2. Abre o menu dropdown de boards
    console.log('Abrindo dropdown de seleção de boards...');
    const boardDropdownBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bBtn = btns.find(b => b.innerText.includes('Quadro Principal') || b.innerText.includes('Board'));
      if (bBtn) {
        bBtn.click();
        return true;
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 2: Dropdown de seleção e gestão de boards aberto
    const shot2 = path.join(ARTIFACT_DIR, 'board-dropdown-menu.png');
    await page.screenshot({ path: shot2 });
    console.log(`Screenshot 2 salvo em: ${shot2}`);

    // 3. Clica em "Criar Novo Board"
    console.log('Clicando em "Criar Novo Board"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const newBoardBtn = btns.find(b => b.innerText.includes('Criar Novo Board'));
      if (newBoardBtn) newBoardBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 3: Modal de Criação de Novo Board
    const shot3 = path.join(ARTIFACT_DIR, 'board-create-modal.png');
    await page.screenshot({ path: shot3 });
    console.log(`Screenshot 3 salvo em: ${shot3}`);

    // Preenche nome do novo board e salva
    console.log('Preenchendo nome do novo board...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const nameInput = inputs[inputs.length - 1];
      if (nameInput) {
        nameInput.value = 'Relações de Facções';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.innerText.includes('Criar Board'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 4: Novo Board "Relações de Facções" ativo e limpo
    const shot4 = path.join(ARTIFACT_DIR, 'board-new-board-active.png');
    await page.screenshot({ path: shot4 });
    console.log(`Screenshot 4 salvo em: ${shot4}`);

    // 4. Cria um NOVO CARD DIRETAMENTE PELO BOARD
    console.log('Criando novo card diretamente pelo board...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const newCardBtn = btns.find(b => b.innerText.includes('Novo Card'));
      if (newCardBtn) newCardBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    // Screenshot 5: Novo Card criado no canvas com a gaveta lateral direita aberta para edição imediata!
    const shot5 = path.join(ARTIFACT_DIR, 'board-card-created-editing.png');
    await page.screenshot({ path: shot5 });
    console.log(`Screenshot 5 salvo em: ${shot5}`);

    // 5. Volta para o "Quadro Principal" para testar interligações e conexões
    console.log('Alternando de volta para o Quadro Principal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bBtn = btns.find(b => b.innerText.includes('Relações de Facções'));
      if (bBtn) bBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div'));
      const mainBoardItem = items.find(d => d.innerText.includes('Quadro Principal') && d.classList.contains('cursor-pointer'));
      if (mainBoardItem) mainBoardItem.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 6: Quadro Principal carregado
    const shot6 = path.join(ARTIFACT_DIR, 'board-switched-main.png');
    await page.screenshot({ path: shot6 });
    console.log(`Screenshot 6 salvo em: ${shot6}`);

    console.log('Todos os testes do Board executados com sucesso!');
  } catch (err) {
    console.error('Erro no teste:', err);
  } finally {
    await browser.close();
  }
}

run();
