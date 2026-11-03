import { analyze } from './analysis.mjs';
self.onmessage = ({ data }) => {
  try {
    const { kind, pixels, width, height, options, reference } = data;
    const result = analyze(kind, pixels, width, height, options, reference);
    self.postMessage({ ok: true, result }, [result.pixels.buffer]);
  } catch (error) {
    self.postMessage({ ok: false, message: error.message });
  }
};
