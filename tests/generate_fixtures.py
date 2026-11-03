#!/usr/bin/env python3
"""Generate controlled synthetic image inputs; no camera photographs are used.

Run from any directory: python3 /path/to/gazoken/tests/generate_fixtures.py
Requires Pillow. The manifest records the generation environment and checksums.
"""
from hashlib import sha256
import json
from pathlib import Path
import platform
import random

import PIL
from PIL import Image, ImageDraw, ImageFilter, ImageFont, features

ROOT = Path(__file__).resolve().parent / 'fixtures'
IMAGES = ROOT / 'images'
MASKS = IMAGES / 'masks'
WIDTH, HEIGHT = 768, 512
SEED = 4281


def make_font():
    # Use Pillow's bundled bitmap font to avoid system-font dependencies.
    # It is deliberately small: the chart is a signal fixture, not artwork.
    return ImageFont.load_default()


def make_reference():
    rng = random.Random(SEED)
    image = Image.new('RGB', (WIDTH, HEIGHT))
    data = []
    for y in range(HEIGHT):
        for x in range(WIDTH):
            # Flat margins, textured left region, smooth gradient at right.
            if 40 <= x < 360 and 160 <= y < 420:
                noise = rng.randrange(-32, 33)
                stripe = 9 if (x // 5 + y // 5) % 2 else -9
                rgb = (66 + noise + stripe, 116 + noise + stripe, 143 + noise + stripe)
            elif 408 <= x < 728 and 160 <= y < 420:
                t = (x - 408) / 319
                rgb = (int(220 - 90 * t), int(178 + 20 * t), int(106 + 90 * t))
            else:
                rgb = (238, 237, 229)
            data.append(tuple(max(0, min(255, c)) for c in rgb))
    image.putdata(data)
    draw = ImageDraw.Draw(image)
    font = make_font()
    draw.text((40, 28), 'GAZOKEN / SYNTHETIC SIGNAL TEST', fill=(30, 45, 55), font=font)
    draw.text((40, 53), 'No camera origin. Controlled pixels for software exploration.', fill=(70, 80, 90), font=font)
    draw.text((40, 135), 'TEXTURE + SEEDED NOISE', fill=(30, 45, 55), font=font)
    draw.text((408, 135), 'SMOOTH COLOUR GRADIENT', fill=(30, 45, 55), font=font)
    for x in range(40, 728):
        g = int(255 * (x - 40) / 687)
        draw.line((x, 86, x, 111), fill=(g, g, g))
    for x in range(40, 728, 12):
        draw.line((x, 450, x, 482), fill=(35, 50, 60), width=2)
    # Deliberate high-contrast structure inside the textured source region.
    draw.ellipse((155, 236, 237, 318), fill=(224, 138, 67), outline=(25, 40, 50), width=3)
    draw.rectangle((85, 350, 146, 386), fill=(222, 226, 215))
    return image


def rectangle_mask(box):
    mask = Image.new('L', (WIDTH, HEIGHT))
    # Crop/paste boxes are half-open; ImageDraw rectangles use inclusive endpoints.
    x0, y0, x1, y1 = box
    ImageDraw.Draw(mask).rectangle((x0, y0, x1 - 1, y1 - 1), fill=255)
    return mask


def main():
    MASKS.mkdir(parents=True, exist_ok=True)
    cases = []
    files = {}

    def save(image, name, *, kind, parent=None, operations=None, mask=None, **kwargs):
        path = IMAGES / name
        image.save(path, **kwargs)
        cases.append({
            'path': path.relative_to(ROOT).as_posix(),
            'kind': kind,
            'parent': parent,
            'operations': operations or [],
            'mask': f'images/masks/{mask}' if mask else None,
        })
        return path

    reference = make_reference()
    save(reference, '01-reference.png', kind='synthetic_reference')
    jpeg = save(reference, '02-reference-q90.jpg', kind='benign_processing',
                parent='images/01-reference.png', operations=['JPEG encode: quality=90, subsampling=0'], quality=90, subsampling=0)
    with Image.open(jpeg) as decoded:
        save(decoded.convert('RGB'), '03-recompressed-q55.jpg', kind='benign_processing',
             parent='images/02-reference-q90.jpg', operations=['Decode JPEG q90; JPEG encode: quality=55, subsampling=2'], quality=55, subsampling=2)

    smooth_box = (60, 195, 335, 405)
    smooth = reference.copy()
    smooth.paste(reference.crop(smooth_box).filter(ImageFilter.GaussianBlur(4)), smooth_box[:2])
    rectangle_mask(smooth_box).save(MASKS / 'smooth-patch.png')
    smoothing = [{'operation': 'local_gaussian_blur', 'radius': 4, 'box_xyxy_half_open': list(smooth_box)}]
    save(smooth, '04-local-smoothing.png', kind='known_local_edit', parent='images/01-reference.png',
         operations=smoothing, mask='smooth-patch.png')
    save(smooth, '05-local-smoothing-q90.jpg', kind='known_local_edit_with_compression',
         parent='images/04-local-smoothing.png', operations=['JPEG encode: quality=90, subsampling=0'],
         mask='smooth-patch.png', quality=90, subsampling=0)

    source_box = (138, 218, 250, 330)
    target = (550, 245)
    copied = reference.copy()
    copied.paste(reference.crop(source_box), target)
    target_box = (*target, target[0] + 112, target[1] + 112)
    rectangle_mask(target_box).save(MASKS / 'copy-move-target.png')
    save(copied, '06-copy-move.png', kind='known_local_edit', parent='images/01-reference.png',
         operations=[{'operation': 'copy_move', 'source_box_xyxy_half_open': list(source_box), 'target_xy': list(target)}],
         mask='copy-move-target.png')

    # A deliberately simple bit-plane pattern, not a covert payload format.
    # The control differs from the reference because red bit 0 is cleared globally.
    control = reference.copy()
    control.putdata([(r & 254, g, b) for r, g, b in reference.getdata()])
    save(control, '07-red-lsb-control.png', kind='bitplane_control', parent='images/01-reference.png',
         operations=['Clear red bit 0 throughout the image'])
    pattern = Image.new('L', (96, 64))
    pd = ImageDraw.Draw(pattern)
    pd.rectangle((8, 8, 87, 55), outline=255, width=2)
    pd.text((26, 25), 'GAZOKEN', fill=255, font=make_font())
    pattern = pattern.resize((WIDTH, HEIGHT), Image.Resampling.NEAREST)
    pattern = pattern.point(lambda value: 255 if value else 0)
    pattern.save(MASKS / 'red-lsb-pattern.png')
    embedded = control.copy()
    embedded.putdata([(r | int(m > 0), g, b) for (r, g, b), m in zip(control.getdata(), pattern.getdata())])
    save(embedded, '08-red-lsb-pattern.png', kind='known_bitplane_pattern', parent='images/07-red-lsb-control.png',
         operations=['Set red bit 0 where the binary pattern is white; preserve all other bits'], mask='red-lsb-pattern.png')

    for path in sorted(IMAGES.rglob('*')):
        if path.is_file():
            with Image.open(path) as image:
                files[path.relative_to(ROOT).as_posix()] = {
                    'sha256': sha256(path.read_bytes()).hexdigest(), 'width': image.width,
                    'height': image.height, 'mode': image.mode, 'bytes': path.stat().st_size,
                }
    manifest = {
        'schema_version': 1, 'generator': 'tests/generate_fixtures.py',
        'seed': SEED, 'python': platform.python_version(), 'pillow': PIL.__version__,
        'jpeg_codec': features.version_codec('jpg'),
        'provenance': 'Generated synthetic signal chart. No camera photograph or third-party image was used.',
        'purpose': 'Software exploration and controlled examples, not a scientific accuracy benchmark.',
        'coordinates': 'Origin at upper left; x right, y down. Boxes use half-open x0,y0,x1,y1.',
        'mask_semantics': 'White = selected edit region or bit-plane pattern. Masks describe construction, not a detector output. JPEG changes can extend beyond edit regions.',
        'cases': cases, 'files': files,
    }
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Generated {len(cases)} inputs and 3 masks in {IMAGES}')


if __name__ == '__main__':
    main()
