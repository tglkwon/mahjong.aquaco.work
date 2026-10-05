const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function transpileFile(relPath) {
  const code = fs.readFileSync(path.join(root, relPath), 'utf8');
  return ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
}

const recMod = { exports: {} };
new Function('require', 'module', 'exports', transpileFile('src/utils/scoreRecognition.ts'))(require, recMod, recMod.exports);
const { recognizeScoreboard } = recMod.exports;

const draftMod = { exports: {} };
new Function('require', 'module', 'exports', transpileFile('src/utils/scoreDraft.ts'))(require, draftMod, draftMod.exports);
const { validateScoreDraft } = draftMod.exports;

const stabMod = { exports: {} };
new Function('require', 'module', 'exports', transpileFile('src/utils/scoreStability.ts'))(require, stabMod, stabMod.exports);
const { createScoreStabilityTracker } = stabMod.exports;

const videoDir = path.join(root, 'research-data/rex 3');
const files = [
  'rex3_scan_2026-09-24T08-13-25-995Z.mp4',
  'rex3_scan_2026-09-24T08-13-34-547Z.mp4',
  'rex3_scan_2026-09-24T09-26-54-413Z.mp4',
  'rex3_scan_2026-09-24T09-27-22-450Z.mp4',
  'rex3_fail_2026-09-24T08-14-19-441Z.mp4',
  'rex3_fail_2026-09-24T08-15-02-336Z.mp4',
  'rex3_fail_2026-09-24T08-15-26-589Z.mp4',
  'rex3_fail_2026-09-24T09-28-41-775Z.mp4',
  'rex3_fail_2026-09-24T09-29-06-668Z.mp4',
];

const pyScript = `
import sys, json, cv2

video_path = sys.argv[1]
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
fc = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Extract all frames or 10 fps
step = max(1, round(fps / 10))
frames = list(range(0, fc, step))
sys.stderr.write(json.dumps({"fps": fps, "frame_count": fc, "width": w, "height": h, "step": step}) + "\\n")
sys.stderr.flush()

for idx in frames:
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
  const py = spawnSync('python', ['-c', pyScript, videoPath], {
    maxBuffer: 500 * 1024 * 1024,
    encoding: 'buffer',
  });

  if (py.error) {
    console.error(`Error processing ${file}:`, py.error);
    continue;
  }

  const meta = JSON.parse(py.stderr.toString('utf8').trim().split('\n')[0]);
  const { width, height, fps, step } = meta;
  const frameBytes = width * height * 4;
  const stdoutBuf = py.stdout;
  const totalFrames = Math.floor(stdoutBuf.length / frameBytes);

  // Recreate the exact tracker and camera parameters
  const tracker = createScoreStabilityTracker(3, 200, 1500);
  const isPortrait = height > width;
  const sy = isPortrait ? Math.round(height * 0.25) : 0;
  const sHeight = isPortrait ? Math.round(height * 0.50) : height;

  let captured = false;
  let captureInfo = null;
  let readingErrors = {};

  for (let i = 0; i < totalFrames; i++) {
    const timeMs = (i * step / fps) * 1000;
    const start = i * frameBytes;
    const fullData = new Uint8ClampedArray(stdoutBuf.buffer, stdoutBuf.byteOffset + start, frameBytes);

    // Crop middle 50%
    const cropData = new Uint8ClampedArray(width * sHeight * 4);
    for (let row = 0; row < sHeight; row++) {
      const srcRow = (sy + row) * width * 4;
      const dstRow = row * width * 4;
      cropData.set(fullData.subarray(srcRow, srcRow + width * 4), dstRow);
    }

    const reading = recognizeScoreboard({ width, height: sHeight, data: cropData }, 'amos_rexx3');
    const draft = validateScoreDraft(
      reading.map(c => c.raw),
      100, // unit
      '100000', // expected
      [0, 1, 2, 3], // players
      4 // playerCount
    );

    if (!draft.valid) {
      readingErrors[draft.error] = (readingErrors[draft.error] || 0) + 1;
    }

    const stable = tracker.observe(
      draft.scores,
      timeMs,
      draft.valid && reading.every(r => r.raw !== '')
    );

    if (stable.ready && !captured) {
      captured = true;
      captureInfo = {
        timeSec: (timeMs / 1000).toFixed(2),
        rawReading: reading.map(r => r.raw),
        draftScores: draft.scores,
        total: draft.total,
      };
      break;
    }
  }

  console.log(`=======================================================`);
  console.log(`File: ${file} (Duration: ${(meta.frame_count / fps).toFixed(1)}s)`);
  if (captured) {
    console.log(`  🎉 FULL PIPELINE CAPTURED at ${captureInfo.timeSec}s!`);
    console.log(`     Raw Readings:  ${JSON.stringify(captureInfo.rawReading)}`);
    console.log(`     Draft Scores:  ${JSON.stringify(captureInfo.draftScores)} (Total: ${captureInfo.total})`);
  } else {
    console.log(`  ❌ NOT CAPTURED.`);
    console.log(`     Validation errors seen:`, readingErrors);
  }
}
