import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../assets/js/analysis.mjs';
const rgb = (values) => Uint8ClampedArray.from(values.flatMap((v) => [v, v, v, 255]));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-4, `${a} != ${b}`);

test('constant fields have zero Sobel response and zero high-pass residual, including borders', () => {
  for (const [w, h] of [[1, 1], [1, 4], [4, 1], [5, 5]]) {
    for (const kind of ['edges', 'residual']) {
      const result = analyze(kind, rgb(Array(w * h).fill(123)), w, h, { gain: 8 });
      close(result.mean, 0);
      close(result.maximum, 0);
      assert.ok(result.pixels.every((v, i) => v === (i % 4 === 3 ? 255 : 0)));
    }
  }
});
test('Sobel detects a vertical step at its two boundary columns', () => {
  const result = analyze('edges', rgb([0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255]), 4, 3);
  assert.deepEqual([...result.pixels.filter((_, i) => i % 4 === 0)], [0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0]);
  close(result.mean, 510);
});
test('3x3 mean residual follows the analytic isolated-impulse response', () => {
  const result = analyze('residual', rgb([0, 0, 0, 0, 255, 0, 0, 0, 0]), 3, 3);
  close(result.maximum, 255 * 8 / 9);
  close(result.mean, (255 * 16 / 9) / 9);
  assert.equal(result.pixels[16], 227);
  assert.equal(result.pixels[0], 28);
});
test('ELA is zero for identical inputs and reports unamplified differences', () => {
  const input = rgb([10, 30]);
  const same = analyze('ela', input, 2, 1, { gain: 15 }, input);
  assert.equal(same.mean, 0);
  const different = analyze('ela', input, 2, 1, { gain: 30 }, rgb([20, 30]));
  assert.equal(different.mean, 5);
  assert.equal(different.maximum, 10);
  assert.equal(different.pixels[0], 255); // gain saturation does not change the mean
});
test('bit plane uses the requested channel and bit; occupancy is descriptive', () => {
  const input = Uint8ClampedArray.from([0, 128, 1, 255, 255, 0, 2, 255]);
  const greenHigh = analyze('bitplane', input, 2, 1, { channel: 1, bit: 7 });
  assert.deepEqual([...greenHigh.pixels], [255,255,255,255,0,0,0,255]);
  assert.equal(greenHigh.mean, .5);
  assert.equal(analyze('bitplane', input, 2, 1, { channel: 2, bit: 0 }).mean, .5);
});
test('each method preserves the common source buffer', () => {
  const input = rgb([0, 15, 200, 255]);
  const before = input.slice();
  for (const kind of ['ela', 'residual', 'edges', 'bitplane']) analyze(kind, input, 2, 2, {}, before);
  assert.deepEqual(input, before);
});
test('malformed input and unsupported configurations fail explicitly', () => {
  assert.throws(() => analyze('edges', rgb([0]), 2, 1), /dimensions/);
  assert.throws(() => analyze('ela', rgb([0]), 1, 1), /recompressed/);
  assert.throws(() => analyze('unknown', rgb([0]), 1, 1), /Unknown/);
  assert.throws(() => analyze('bitplane', rgb([0]), 1, 1, { bit: 8 }), /Invalid/);
  assert.throws(() => analyze('residual', rgb([0]), 1, 1, { gain: -1 }), /Gain/);
});
