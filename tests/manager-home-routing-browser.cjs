const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});

const firebaseApp = `export const initializeApp=()=>({}),getApps=()=>[],getApp=()=>({});`;
const firebaseDb = `export const getDatabase=()=>({}),ref=(d,p='')=>({p}),get=async()=>({val:()=>null,exists:()=>false});`;
const manager = {
  username: 'manager-putra',
  nama: 'Manajer Putra',
  roleSystemVersion: 2,
  roles: ['MANAJER'],
  defaultRole: 'MANAJER',
  assignments: { MANAJER: { unit: 'PUTRA', managedRoles: ['GURU_PONDOK'], programDomain: 'KEPONDOKAN' } }
};

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const width of [409, 456]) {
      const context = await browser.newContext({ viewport: { width, height: 720 } });
      await context.addInitScript(user => localStorage.setItem('cahayaCurrentUser', JSON.stringify(user)), manager);
      await context.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith(origin)) return route.continue();
        if (url.includes('firebase-app.js')) return route.fulfill({ contentType: 'text/javascript', body: firebaseApp });
        if (url.includes('firebase-database.js')) return route.fulfill({ contentType: 'text/javascript', body: firebaseDb });
        return route.abort();
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${origin}/home-manajer-pendidikan.html?v=230`);
      await page.waitForSelector('#quickGrid .me-card');
      assert.equal(await page.locator('.me-home-header').isVisible(), true);
      assert.equal(await page.locator('.me-home-brand img').evaluate(img => img.complete && img.naturalWidth > 0), true);
      assert.equal(await page.locator('#managerProfileButton').innerText(), 'M');
      const header = await page.locator('.me-home-header').boundingBox();
      const hero = await page.locator('.me-hero').boundingBox();
      assert(header.y + header.height <= hero.y);
      assert.equal(await page.locator('#quickGrid .me-card').count(), 4);
      assert.equal(await page.locator('#menuGrid .me-card').count(), 6);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), true);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('manager-home-routing-browser: ok');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
