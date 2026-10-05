const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const srcCode = fs.readFileSync(path.join(root, 'src/utils/scoreRecognition.ts'), 'utf8');
const compiled = ts.transpileModule(srcCode, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

const recognitionModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, recognitionModule, recognitionModule.exports);
const { recognizeScoreboard } = recognitionModule.exports;

const videoDir = path.join(root, 'research-data/rex 3');
const files = fs.readdirSync(videoDir)
  .filter(f => f.includes('2026-09-24') && f.endsWith('.mp4'))
  .sort();

console.log(`Comparing FULL FRAME vs CAMERA ROI CROP (middle 50%) for ${files.length} videos...\n`);

const pyScript = `
import sys, json, cv2

video_path = sys.argv[1]
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
fc = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

step = max(1, round(fps / 4))
frames_to_read = list(range(0, fc, step))

metadata = {"fps": fps, "frame_count": fc, "width": w, "height": h, "sampled": len(frames_to_read)}
sys.stderr.write(json.dumps(metadata) + "\\n")
sys.stderr.flush()

for idx in frames_to_read:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ret, frame = cap.read()
    if not ret or frame is None:
        continue
    rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA)
    sys.stdout.buffer.write(rgba.tobytes())
cap.release()
`;

for (const file of files) {
  const videoPath = path.join(videoDir, file);
  const isScan = file.includes('scan');
  
  const py = spawnSync('python', ['-c', pyScript, videoPath], {
    maxBuffer: 500 * 1024 * 1024,
    encoding: 'buffer',
  });

  if (py.error) {
    console.error(`Error processing ${file}:`, py.error);
    continue;
  }

  const lines = py.stderr.toString('utf8').trim().split('\n');
  const meta = JSON.parse(lines[0]);
  const { width, height, fps } = meta;
  const frameBytes = width * height * 4;
  const stdoutBuf = py.stdout;
  const totalFramesReceived = Math.floor(stdoutBuf.length / frameBytes);

  // Test 1: Full Frame
  let fullConsensus = 0, fullMax = 0, fullKey = '', fullCapture = null;
  // Test 2: Camera Crop (middle 50% height for portrait)
  const isPortrait = height > width;
  const cropSy = isPortrait ? Math.round(height * 0.25) : 0;
  const cropSh = isPortrait ? Math.round(height * 0.50) : height;
  let cropConsensus = 0, cropMax = 0, cropKey = '', cropCapture = null;

  for (let i = 0; i < totalFramesReceived; i++) {
    const start = i * frameBytes;
    const fullData = new Uint8ClampedArray(stdoutBuf.buffer, stdoutBuf.byteOffset + start, frameBytes);
    const timeSec = (i * (fps / 4) / fps).toFixed(2);

    // Full frame recognition
    const fullRes = recognizeScoreboard({ width, height, data: fullData }, 'amos_rexx3');
    if (fullRes.length === 4 && fullRes.every(c => c.raw.length > 0 && c.confidence > 0)) {
      const k = fullRes.map(c => c.raw).join('/');
      if (k === fullKey) fullConsensus++; else { fullConsensus = 1; fullKey = k; }
      if (fullConsensus > fullMax) fullMax = fullConsensus;
      if (fullConsensus >= 3 && !fullCapture) fullCapture = { time: `${timeSec}s`, scores: fullRes.map(c => c.raw) };
    } else {
      fullConsensus = 0;
      fullKey = '';
    }

    // Cropped recognition (simulating scoreCamera.ts drawImage(video, 0, sy, width, sHeight, 0, 0, width, cropSh))
    const cropData = new Uint8ClampedArray(width * cropSh * 4);
    for (let row = 0; row < cropSh; row++) {
      const srcRow = (cropSy + row) * width * 4;
      const dstRow = row * width * 4;
      cropData.set(fullData.subarray(srcRow, srcRow + width * 4), dstRow);
    }
    const cropRes = recognizeScoreboard({ width, height: cropSh, data: cropData }, 'amos_rexx3');
    if (cropRes.length === 4 && cropRes.every(c => c.raw.length > 0 && c.confidence > 0)) {
      const k = cropRes.map(c => c.raw).join('/');
      if (k === cropKey) cropConsensus++; else { cropConsensus = 1; cropKey = k; }
      if (cropConsensus > cropMax) cropMax = cropConsensus;
      if (cropConsensus >= 3 && !cropCapture) cropCapture = { time: `${timeSec}s`, scores: cropRes.map(c => c.raw) };
    } else {
      cropConsensus = 0;
      cropKey = '';
    }
  }

  console.log(`=======================================================`);
  console.log(`File: ${file} [${isScan ? 'SUCCESS SCAN' : 'FAIL VIDEO'}] (${(meta.frame_count / fps).toFixed(1)}s)`);
  console.log(`- FULL FRAME: Max Consensus = ${fullMax}/3, ${fullCapture ? `🎯 Capture at ${fullCapture.time}: ${JSON.stringify(fullCapture.scores)}` : '❌ No 3-consensus'}`);
  console.log(`- CROP (50%):  Max Consensus = ${cropMax}/3, ${cropCapture ? `🎯 Capture at ${cropCapture.time}: ${JSON.stringify(cropCapture.scores)}` : '❌ No 3-consensus'}`);
}
