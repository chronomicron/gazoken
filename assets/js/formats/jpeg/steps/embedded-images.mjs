/** JPEG Phase 1, Step 1.6: inventory bounded embedded JPEG preview ranges. */
import { SourceContext } from '../../../core/source-context.mjs';
import { parseExif } from '../../../exif.mjs';
import { inspectJpeg } from '../../../jpeg.mjs';
import { run as runFileStructure } from './file-structure.mjs';

export const stepId = '1.6';
export const version = '1.0.0';
const MAX_MARKERS = 4096;
const MAX_EXIF_BLOCKS = 16;
const MAX_PREVIEWS = 16;

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function run(inputs, parameters = {}) {
  if (!inputs || inputs.mediaType !== 'image/jpeg' || typeof inputs.readOriginalBytes !== 'function') {
    throw new TypeError('Step 1.6 requires a JPEG SourceContext with original encoded bytes.');
  }
  const previewLimit = parameters.preview_limit ?? 4;
  const nestedStructure = parameters.nested_structure ?? true;
  if (!Number.isInteger(previewLimit) || previewLimit < 1 || previewLimit > MAX_PREVIEWS) {
    throw new RangeError('Maximum embedded previews must be an integer from 1 to 16.');
  }
  if (typeof nestedStructure !== 'boolean') {
    throw new TypeError('Nested structure option must be true or false.');
  }

  const bytes = await inputs.readOriginalBytes();
  const parsed = inspectJpeg(bytes, { includeExif: false });
  const sourceSha256 = await inputs.getSourceSha256();
  const warnings = [...parsed.warnings];
  const previews = [];
  const seen = new Set();
  let exifCount = 0;
  let stoppedAtLimit = false;

  async function addPreview(offset, length, kind, containerOffset) {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 2 || offset + length > bytes.length) {
      warnings.push(`${kind}: declared preview range is invalid or outside the source file.`);
      return;
    }
    if (bytes[offset] !== 0xff || bytes[offset + 1] !== 0xd8) {
      warnings.push(`${kind}: declared preview is not a JPEG SOI stream.`);
      return;
    }
    const key = `${offset}:${length}`;
    if (seen.has(key)) return;
    if (previews.length >= previewLimit) {
      warnings.push('Embedded preview limit reached.');
      return;
    }
    seen.add(key);
    const content = bytes.slice(offset, offset + length);
    const preview = {
      index: previews.length,
      kind,
      containerMarkerOffset: containerOffset,
      offset,
      byteCount: length,
      sourceSha256,
      sha256: await sha256(content),
      mime: 'image/jpeg',
    };
    if (nestedStructure) {
      const nestedContext = new SourceContext(new Blob([content], { type: 'image/jpeg' }), 'image/jpeg');
      const nestedResult = await runFileStructure(nestedContext, {
        segment_limit: 256,
        include_scan_layout: false,
      });
      preview.structure = nestedResult.measurements;
      preview.warnings = [...nestedResult.warnings];
      if (nestedResult.warnings.length) warnings.push(`Preview ${preview.index}: nested structure is partial.`);
    }
    previews.push(preview);
  }

  for (const segment of parsed.segments) {
    const offset = segment.payloadOffset;
    const end = offset + segment.payloadLength;
    if (segment.marker === 'APP1'
      && bytes[offset] === 0x45 && bytes[offset + 1] === 0x78 && bytes[offset + 2] === 0x69
      && bytes[offset + 3] === 0x66 && bytes[offset + 4] === 0 && bytes[offset + 5] === 0) {
      if (exifCount >= MAX_EXIF_BLOCKS) {
        warnings.push('Exif block inspection limit reached.');
        stoppedAtLimit = true;
        break;
      }
      exifCount++;
      const record = parseExif(bytes, offset, end, { includeGps: false, includeVendor: false });
      warnings.push(...record.warnings);
      const tags = ['0x0201', '0x0202'].map(tag => record.entries.filter(entry => entry.ifd === 'IFD1' && entry.tag === tag));
      if (!tags[0].length && !tags[1].length) continue;
      if (tags.some(entries => entries.length !== 1)) {
        warnings.push('Exif IFD1 preview requires exactly one offset and length.');
        continue;
      }
      const [offsetEntry, lengthEntry] = tags.map(entries => entries[0]);
      if ([offsetEntry, lengthEntry].some(entry => entry.type !== 'LONG' || entry.count !== 1 || !Number.isSafeInteger(entry.value))) {
        warnings.push('Exif IFD1 preview offset and length must be scalar LONG values.');
        continue;
      }
      const relativeOffset = offsetEntry.value;
      const length = lengthEntry.value;
      const previewOffset = offset + 6 + relativeOffset;
      if (relativeOffset < 8 || length < 2 || previewOffset + length > end) {
        warnings.push('Exif preview range exceeds its APP1 container or TIFF header.');
        continue;
      }
      await addPreview(previewOffset, length, 'Exif IFD1 JPEG', segment.offset);
      continue;
    }
    if (segment.marker !== 'APP0') continue;
    const isJfxx = bytes[offset] === 0x4a && bytes[offset + 1] === 0x46 && bytes[offset + 2] === 0x58
      && bytes[offset + 3] === 0x58 && bytes[offset + 4] === 0;
    if (isJfxx) {
      if (segment.payloadLength < 6) {
        warnings.push('Truncated JFXX extension header.');
      } else if (bytes[offset + 5] !== 0x10) {
        warnings.push('JFXX non-JPEG thumbnail is not extracted.');
      } else {
        await addPreview(offset + 6, segment.payloadLength - 6, 'JFXX JPEG', segment.offset);
      }
      continue;
    }
    const isJfif = bytes[offset] === 0x4a && bytes[offset + 1] === 0x46 && bytes[offset + 2] === 0x49
      && bytes[offset + 3] === 0x46 && bytes[offset + 4] === 0;
    if (isJfif && segment.payloadLength >= 14 && (bytes[offset + 12] || bytes[offset + 13])) {
      warnings.push('JFIF RGB thumbnail is present but not extracted by this JPEG-only tool.');
    }
  }

  if (parsed.segments.length >= MAX_MARKERS && parsed.warnings.some(warning => warning.includes('Structural inspection limit reached'))) {
    stoppedAtLimit = true;
  }
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
    parameters: { preview_limit: previewLimit, nested_structure: nestedStructure },
    measurements: {
      extractionStatus,
      eoiReached: parsed.complete,
      previewCount: previews.length,
      previews,
      nestedStructureRequested: nestedStructure,
      ...(stoppedAtLimit ? { parsingStoppedAtLimit: true } : {}),
      interpretation: 'Declared embedded JPEG ranges only; no pixel comparison, timestamp authentication, or editing inference. Nested offsets are relative to each preview.',
    },
    warnings: warnings.slice(0, 100),
  };
}
