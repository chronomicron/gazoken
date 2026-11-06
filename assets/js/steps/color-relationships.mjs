/** Phase 3, Step 3.3: descriptive whole-image RGB channel relationships. */
import { runPixelAnalysisWorker } from '../core/pixel-analysis-worker.mjs';

export const stepId = '3.3';
export const version = '0.1.0';

export async function run(inputs, parameters = {}) {
  if (!inputs || !['image/jpeg', 'image/png', 'image/webp'].includes(inputs.mediaType)
    || typeof inputs.getDecodedPixels !== 'function') {
    throw new TypeError('Step 3.3 requires a browser-decoded JPEG, PNG, or WebP pixel package.');
  }
  const representation = parameters.representation ?? 'RGB channels and pairwise correlations';
  const method = parameters.method ?? 'Descriptive whole-image summary';
  const saturationFloor = parameters.saturation_floor ?? 0.05;
  const region = parameters.region ?? 'Whole image';
  const includeChannels = parameters.include_channels ?? true;
  if (representation !== 'RGB channels and pairwise correlations') {
    throw new TypeError('The browser adapter currently supports RGB channel relationships only.');
  }
  if (method !== 'Descriptive whole-image summary') {
    throw new TypeError('The browser adapter provides descriptive channel statistics only; no method-specific detector is implemented.');
  }
  if (region !== 'Whole image') throw new TypeError('The browser adapter currently supports whole-image scope only.');
  if (!Number.isFinite(saturationFloor) || saturationFloor < 0 || saturationFloor > 1) {
    throw new RangeError('Saturation floor must be between 0 and 1.');
  }
  if (typeof includeChannels !== 'boolean') throw new TypeError('Channel histogram control must be true or false.');

  const pixelPackage = await inputs.getDecodedPixels();
  if (!pixelPackage) throw new Error('A decoded pixel reference is unavailable. Load a supported image first.');
  const measurements = await runPixelAnalysisWorker('color-relationships', pixelPackage, {
    saturation_floor: saturationFloor,
    include_channels: includeChannels,
  });
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
    parameters: { representation, method, saturation_floor: saturationFloor, region, include_channels: includeChannels },
    measurements: {
      ...measurements,
      methodSpecificResponseIncluded: false,
      interpretation: 'Descriptive whole-image RGB channel histograms, moments, pairwise correlations, and a low-saturation count only. These summaries do not test a forensic color-processing hypothesis.',
    },
    warnings: ['Regional plots, hue-specific analysis, and the catalog’s wavelet-ratio candidate are not implemented; only whole-image descriptive RGB statistics are reported.'],
  };
}
