const puppeteer = require('puppeteer');
const fileUrl = require('file-url');

(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  var log = ""
  page.on('console', (msg) => { log = log  + msg.text(); console.log('  ', msg.text()) } ) ;
  const url = fileUrl('testrunner.html');
  console.log("Opening", url)
  page.goto(url);

  await new Promise(r => setInterval(() => { log.includes("--- DONE") && r() }, 2))

  const success = ! log.includes("--- ERROR")  
  console.log(`Test run completed with ${success ? "SUCCESS" : "ERROR"}`)

  process.exit(success ? 0 : 1)
})();
