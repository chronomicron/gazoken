/** JPEG Phase 1, Step 1.2: inventory marker, frame, and scan structure. */
import { inspectJpeg } from '../../../jpeg.mjs';

export const stepId = '1.2';
export const version = '1.0.0';
const MAX_SEGMENTS = 4096;

export async function run(inputs, parameters = {}) {
  if (!inputs || inputs.mediaType !== 'image/jpeg' || typeof inputs.readOriginalBytes !== 'function') {
    throw new TypeError('Step 1.2 requires a JPEG SourceContext with original encoded bytes.');
  }
  const segmentLimit = parameters.segment_limit ?? MAX_SEGMENTS;
  const includeScanLayout = parameters.include_scan_layout ?? true;
  if (!Number.isInteger(segmentLimit) || segmentLimit < 32 || segmentLimit > MAX_SEGMENTS) {
    throw new RangeError('Maximum segments must be an integer from 32 to 4096.');
  }
  if (typeof includeScanLayout !== 'boolean') {
    throw new TypeError('Include scan layout must be true or false.');
  }

  const bytes = await inputs.readOriginalBytes();
  const parsed = inspectJpeg(bytes, { includeExif: false });
  const limitReached = parsed.segments.length > segmentLimit
    || (parsed.segments.length >= MAX_SEGMENTS && parsed.warnings.some(warning => warning.includes('Structural inspection limit reached')));
  const keptSegments = parsed.segments.slice(0, segmentLimit);
  const keptOffsets = new Set(keptSegments.map(segment => segment.offset));
  const segments = keptSegments.map(segment => ({
    marker: segment.marker,
    code: `FF${segment.code.toString(16).padStart(2, '0').toUpperCase()}`,
    offset: segment.offset,
    byteLength: segment.length,
    payloadOffset: [0xd8, 0xd9, 0x01, ...Array.from({ length: 8 }, (_, index) => 0xd0 + index)].includes(segment.code)
      ? null : segment.payloadOffset,
    payloadLength: segment.payloadLength,
  }));
  const frames = parsed.frames.filter(frame => keptOffsets.has(frame.offset)).map(frame => ({
    markerOffset: frame.offset,
    marker: frame.marker,
    samplePrecisionBits: frame.precision,
    height: frame.height,
    width: frame.width,
    components: frame.components.map(component => ({
      componentId: component.id,
      horizontalSampling: component.horizontal,
      verticalSampling: component.vertical,
      quantizationTableId: component.quantizationTable,
    })),
  }));
  const selectedScans = parsed.scans.filter(scan => keptOffsets.has(scan.offset));
  const scans = selectedScans.map(scan => ({
    markerOffset: scan.offset,
    components: scan.components.map(component => ({
      componentId: component.id,
      dcTableId: component.dcTable,
      acTableId: component.acTable,
    })),
    spectralStart: scan.spectralStart,
    spectralEnd: scan.spectralEnd,
    approximationHigh: scan.successiveHigh,
    approximationLow: scan.successiveLow,
    dataStart: scan.dataOffset,
    dataEnd: scan.dataEnd,
    encodedDataBytes: scan.encodedBytes,
    restartMarkerCount: scan.restartMarkers,
    stuffedByteCount: scan.stuffedBytes,
  }));
  const warnings = [...parsed.warnings];
  if (limitReached && !warnings.some(warning => warning.includes('segment limit'))) {
    warnings.push('Segment limit reached; inventory is partial.');
  }
  const extractionStatus = parsed.complete && !limitReached && warnings.length === 0 ? 'complete' : 'partial';
  const sourceSha256 = await inputs.getSourceSha256();

  return {
    contractVersion: 1,
    stepId,
    methodVersion: version,
    status: extractionStatus === 'complete' ? 'completed' : 'partial',
    inputs: {
      requiredRepresentation: 'original encoded file',
      source: { ...inputs.record(), sha256: sourceSha256 },
    },
    parameters: { segment_limit: segmentLimit, include_scan_layout: includeScanLayout },
    measurements: {
      extractionStatus,
      eoiReached: parsed.complete,
      fileBytes: bytes.length,
      trailingBytes: parsed.complete ? parsed.trailingBytes : null,
      segmentCount: segments.length,
      segments,
      frames,
      scanCount: selectedScans.length,
      scanLayoutIncluded: includeScanLayout,
      scans: includeScanLayout ? scans : [],
      restartIntervals: parsed.restartIntervals
        .filter(interval => keptOffsets.has(interval.offset))
        .map(interval => ({ markerOffset: interval.offset, intervalMcus: interval.mcus })),
      interpretation: 'Structural inventory only; not JPEG conformance, processing-history, or editing evidence.',
    },
    warnings,
  };
}
