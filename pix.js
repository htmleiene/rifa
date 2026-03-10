const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true }); // Headless true = não abre o navegador
  const page = await browser.newPage();

  // Acesse a página
  await page.goto('https://qrcodepix.com.br/', { waitUntil: 'networkidle2' });

  // Seleciona "Telefone" no select
  await page.select('select', 'phone');

  // Preenche o campo de telefone
  await page.type('input#key', '79991306087');

  // Preenche o campo de nome
  await page.type('input#name', 'Catia Modesto');

  // Preenche o campo de cidade
  await page.type('input#city', 'Aracaju');

  // Preenche o campo de valor
  await page.type('input#amount', '3');

  // Clica no botão "Gerar QR Code PIX"
  await page.click('button[type="submit"]');

  // Aguarda o input do código Pix aparecer
  await page.waitForSelector('input#brcode');

  // Captura o código PIX copia e cola
  const pixCode = await page.$eval('input#brcode', el => el.value);
  console.log('Código PIX copia e cola:', pixCode);

  // Fecha o navegador
  await browser.close();
})();
