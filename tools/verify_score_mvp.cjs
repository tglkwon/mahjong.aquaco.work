// Run after production build. Pass Playwright module directory as first argument if not installed locally.
const { chromium } = require(process.argv[2] || 'playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/ai/mobile-score-recognition');
const server = http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
  let file = path.resolve(root, 'build', relative || 'index.html');
  if (!file.startsWith(path.join(root, 'build') + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'build/index.html');
  res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__mediaEvents = [];
      const create = document.createElement.bind(document);
      document.createElement = function(tag, options) {
        const element = create(tag, options);
        if (tag === 'video') for (const event of ['loadedmetadata', 'loadeddata', 'seeked', 'error', 'stalled']) element.addEventListener(event, () => window.__mediaEvents.push({ event, time: element.currentTime, duration: element.duration, width: element.videoWidth, code: element.error?.code, message: element.error?.message }));
        return element;
      };
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/set_score_photo', { waitUntil: 'networkidle' });
    const network = [];
    page.on('request', request => { if (/^https?:/.test(request.url())) network.push({ method: request.method(), url: request.url() }); });
    await page.getByLabel('사진 또는 영상 선택', { exact: true }).setInputFiles(path.join(root, 'research-data/rex 3/PXL_20260902_054136311.mp4'));
    await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.match(/원본과 대조|불확실|못했습니다/), undefined, { timeout: 60000 });
    const originalNativeDecoded = await page.getByRole('button', { name: /^프레임 5/ }).count() === 1;
    const originalEvents = await page.evaluate(() => window.__mediaEvents);
    if (!originalNativeDecoded) {
      assert.match(await page.getByRole('status').innerText(), /직접 입력해 주세요/);
      assert.equal(await page.getByLabel('표시값 1', { exact: true }).isEnabled(), true);
      assert.equal(network.length, 0, JSON.stringify(network));
      // Test only: the exact source is locally transcoded; the app never transcodes on a server.
      await page.getByLabel('사진 또는 영상 선택', { exact: true }).setInputFiles(path.join(root, 'research-data/rex 3/inspection/browser-sample-h264.mp4'));
    }
    await page.getByRole('button', { name: /^프레임 5/ }).waitFor({ timeout: 60000 }).catch(async error => {
      console.error('Page status:', await page.getByRole('status').allTextContents(), 'Errors:', errors);
      console.error('Media events:', await page.evaluate(() => window.__mediaEvents));
      await page.screenshot({ path: path.join(output, 'browser-failure.png'), fullPage: true });
      throw error;
    });
    const values = [];
    for (let i = 1; i <= 4; i++) values.push(await page.getByLabel(`표시값 ${i}`, { exact: true }).inputValue());
    assert.deepEqual(values, ['0026', '0606', '0266', '102']);
    assert.equal(await page.getByRole('button', { name: /^프레임 / }).count(), 5);
    const confirm = page.getByRole('button', { name: '확정하고 기록에 추가', exact: true });
    assert.equal(await confirm.isDisabled(), true);
    await page.getByLabel('기준 합계 (점)', { exact: true }).fill('99900');
    await page.getByLabel('점수·단위·플레이어 대응을 확인했습니다', { exact: true }).check();
    assert.equal(await confirm.isDisabled(), true);
    await page.getByLabel('기준 합계 (점)', { exact: true }).fill('100000');
    assert.equal(await page.getByLabel('점수·단위·플레이어 대응을 확인했습니다', { exact: true }).isChecked(), false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'mobile-sample-review.png'), fullPage: true });
    await page.getByLabel('점수·단위·플레이어 대응을 확인했습니다', { exact: true }).check();
    await confirm.click();
    assert.equal(await confirm.isDisabled(), true);
    await page.getByRole('cell', { name: '60600', exact: true }).last().waitFor();
    const shared = await page.getByRole('link', { name: '확정한 기록 공유 링크' }).getAttribute('href');
    assert.equal(network.length, 0, JSON.stringify(network));
    await page.goto(origin + shared, { waitUntil: 'networkidle' });
    await page.getByRole('cell', { name: '60600', exact: true }).last().waitFor();
    await page.getByRole('button', { name: '1 삭제', exact: true }).click();
    assert.equal(await page.getByRole('link', { name: '확정한 기록 공유 링크' }).count(), 0);
    await page.getByLabel('사진 또는 영상 선택', { exact: true }).setInputFiles(path.join(root, 'research-data/rex 3/inspection/middle_full.jpg'));
    await page.getByRole('button', { name: /^프레임 1/ }).waitFor({ timeout: 30000 });
    const photoValues = [];
    for (let i = 1; i <= 4; i++) photoValues.push(await page.getByLabel(`표시값 ${i}`, { exact: true }).inputValue());
    assert.deepEqual(photoValues, ['0026', '0606', '0266', '102']);
    await page.getByLabel('사진 또는 영상 선택', { exact: true }).setInputFiles({ name: 'broken.mp4', mimeType: 'video/mp4', buffer: Buffer.from('not a video') });
    await page.getByRole('status').filter({ hasText: '직접 입력해 주세요' }).waitFor();
    await page.getByRole('button', { name: '직접 입력', exact: true }).click();
    for (let i = 1; i <= 4; i++) await page.getByLabel(`표시값 ${i}`, { exact: true }).fill('250');
    await page.getByLabel('점수·단위·플레이어 대응을 확인했습니다', { exact: true }).check();
    await confirm.click();
    await page.getByRole('link', { name: '확정한 기록 공유 링크' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.deepEqual(errors, []);
    const result = { video: 'PXL_20260902_054136311.mp4', originalNativeDecoded, originalEvents, videoPathTested: originalNativeDecoded ? 'original HEVC' : 'local H.264 derivative; original HEVC fell back to editable manual input', viewport: '390x844 Chromium/Edge mobile emulation', frames: 5, videoCandidates: values, photoCandidates: photoValues, normalizedPoints: [2600, 60600, 26600, 10200], total: 100000, mediaProcessingHttpRequests: 0, checks: ['original HEVC decode or manual fallback', 'confirmation gate', 'sum mismatch', 'single append', 'shared link reload', 'last record deletion', 'photo recognition', 'decode failure/manual recovery', 'no horizontal overflow'], pageErrors: errors };
    fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
