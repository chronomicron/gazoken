/** JPEG Phase 1, Step 1.4: extract exact stored DQT definitions and assignments. */
import { inspectJpeg } from '../../../jpeg.mjs';

export const stepId = '1.4';
export const version = '1.0.0';
const MAX_MARKERS = 4096;
const MAX_TABLES = 1024;
const MAX_FRAMES = 32;
const MAX_HUFFMAN_TABLES = 256;
const MAX_SCANS = 256;

export async function run(inputs, parameters = {}) {
  if (!inputs || inputs.mediaType !== 'image/jpeg' || typeof inputs.readOriginalBytes !== 'function') {
    throw new TypeError('Step 1.4 requires a JPEG SourceContext with original encoded bytes.');
  }
  const order = parameters.order ?? 'Natural 8 × 8';
  const retainHistory = parameters.retain_history ?? true;
  if (!['Natural 8 × 8', 'Stored zigzag'].includes(order)) {
    throw new TypeError('Choose Natural 8 × 8 or Stored zigzag table layout.');
  }
  if (typeof retainHistory !== 'boolean') {
    throw new TypeError('Retain table history must be true or false.');
  }

  const bytes = await inputs.readOriginalBytes();
  const parsed = inspectJpeg(bytes, { includeExif: false, maxQuantizationTables: MAX_TABLES });
  const warnings = [...parsed.warnings];
  for (const segment of parsed.segments) {
    if (segment.code === 0xdb && segment.payloadLength === 0) {
      warnings.push(`Empty DQT segment at byte ${segment.offset}.`);
    }
  }
  const definitions = parsed.quantizationTables.map((table, definitionIndex) => ({
    definitionIndex,
    tableId: table.id,
    markerOffset: table.segmentOffset,
    payloadOffset: table.offset,
    precisionBits: table.precision,
    layout: order,
    values: [...(order === 'Natural 8 × 8' ? table.natural : table.zigzag)],
    minimum: table.statistics.minimum,
    maximum: table.statistics.maximum,
    mean: table.statistics.mean,
  }));
  const definitionByOffset = new Map(definitions.map(definition => [definition.payloadOffset, definition.definitionIndex]));
  const active = new Map();
  for (const definition of definitions) active.set(definition.tableId, definition.definitionIndex);
  if (!definitions.length) {
    warnings.push('No complete quantization table found; absence does not establish lossless encoding.');
  }

  const frames = parsed.frames.map(frame => ({
    markerOffset: frame.offset,
    marker: frame.marker,
    components: frame.components.map(component => ({ componentId: component.id, tableId: component.quantizationTable })),
  }));
  for (const frame of parsed.frames) {
    const componentIds = frame.components.map(component => component.id);
    if (new Set(componentIds).size !== componentIds.length) {
      warnings.push(`Frame at ${frame.offset}: duplicate component identifiers.`);
    }
    if (frame.components.some(component => component.quantizationTable > 3)) {
      warnings.push(`Frame at ${frame.offset}: quantization table selector exceeds 3.`);
    }
  }
  const scans = parsed.scans.map(scan => {
    const frame = [...parsed.frames].reverse().find(item => item.offset <= scan.offset);
    const frameTables = new Map((frame?.components || []).map(component => [component.id, component.quantizationTable]));
    const scanDefinitions = new Map(Object.entries(scan.quantizationDefinitions || {}).map(([id, offset]) => [Number(id), definitionByOffset.get(offset)]));
    const assignments = scan.components.map(component => {
      const tableId = frameTables.get(component.id) ?? null;
      const definitionIndex = tableId === null ? null : (scanDefinitions.get(tableId) ?? null);
      if (definitionIndex === null) {
        warnings.push(`Scan at ${scan.offset}: no in-file table definition for component ${component.id}.`);
      }
      return { componentId: component.id, tableId, definitionIndex };
    });
    return { markerOffset: scan.offset, assignments };
  });
  const finalDefinitions = Object.fromEntries([...active.entries()].map(([id, index]) => [String(id), index]));
  const retainedIndices = retainHistory ? definitions.map(definition => definition.definitionIndex) : [...active.values()].sort((a, b) => a - b);
  const retained = retainedIndices.map(index => definitions[index]);
  const sourceSha256 = await inputs.getSourceSha256();
  const extractionStatus = parsed.complete && warnings.length === 0 ? 'complete' : 'partial';

  return {
    contractVersion: 1,
    stepId,
    methodVersion: version,
    status: extractionStatus === 'complete' ? 'completed' : 'partial',
    inputs: {
      requiredRepresentation: 'original encoded file',
      source: { ...inputs.record(), sha256: sourceSha256 },
    },
    parameters: { order, retain_history: retainHistory },
    measurements: {
      extractionStatus,
      eoiReached: parsed.complete,
      definitionCount: definitions.length,
      historyRetained: retainHistory,
      tables: retained,
      finalTableDefinitions: finalDefinitions,
      frames,
      scans,
      interpretation: 'Stored quantization choices only; no quality, encoder, prior-save, or editing estimate.',
      limits: `Parser limits: ${MAX_MARKERS} structural markers, ${MAX_FRAMES} frame headers, ${MAX_HUFFMAN_TABLES} Huffman definitions, ${MAX_SCANS} scan headers, and ${MAX_TABLES} quantization definitions.`,
    },
    warnings: warnings.slice(0, 100),
  };
}
