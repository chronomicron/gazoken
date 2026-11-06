/** JPEG Phase 1, Step 1.5: inventory Huffman definitions and scan assignments. */
import { inspectJpeg } from '../../../jpeg.mjs';

export const stepId = '1.5';
export const version = '1.0.0';
const MAX_MARKERS = 4096;
const MAX_FRAMES = 32;
const MAX_DEFINITIONS = 1024;
const MAX_SCANS = 256;

function parseDefinition(bytes, segment, offset, definitionIndex, includeCodebook) {
  const end = segment.payloadOffset + segment.payloadLength;
  const requireBytes = (position, count) => {
    if (position + count > end) throw new Error(`Truncated Huffman definition at byte ${position}.`);
  };
  requireBytes(offset, 17);
  const info = bytes[offset++];
  const tableClass = info >> 4;
  const tableId = info & 15;
  const countsByLength = [...bytes.subarray(offset, offset + 16)];
  offset += 16;
  const symbolCount = countsByLength.reduce((sum, count) => sum + count, 0);
  if (tableClass > 1 || tableId > 3) throw new Error(`Invalid Huffman class or table ID at byte ${offset - 17}.`);
  if (!symbolCount || symbolCount > 256) throw new Error(`Invalid Huffman symbol count at byte ${offset - 16}.`);
  requireBytes(offset, symbolCount);
  const symbols = [...bytes.subarray(offset, offset + symbolCount)];
  const symbolSet = new Set(symbols);
  if (symbolSet.size !== symbols.length) throw new Error(`Duplicate Huffman symbol at byte ${offset}.`);
  const codes = [];
  let code = 0;
  for (let index = 0; index < countsByLength.length; index++) {
    const length = index + 1;
    const count = countsByLength[index];
    if (code + count > 2 ** length) throw new Error(`Oversubscribed Huffman code lengths at byte ${offset - 17}.`);
    for (let item = 0; item < count; item++) {
      if (code === 2 ** length - 1) throw new Error(`Reserved all-ones Huffman code at byte ${offset - 17}.`);
      if (includeCodebook) codes.push({ symbol: symbols[codes.length], length, code: code.toString(2).padStart(length, '0') });
      code++;
    }
    code *= 2;
  }
  return {
    definition: {
      definitionIndex,
      markerOffset: segment.offset,
      definitionOffset: offset - 17,
      tableClass,
      tableId,
      countsByLength,
      symbolCount,
      ...(includeCodebook ? { symbols, codes } : {}),
    },
    nextOffset: offset + symbolCount,
  };
}

