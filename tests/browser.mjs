const frame = document.getElementById('app');
const log = document.getElementById('log');
const lines = [];
function assert(condition, message) { if (!condition) throw new Error(message); }
async function until(check, label) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > 15000) throw new Error(`Timed out: ${label}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}
try {
  await until(() => frame.contentDocument?.readyState === 'complete' && frame.contentDocument.getElementById('run'), 'page load');
  const doc = frame.contentDocument;
  const $ = (id) => doc.getElementById(id);
  const text = () => $('status').textContent;
  const choose = (file) => {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    $('file').files = transfer.files;
    $('file').dispatchEvent(new Event('change', { bubbles: true }));
  };
  const pass = (message) => { lines.push(`PASS: ${message}`); log.textContent = lines.join('\n'); };
  assert($('run').disabled, 'Run enabled without an image');
  pass('Run disabled before loading an image');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 8;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(100, 150, 200, .5)';
  context.fillRect(0, 0, 8, 8);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const png = new File([blob], 'transparent.png', { type: 'image/png' });
  choose(png);
  await until(() => text().startsWith('Image ready.'), 'PNG loading');
  assert(doc.querySelector('input[value="ela"]').disabled, 'ELA allowed for PNG');
  assert(!$('run').disabled, 'Run disabled after PNG load');
  const pixel = $('original').getContext('2d').getImageData(0, 0, 1, 1).data;
  assert(pixel[3] === 255 && Math.abs(pixel[0] - 177) <= 2, 'Transparency not composited onto white');
  pass('PNG input decoded; transparency normalized; ELA disabled');
  $('run').click();
  await until(() => text().includes('analysis view') && !text().includes('Running'), 'PNG residual');
  assert($('results').querySelectorAll('canvas').length === 1, 'Expected one residual result');
  pass('Selected analysis runs on uploaded pixel data');
  choose(new File(['not an image'], 'invalid.png', { type: 'image/png' }));
  await until(() => $('status').classList.contains('error'), 'invalid input');
  assert($('run').disabled && $('original').hidden, 'Old source remains after invalid input');
  assert(!$('results').querySelector('canvas'), 'Stale results remain after invalid input');
  pass('Invalid input rejected without stale source or results');
  $('demo').click();
  await until(() => text().startsWith('Image ready.'), 'JPEG demo');
  assert(!doc.querySelector('input[value="ela"]').disabled, 'ELA disabled for JPEG');
  for (const checkbox of doc.querySelectorAll('input[name="tool"]')) checkbox.checked = true;
  $('run').click();
  await until(() => $('result-count').textContent === '4 completed', 'all methods');
  assert($('results').querySelectorAll('canvas').length === 4, 'Not all results rendered');
  pass('JPEG roundtrip and all four workers produce results under the current base path');
  $('bit').value = '1';
  $('bit').dispatchEvent(new Event('input', { bubbles: true }));
  assert(!$('results').querySelector('canvas'), 'Settings change left stale results');
  pass('Changing settings invalidates previous results');
  $('run').click();
  $('clear').click();
  await new Promise((r) => setTimeout(r, 300));
  assert($('run').disabled && !$('results').querySelector('canvas'), 'Cleared analysis returned stale results');
  pass('Clear cancels an in-flight analysis');
  choose(png);
  choose(new File(['bad'], 'replacement.png'));
  await until(() => $('status').classList.contains('error'), 'rapid replacement');
  await new Promise((r) => setTimeout(r, 100));
  assert($('original').hidden && $('run').disabled, 'Earlier decode overwrote latest source');
  pass('Rapid replacement does not resurrect earlier source');
  log.textContent += '\n\nALL BROWSER CHECKS PASSED';
} catch (error) {
  log.textContent = `${lines.join('\n')}\nFAIL: ${error.message}`;
  console.error(error);
}
