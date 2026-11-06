import { run as runSourceIdentity } from './formats/jpeg/steps/source-identity.mjs';

const $ = (id) => document.getElementById(id);
const dialog = $('python-dialog');
const selectedSteps = new Set(['1.1', '1.2', '1.3', '1.4', '1.7']);
let stepCatalog = [];
let sourceContext = null;

document.addEventListener('gazoken:source-context', ({ detail }) => {
  sourceContext = detail?.sourceContext || null;
  const button = document.querySelector('[data-run-browser-step="1.1"]');
  if (button) button.disabled = !sourceContext || sourceContext.mediaType !== 'image/jpeg';
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
  const browserStep = step.id === '1.1';
  controls.disabled = !browserStep;
  const legend = node('legend', '', 'STEP ' + step.id + ' / PARAMETERS');
  const description = node('p', 'step-description', step.description || 'See the local workbench for this step.');
  const note = node('p', 'step-hint', browserStep
    ? 'This browser step reads the original JPEG file bytes. Decoded preview pixels are a separate representation.'
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
    use.title = 'Runs source identity on the unchanged encoded JPEG file.';
    use.addEventListener('click', async () => {
      await executeSourceIdentity(use, controls);
    });
  } else {
    use.addEventListener('click', () => openPythonHelp(step));
  }
  actions.append(use);
  if (step.id.startsWith('1.') && ['1.2','1.3','1.4','1.5','1.7'].includes(step.id)) {
    const inspector = node('a', 'text-link', 'View browser inspector ↗');
    inspector.href = './jpeg.html';
    inspector.title = 'Choose this JPEG again in the separate browser inspector.';
    actions.append(inspector);
  }
  details.append(controls, actions);
  updateSignal(step.id, signal, step.implementation);
  return details;
}

async function executeSourceIdentity(button, controls = button?.closest('.step-card')?.querySelector('.step-controls')) {
  if (!sourceContext || sourceContext.mediaType !== 'image/jpeg') {
    $('run-python-status').textContent = 'Load a JPEG image to run step 1.1 in the browser.';
    return false;
  }
  if (button) {
    button.disabled = true;
    button.textContent = 'Reading original file…';
  }
  try {
    const noteInput = controls?.querySelector('[data-step-parameter="note"]');
    const result = await runSourceIdentity(sourceContext, { note: noteInput?.value || '' });
    appendSourceIdentityResult(result);
    $('run-python-status').textContent = 'Step 1.1 completed in this browser.';
    return true;
  } catch (error) {
    appendSourceIdentityError(error);
    $('run-python-status').textContent = `Step 1.1 failed: ${error.message}`;
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
  $('results').replaceChildren(card);
  $('result-count').textContent = 'Step 1.1 complete';
}

function appendSourceIdentityError(error) {
  const card = node('article', 'result');
  card.append(node('h3', '', '1.1 · Source identity'));
  const body = node('div', 'result-body');
  addReportParagraph(body, `Step unavailable: ${error.message}`, 'error');
  card.append(body);
  $('results').replaceChildren(card);
  $('result-count').textContent = 'Step 1.1 unavailable';
}

function updateSignal(stepId, signal, implementation) {
  const status = !selectedSteps.has(stepId) ? 'gray' : implementation === 'ready' ? 'green' : 'amber';
  signal.dataset.status = status;
  signal.setAttribute('aria-label', status === 'green'
    ? stepId === '1.1' ? 'Selected; can run in this browser' : 'Selected; available in the local workbench'
    : status === 'amber' ? 'Selected; method still planned' : 'Not selected');
}

function updateSelection() {
  const phase = document.body.dataset.publicPhase + '.';
  const steps = stepCatalog.filter(step => step.id.startsWith(phase));
  const selected = steps.filter(step => selectedSteps.has(step.id));
  $('selected-count').textContent = `${selected.length} selected`;
  const browserCount = selected.filter(step => step.id === '1.1').length;
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
  const browserStep = selected.find(step => step.id === '1.1');
  if (!browserStep) {
    $('run-python-status').textContent = 'These selected steps need the local Python workbench.';
    openPythonHelp();
    return;
  }
  const button = document.querySelector('[data-run-browser-step="1.1"]');
  const controls = button?.closest('.step-card')?.querySelector('.step-controls');
  executeSourceIdentity(button, controls).then((completed) => {
    if (!completed) return;
    const localCount = selected.length - 1;
    $('run-python-status').textContent = localCount
      ? `Step 1.1 completed here. ${localCount} other selected step${localCount === 1 ? ' needs' : 's need'} the local Python workbench.`
      : 'Step 1.1 completed in this browser.';
  });
});

loadCatalog();
