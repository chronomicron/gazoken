import { run as runSourceIdentity } from './formats/jpeg/steps/source-identity.mjs';
import { run as runFileStructure } from './formats/jpeg/steps/file-structure.mjs';
import { run as runMetadataInventory } from './formats/jpeg/steps/metadata-inventory.mjs';
import { run as runQuantizationTables } from './formats/jpeg/steps/quantization-tables.mjs';
import { run as runEntropyCoding } from './formats/jpeg/steps/entropy-coding.mjs';
import { run as runEmbeddedImages } from './formats/jpeg/steps/embedded-images.mjs';
import { run as runByteDistribution } from './formats/jpeg/steps/byte-distribution.mjs';

const $ = (id) => document.getElementById(id);
const dialog = $('python-dialog');
const selectedSteps = new Set(['1.1', '1.2', '1.3', '1.4', '1.7']);
let stepCatalog = [];
let sourceContext = null;
const browserStepIds = new Set(['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7']);

document.addEventListener('gazoken:source-context', ({ detail }) => {
  sourceContext = detail?.sourceContext || null;
  document.querySelectorAll('[data-run-browser-step]').forEach(button => {
    button.disabled = !sourceContext || sourceContext.mediaType !== 'image/jpeg';
  });
});

function node(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function openPythonHelp(step = null) {
  if (step) {
    const full = step.implementation === 'ready';
    $('python-dialog-title').textContent = full ? 'Use this tool in Python' : 'This step is planned for Python';
    $('python-dialog-message').textContent = full
      ? 'This measurement is implemented in the local Python workbench. Install the source checkout to run it and keep its settings, output, and provenance together. Some tools require an optional Python extra.'
      : 'This step is listed in the Python workbench, but its analysis method is still under development. The local app can record configuration for it; it will not produce a measurement yet.';
  } else {
    $('python-dialog-title').textContent = 'Get the full workbench';
    $('python-dialog-message').textContent = 'Install the Gazoken source checkout to use the local three-phase framework and its currently available Python measurements. Planned methods are still under development.';
  }
  dialog.showModal();
}

document.querySelectorAll('[data-python-help]').forEach(button => button.addEventListener('click', () => openPythonHelp()));
document.querySelectorAll('[data-media]').forEach(button => button.addEventListener('click', () => {
  const media = button.dataset.media;
  if (media === 'JPEG') {
    $('media-selector').open = false;
    return;
  }
  $('media-notice-text').textContent = `${media} investigation is still under development. The public browser workbench currently supports JPEG file inspection and decoded JPEG, PNG, or WebP image views.`;
  $('media-notice').showModal();
}));
document.querySelectorAll('[data-viewer-mode]').forEach(button => button.addEventListener('click', () => {
  const mode = button.dataset.viewerMode;
  if (mode === 'image') {
    document.querySelectorAll('[data-viewer-mode]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    $('view-tag').textContent = 'SOURCE VIEW';
    return;
  }
  if (mode === 'quantization') {
    window.location.href = './jpeg.html';
    return;
  }
  $('python-dialog-title').textContent = 'Open the local byte map';
  $('python-dialog-message').textContent = 'The encoded-byte map belongs to the full Python workbench. Install the local app to view it alongside the preserved JPEG source.';
  dialog.showModal();
}));
document.querySelectorAll('button[data-public-phase]').forEach(button => button.addEventListener('click', () => {
  const phase = Number(button.dataset.publicPhase);
  document.body.dataset.publicPhase = String(phase);
  document.querySelectorAll('button[data-public-phase]').forEach(tab => {
    const active = Number(tab.dataset.publicPhase) === phase;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
    if (active) tab.setAttribute('aria-current', 'step');
    else tab.removeAttribute('aria-current');
  });
  const labels = {
    1: ['PHASE 01 / ENCODED FILE', 'Configure source structure, metadata, quantization, coding, and byte-level investigations. Browser-based JPEG inspection is available from the step cards.'],
    2: ['PHASE 02 / DECODED IMAGE', 'Choose a browser view for this image. Python-only steps are listed below with their current implementation status.'],
    3: ['PHASE 03 / PROCESSING HISTORY', 'Review planned methods for geometry, color, filtering, noise, and other processing traces. These require the local Python framework; most methods remain under development.']
  };
  const [kicker, description] = labels[phase];
  $('phase-kicker').textContent = kicker;
  $('phase-heading').textContent = 'Build your investigation';
  $('phase-description').textContent = description;
  $('browser-tools-panel').hidden = phase !== 2;
  $('inspector-promo').hidden = phase !== 1;
  document.querySelector('.python-panel').scrollIntoView({block:'nearest',behavior:'smooth'});
  document.dispatchEvent(new CustomEvent('publicphasechange'));
}));

function addParameter(container, parameter, enabled = false) {
  const label = node('label', 'preview-param');
  const title = node('span', '', parameter.label || parameter.key);
  label.append(title);
  let control;
  if (parameter.type === 'select') {
    control = node('select');
    for (const option of parameter.options || []) {
      const item = node('option', '', option);
      item.value = option;
      control.append(item);
    }
    control.value = parameter.default;
  } else if (parameter.type === 'checkbox') {
    control = node('input');
    control.type = 'checkbox';
    control.checked = Boolean(parameter.default);
  } else {
    control = node('input');
    control.type = ['text','number','range'].includes(parameter.type) ? parameter.type : 'text';
    if (parameter.default !== undefined && parameter.default !== null) control.value = String(parameter.default);
    if (parameter.min !== undefined) control.min = String(parameter.min);
    if (parameter.max !== undefined) control.max = String(parameter.max);
    if (parameter.step !== undefined) control.step = String(parameter.step);
    if (parameter.placeholder) control.placeholder = parameter.placeholder;
  }
  control.disabled = !enabled;
  control.dataset.stepParameter = parameter.key;
  label.append(control);
  container.append(label);
}

function renderStep(step) {
  const details = node('details', 'step-card');
  details.dataset.stepId = step.id;
  details.open = step.id === '1.1' && document.body.dataset.publicPhase === '1';
  const summary = node('summary');
  const number = node('span', 'step-number');
  number.append(node('span', '', step.id));
  const signal = node('span', 'step-signal');
  number.append(signal);
  const info = node('span', 'step-info');
  info.append(node('strong', '', step.title));
  info.append(node('small', '', step.subtitle || step.group || 'Investigation step'));
  const state = step.implementation === 'ready' ? null : node('span', 'step-state', 'PLANNED');
  const chevron = node('span', 'chevron', '›');
  summary.append(number, info);
  if (state) summary.append(state);
  summary.append(chevron);
  details.append(summary);

  const include = node('label', 'step-select');
  const checkbox = node('input');
  checkbox.type = 'checkbox';
  checkbox.checked = selectedSteps.has(step.id);
  checkbox.setAttribute('aria-label', `Include ${step.id} ${step.title} in the selected run`);
  checkbox.addEventListener('change', () => {
    checkbox.checked ? selectedSteps.add(step.id) : selectedSteps.delete(step.id);
    updateSelection();
  });
  include.append(checkbox, node('span', '', 'Include this step in the selected run'));
  details.append(include);

  const controls = node('fieldset', 'step-controls');
  const browserStep = browserStepIds.has(step.id);
  controls.disabled = !browserStep;
  const legend = node('legend', '', 'STEP ' + step.id + ' / PARAMETERS');
  const description = node('p', 'step-description', step.description || 'See the local workbench for this step.');
  const note = node('p', 'step-hint', step.id === '1.1'
    ? 'This browser step reads the original JPEG file bytes. Decoded preview pixels are a separate representation.'
    : step.id === '1.2'
      ? 'This browser step inventories markers, frame declarations, and scan layout from the original encoded JPEG bytes.'
    : step.id === '1.3'
      ? 'This browser step reads bounded metadata from the original JPEG bytes. Metadata values are editable file claims, not authenticated provenance.'
    : step.id === '1.4'
      ? 'This browser step extracts exact stored quantization values, their definitions over time, and frame or scan references from the original JPEG bytes.'
    : step.id === '1.5'
      ? 'This browser step reads stored Huffman definitions and scan-time table assignments from the original JPEG bytes. It does not decode entropy symbols.'
    : step.id === '1.6'
      ? 'This browser step locates declared embedded JPEG previews in Exif and JFXX blocks, verifies their bounded byte ranges, and records hashes without replacing or decoding the source.'
    : step.id === '1.7'
      ? 'This browser step counts each byte value in the original encoded file and reports descriptive Shannon entropy. The result is not a tampering score.'
    : step.implementation === 'ready'
      ? 'Method implemented in the local Python app. This static page cannot run it.'
      : 'Planned method. Local settings can be recorded; no measurement is produced.');
  controls.append(legend, description);
  if (step.parameters?.length) {
    const grid = node('div', 'parameter-preview');
    for (const parameter of step.parameters) addParameter(grid, parameter, browserStep);
    controls.append(grid);
  }
  const inputText = step.tool?.inputs?.length ? 'Required input: ' + step.tool.inputs.join(', ') + '.' : '';
  if (inputText) controls.append(node('p', 'step-input-note', inputText));
  controls.append(note);
  const actions = node('div', 'step-actions');
  const use = node('button', 'button secondary', browserStep ? 'Run this step in browser' : step.implementation === 'ready' ? 'Use this step in Python ↗' : 'View Python step ↗');
  use.type = 'button';
  if (browserStep) {
    use.dataset.runBrowserStep = step.id;
    use.disabled = !sourceContext || sourceContext.mediaType !== 'image/jpeg';
    use.title = `Runs step ${step.id} on the original encoded JPEG file.`;
    use.addEventListener('click', async () => {
      await executeBrowserStep(step.id, use, controls);
    });
  } else {
    use.addEventListener('click', () => openPythonHelp(step));
  }
  actions.append(use);
  if (step.id.startsWith('1.') && ['1.2','1.3','1.4','1.5','1.6','1.7'].includes(step.id)) {
    const inspector = node('a', 'text-link', 'View browser inspector ↗');
    inspector.href = './jpeg.html';
    inspector.title = 'Choose this JPEG again in the separate browser inspector.';
    actions.append(inspector);
  }
  details.append(controls, actions);
  updateSignal(step.id, signal, step.implementation);
  return details;
}

function readParameters(controls) {
  const parameters = {};
  for (const control of controls?.querySelectorAll('[data-step-parameter]') || []) {
    parameters[control.dataset.stepParameter] = control.type === 'checkbox'
      ? control.checked
      : control.type === 'number' ? Number(control.value) : control.value;
  }
  return parameters;
}

async function executeBrowserStep(stepId, button, controls = button?.closest('.step-card')?.querySelector('.step-controls')) {
  if (!sourceContext || sourceContext.mediaType !== 'image/jpeg') {
    $('run-python-status').textContent = `Load a JPEG image to run step ${stepId} in the browser.`;
    return false;
  }
  if (button) {
    button.disabled = true;
    button.textContent = 'Reading original file…';
  }
  try {
    const parameters = readParameters(controls);
    const runners = {
      '1.1': runSourceIdentity,
      '1.2': runFileStructure,
      '1.3': runMetadataInventory,
      '1.4': runQuantizationTables,
      '1.5': runEntropyCoding,
      '1.6': runEmbeddedImages,
      '1.7': runByteDistribution,
    };
    const result = await runners[stepId](sourceContext, parameters);
    if (stepId === '1.1') appendSourceIdentityResult(result);
    else if (stepId === '1.2') appendFileStructureResult(result);
    else if (stepId === '1.3') appendMetadataInventoryResult(result);
    else if (stepId === '1.4') appendQuantizationTablesResult(result);
    else if (stepId === '1.5') appendEntropyCodingResult(result);
    else if (stepId === '1.6') appendEmbeddedImagesResult(result);
    else appendByteDistributionResult(result);
    $('run-python-status').textContent = `Step ${stepId} completed in this browser.`;
    return true;
  } catch (error) {
    appendBrowserStepError(stepId, error);
    $('run-python-status').textContent = `Step ${stepId} failed: ${error.message}`;
    return false;
  } finally {
    if (button) {
      button.textContent = 'Run this step in browser';
      button.disabled = !sourceContext || sourceContext.mediaType !== 'image/jpeg';
    }
  }
}

function addReportParagraph(parent, text, className = '') {
  const element = node('p', className, text);
  parent.append(element);
}

function appendSourceIdentityResult(result) {
  const card = node('article', 'result');
  card.dataset.stepResult = '1.1';
  const top = node('div', 'result-top');
  top.append(node('h3', '', '1.1 · Source identity'));
  card.append(top);
  const body = node('div', 'result-body');
  const measurement = result.measurements;
  addReportParagraph(body, `${measurement.filename} · ${measurement.byteLength.toLocaleString()} bytes`, 'settings');
  addReportParagraph(body, `JPEG signature: ${measurement.signature}`);
  addReportParagraph(body, `SHA-256: ${measurement.sha256}`, 'metric');
  addReportParagraph(body, measurement.validation);
  if (result.parameters.note) addReportParagraph(body, `Acquisition note: ${result.parameters.note}`);
  addReportParagraph(body, `Input: ${result.inputs.source.representations.original.kind} · ${result.inputs.source.mediaType}; decoded pixels were not used.`, 'settings');
  card.append(body);
  appendStepReport(card);
}

function appendFileStructureResult(result) {
  const card = node('article', 'result');
  card.dataset.stepResult = '1.2';
  const top = node('div', 'result-top');
  top.append(node('h3', '', '1.2 · File structure'));
  card.append(top);
  const body = node('div', 'result-body');
  const data = result.measurements;
  addReportParagraph(body, `${data.extractionStatus.toUpperCase()} · ${data.segmentCount} segments · ${data.frames.length} frames · ${data.scanCount} scans · ${data.eoiReached ? 'EOI reached' : 'EOI not reached'}`, 'metric');
  addReportParagraph(body, `${data.fileBytes.toLocaleString()} source bytes${data.trailingBytes ? ` · ${data.trailingBytes.toLocaleString()} bytes after EOI` : ''}`, 'settings');
  for (const frame of data.frames.slice(0, 8)) {
    addReportParagraph(body, `${frame.marker} at byte ${frame.markerOffset}: ${frame.width} × ${frame.height}, ${frame.samplePrecisionBits}-bit, ${frame.components.length} components (declared dimensions; no pixel decode).`);
  }
  if (data.frames.length > 8) addReportParagraph(body, `${data.frames.length - 8} additional frame declarations are included in the full record.`, 'settings');
  if (data.scans.length) {
    const scanDetails = document.createElement('details');
    const scanSummary = node('summary', '', 'Scan layout');
    const scanList = document.createElement('ol');
    for (const scan of data.scans.slice(0, 64)) {
      const item = document.createElement('li');
      item.textContent = `Byte ${scan.markerOffset} · ${scan.encodedDataBytes.toLocaleString()} encoded bytes · ${scan.components.length} components · ${scan.restartMarkerCount} restart markers · ${scan.stuffedByteCount} stuffed bytes`;
      scanList.append(item);
    }
    scanDetails.append(scanSummary, scanList);
    body.append(scanDetails);
  }
  const tableDetails = document.createElement('details');
  const tableSummary = node('summary', '', `Marker inventory (${data.segmentCount})`);
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const header = document.createElement('tr');
  for (const title of ['Marker', 'Code', 'Offset', 'Bytes', 'Payload']) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = title;
    header.append(cell);
  }
  head.append(header);
  const rows = document.createElement('tbody');
  for (const segment of data.segments.slice(0, 128)) {
    const row = document.createElement('tr');
    for (const value of [segment.marker, segment.code, segment.offset, segment.byteLength, segment.payloadLength]) {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.append(cell);
    }
    rows.append(row);
  }
  table.append(head, rows);
  tableDetails.append(tableSummary, table);
  body.append(tableDetails);
  if (data.segmentCount > 128) addReportParagraph(body, `First 128 of ${data.segmentCount} marker records shown here.`, 'settings');
  if (result.warnings.length) {
    const warningList = document.createElement('ul');
    warningList.className = 'step-warnings';
    for (const warning of result.warnings.slice(0, 20)) warningList.append(node('li', '', warning));
    body.append(node('h4', '', 'Parser warnings'), warningList);
  }
  addReportParagraph(body, data.interpretation);
  card.append(body);
  appendStepReport(card);
}

function appendMetadataInventoryResult(result) {
  const card = node('article', 'result');
  card.dataset.stepResult = '1.3';
  const top = node('div', 'result-top');
  top.append(node('h3', '', '1.3 · Metadata inventory'));
  card.append(top);
  const body = node('div', 'result-body');
  const data = result.measurements;
  addReportParagraph(body, `${data.reader} · ${data.extractionStatus.toUpperCase()} · ${data.blocks.length} metadata blocks · ${data.exif.length} Exif blocks`, 'metric');
  addReportParagraph(body, `Standard GPS IFD ${data.gpsIncluded ? 'included' : 'excluded'} · MakerNote values ${data.vendorBytesIncluded ? 'included, bounded' : 'excluded'}`, 'settings');
  addReportParagraph(body, 'Metadata may contain personal information. Values shown here are declarations in the file and are not verified.', 'step-hint');
  if (data.blocks.length) {
    const blockTable = document.createElement('table');
    const head = document.createElement('thead');
    const header = document.createElement('tr');
    for (const title of ['Marker', 'Offset', 'Payload bytes', 'Kind']) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = title;
      header.append(cell);
    }
    head.append(header);
    const rows = document.createElement('tbody');
    for (const block of data.blocks.slice(0, 128)) {
      const row = document.createElement('tr');
      for (const value of [block.marker, block.markerOffset, block.payloadBytes, block.kind]) {
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.append(cell);
      }
      rows.append(row);
    }
    blockTable.append(head, rows);
    body.append(blockTable);
    if (data.blocks.length > 128) addReportParagraph(body, `First 128 of ${data.blocks.length} metadata blocks shown.`, 'settings');
  } else {
    addReportParagraph(body, 'No APP or COM metadata blocks were found.', 'settings');
  }
  for (const [index, record] of data.exif.entries()) {
    const detail = document.createElement('details');
    const heading = `Exif block ${index + 1} · ${record.byteOrder || 'byte order unavailable'} · ${record.entries.length} entries`;
    detail.append(node('summary', '', heading));
    const list = document.createElement('ul');
    for (const entry of record.entries.slice(0, 80)) {
      let value = entry.omitted || entry.value;
      if (value === null || value === undefined) value = 'No value read';
      else if (typeof value !== 'string') value = JSON.stringify(value);
      const displayTruncated = value.length > 240;
      if (displayTruncated) value = `${value.slice(0, 237)}…`;
      const item = document.createElement('li');
      item.textContent = `${entry.ifd} · ${entry.name} (${entry.tag}; ${entry.type} × ${entry.count}) · ${value}${entry.truncated || displayTruncated ? ' [display truncated]' : ''}`;
      list.append(item);
    }
    detail.append(list);
    if (record.entries.length > 80) detail.append(node('p', 'settings', `First 80 of ${record.entries.length} Exif entries shown.`));
    body.append(detail);
  }
  if (result.warnings.length) {
    const warningList = document.createElement('ul');
    warningList.className = 'step-warnings';
    for (const warning of result.warnings.slice(0, 20)) warningList.append(node('li', '', warning));
    body.append(node('h4', '', 'Parser warnings'), warningList);
  }
  addReportParagraph(body, data.interpretation);
  card.append(body);
  appendStepReport(card);
}

