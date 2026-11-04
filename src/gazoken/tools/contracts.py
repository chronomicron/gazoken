"""Version 1 tool boundary: immutable images, explicit provenance, JSON outputs.

This is an in-process interface, not isolation from untrusted executable code.
No decoder, browser pixels, model loader or persistent artifact store lives here.
"""
from dataclasses import dataclass, field
import hashlib
import json
from typing import Mapping, Protocol

CONTRACT_VERSION = 1
MAX_BYTES = 25 * 1024 * 1024


@dataclass(frozen=True)
class ImageSource:
    data: bytes
    filename: str
    sha256: str = field(init=False)

    def __post_init__(self):
        if not isinstance(self.data, (bytes, bytearray, memoryview)):
            raise ValueError("Source must be encoded bytes.")
        object.__setattr__(self, "data", bytes(self.data))
        if not self.data or len(self.data) > MAX_BYTES:
            raise ValueError("Choose a non-empty JPEG no larger than 25 MiB.")
        if not self.data.startswith(b"\xff\xd8"):
            raise ValueError("JPEG SOI signature FF D8 is missing.")
        if not isinstance(self.filename, str):
            raise ValueError("Source filename must be text.")
        object.__setattr__(self, "filename", self.filename[:255])
        object.__setattr__(self, "sha256", hashlib.sha256(self.data).hexdigest())

    def record(self):
        return {"filename": self.filename, "size": len(self.data), "sha256": self.sha256,
                "signature": "FF D8", "validation": "Signature only; not a conformance check"}


@dataclass(frozen=True)
class PixelPackage:
    """Tightly packed row-major interleaved uint8 pixels, supplied by Python callers.

    Future numeric/layout variants require an explicit contract extension. Construction
    checks consistency, not whether the caller truthfully identifies its decoder.
    """
    data: bytes
    width: int
    height: int
    channels: tuple[str, ...]
    source_sha256: str
    decoder: str
    decoder_version: str
    color_policy: str
    orientation_policy: str
    coordinates: str

    def __post_init__(self):
        if not isinstance(self.data, (bytes, bytearray, memoryview)):
            raise ValueError("Pixel data must be bytes.")
        object.__setattr__(self, "data", bytes(self.data))
        if type(self.width) is not int or type(self.height) is not int or min(self.width, self.height) < 1:
            raise ValueError("Pixel dimensions must be positive integers.")
        if not isinstance(self.channels, tuple) or len(self.channels) not in (1, 3, 4) or any(not isinstance(c, str) or not c for c in self.channels) or len(set(self.channels)) != len(self.channels):
            raise ValueError("Declare one, three or four distinct channel names.")
        if self.width * self.height > 12_000_000 or len(self.data) != self.width*self.height*len(self.channels):
            raise ValueError("Pixel buffer shape mismatch or 12-megapixel limit exceeded.")
        if not isinstance(self.source_sha256, str) or len(self.source_sha256) != 64 or any(c not in '0123456789abcdef' for c in self.source_sha256):
            raise ValueError("Pixels require a lowercase SHA-256 source identity.")
        for name in ('decoder', 'decoder_version', 'color_policy', 'orientation_policy', 'coordinates'):
            value = getattr(self, name)
            if not isinstance(value, str) or not value.strip() or len(value) > 2000:
                raise ValueError(f"Pixels require explicit {name} provenance.")

    def record(self):
        metadata = {"width": self.width, "height": self.height, "channels": list(self.channels),
                    "dtype": "uint8", "layout": "row_major_interleaved", "source_sha256": self.source_sha256,
                    "decoder": self.decoder, "decoder_version": self.decoder_version,
                    "color_policy": self.color_policy, "orientation_policy": self.orientation_policy,
                    "coordinates": self.coordinates}
        # Include shape and policies: identical byte buffers can represent different images.
        digest = hashlib.sha256(json.dumps(metadata, sort_keys=True).encode()+b'\0'+self.data).hexdigest()
        return {**metadata, "sha256": digest, "byte_count": len(self.data)}


@dataclass(frozen=True)
class ToolInputs:
    source: ImageSource
    pixels: PixelPackage | None = None

    def __post_init__(self):
        if not isinstance(self.source, ImageSource):
            raise ValueError("Tool inputs require an ImageSource.")
        if self.pixels is not None and (not isinstance(self.pixels, PixelPackage) or self.pixels.source_sha256 != self.source.sha256):
            raise ValueError("Pixel package does not belong to this source.")

    def record(self):
        return {"contract_version": CONTRACT_VERSION, "source_sha256": self.source.sha256,
                "pixels": self.pixels.record() if self.pixels else None}


@dataclass(frozen=True)
class ToolOutput:
    measurements: dict
    warnings: tuple[str, ...] = ()
    pixels: PixelPackage | None = None


class ToolHandler(Protocol):
    def __call__(self, inputs: ToolInputs, parameters: Mapping[str, object]) -> ToolOutput: ...
