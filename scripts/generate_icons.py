"""Utility helpers to regenerate base64 icon data URIs for the IGEM/UP/1 PWA."""
from __future__ import annotations

import base64
import struct
import zlib

_GRADIENT_TOP = (0x00, 0x5E, 0xA5)
_GRADIENT_BOTTOM = (0x28, 0xA1, 0x97)


def _lerp(start: int, end: int, ratio: float) -> int:
    return int(start + (end - start) * ratio)


def _generate_icon(size: int, maskable: bool = False) -> bytearray:
    data = bytearray(size * size * 4)
    for y in range(size):
        ratio = y / (size - 1 if size > 1 else 1)
        r = _lerp(_GRADIENT_TOP[0], _GRADIENT_BOTTOM[0], ratio)
        g = _lerp(_GRADIENT_TOP[1], _GRADIENT_BOTTOM[1], ratio)
        b = _lerp(_GRADIENT_TOP[2], _GRADIENT_BOTTOM[2], ratio)
        for x in range(size):
            idx = (y * size + x) * 4
            data[idx:idx + 4] = bytes((r, g, b, 255))
    thickness = max(4, size // 24)
    bars = (
        (int(size * 0.35), int(size * 0.28), int(size * 0.72)),
        (int(size * 0.50), int(size * 0.28), int(size * 0.72)),
        (int(size * 0.65), int(size * 0.28), int(size * 0.56)),
    )
    for center_y, start_x, end_x in bars:
        y0 = max(0, center_y - thickness // 2)
        y1 = min(size, y0 + thickness)
        for y in range(y0, y1):
            for x in range(max(0, start_x), min(size, end_x)):
                idx = (y * size + x) * 4
                data[idx:idx + 4] = b"\xff\xff\xff\xff"
    if maskable:
        margin = int(size * 0.08)
        for y in range(size):
            for x in range(size):
                if x < margin or x >= size - margin or y < margin or y >= size - margin:
                    idx = (y * size + x) * 4
                    data[idx + 3] = int(data[idx + 3] * 0.7)
    return data


def _make_png(size: int, maskable: bool = False) -> bytes:
    rgba = _generate_icon(size, maskable)
    stride = size * 4
    scanlines = b"".join(b"\x00" + bytes(rgba[y * stride:(y + 1) * stride]) for y in range(size))
    compressed = zlib.compress(scanlines)

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + tag
            + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")
    return b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend


def as_data_uri(size: int, maskable: bool = False) -> str:
    png = _make_png(size, maskable)
    return f"data:image/png;base64,{base64.b64encode(png).decode('ascii')}"


def main() -> None:
    icons = {
        "icon192": as_data_uri(192),
        "icon512": as_data_uri(512),
        "maskable": as_data_uri(512, maskable=True),
    }
    for name, data_uri in icons.items():
        print(f"{name}: {data_uri[:64]}...")
        print()


if __name__ == "__main__":
    main()
