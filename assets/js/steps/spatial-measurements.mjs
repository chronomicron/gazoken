/** Phase 2, Step 2.2: descriptive decoded-channel and sampled spatial statistics. */
import { runPixelAnalysisWorker } from '../core/pixel-analysis-worker.mjs';

export const stepId = '2.2';
export const version = '0.1.0';
const MAX_REGIONS = 4096;

export async function run(inputs, parameters = {}) {
  if (!inputs || !['image/jpeg', 'image/png', 'image/webp'].includes(inputs.mediaType)
    || typeof inputs.getDecodedPixels !== 'function') {
    throw new TypeError('Step 2.2 requires a browser-decoded JPEG, PNG, or WebP pixel package.');
  }
  const channel = parameters.channel ?? 'Derived RGB luminance';
  const windowSize = parameters.window_size ?? 64;
  const markClipping = parameters.mark_clipping ?? true;
  if (!['Derived RGB luminance', 'Separate RGB channels'].includes(channel)) {
    throw new TypeError('The browser adapter supports derived RGB luminance or separate RGB channels. Stored JPEG component planes are not available.');
  }
  if (!Number.isInteger(windowSize) || windowSize < 8 || windowSize > 512) {
    throw new RangeError('Local window size must be an integer from 8 to 512.');
  }
  if (typeof markClipping !== 'boolean') throw new TypeError('Clipping control must be true or false.');

  const pixelPackage = await inputs.getDecodedPixels();
  if (!pixelPackage) throw new Error('A decoded pixel reference is unavailable. Load a supported image first.');
  const measurements = await runPixelAnalysisWorker('spatial-measurements', pixelPackage, {
    channel,
    window_size: windowSize,
    mark_clipping: markClipping,
  });
  const warnings = ['No low-texture threshold is defined; local variation is reported without classifying low-texture regions.'];
  const sourceSha256 = pixelPackage.sourceSha256;
  return {
    contractVersion: 1,
    stepId,
    methodVersion: version,
    status: 'partial',
    inputs: {
      requiredRepresentation: 'browser-decoded pixel package',
      source: { ...inputs.record(), sha256: sourceSha256 },
      decodedPixels: {
        width: pixelPackage.width,
        height: pixelPackage.height,
        channels: [...pixelPackage.channels],
        dtype: pixelPackage.dtype,
        layout: pixelPackage.layout,
        provenance: { ...pixelPackage.provenance },
      },
    },
    parameters: { channel, window_size: windowSize, mark_clipping: markClipping },
    measurements: {
      ...measurements,
      maxRetainedWindows: MAX_REGIONS,
      lowTextureMaskIncluded: false,
      interpretation: 'Descriptive browser-decoded channel and local spatial statistics. Exact 0/255 RGB endpoint hits are counted as clipping indicators; local variance and gradients do not identify an edit or processing cause.',
    },
    warnings,
  };
}