function appendQuantizationTablesResult(result) {
  const card = node('article', 'result');
  card.dataset.stepResult = '1.4';
  const top = node('div', 'result-top');
  top.append(node('h3', '', '1.4 · Quantization atlas'));
  card.append(top);
  const body = node('div', 'result-body');
  const data = result.measurements;
  addReportParagraph(body, `${data.extractionStatus.toUpperCase()} · ${data.definitionCount} table definitions · ${data.frames.length} frames · ${data.scans.length} scans · ${data.eoiReached ? 'EOI reached' : 'EOI not reached'}`, 'metric');
  addReportParagraph(body, `Layout: ${result.parameters.order} · History ${data.historyRetained ? 'retained' : 'collapsed to final definition per table ID'} · original JPEG bytes`, 'settings');
  const assignments = data.frames.flatMap((frame, frameIndex) => frame.components.map(component =>
    `Frame ${frameIndex + 1} (${frame.marker}) component ${component.componentId} → table ${component.tableId}`));
  if (assignments.length) addReportParagraph(body, assignments.join(' · '));
  if (data.tables.length) {
    for (const tableData of data.tables.slice(0, 16)) {
      const details = document.createElement('details');
      const definitionLabel = `Table ${tableData.tableId} · definition ${tableData.definitionIndex} · ${tableData.precisionBits}-bit · byte ${tableData.payloadOffset}`;
      details.append(node('summary', '', definitionLabel));
      addReportParagraph(details, `Range ${tableData.minimum}–${tableData.maximum} · mean ${tableData.mean.toFixed(2)} quantization step`, 'settings');
      const matrix = document.createElement('table');
      matrix.className = 'quantization-matrix';
      const caption = document.createElement('caption');
      caption.textContent = tableData.layout === 'Natural 8 × 8'
        ? 'Natural row-major frequency positions; exact stored values'
        : 'Stored zigzag sequence shown in rows of eight; exact stored values';
      matrix.append(caption);
      const tableBody = document.createElement('tbody');
      for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
        const row = document.createElement('tr');
        for (let columnIndex = 0; columnIndex < 8; columnIndex++) {
          const index = rowIndex * 8 + columnIndex;
          const cell = document.createElement('td');
          cell.textContent = String(tableData.values[index]);
          const range = tableData.maximum - tableData.minimum;
          const level = range ? (tableData.values[index] - tableData.minimum) / range : 0.5;
          cell.style.backgroundColor = `hsl(${132 - level * 78} 34% ${96 - level * 24}%)`;
          cell.title = `${tableData.layout === 'Natural 8 × 8' ? `row ${rowIndex}, column ${columnIndex}` : `zigzag index ${index}`}: ${tableData.values[index]}`;
          row.append(cell);
        }
        tableBody.append(row);
      }
      matrix.append(tableBody);
      details.append(matrix);
      body.append(details);
    }
    if (data.tables.length > 16) addReportParagraph(body, `First 16 of ${data.tables.length} retained table definitions shown.`, 'settings');
  } else {
    addReportParagraph(body, 'No complete quantization table was found. Absence does not establish lossless encoding.', 'settings');
  }
  if (data.scans.length) {
    const scanDetails = document.createElement('details');
    scanDetails.append(node('summary', '', 'Scan-time table assignments'));
    const list = document.createElement('ul');
    for (const scan of data.scans.slice(0, 64)) {
      const description = scan.assignments.map(assignment =>
        `component ${assignment.componentId} → table ${assignment.tableId ?? 'unknown'}, definition ${assignment.definitionIndex ?? 'missing'}`).join('; ');
      list.append(node('li', '', `Byte ${scan.markerOffset}: ${description || 'no component assignments'}`));
    }
    scanDetails.append(list);
    body.append(scanDetails);
  }
  if (!data.historyRetained) {
    addReportParagraph(body, 'Earlier definitions may be omitted from the table display; scan references retain their original definition indexes and are not redirected to later tables.', 'step-hint');
  }
  if (result.warnings.length) {
    const warningList = document.createElement('ul');
    warningList.className = 'step-warnings';
    for (const warning of result.warnings.slice(0, 20)) warningList.append(node('li', '', warning));
    body.append(node('h4', '', 'Parser warnings'), warningList);
  }
  addReportParagraph(body, data.interpretation);
  addReportParagraph(body, data.limits, 'settings');
  card.append(body);
  appendStepReport(card);
}

