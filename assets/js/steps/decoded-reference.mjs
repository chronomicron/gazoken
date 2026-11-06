/** Phase 2, Step 2.1: describe the fixed browser-decoded pixel reference. */
export const stepId = '2.1';
export const version = '0.1.0';

export async function run(inputs) {
  if (!inputs || typeof inputs.record !== 'function' || typeof inputs.getSourceSha256 !== 'function') {
    throw new TypeError('Step 2.1 requires an image SourceContext.');
  }
  const source = inputs.record();
  const reference = source.representations?.decodedPixels;
  if (!reference?.available) {
    throw new Error('A decoded browser pixel reference is unavailable. Load a supported image first.');
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(inputs.mediaType)) {
    throw new TypeError('Step 2.1 supports browser-decoded JPEG, PNG, or WebP images.');
  }
  const sourceSha256 = await inputs.getSourceSha256();
  return {
    contractVersion: 1,
    stepId,
    methodVersion: version,
    status: 'completed',
    inputs: {
      requiredRepresentation: 'browser-decoded pixel package linked to the original encoded file',
      source: { ...source, sha256: sourceSha256 },
    },
    parameters: {
      decoder: reference.provenance?.decoder || 'Browser decoder (unspecified)',
      representation: `${reference.dtype} ${reference.channels.join('/')} pixels`,
      orientation: reference.provenance?.orientationPolicy || 'Browser default; not independently controlled',
      colorPolicy: reference.provenance?.colorPolicy || 'Browser default; not independently controlled',
    },
    measurements: {
      width: reference.width,
      height: reference.height,
      pixelCount: reference.width * reference.height,
      channels: [...reference.channels],
      dtype: reference.dtype,
      layout: reference.layout,
      sourceContextId: reference.sourceContextId,
      sourceSha256,
      decoderProvenance: { ...reference.provenance },
      coordinateMapping: reference.provenance?.coordinates || 'top-left origin; pixel coordinates',
      interpretation: 'Reference manifest for the image already decoded for browser display. Decoder, color, alpha, and orientation behavior are browser-dependent; this is not a reproducible Python or native-component JPEG decode.',
    },
    warnings: [],
  };
}
