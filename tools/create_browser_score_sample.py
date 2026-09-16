"""Test-only HEVC → H.264 derivative using Windows Media Foundation.

Run `python tools/create_browser_score_sample.py` on Windows with opencv-python.
This does not change the original or add any application runtime transcoding.
"""
from pathlib import Path
import json
import cv2

root = Path(__file__).resolve().parents[1]
source = root / 'research-data/rex 3/PXL_20260902_054136311.mp4'
target = source.parent / 'inspection/browser-sample-h264.mp4'
capture = cv2.VideoCapture(str(source))
if not capture.isOpened():
    raise RuntimeError('Cannot decode original validation video')
fps = capture.get(cv2.CAP_PROP_FPS)
size = (int(capture.get(cv2.CAP_PROP_FRAME_WIDTH)), int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)))
writer = cv2.VideoWriter(str(target), cv2.CAP_MSMF, cv2.VideoWriter_fourcc(*'H264'), fps, size)
if not writer.isOpened():
    raise RuntimeError('Windows Media Foundation H.264 encoder unavailable')
count = 0
try:
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        writer.write(frame)
        count += 1
finally:
    capture.release()
    writer.release()
check = cv2.VideoCapture(str(target))
metadata = {'source': str(source), 'target': str(target), 'frames_written': count,
            'frames_read': check.get(cv2.CAP_PROP_FRAME_COUNT), 'fps': check.get(cv2.CAP_PROP_FPS),
            'width': check.get(cv2.CAP_PROP_FRAME_WIDTH), 'height': check.get(cv2.CAP_PROP_FRAME_HEIGHT),
            'bytes': target.stat().st_size, 'audio': False, 'test_only': True}
check.release()
if metadata['frames_read'] != count:
    raise RuntimeError(f'Output frame count mismatch: {metadata}')
print(json.dumps(metadata, indent=2))