export async function run(inputs, parameters = {}) {
  if (!inputs || inputs.mediaType !== 'image/jpeg' || typeof inputs.readOriginalBytes !== 'function') {
    throw new TypeError('Step 1.5 requires a JPEG SourceContext with original encoded bytes.');
  }
  const includeCodebooks = parameters.codebooks ?? true;
  const includeScanScript = parameters.scan_script ?? true;
  if (typeof includeCodebooks !== 'boolean' || typeof includeScanScript !== 'boolean') {
    throw new TypeError('Codebook and scan-script controls must be true or false.');
  }

  const bytes = await inputs.readOriginalBytes();
  const parsed = inspectJpeg(bytes, { includeExif: false, includeHuffman: false });
  const warnings = [...parsed.warnings];
  const definitions = [];
  const scans = [];
  const activeDefinitions = new Map();
  const frameByOffset = new Map(parsed.frames.map(frame => [frame.offset, frame]));
  const scanByOffset = new Map(parsed.scans.map(scan => [scan.offset, scan]));
  let frame = null;
  let stopped = false;

  for (const segment of parsed.segments) {
    if (segment.marker.startsWith('SOF')) {
      frame = frameByOffset.get(segment.offset) || frame;
      continue;
    }
    if (segment.code === 0xcc) {
      warnings.push(`DAC conditioning is present but is not parsed by this Huffman tool (byte ${segment.offset}).`);
      continue;
    }
    if (segment.code === 0xc4) {
      let offset = segment.payloadOffset;
      const end = segment.payloadOffset + segment.payloadLength;
      while (offset < end) {
        if (definitions.length >= MAX_DEFINITIONS) {
          warnings.push(`Huffman definition limit reached (${MAX_DEFINITIONS}); later data was not parsed.`);
          stopped = true;
          break;
        }
        try {
          const parsedDefinition = parseDefinition(bytes, segment, offset, definitions.length, includeCodebooks);
          const definition = parsedDefinition.definition;
          definitions.push(definition);
          activeDefinitions.set(`${definition.tableClass}:${definition.tableId}`, definition.definitionIndex);
          offset = parsedDefinition.nextOffset;
        } catch (error) {
          warnings.push(error.message);
          stopped = true;
          break;
        }
      }
      if (stopped) break;
      continue;
    }
    if (segment.code !== 0xda) continue;
    const scan = scanByOffset.get(segment.offset);
    if (!scan) continue;
    if (includeScanScript) {
      const markerCode = frame?.marker ? Number.parseInt(frame.marker.slice(3), 10) + 0xc0 : null;
      const arithmetic = markerCode !== null && [0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(markerCode);
      const progressive = ['SOF2', 'SOF6'].includes(frame?.marker);
      const lossless = ['SOF3', 'SOF7'].includes(frame?.marker);
      const classes = arithmetic ? [] : progressive
        ? scan.spectralStart > 0 ? [1] : scan.successiveHigh > 0 ? [] : [0]
        : lossless ? [0] : [0, 1];
      if (arithmetic) warnings.push(`Arithmetic-coded frame: Huffman assignment interpretation is unavailable (scan byte ${scan.offset}).`);
      const assignments = [];
      for (const component of scan.components) {
        for (const tableClass of classes) {
          const tableId = tableClass === 0 ? component.dcTable : component.acTable;
          const definitionIndex = activeDefinitions.get(`${tableClass}:${tableId}`) ?? null;
          if (definitionIndex === null) {
            warnings.push(`Scan at ${scan.offset}: no in-file ${tableClass === 0 ? 'DC' : 'AC'} Huffman table ${tableId} for component ${component.id}.`);
          }
          assignments.push({ componentId: component.id, tableClass, tableId, definitionIndex });
        }
      }
      scans.push({
        markerOffset: scan.offset,
        componentIds: scan.components.map(component => component.id),
        spectralStart: scan.spectralStart,
        spectralEnd: scan.spectralEnd,
        successiveHigh: scan.successiveHigh,
        successiveLow: scan.successiveLow,
        restartInterval: [...parsed.restartIntervals].reverse().find(item => item.offset < scan.offset)?.mcus ?? 0,
        assignments,
      });
    }
    if (scans.length >= MAX_SCANS) {
      warnings.push(`Scan limit reached (${MAX_SCANS}); later scans were not retained.`);
      stopped = true;
      break;
    }
  }
  if (!definitions.length) warnings.push('No complete Huffman definition found in the file.');
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
    parameters: { codebooks: includeCodebooks, scan_script: includeScanScript },
    measurements: {
      extractionStatus,
      eoiReached: parsed.complete,
      definitionCount: definitions.length,
      scanCount: parsed.scans.length,
      codebooksIncluded: includeCodebooks,
      scanScriptIncluded: includeScanScript,
      definitions,
      scans,
      interpretation: 'Stored Huffman declarations and derived canonical codes only; no entropy symbols or coefficients are decoded.',
      limits: `Parser limits: ${MAX_MARKERS} structural markers, ${MAX_FRAMES} frame headers, ${MAX_DEFINITIONS} Huffman definitions, and ${MAX_SCANS} scan headers.`,
      ...(stopped ? { parsingStoppedEarly: true } : {}),
    },
    warnings: warnings.slice(0, 100),
  };
}