function appendEntropyCodingResult(result) {
  const card = node('article', 'result');
  card.dataset.stepResult = '1.5';
  const top = node('div', 'result-top');
  top.append(node('h3', '', '1.5 · Entropy coding'));
  card.append(top);
  const body = node('div', 'result-body');
  const data = result.measurements;
  addReportParagraph(body, `${data.extractionStatus.toUpperCase()} · ${data.definitionCount} Huffman definitions · ${data.scanCount} scans · ${data.eoiReached ? 'EOI reached' : 'EOI not reached'}`, 'metric');
  addReportParagraph(body, `Codebooks ${data.codebooksIncluded ? 'included' : 'omitted'} · scan assignments ${data.scanScriptIncluded ? 'included' : 'omitted'} · original JPEG bytes`, 'settings');
  for (const definition of data.definitions.slice(0, 32)) {
    const detail = document.createElement('details');
    detail.append(node('summary', '', `${definition.tableClass === 0 ? 'DC' : 'AC'} table ${definition.tableId} · definition ${definition.definitionIndex + 1} · byte ${definition.definitionOffset} · ${definition.symbolCount} symbols`));
    addReportParagraph(detail, `Codes by length 1–16: ${definition.countsByLength.join(', ')}`, 'settings');
    if (definition.symbols) {
      addReportParagraph(detail, `Stored symbol order: ${definition.symbols.map(value => `0x${value.toString(16).padStart(2, '0')}`).join(' ')}`, 'settings');
      const list = document.createElement('ul');
      for (const item of definition.codes.slice(0, 64)) list.append(node('li', '', `${item.code} → 0x${item.symbol.toString(16).padStart(2, '0')} (${item.length} bits)`));
      if (definition.codes.length) detail.append(list);
      if (definition.codes.length > 64) addReportParagraph(detail, `First 64 of ${definition.codes.length} canonical codes shown.`, 'settings');
    }
    body.append(detail);
  }
  if (data.definitions.length > 32) addReportParagraph(body, `First 32 of ${data.definitions.length} definitions shown.`, 'settings');
  if (data.scanScriptIncluded && data.scans.length) {
    const section = document.createElement('details');
    section.append(node('summary', '', 'Scan-time Huffman assignments'));
    const list = document.createElement('ul');
    for (const scan of data.scans.slice(0, 64)) {
      const assignments = scan.assignments.map(item => `${item.tableClass === 0 ? 'DC' : 'AC'} component ${item.componentId} → table ${item.tableId}, definition ${item.definitionIndex === null ? 'missing' : item.definitionIndex + 1}`).join('; ');
      list.append(node('li', '', `Byte ${scan.markerOffset} · spectral ${scan.spectralStart}–${scan.spectralEnd} · restart interval ${scan.restartInterval}: ${assignments || 'no Huffman assignments required'}`));
    }
    section.append(list);
    body.append(section);
    if (data.scans.length > 64) addReportParagraph(body, `First 64 of ${data.scans.length} scan records shown.`, 'settings');
  }
  if (result.warnings.length) {
    const list = document.createElement('ul');
    list.className = 'step-warnings';
    for (const warning of result.warnings.slice(0, 20)) list.append(node('li', '', warning));
    body.append(node('h4', '', 'Parser warnings'), list);
  }
  addReportParagraph(body, data.interpretation);
  addReportParagraph(body, data.limits, 'settings');
  card.append(body);
  appendStepReport(card);
}

