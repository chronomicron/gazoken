import { installSamples } from './samples.mjs';
const $ = (id) => document.getElementById(id);
const original = $('original');
const ctx = original.getContext('2d', { willReadFrequently: true });
const MAX_PIXELS = 12_000_000;
const MAX_BYTES = 25 * 1024 * 1024;
let image = null;
let generation = 0;
let task = null;
let busy = false;
let loading = false;
const names = { ela: 'Error-level analysis', residual: 'Noise residual', edges: 'Edge strength', bitplane: 'Bit-plane inspection' };
const explanations = {
  ela: 'Absolute RGB difference from a JPEG recompression. Brightness may reflect texture, edges, or compression as well as editing. This view does not locate edits reliably by itself.',
  residual: 'Absolute difference between grayscale pixels and a 3 × 3 local mean. Brighter areas contain more high-frequency detail. Texture, contrast, sharpening, and noise all contribute.',
  edges: 'Sobel gradient magnitude on grayscale pixels. Brighter areas have stronger transitions. Scene content and contrast affect this view; it is not a blur or tampering verdict.',
  bitplane: 'White pixels have this channel bit set; black pixels do not. Ordinary processing can create patterns. No hidden message is detected or extracted by this visualization.',
};
function status(text, error = false) {
  $('status').textContent = text;
  $('status').classList.toggle('error', error);
}
function emptyResults() {
  $('results').replaceChildren();
  const empty = document.createElement('p');
  empty.className = 'results-empty';
  empty.textContent = 'Your selected analyses will appear here, each with its own settings and interpretation.';
  $('results').append(empty);
  $('result-count').textContent = 'No analyses yet';
}
function controls() {
  $('tool-options').disabled = busy || loading;
  $('run').disabled = !image || busy || loading || !document.querySelector('input[name="tool"]:checked:not(:disabled)');
  $('clear').disabled = !image && !loading;
  $('run').textContent = busy ? 'Analysing…' : 'Run selected tools →';
  $('results').setAttribute('aria-busy', String(busy));
  $('source-title').closest('section').setAttribute('aria-busy', String(loading));
}
function cancel() {
  generation++;
  task?.cancel();
  task = null;
  busy = false;
  loading = false;
}
function resetSource() {
  image = null;
  original.width = original.height = 0;
  original.hidden = true;
  $('empty-source').hidden = false;
  $('file-info').textContent = 'No image loaded.';
  $('source-note').textContent = 'The source file is kept unchanged. Analyses use its browser-decoded pixels.';
  emptyResults();
}
async function detectedType(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((v, i) => b[i] === v)) return 'image/png';
  const s = new TextDecoder().decode(b);
  if (s.slice(0, 4) === 'RIFF' && s.slice(8, 12) === 'WEBP') return 'image/webp';
  throw new Error('Please choose a JPEG, PNG, or WebP image.');
}
async function loadFile(file, demo = false) {
  if (!file) return;
  cancel();
  resetSource();
  const token = generation;
  loading = true;
  controls();
  status('Decoding image…');
  let bitmap;
  try {
    if (file.size > MAX_BYTES) throw new Error('This file exceeds the 25 MiB limit.');
    const type = await detectedType(file);
    bitmap = await createImageBitmap(file);
    if (token !== generation) return;
    const { width, height } = bitmap;
    if (!width || !height || width * height > MAX_PIXELS) throw new Error('This image exceeds the 12 megapixel limit. Use a smaller copy for this prototype.');
    original.width = width;
    original.height = height;
    // One explicit preprocessing baseline for every tool, including JPEG roundtrips.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    image = { width, height, pixels, type, name: file.name };
    original.hidden = false;
    $('empty-source').hidden = true;
    $('file-info').textContent = `${file.name} · ${width} × ${height} px · ${(file.size / 1024 / 1024).toFixed(2)} MiB · ${type.replace('image/', '').toUpperCase()}`;
    $('source-note').textContent = demo
      ? 'Synthetic demo: generated texture with a smoother rectangular region. This illustrates the tools; it is not a validation benchmark.'
      : 'Browser-decoded RGB, with transparency composited onto white. No resizing is applied. The source file is unchanged.';
    const ela = document.querySelector('input[value="ela"]');
    ela.disabled = type !== 'image/jpeg';
    ela.checked = type === 'image/jpeg';
    status(type === 'image/jpeg' ? 'Image ready. Choose tools and run an analysis.' : 'Image ready. JPEG error-level analysis is unavailable for this file type.');
  } catch (error) {
    if (token === generation) status(error.message || 'The image could not be decoded.', true);
  } finally {
    bitmap?.close();
    if (token === generation) { loading = false; controls(); }
  }
}
function encode(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob || blob.type !== type) reject(new Error(`${type} encoding is unavailable in this browser.`));
    else resolve(blob);
  }, type, quality));
}
function runWorker(kind, source, options, reference) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
    const finish = () => { clearTimeout(timer); worker.terminate(); if (task === current) task = null; };
    const current = { cancel() { finish(); reject(new DOMException('Analysis cancelled.', 'AbortError')); } };
    const timer = setTimeout(() => { finish(); reject(new Error('Analysis timed out. Try a smaller image.')); }, 60_000);
    task = current;
    worker.onmessage = ({ data }) => { finish(); data.ok ? resolve(data.result) : reject(new Error(data.message)); };
    worker.onerror = () => { finish(); reject(new Error('The analysis worker failed. Serve this page over HTTP/HTTPS in a modern browser.')); };
    worker.postMessage({ kind, pixels: source.pixels, width: source.width, height: source.height, options, reference });
  });
}
function paragraph(parent, text, className = '') {
  const node = document.createElement('p');
  node.textContent = text;
  node.className = className;
  parent.append(node);
}
function addResult(kind, options, result, error = null) {
  const card = document.createElement('article');
  card.className = 'result';
  const top = document.createElement('div');
  top.className = 'result-top';
  const heading = document.createElement('h3');
  heading.textContent = names[kind];
  top.append(heading);
  card.append(top);
  const body = document.createElement('div');
  body.className = 'result-body';
  if (error) {
    paragraph(body, `Analysis unavailable: ${error}`, 'error');
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.setAttribute('aria-label', `${names[kind]} result`);
    canvas.getContext('2d').putImageData(new ImageData(result.pixels, canvas.width, canvas.height), 0, 0);
    card.append(canvas);
    const download = document.createElement('button');
    download.className = 'text-button';
    download.type = 'button';
    download.textContent = 'Save PNG';
    const filename = `${image.name.replace(/\.[^.]*$/, '')}-${kind}.png`;
    download.onclick = async () => {
      download.disabled = true;
      try {
        const blob = await encode(canvas, 'image/png');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } catch (error) { status(`Could not save result: ${error.message}`, true); }
      finally { download.disabled = false; }
    };
    top.append(download);
    let settings;
    if (kind === 'ela') settings = `JPEG quality ${options.quality} · display gain ${options.gain}×`;
    if (kind === 'residual') settings = `3 × 3 mean filter · display gain ${options.gain}×`;
    if (kind === 'edges') settings = 'Sobel 3 × 3 · display magnitude ÷ 4';
    if (kind === 'bitplane') settings = `${['Red', 'Green', 'Blue'][options.channel]} channel · bit ${options.bit}`;
    paragraph(body, `${settings} · method v${result.version}`, 'settings');
    const metric = kind === 'bitplane'
      ? `Set pixels: ${(result.mean * 100).toFixed(2)}% (bit occupancy, not tampering probability)`
      : `Mean ${kind === 'ela' ? 'RGB difference' : kind === 'residual' ? 'absolute residual' : 'gradient magnitude'}: ${result.mean.toFixed(2)} (before display scaling)`;
    paragraph(body, metric, 'metric');
    paragraph(body, explanations[kind]);
    if (kind === 'ela') paragraph(body, 'Browser JPEG encoding is part of this measurement; results may differ between browsers.');
  }
  card.append(body);
  $('results').append(card);
}
$('tools-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!image || busy || loading) return;
  const selected = [...document.querySelectorAll('input[name="tool"]:checked:not(:disabled)')].map((e) => e.value);
  if (!selected.length) { status('Select at least one tool.', true); return; }
  cancel();
  const token = generation;
  const source = image;
  const configs = {
    ela: { quality: Number($('quality').value), gain: Number($('ela-gain').value) },
    residual: { gain: Number($('residual-gain').value) },
    edges: {},
    bitplane: { channel: Number($('channel').value), bit: Number($('bit').value) },
  };
  busy = true;
  controls();
  $('results').replaceChildren();
  let completed = 0;
  let failures = 0;
  try {
    for (const kind of selected) {
      status(`Running ${names[kind].toLowerCase()}…`);
      try {
        let reference = null;
        if (kind === 'ela') {
          const blob = await encode(original, 'image/jpeg', configs.ela.quality / 100);
          if (token !== generation) return;
          const bitmap = await createImageBitmap(blob);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            const context = canvas.getContext('2d');
            context.drawImage(bitmap, 0, 0);
            reference = context.getImageData(0, 0, canvas.width, canvas.height).data;
            canvas.width = canvas.height = 0;
          } finally { bitmap.close(); }
        }
        if (token !== generation) return;
        const result = await runWorker(kind, source, configs[kind], reference);
        if (token !== generation) return;
        addResult(kind, configs[kind], result);
        completed++;
      } catch (error) {
        if (token !== generation) return;
        failures++;
        addResult(kind, configs[kind], null, error.message);
      }
      $('result-count').textContent = `${completed} completed${failures ? ` · ${failures} unavailable` : ''}`;
    }
    status(`${completed} analysis view${completed === 1 ? '' : 's'} completed.${failures ? ` ${failures} unavailable; see the result messages.` : ' Results are exploratory; review each interpretation.'}`, failures > 0);
  } finally {
    if (token === generation) { busy = false; controls(); }
  }
});
$('tools-form').addEventListener('input', () => {
  $('quality-value').value = $('quality').value;
  if (!busy && !loading && image) {
    emptyResults();
    status('Settings updated. Run selected tools to generate new results.');
  }
  controls();
});
$('file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  loadFile(file);
});
$('clear').addEventListener('click', () => { cancel(); resetSource(); controls(); status('Load an image to begin.'); });
const drop = $('drop-zone');
for (const type of ['dragenter', 'dragover']) drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.add('dragover'); });
for (const type of ['dragleave', 'drop']) drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.remove('dragover'); });
drop.addEventListener('drop', (event) => {
  if (event.dataTransfer.files.length !== 1) { status('Drop one image at a time.', true); return; }
  loadFile(event.dataTransfer.files[0]);
});
$('demo').addEventListener('click', async () => {
  $('demo').disabled = true;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    const data = context.createImageData(900, 600);
    let seed = 4281;
    for (let y = 0; y < 600; y++) for (let x = 0; x < 900; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = ((seed >>> 24) - 128) * (x > 520 && x < 760 && y > 180 && y < 420 ? .035 : .45);
      const i = (y * 900 + x) * 4;
      data.data[i] = 55 + x / 10 + noise;
      data.data[i + 1] = 90 + y / 8 + noise;
      data.data[i + 2] = 140 + noise;
      data.data[i + 3] = 255;
    }
    context.putImageData(data, 0, 0);
    const blob = await encode(canvas, 'image/jpeg', .92);
    await loadFile(new File([blob], 'gazoken-synthetic-demo.jpg', { type: blob.type }), true);
  } catch (error) { status(`Could not create demo: ${error.message}`, true); }
  finally { $('demo').disabled = false; }
});
controls();

installSamples({container: document.getElementById('sample-gallery'), load:loadFile, status});
