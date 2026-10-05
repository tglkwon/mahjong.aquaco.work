const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function transpile(f) {
  return ts.transpileModule(fs.readFileSync(path.join(root, f), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText;
}
const clsMod = { exports: {} };
new Function('require', 'module', 'exports', transpile('src/utils/tableClassifier.ts'))(require, clsMod, clsMod.exports);
const { classifyTableModel } = clsMod.exports;

const frames = fs.readdirSync(path.join(root, 'research-data/rex 3/inspection/2026-09-24'))
  .filter(f => f.endsWith('.jpg') && f.includes('frame'))
  .slice(0, 10);

console.log('Testing classifyTableModel on real captured frames:');

for (const f of frames) {
  const p = path.join(root, 'research-data/rex 3/inspection/2026-09-24', f);
  const py = spawnSync('python', ['-c', `
import cv2, sys
img = cv2.imread(sys.argv[1])
h, w = img.shape[:2]
sys.stderr.write(f"{w},{h}\\n")
rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA)
sys.stdout.buffer.write(rgba.tobytes())
`, p]);

  const [w, h] = py.stderr.toString().trim().split(',').map(Number);
  const res = classifyTableModel({ width: w, height: h, data: new Uint8ClampedArray(py.stdout) });
  console.log(`${f.padEnd(65)} -> Model: ${res.model || 'NONE'}, Conf: ${res.confidence.toFixed(2)}, Reason: ${res.reason || ''}`);
}
