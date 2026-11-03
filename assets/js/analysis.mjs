/** Exploratory pixel methods, v0.1.0. No forensic probability is computed. */
export const METHOD_VERSION = '0.1.0';

export function analyze(kind, pixels, width, height, options = {}, reference = null) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || pixels.length !== width * height * 4) {
    throw new Error('Invalid image dimensions or pixel buffer.');
  }
  const count = width * height;
  const output = new Uint8ClampedArray(count * 4);
  let sum = 0;
  let maximum = 0;
  const gain = Number(options.gain ?? 1);
  if (!Number.isFinite(gain) || gain <= 0) throw new Error('Gain must be positive.');
  if (!['ela', 'residual', 'edges', 'bitplane'].includes(kind)) throw new Error('Unknown method.');
  if (kind === 'ela' && (!reference || reference.length !== pixels.length)) throw new Error('ELA requires a matching recompressed image.');
  const channel = Number(options.channel ?? 0);
  const bit = Number(options.bit ?? 0);
  if (kind === 'bitplane' && (!Number.isInteger(channel) || channel < 0 || channel > 2 || !Number.isInteger(bit) || bit < 0 || bit > 7)) {
    throw new Error('Invalid channel or bit.');
  }
  // Encoded RGB luma approximation, not linear-light luminance.
  const gray = kind === 'edges' || kind === 'residual' ? new Float32Array(count) : null;
  if (gray) {
    for (let i = 0; i < count; i++) gray[i] = .299 * pixels[4 * i] + .587 * pixels[4 * i + 1] + .114 * pixels[4 * i + 2];
  }
  const at = (x, y) => gray[Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const p = i * 4;
      let value;
      if (kind === 'ela') {
        let pixelSum = 0;
        for (let c = 0; c < 3; c++) {
          const difference = Math.abs(pixels[p + c] - reference[p + c]);
          output[p + c] = difference * gain;
          pixelSum += difference;
          maximum = Math.max(maximum, difference);
        }
        sum += pixelSum / 3;
      } else {
        if (kind === 'bitplane') {
          value = (pixels[p + channel] >> bit) & 1;
          output[p] = output[p + 1] = output[p + 2] = value * 255;
        } else if (kind === 'residual') {
          let local = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) local += at(x + dx, y + dy);
          value = Math.abs(gray[i] - local / 9);
          output[p] = output[p + 1] = output[p + 2] = value * gain;
        } else {
          const gx = -at(x - 1, y - 1) + at(x + 1, y - 1) - 2 * at(x - 1, y) + 2 * at(x + 1, y) - at(x - 1, y + 1) + at(x + 1, y + 1);
          const gy = -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
          value = Math.hypot(gx, gy);
          output[p] = output[p + 1] = output[p + 2] = value / 4;
        }
        sum += value;
        maximum = Math.max(maximum, value);
      }
      output[p + 3] = 255;
    }
  }
  return { pixels: output, mean: sum / count, maximum, version: METHOD_VERSION };
}
