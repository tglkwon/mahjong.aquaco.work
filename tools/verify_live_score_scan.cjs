// Production-build E2E with real fixture pixels delivered through a synthetic camera.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const { chromium } = require(process.argv[2] || 'C:/Users/AquaCo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const build = path.join(root, 'build');
const fixture = path.join(root, 'research-data/rex 3/inspection/browser-sample-h264.mp4');
const output = path.join(root, 'docs/ai/live-score-scan');
const ts = require('typescript');
const codec = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(path.join(root, 'src/utils/shareState.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(require, codec, codec.exports);
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = pathname === '/__fixture.mp4' ? fixture : path.resolve(build, '.' + pathname);
  if (file !== fixture && !file.startsWith(build + path.sep) && file !== build) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(build, 'index.html');
  const size = fs.statSync(file).size;
  const mime = ({ '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.mp4': 'video/mp4', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  if (req.headers.range && file === fixture) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if (!match) { res.writeHead(416).end(); return; }
    const start = Number(match[1]), end = Math.min(match[2] ? Number(match[2]) : size - 1, size - 1);
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else { res.setHeader('Content-Length', size); fs.createReadStream(file).pipe(res); }
});

async function injectCamera(page, mode = 'video') {
  await page.addInitScript(({ mode }) => {
    window.__camera = { calls: 0, tracks: [], constraints: [], snapshots: 0, methods: [] };
    const originalDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      window.__camera.snapshots += 1;
      return originalDataURL.apply(this, args);
    };
    navigator.mediaDevices.getUserMedia = async constraints => {
      window.__camera.calls += 1;
      window.__camera.constraints.push(constraints);
      if (mode === 'denied') throw new DOMException('Test permission denied', 'NotAllowedError');
      const video = document.createElement('video');
      video.muted = true; video.playsInline = true; video.loop = true;
      video.src = '/__fixture.mp4';
      document.body.appendChild(video);
      video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
      await video.play();
      let stream;
      let frameHandle;
      if (typeof video.captureStream === 'function') {
        stream = video.captureStream(); window.__camera.methods.push('video.captureStream');
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        const draw = () => { context.drawImage(video, 0, 0); frameHandle = video.requestVideoFrameCallback(draw); };
        draw(); stream = canvas.captureStream(30); window.__camera.methods.push('canvas.captureStream');
      }
      const tracks = stream.getTracks();
      window.__camera.tracks.push(...tracks);
      for (const track of tracks) {
        const stop = track.stop.bind(track);
        track.stop = () => {
          stop();
          if (tracks.every(item => item.readyState === 'ended')) {
            if (frameHandle !== undefined) video.cancelVideoFrameCallback(frameHandle);
            video.pause(); video.removeAttribute('src'); video.load(); video.remove();
          }
        };
      }
      if (mode === 'delayed') await new Promise(resolve => setTimeout(resolve, 2000));
      return stream;
    };
  }, { mode });
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  assert.ok(fs.existsSync(fixture), 'real H.264 fixture exists');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [], requests = [];
    const makePage = async mode => {
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await injectCamera(page, mode);
      await page.goto(origin + '/set_score_photo', { waitUntil: 'networkidle' });
      page.on('request', request => { if (/^https?:/.test(request.url())) requests.push({ method: request.method(), url: request.url() }); });
      return page;
    };
    const page = await makePage('video');
    const start = page.getByRole('button', { name: '실시간 스캔 시작', exact: true });
    await start.click();
    await page.getByLabel('실시간 점수판 영상', { exact: true }).waitFor();
    await page.getByRole('status').filter({ hasText: '자동 캡처했습니다' }).waitFor({ timeout: 60000 });
    const values = [];
    for (let i = 1; i <= 4; i++) values.push(await page.getByLabel(`표시값 ${i}`, { exact: true }).inputValue());
    assert.deepEqual(values, ['102', '0266', '0606', '0026']);
    const stopped = () => page.evaluate(() => window.__camera.tracks.length > 0 && window.__camera.tracks.every(track => track.readyState === 'ended'));
    assert.equal(await stopped(), true);
    const snapshotCount = await page.evaluate(() => window.__camera.snapshots);
    assert.equal(snapshotCount, 1);
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.__camera.snapshots), snapshotCount);
    assert.equal(await page.getByRole('link', { name: '확정한 기록 공유 링크' }).count(), 0);
    const confirm = page.getByRole('button', { name: '확정하고 기록에 추가', exact: true });
    assert.equal(await confirm.isDisabled(), true);
    const assignments = () => Promise.all([1, 2, 3, 4].map(i => page.getByRole('combobox', { name: new RegExp(`^플레이어 ${i}`) }).inputValue()));
    assert.deepEqual(await assignments(), ['0', '1', '2', '3']);
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: '점수 배정 한 자리 이동', exact: true }).click();
    assert.deepEqual(await assignments(), ['0', '1', '2', '3']);
    await page.getByRole('button', { name: '점수 배정 한 자리 이동', exact: true }).click();
    assert.deepEqual(await assignments(), ['1', '2', '3', '0']);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(output, 'live-scan-auto-capture.png'), fullPage: true });
    await page.getByLabel('점수·단위·플레이어 대응을 확인했습니다', { exact: true }).check();
    await confirm.click();
    assert.equal(await confirm.isDisabled(), true);
    await confirm.evaluate(button => button.click());
    const shared = await page.getByRole('link', { name: '확정한 기록 공유 링크' }).getAttribute('href');
    const sharedState = codec.exports.parseShareStateFromHash(new URL(shared, origin).hash, false);
    assert.equal(sharedState.games.length, 1);
    assert.deepEqual(sharedState.games[0].scores, ['2600', '10200', '26600', '60600']);
    const processingRequests = [...requests];
    assert.ok(processingRequests.every(request => request.method === 'GET' && request.url === origin + '/__fixture.mp4'), JSON.stringify(processingRequests));
    const cameraEvidence = await page.evaluate(() => ({ calls: window.__camera.calls, constraints: window.__camera.constraints, methods: window.__camera.methods, snapshots: window.__camera.snapshots }));
    await page.goto(new URL(shared, origin).href, { waitUntil: 'networkidle' });
    await page.getByRole('cell', { name: '60600', exact: true }).last().waitFor();
    assert.equal(await page.getByRole('button', { name: '1 삭제', exact: true }).count(), 1);
    await page.screenshot({ path: path.join(output, 'live-scan-record-shared.png'), fullPage: true });

    const mismatch = await makePage('video');
    await mismatch.getByLabel('기준 합계 (점)', { exact: true }).fill('99900');
    await mismatch.getByRole('button', { name: '실시간 스캔 시작', exact: true }).click();
    await mismatch.waitForTimeout(5000);
    assert.equal(await mismatch.getByRole('status').filter({ hasText: '자동 캡처했습니다' }).count(), 0);
    assert.equal(await mismatch.getByRole('link', { name: '확정한 기록 공유 링크' }).count(), 0);
    assert.equal(await mismatch.evaluate(() => window.__camera.snapshots), 0);
    assert.equal(await mismatch.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await mismatch.screenshot({ path: path.join(output, 'live-scan-total-mismatch.png'), fullPage: true });
    await mismatch.getByRole('button', { name: '스캔 중지', exact: true }).click();
    assert.equal(await mismatch.evaluate(() => window.__camera.tracks.every(track => track.readyState === 'ended')), true);
    const denied = await makePage('denied');
    await denied.getByRole('button', { name: '실시간 스캔 시작', exact: true }).click();
    await denied.getByRole('status').filter({ hasText: '카메라 권한을 허용' }).waitFor();
    await denied.getByRole('button', { name: '직접 입력', exact: true }).click();
    assert.equal(await denied.getByLabel('표시값 1', { exact: true }).isEnabled(), true);
    const delayed = await makePage('delayed');
    await delayed.getByRole('button', { name: '실시간 스캔 시작', exact: true }).click();
    await delayed.getByRole('button', { name: '스캔 중지', exact: true }).click();
    await delayed.waitForTimeout(3000);
    assert.equal(await delayed.evaluate(() => window.__camera.tracks.length > 0 && window.__camera.tracks.every(track => track.readyState === 'ended')), true);
    assert.equal(await delayed.evaluate(() => window.__camera.snapshots), 0);
    assert.deepEqual(errors, []);
    const result = { viewport: '390x844 Edge/Chromium mobile emulation', fixture, physicalCameraTested: false, mediaSource: 'test-only getUserMedia injection with real H.264 video frames; recognition unmocked', candidates: values, mappedPoints: sharedState.games[0].scores, cameraEvidence, processingRequests, uploads: 0, checks: ['continuous real video recognition', 'one automatic snapshot', 'stream ended after capture', 'human confirmation required', 'four shifts restore mapping', 'one shift maps recorded players', 'repeat confirmation no duplicate', 'shared link reload', 'wrong sum blocks capture', 'explicit stop ends tracks', 'permission-denied manual fallback', 'late permission result ends tracks'], pageErrors: errors };
    fs.writeFileSync(path.join(output, 'live-scan-browser-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
