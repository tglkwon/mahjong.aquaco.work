import os
import sys
import json
from pathlib import Path
import cv2
import numpy as np

VIDEO_DIR = Path("research-data/rex 3")
OUTPUT_DIR = Path("research-data/rex 3/inspection/2026-09-24")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

files = sorted([f for f in VIDEO_DIR.glob("*2026-09-24*.mp4")])

report = []

print(f"Found {len(files)} video files from 2026-09-24.\n")

for f in files:
    cap = cv2.VideoCapture(str(f))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps else 0.0

    is_success = "scan" in f.name and "fail" not in f.name
    category = "SUCCESS" if is_success else "FAIL"

    # Sample 3 frames: 15%, 50%, 85%
    sample_indices = [
        int(frame_count * 0.15),
        int(frame_count * 0.50),
        max(0, int(frame_count * 0.85)),
    ]

    saved_frames = []
    red_counts = []
    bright_means = []

    for i, idx in enumerate(sample_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret and frame is not None:
            # Check red pixel presence (7-seg LED check)
            # frame is BGR
            b, g, r = frame[:, :, 0], frame[:, :, 1], frame[:, :, 2]
            red_mask = (r > 160) & (r > g * 1.3) & (r > b * 1.2)
            red_pixels = int(np.sum(red_mask))
            red_counts.append(red_pixels)

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            bright_means.append(float(np.mean(gray)))

            # Save snapshot
            snap_name = f"{f.stem}_frame_{idx}_{i}.jpg"
            snap_path = OUTPUT_DIR / snap_name
            # Resize for compact viewing if large
            h, w = frame.shape[:2]
            if w > 960:
                thumb = cv2.resize(frame, (960, int(h * 960 / w)))
            else:
                thumb = frame
            cv2.imwrite(str(snap_path), thumb)
            saved_frames.append(str(snap_path))

    cap.release()

    item = {
        "file": f.name,
        "category": category,
        "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
        "duration_sec": round(duration, 2),
        "resolution": f"{width}x{height}",
        "fps": round(fps, 1),
        "frame_count": frame_count,
        "avg_brightness": round(float(np.mean(bright_means)) if bright_means else 0, 1),
        "avg_red_pixels": int(np.mean(red_counts)) if red_counts else 0,
        "snapshots": saved_frames,
    }
    report.append(item)
    print(f"[{category}] {f.name}: {item['duration_sec']}s, {item['resolution']}, {item['size_mb']}MB, red_px: {item['avg_red_pixels']}")

with open(OUTPUT_DIR / "summary.json", "w", encoding="utf-8") as out:
    json.dump(report, out, ensure_ascii=False, indent=2)

print("\nSaved summary to", OUTPUT_DIR / "summary.json")
