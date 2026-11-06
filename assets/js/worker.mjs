import { analyze } from './analysis.mjs';
import { measureSpatial } from './pixel-analysis.mjs';
self.onmessage = ({ data }) => {
  try {
    const { kind, pixels, width, height, options, reference } = data;
    if (kind === 'spatial-measurements') {
      self.postMessage({ ok: true, result: measureSpatial(pixels, width, height, options) });
    } else {
      const result = analyze(kind, pixels, width, height, options, reference);
      self.postMessage({ ok: true, result }, [result.pixels.buffer]);
    }
  } catch (error) {
    self.postMessage({ ok: false, message: error.message });
  }
};