function appendEmbeddedImagesResult(result) {
  const card = node('article', 'result');
  card.dataset.stepResult = '1.6';
  const top = node('div', 'result-top');
  top.append(node('h3', '', '1.6 · Embedded images'));
  card.append(top);
  const body = node('div', 'result-body');
  const data = result.measurements;
  addReportParagraph(body, `${data.extractionStatus.toUpperCase()} · ${data.previewCount} declared JPEG preview${data.previewCount === 1 ? '' : 's'} · ${data.eoiReached ? 'EOI reached' : 'EOI not reached'}`, 'metric');
  addReportParagraph(body, `Preview limit ${result.parameters.preview_limit} · nested structure ${result.parameters.nested_structure ? 'included' : 'omitted'} · original JPEG bytes`, 'settings');
  if (data.previews.length) {
    for (const preview of data.previews) {
      const detail = document.createElement('details');
      detail.append(node('summary', '', `${preview.kind} · ${preview.byteCount.toLocaleString()} bytes · source byte ${preview.offset}`));
      addReportParagraph(detail, `Container marker at byte ${preview.containerMarkerOffset} · MIME ${preview.mime}`);
      addReportParagraph(detail, `Preview SHA-256: ${preview.sha256}`, 'metric');
      addReportParagraph(detail, `Source SHA-256: ${preview.sourceSha256}`, 'settings');
      if (preview.structure) {
        const structure = preview.structure;
        addReportParagraph(detail, `Nested structure: ${structure.segmentCount} markers · ${structure.frames.length} frames · ${structure.scanCount} scans · ${structure.eoiReached ? 'EOI reached' : 'EOI not reached'}`, 'settings');
        for (const warning of preview.warnings || []) addReportParagraph(detail, warning, 'warning');
      } else if (data.nestedStructureRequested) {
        addReportParagraph(detail, 'Nested JPEG structure is unavailable.', 'settings');
      }
      body.append(detail);
    }
  } else {
    addReportParagraph(body, 'No supported Exif IFD1 or JFXX JPEG preview was found. Empty inventory does not establish that the file contains no other embedded image types.', 'settings');
  }
  if (result.warnings.length) {
    const list = document.createElement('ul');
    list.className = 'step-warnings';
    for (const warning of result.warnings.slice(0, 20)) list.append(node('li', '', warning));
    body.append(node('h4', '', 'Parser warnings'), list);
  }
  addReportParagraph(body, data.interpretation);
  card.append(body);
  appendStepReport(card);
}

