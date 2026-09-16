from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np


def resize_for_sheet(frame: np.ndarray, width: int = 480) -> np.ndarray:
    height = max(1, round(frame.shape[0] * width / frame.shape[1]))
    return cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)


def label_frame(frame: np.ndarray, text: str) -> np.ndarray:
    result = frame.copy()
    cv2.rectangle(result, (0, 0), (result.shape[1], 42), (0, 0, 0), -1)
    cv2.putText(result, text, (12, 29), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
    return result


def read_frame(capture: cv2.VideoCapture, frame_index: int) -> np.ndarray:
    capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
    ok, frame = capture.read()
    if not ok or frame is None:
        raise RuntimeError(f"Could not read frame {frame_index}")
    return frame


def write_sheet(frames: list[np.ndarray], labels: list[str], path: Path, columns: int) -> None:
    tiles = [label_frame(resize_for_sheet(frame), label) for frame, label in zip(frames, labels)]
    rows: list[np.ndarray] = []
    for start in range(0, len(tiles), columns):
        row = tiles[start:start + columns]
        if len(row) < columns:
            row.extend([np.zeros_like(tiles[0]) for _ in range(columns - len(row))])
        rows.append(np.hstack(row))
    cv2.imwrite(str(path), np.vstack(rows))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    capture = cv2.VideoCapture(str(args.video))
    if not capture.isOpened():
        raise RuntimeError(f"Could not open {args.video}")

    fps = capture.get(cv2.CAP_PROP_FPS)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps else 0
    orientation = capture.get(cv2.CAP_PROP_ORIENTATION_META)

    representative_indices = sorted({
        0,
        round(frame_count * 0.1),
        round(frame_count * 0.25),
        round(frame_count * 0.5),
        round(frame_count * 0.75),
        round(frame_count * 0.9),
        max(0, frame_count - 1),
    })
    representative_frames = [read_frame(capture, index) for index in representative_indices]
    representative_labels = [f"{index / fps:.2f}s  frame {index}" for index in representative_indices]
    write_sheet(representative_frames, representative_labels, args.output / "representative.jpg", 2)
    cv2.imwrite(str(args.output / "middle_full.jpg"), read_frame(capture, frame_count // 2))

    middle = frame_count // 2
    step = max(1, round(fps / 10))
    consecutive_indices = [min(frame_count - 1, middle + offset * step) for offset in range(-5, 6)]
    consecutive_frames = [read_frame(capture, index) for index in consecutive_indices]
    consecutive_labels = [f"{index / fps:.3f}s  frame {index}" for index in consecutive_indices]
    write_sheet(consecutive_frames, consecutive_labels, args.output / "sequence_10hz.jpg", 3)

    metadata = {
        "video": str(args.video.resolve()),
        "size_bytes": args.video.stat().st_size,
        "fps": fps,
        "frame_count": frame_count,
        "duration_seconds": duration,
        "decoded_width": width,
        "decoded_height": height,
        "orientation_metadata_degrees": orientation,
        "representative_frames": representative_indices,
        "sequence_frames": consecutive_indices,
    }
    (args.output / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
