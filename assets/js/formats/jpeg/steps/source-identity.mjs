/** JPEG Phase 1, Step 1.1: identify the supplied encoded source. */
export const stepId = '1.1';
export const version = '1.0.0';

export async function run(inputs, parameters = {}) {
  if (!inputs || inputs.mediaType !== 'image/jpeg' || typeof inputs.readOriginalBytes !== 'function') {
    throw new TypeError('Step 1.1 requires a JPEG SourceContext with original encoded bytes.');
  }
  const bytes = await inputs.readOriginalBytes();
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('JPEG SOI signature FF D8 is missing.');
  }
  const sha256 = await inputs.getSourceSha256();
  return {
    contractVersion: 1,
    stepId,
    methodVersion: version,
    status: 'completed',
    inputs: {
      requiredRepresentation: 'original encoded file',
      source: { ...inputs.record(), sha256 },
    },
    parameters: { note: typeof parameters.note === 'string' ? parameters.note.slice(0, 2000) : '' },
    measurements: {
      filename: inputs.filename,
      byteLength: bytes.length,
      signature: 'FF D8',
      sha256,
      validation: 'JPEG start-of-image signature checked only; this is not a full conformance check.',
    },
    warnings: [],
  };
}
