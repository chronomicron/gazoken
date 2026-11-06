/** JPEG Phase 1, Step 1.7: exact whole-file byte histogram and entropy. */
import { byteStatistics } from '../../../jpeg.mjs';

export const stepId = '1.7';
export const version = '1.0.0';

export async function run(inputs, parameters = {}) {
  if (!inputs || inputs.mediaType !== 'image/jpeg' || typeof inputs.readOriginalBytes !== 'function') {
    throw new TypeError('Step 1.7 requires a JPEG SourceContext with original encoded bytes.');
  }
  const scope = parameters.scope ?? 'Whole file';
  if (!['Whole file', 'whole_file'].includes(scope)) {
    throw new TypeError('Byte distribution currently supports Whole file scope only.');
  }
  const bytes = await inputs.readOriginalBytes();
  if (!bytes.length) throw new RangeError('Byte distribution requires a non-empty file.');
  const statistics = byteStatistics(bytes);
  const sourceSha256 = await inputs.getSourceSha256();
  return {
    contractVersion: 1,
    stepId,
    methodVersion: version,
    status: 'completed',
    inputs: {
      requiredRepresentation: 'original encoded file',
      source: { ...inputs.record(), sha256: sourceSha256 },
    },
    parameters: { scope: 'Whole file' },
    measurements: {
      scope: 'whole_file',
      count: statistics.count,
      histogram: statistics.histogram,
      entropyBitsPerByte: statistics.entropy,
      interpretation: 'Descriptive encoded-byte entropy; not a forensic probability or tampering score.',
    },
    warnings: [],
  };
}