function appendByteDistributionResult(result) {
  const card = node('article', 'result');
  card.dataset.stepResult = '1.7';
  const top = node('div', 'result-top');
  top.append(node('h3', '', '1.7 · Byte distribution'));
  card.append(top);
  const body = node('div', 'result-body');
  const data = result.measurements;
  const histogram = data.histogram;
  const maximum = Math.max(...histogram);
  const occupiedValues = histogram.filter(count => count > 0).length;
  const modalValue = histogram.indexOf(maximum);
  addReportParagraph(body, `${data.count.toLocaleString()} bytes · ${occupiedValues} of 256 byte values present · Shannon entropy ${data.entropyBitsPerByte.toFixed(4)} bits/byte`, 'metric');
  addReportParagraph(body, `Scope: whole original JPEG file · most frequent byte 0x${modalValue.toString(16).padStart(2, '0').toUpperCase()} (${maximum.toLocaleString()} occurrences)`, 'settings');

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const chart = document.createElementNS(svgNamespace, 'svg');
  chart.setAttribute('viewBox', '0 0 800 142');
  chart.setAttribute('role', 'img');
  chart.setAttribute('aria-label', 'Histogram of exact byte counts for values zero through 255.');
  chart.classList.add('byte-histogram');
  const title = document.createElementNS(svgNamespace, 'title');
  title.textContent = 'Whole-file byte-value histogram';
  chart.append(title);
  const plotTop = 8;
  const plotHeight = 104;
  const baseline = plotTop + plotHeight;
  for (const fraction of [0, 0.5, 1]) {
    const y = baseline - fraction * plotHeight;
    const line = document.createElementNS(svgNamespace, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('x2', '768');
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('class', 'histogram-gridline');
    chart.append(line);
    const scaleLabel = document.createElementNS(svgNamespace, 'text');
    scaleLabel.setAttribute('x', '772');
    scaleLabel.setAttribute('y', String(y + 3));
    scaleLabel.textContent = Math.round(maximum * fraction).toLocaleString();
    chart.append(scaleLabel);
  }
  histogram.forEach((count, value) => {
    if (!count) return;
    const barHeight = count / maximum * plotHeight;
    const rect = document.createElementNS(svgNamespace, 'rect');
    rect.setAttribute('x', String(value * 3));
    rect.setAttribute('y', String(baseline - barHeight));
    rect.setAttribute('width', '2.55');
    rect.setAttribute('height', String(barHeight));
    const barTitle = document.createElementNS(svgNamespace, 'title');
    barTitle.textContent = `Byte 0x${value.toString(16).padStart(2, '0').toUpperCase()}: ${count.toLocaleString()}`;
    rect.append(barTitle);
    chart.append(rect);
  });
  for (const value of [0, 64, 128, 192, 255]) {
    const label = document.createElementNS(svgNamespace, 'text');
    label.setAttribute('x', String(value * 3));
    label.setAttribute('y', '136');
    label.textContent = `0x${value.toString(16).padStart(2, '0').toUpperCase()}`;
    chart.append(label);
  }
  body.append(chart);
  addReportParagraph(body, 'The histogram describes the complete encoded byte stream, including headers and coded image data. Byte entropy alone is not evidence of editing or image authenticity.', 'settings');
  addReportParagraph(body, data.interpretation);
  card.append(body);
  appendStepReport(card);
}

function appendStepReport(card) {
  $('results').querySelector('.results-empty')?.remove();
  const prior = $('results').querySelector(`[data-step-result="${card.dataset.stepResult}"]`);
  prior?.remove();
  $('results').append(card);
  $('clear-reports').disabled = false;
  const reportCount = $('results').querySelectorAll('[data-step-result]').length;
  $('result-count').textContent = `${reportCount} step report${reportCount === 1 ? '' : 's'}`;
}

function appendBrowserStepError(stepId, error) {
  const card = node('article', 'result');
  card.dataset.stepResult = stepId;
  const names = { '1.1': 'Source identity', '1.2': 'File structure', '1.3': 'Metadata inventory', '1.4': 'Quantization atlas', '1.5': 'Entropy coding', '1.6': 'Embedded images', '1.7': 'Byte distribution' };
  card.append(node('h3', '', `${stepId} · ${names[stepId] || 'Browser step'}`));
  const body = node('div', 'result-body');
  addReportParagraph(body, `Step unavailable: ${error.message}`, 'error');
  card.append(body);
  appendStepReport(card);
}

function updateSignal(stepId, signal, implementation) {
  const status = !selectedSteps.has(stepId) ? 'gray' : implementation === 'ready' ? 'green' : 'amber';
  signal.dataset.status = status;
  signal.setAttribute('aria-label', status === 'green'
    ? browserStepIds.has(stepId) ? 'Selected; can run in this browser' : 'Selected; available in the local workbench'
    : status === 'amber' ? 'Selected; method still planned' : 'Not selected');
}

function updateSelection() {
  const phase = document.body.dataset.publicPhase + '.';
  const steps = stepCatalog.filter(step => step.id.startsWith(phase));
  const selected = steps.filter(step => selectedSteps.has(step.id));
  $('selected-count').textContent = `${selected.length} selected`;
  const browserCount = selected.filter(step => browserStepIds.has(step.id)).length;
  const localCount = selected.length - browserCount;
  $('ready-count').textContent = selected.length === 0
    ? 'No selected steps'
    : browserCount && localCount
      ? `${browserCount} runs here · ${localCount} local`
      : browserCount
        ? `${browserCount} browser step${browserCount === 1 ? '' : 's'}`
        : `${localCount} local step${localCount === 1 ? '' : 's'}`;
  $('execution-plan').replaceChildren(...selected.map(step => {
    const item = node('li');
    item.append(node('b', '', step.id), node('span', '', step.title));
    return item;
  }));
  for (const step of steps) {
    const card = document.querySelector(`[data-step-id="${step.id}"]`);
    if (!card) continue;
    const checkbox = card.querySelector('.step-select input');
    checkbox.checked = selectedSteps.has(step.id);
    updateSignal(step.id, card.querySelector('.step-signal'), step.implementation);
    card.dataset.selection = selectedSteps.has(step.id) ? 'selected' : 'unselected';
  }
}

async function loadCatalog() {
  try {
    const response = await fetch(new URL('../../src/gazoken/web/steps.json', import.meta.url));
    if (!response.ok) throw new Error('Step catalog is unavailable.');
    const catalog = await response.json();
    stepCatalog = catalog;
    $('phase-steps').replaceChildren();
    for (const step of catalog.filter(item => item.id.startsWith(document.body.dataset.publicPhase + '.'))) {
      $('phase-steps').append(renderStep(step));
    }
    updateSelection();
  } catch (error) {
    $('phase-steps').replaceChildren(node('p', 'error', 'Could not load the step catalog. ' + error.message));
  }
}

document.querySelectorAll('button[data-public-phase]').forEach(button => button.addEventListener('click', loadCatalog));
$('select-ready').addEventListener('click', () => {
  const phase = document.body.dataset.publicPhase + '.';
  for (const step of stepCatalog.filter(item => item.id.startsWith(phase) && item.implementation === 'ready')) selectedSteps.add(step.id);
  updateSelection();
});
$('select-all').addEventListener('click', () => {
  const phase = document.body.dataset.publicPhase + '.';
  for (const step of stepCatalog.filter(item => item.id.startsWith(phase))) selectedSteps.add(step.id);
  updateSelection();
});
$('select-none').addEventListener('click', () => {
  const phase = document.body.dataset.publicPhase + '.';
  for (const step of stepCatalog.filter(item => item.id.startsWith(phase))) selectedSteps.delete(step.id);
  updateSelection();
});
$('run-python').addEventListener('click', () => {
  const phase = document.body.dataset.publicPhase + '.';
  const selected = stepCatalog.filter(step => step.id.startsWith(phase) && selectedSteps.has(step.id));
  if (!selected.length) {
    $('run-python-status').textContent = 'Select one or more steps first.';
    return;
  }
  const browserSteps = selected.filter(step => browserStepIds.has(step.id));
  if (!browserSteps.length) {
    $('run-python-status').textContent = ['2', '3'].includes(phase.slice(0, -1))
      ? `Phase ${phase.slice(0, -1)} has no browser analysis adapters yet. These selections are configuration only; no measurement was produced. The local workbench can record settings, but these methods are not implemented there yet either.`
      : 'None of the selected steps can run in this browser. No measurement was produced; use the local workbench for supported local tools.';
    return;
  }
  (async () => {
    let completed = 0;
    for (const step of browserSteps) {
      const button = document.querySelector(`[data-run-browser-step="${step.id}"]`);
      const controls = button?.closest('.step-card')?.querySelector('.step-controls');
      if (!await executeBrowserStep(step.id, button, controls)) return;
      completed++;
    }
    const localCount = selected.length - completed;
    $('run-python-status').textContent = localCount
      ? `${completed} browser step${completed === 1 ? '' : 's'} completed. ${localCount} other selected step${localCount === 1 ? ' needs' : 's need'} the local Python workbench.`
      : `${completed} browser step${completed === 1 ? '' : 's'} completed.`;
  })();
});

loadCatalog();
