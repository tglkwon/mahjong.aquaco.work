"""Create compact lossless RGB fixtures from the actual private sample video."""
from pathlib import Path
import base64
import json
import zlib
import cv2

root = Path(__file__).resolve().parents[1]
capture = cv2.VideoCapture(str(root / 'research-data/rex 3/PXL_20260902_054136311.mp4'))
fixtures = []
for index in [0, 64, 129, 232]:
    capture.set(cv2.CAP_PROP_POS_FRAMES, index)
    ok, frame = capture.read()
    if not ok:
        raise RuntimeError(f'Cannot decode frame {index}')
    frame = cv2.resize(frame, (960, 540), interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    # Preserve the actual red classification while compacting irrelevant colors.
    r, g, b = [rgb[:, :, i].astype('float32') for i in range(3)]
    mask = ((r > 180) & (r > g * 1.6) & (r > b * 1.35)).astype('uint8')
    fixtures.append({'frame': index, 'width': 960, 'height': 540, 'mask': base64.b64encode(zlib.compress(mask.tobytes())).decode()})
    if index == 129:
        (root / 'src/utils/scoreRecognition.rgb.fixture.json').write_text(json.dumps({'width': 960, 'height': 540, 'rgb': base64.b64encode(zlib.compress(rgb.tobytes())).decode()}), encoding='utf-8')
target = root / 'src/utils/scoreRecognition.fixtures.json'
target.write_text(json.dumps(fixtures), encoding='utf-8')
capture.release()

