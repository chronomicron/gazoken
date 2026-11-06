/** JPEG Phase 1, Step 1.3: bounded metadata inventory. */
import { parseExif } from '../../../exif.mjs';
import { inspectJpeg } from '../../../jpeg.mjs';

export const stepId = '1.3';
export const version = '1.0.0';
const MAX_SEGMENTS = 4096;
const MAX_EXIF_BLOCKS = 16;
const XMP_SIGNATURE = 'http://ns.adobe.com/xap/1.0/\0';
const ICC_SIGNATURE = 'ICC_PROFILE\0';

function startsWith(bytes, offset, signature) {
  for (let index = 0; index < signature.length; index++) {
    if (bytes[offset + index] !== signature.charCodeAt(index)) return false;
  }
  return true;
}

export async function run(inputs, parameters = {}) {
  if (!inputs || inputs.mediaType !== 'image/jpeg' || typeof inputs.readOriginalBytes !== 'function') {
    throw new TypeError('Step 1.3 requires a JPEG SourceContext with original encoded bytes.');
  }
  const requestedReader = String(parameters.reader ?? 'Auto').replace(' (not connected)', '');
  const includeGps = parameters.include_gps ?? false;
  const includeVendor = parameters.include_vendor ?? false;
  if (!['Auto', 'Bounded TIFF reader', 'ExifTool'].includes(requestedReader)) {
    throw new TypeError('Choose Auto, Bounded TIFF reader, or ExifTool.');
  }
  if (typeof includeGps !== 'boolean' || typeof includeVendor !== 'boolean') {
    throw new TypeError('GPS and vendor inclusion options must be true or false.');
  }
  if (requestedReader === 'ExifTool') {
    const sourceSha256 = await inputs.getSourceSha256();
    return {
      contractVersion: 1,
      stepId,
      methodVersion: version,
      status: 'partial',
      inputs: {
        requiredRepresentation: 'original encoded file',
        source: { ...inputs.record(), sha256: sourceSha256 },
      },
      parameters: { reader: parameters.reader ?? 'Auto', include_gps: includeGps, include_vendor: includeVendor },
      measurements: {
        reader: 'unavailable', extractionStatus: 'partial', gpsIncluded: includeGps,
        vendorBytesIncluded: includeVendor, blocks: [], exif: [],
        interpretation: 'ExifTool is not connected; no external process was invoked.',
      },
      warnings: ['ExifTool is not integrated; no external process was invoked.'],
    };
  }

  const bytes = await inputs.readOriginalBytes();
  const parsed = inspectJpeg(bytes, { includeExif: false });
  const blocks = [];
  const exif = [];
  const warnings = [...parsed.warnings];
  for (const segment of parsed.segments) {
    const marker = segment.marker;
    if (!marker.startsWith('APP') && marker !== 'COM') continue;
    const offset = segment.payloadOffset;
    const end = offset + segment.payloadLength;
    const block = {
      marker,
      markerOffset: segment.offset,
      payloadBytes: segment.payloadLength,
      kind: 'Opaque metadata block',
    };
    if (marker === 'APP1' && startsWith(bytes, offset, 'Exif\0\0')) {
      block.kind = 'Exif';
      if (exif.length >= MAX_EXIF_BLOCKS) {
        warnings.push('Exif block limit reached.');
        blocks.push(block);
        break;
      }
      const record = parseExif(bytes, offset, end, { includeGps, includeVendor });
      exif.push({ markerPayloadOffset: record.offset, byteOrder: record.byteOrder, entries: record.entries });
      warnings.push(...record.warnings);
    } else if (marker === 'APP0' && startsWith(bytes, offset, 'JFIF\0')) {
      block.kind = 'JFIF';
    } else if (marker === 'APP1' && startsWith(bytes, offset, XMP_SIGNATURE)) {
      block.kind = 'XMP (not parsed)';
    } else if (marker === 'APP2' && startsWith(bytes, offset, ICC_SIGNATURE)) {
      block.kind = 'ICC (not parsed)';
    }
    blocks.push(block);
  }
  const sourceSha256 = await inputs.getSourceSha256();
  const extractionStatus = warnings.length ? 'partial' : 'complete';
  return {
    contractVersion: 1,
    stepId,
    methodVersion: version,
    status: extractionStatus === 'complete' ? 'completed' : 'partial',
    inputs: {
      requiredRepresentation: 'original encoded file',
      source: { ...inputs.record(), sha256: sourceSha256 },
    },
    parameters: {
      reader: parameters.reader ?? 'Auto',
      include_gps: includeGps,
      include_vendor: includeVendor,
    },
    measurements: {
      reader: 'Bounded TIFF reader',
      extractionStatus,
      gpsIncluded: includeGps,
      vendorBytesIncluded: includeVendor,
      blocks,
      exif,
      interpretation: 'Metadata declarations are editable claims, not authenticated provenance. Excluding the standard GPS IFD does not remove location information that may appear elsewhere in the file.',
    },
    warnings: warnings.slice(0, 100),
  };
}
