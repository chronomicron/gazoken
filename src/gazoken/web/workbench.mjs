import {sessionRecord, readSettings, phaseReport, phaseSteps} from './session.mjs';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {phase:1, activeByPhase:{1:'1.1',2:'2.1',3:'3.1'}, openByPhase:{1:new Set(['1.1']),2:new Set(['2.1']),3:new Set(['3.1'])}, modeByPhase:{1:'source',2:'source',3:'source'}, catalog: [], settings: {}, selected: new Set(), file: null, bytes: null, preview: null, runs: [], mode: 'source', active: '1.1', url: null, worker: null, busy: false, generation: 0, source: null};
const visibleSteps = () => phaseSteps(state.catalog,state.phase);
const visibleRuns = () => state.runs.map((run,runIndex)=>({run:{...run,results:run.results.filter(r=>r.id.startsWith(`${state.phase}.`))},runIndex})).filter(({run})=>run.results.length);
const visibleRecords = () => visibleRuns().flatMap(({run,runIndex})=>run.results.map(result=>({run,result,runIndex})));
function updateReferenceBanner() {
  $('reference-banner').hidden=state.phase===1;
  $('reference-kicker').textContent=`PHASE 0${state.phase} / SHARED SOURCE`;
  $('reference-title').textContent=state.phase===3?'Same JPEG. Processing-history configuration.':'Same JPEG. A separate decoded-reference plan.';
  $('reference-status').textContent=state.phase===3?'METHODS & REFERENCES PENDING':'PYTHON DECODER PENDING';
  $('reference-note').textContent=state.source
    ? `Linked to ${state.source.filename} · SHA-256 ${state.source.sha256.slice(0,16)}… The image is a browser display preview. Step 2.1 has not created Python reference pixels.`
    : 'Load a JPEG in any phase. The original bytes and source identity will be shared; a Python decoded reference is not yet implemented.';
}
function switchPhase(phase) {
  if(state.busy || !state.catalog.length || ![1,2,3].includes(phase) || phase===state.phase)return;
  state.activeByPhase[state.phase]=state.active;state.modeByPhase[state.phase]=state.mode;
  state.phase=phase;state.active=state.activeByPhase[phase];
  document.querySelectorAll('[data-phase]').forEach(button=>{
    const active=Number(button.dataset.phase)===phase;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    if(active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  });
  $('steps-kicker').textContent={1:'PHASE 01 / ENCODED FILE',2:'PHASE 02 / DECODED IMAGE',3:'PHASE 03 / PROCESSING HISTORY'}[phase];
  $('steps-panel').setAttribute('aria-label',`Phase ${phase} step configuration`);
  $('reports-kicker').textContent=`PHASE 0${phase} / RECORDED OUTPUTS`;
  $('phase-summary-kicker').textContent=`PHASE 0${phase} / SUMMARY`;
  $('phase-report-title').textContent=`Phase ${phase} evidence report`;
  $('run-help').textContent=phase!==1?`Configuration only. Phase ${phase} methods and prerequisites are pending.`:'Other steps record configuration only.';
  $('run').innerHTML=phase!==1?'Record selected plan <span>→</span>':'Run selected <span>→</span>';
  $('run-status').textContent=phase!==1?`Configure Phase ${phase}. Source and other phases’ records are retained.`:state.file?'Original source retained. Choose your next steps.':'Load a JPEG to begin.';
  renderSteps();renderJournal();setMode(state.modeByPhase[phase]);showEvidence();updateReferenceBanner();
}
function selectVisible(kind) {
  for(const step of visibleSteps()){
    state.selected.delete(step.id);
    if(kind==='all'||(kind==='ready'&&step.implementation==='ready'))state.selected.add(step.id);
  }
  renderSteps();
}
let notificationTimer;
function notify(message) { $('notification').textContent = message; $('notification').hidden = false; clearTimeout(notificationTimer); notificationTimer = setTimeout(() => $('notification').hidden = true, 6000); }
function size(n) { return n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KiB` : `${(n / 1024 ** 2).toFixed(2)} MiB`; }
function control(p, id) {
  const value = state.settings[id][p.key], key = `${id}-${p.key}`;
  if (p.type === 'checkbox') return `<label class="param checkbox"><input data-step="${id}" data-param="${p.key}" id="${key}" type="checkbox" ${value ? 'checked' : ''}><span>${esc(p.label)}</span></label>`;
  let widget;
  if (p.type === 'select') widget = `<select data-step="${id}" data-param="${p.key}" id="${key}">${p.options.map(o => `<option ${value === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  else widget = `<input data-step="${id}" data-param="${p.key}" id="${key}" type="${p.type}" value="${esc(value)}" ${p.type === 'number' ? `min="${p.min}" max="${p.max}" step="${p.step}"` : 'maxlength="2000"'} placeholder="${esc(p.placeholder || '')}">`;
  return `<label class="param" for="${key}"><span>${esc(p.label)}</span>${widget}</label>`;
}
const inputLabel = kind => ({jpeg_bytes:'Original JPEG bytes',pixels:'Python pixel package',coefficients:'Stored coefficient package',sensor_reference:'Enrolled sensor reference',model_weights:'Versioned model weights',evaluated_evidence:'Evaluated specialist evidence',run_evidence:'Earlier results in this run'}[kind] || kind);
function toolBoundary(step) {
  const tool=step.tool;
  if(!tool)return '';
  return `<div class="tool-boundary">${step.id==='1.9'?'<p>Optional reader: install with pip install -e &quot;.[coefficients]&quot;. Arrays remain in Python; exports contain descriptors and first-block samples.</p>':''}<strong>Common tool interface · v${esc(tool.contract_version)}</strong><code>${esc(tool.module)}</code><span>${step.implementation==='ready'?'Registered adapter':'Reserved module · not implemented'}</span><ul>${tool.inputs.map(kind=>`<li>${esc(inputLabel(kind))}: ${kind==='jpeg_bytes'?(state.source?'source ready for submission':'load a source'):kind==='run_evidence'?'assembled by runner; may be empty':kind==='coefficients'?'provided only after selected 1.9 succeeds in this run':'not provided by this framework'}</li>`).join('')}</ul></div>`;
}
function renderSteps() {
  const open = state.openByPhase[state.phase];
  $('steps').innerHTML = visibleSteps().map(s => `<details class="step-card ${state.selected.has(s.id) ? 'selected' : ''}" data-step="${s.id}" ${open.has(s.id) ? 'open' : ''}>
    <summary><span class="step-number">${s.id}</span><span class="step-info"><strong>${esc(s.title)}</strong><small>${esc(s.subtitle)}</small></span><span class="step-state ${s.implementation === 'ready' ? 'ready' : ''}">${s.implementation === 'ready' ? 'PYTHON' : 'PLANNED'}</span><span class="chevron">›</span></summary>
    <fieldset class="step-controls"><legend>STEP ${s.id} / PARAMETERS${s.implementation==='ready'?'':' · PROVISIONAL'}</legend><p class="step-description">${esc(s.description)}</p>${toolBoundary(s)}${s.parameters.map(p => control(p, s.id)).join('')}
    <div class="step-actions"><label><input type="checkbox" data-select="${s.id}" ${state.selected.has(s.id) ? 'checked' : ''}> Include step</label><button type="button" class="button" data-inspect="${s.id}">Inspect view ↗</button><button type="button" class="button" data-run="${s.id}" ${!state.file || state.busy ? 'disabled' : ''}>${s.implementation==='ready'?'Run step':'Record settings'}</button></div>
    ${s.implementation !== 'ready' ? `<p class="step-hint">Configuration only · Python method not connected.${s.requires ? ` Planned prerequisites: ${s.requires.join(', ')} (not executed or verified).` : ''}</p>` : ''}</fieldset></details>`).join('');
  updateSelection();
}
function updateSelection() {
  const selected=visibleSteps().filter(s=>state.selected.has(s.id));
  $('selected-count').textContent = `${selected.length} selected`;
  $('execution-plan').innerHTML=selected.length?selected.map(s=>`<li><b>${esc(s.id)} ${esc(s.title)}</b><code>${esc(s.tool?.key||'Unassigned')}</code><span>${s.implementation==='ready'?'Call registered adapter':'Record planned settings only'} · ${esc((s.tool?.inputs||[]).map(inputLabel).join(' + '))}</span></li>`).join(''):'<li>No tools selected in this phase.</li>';
  const ready = selected.filter(s=>s.implementation==='ready').length;
  $('ready-count').textContent = `${ready} implemented · ${selected.length-ready} configuration only`;
  $('run').disabled = !state.file || !selected.length || state.busy;
  document.querySelectorAll('[data-phase]').forEach(b=>b.disabled=state.busy);
  document.querySelectorAll('[data-run]').forEach(b => b.disabled = !state.file || state.busy);
  document.querySelectorAll('.step-card').forEach(e => e.classList.toggle('selected', state.selected.has(e.dataset.step)));
}
function latest(id) {
  return state.runs.flatMap(r => r.results).filter(r => r.id === id && r.status === 'completed').at(-1);
}
function definitionList(items) {
  return `<dl>${items.map(([k,v]) => `<dt>${esc(k)}</dt><dd>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</dd>`).join('')}</dl>`;
}
function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function showEvidence(id = state.active) {
  state.active = id;state.activeByPhase[state.phase]=id;
  const step = state.catalog.find(s => s.id === id);
  if (!step) return;
  $('evidence-kicker').textContent = `STEP ${id} / ${step.group.toUpperCase()}`;
  $('evidence-title').textContent = step.title;
  $('evidence-description').textContent = step.description;
  const measured = latest(id), preview = state.preview;
  let body = '';
  $('evidence-origin').textContent = measured ? 'PYTHON MEASUREMENT' : preview && ['1.2','1.3','1.4','1.5'].includes(id) ? 'BROWSER PREVIEW' : 'CONFIGURATION';
  if(!id.startsWith('1.')) {
    body=`<div class="config-note">${state.source?'Uses the same preserved source as Phase 1.':'Load a source once in any phase.'} Python decoded reference: not created. This step records configuration only. Provisional settings are not validated experimental parameters.</div><h3 class="artifact-heading">Expected outputs · not generated</h3><ul class="artifact-slots">${(step.outputs||[]).map(label=>`<li>${esc(label)}</li>`).join('')}</ul>${step.requires?.length?`<p class="muted">Planned inputs from steps ${esc(step.requires.join(', '))}. Dependencies are declared, not automatically executed.</p>`:''}`;
  }
  else if (id === '1.1' && state.source) body = definitionList(Object.entries(measured?.output || state.source));
  else if (id === '1.10' && measured) {
    const o=measured.output;
    body=`<p>DC + ${o.ac_frequency_count} AC frequencies per component · ${o.histogram_bin_count} nonempty histogram bins</p>`+o.components.map(c=>`<h3>COMPONENT ${c.component_id} · ${c.block_rows} × ${c.block_columns} BLOCKS</h3>`+table(['Zigzag / (u,v)','Samples','Range','Mean','Variance','Zero fraction'],c.frequencies.map(f=>[f.zigzag_index+' / ('+f.u+','+f.v+')',f.sample_count,f.minimum+' … '+f.maximum,f.mean.toFixed(4),f.population_variance.toFixed(4),f.zero_fraction===undefined?'Omitted':f.zero_fraction.toFixed(4)]))).join('')+`<details><summary>Exact histograms and coefficient provenance</summary><pre>${esc(JSON.stringify(o,null,2))}</pre></details><p class="warning-note">${esc(o.interpretation)}</p>`;
  } else if (id === '1.9' && measured) {
    const o=measured.output,p=o.package;
    body=`<p>Stored quantized DCT · ${esc(p.reader)} ${esc(p.reader_version)} · libjpeg ${esc(p.codec_version)}</p>`+table(['Component ID','Blocks (rows × columns)','Table','Bytes'],p.components.map(c=>[c.component_id,c.shape[0]+' × '+c.shape[1],c.table_id,c.byte_count]))+`<details><summary>Coefficient provenance and first blocks</summary><pre>${esc(JSON.stringify(o,null,2))}</pre></details><p class="warning-note">${esc(o.interpretation)}</p>`;
  } else if (id === '1.12' && measured) {
    const o=measured.output;
    body=`<p>${o.record_count} earlier records · ${o.completed_count} completed steps · ${o.warning_count} warnings</p><button id="download-evidence-report" class="button subtle">Download assembled report ↗</button><p class="muted">${esc(o.scope)}</p>`+table(['Step','Execution','Partial extraction','Warnings'],o.coverage.map(r=>[r.id,r.status,r.partial_extraction?'Yes':'No',r.has_warnings?'Yes':'No']))+`<details><summary>Assembled evidence report</summary><pre>${esc(JSON.stringify(o,null,2))}</pre></details><p class="warning-note">${esc(o.interpretation)}</p>`+(measured.warnings||[]).map(w=>`<p class="warning-note">${esc(w)}</p>`).join('');
  } else if (id === '1.6' && measured) {
    const o=measured.output;
    body=`<p>${esc(o.extraction_status)} extraction · ${o.preview_count} embedded JPEG previews</p>`+table(['Kind','Offset','Bytes','SHA-256'],o.previews.map(p=>[p.kind,p.offset,p.byte_count,p.sha256]))+`<details><summary>Embedded preview records</summary><pre>${esc(JSON.stringify(o.previews,null,2))}</pre></details><p class="muted">${esc(o.interpretation)}</p>`+(measured.warnings||[]).map(w=>`<p class="warning-note">${esc(w)}</p>`).join('');
  } else if (id === '1.7' && (measured || preview?.statistics)) {
    const statistics = measured?.output || {histogram: preview.statistics.histogram, entropy_bits_per_byte: preview.statistics.entropy, count: preview.size};
    body = `<canvas id="distribution-chart" class="chart" aria-label="Whole-file byte frequency histogram"></canvas><div class="chart-label"><span>BYTE VALUE 0 → 255</span><span>${statistics.entropy_bits_per_byte.toFixed(4)} BITS / BYTE</span></div><p class="warning-note">Whole-file bytes, including headers and scan data. This descriptive measurement is not a tampering score.${measured ? '' : ' Browser preview; run 1.7 for a Python record.'}</p>`;
    if (!measured) $('evidence-origin').textContent = 'BROWSER PREVIEW';
    $('evidence-content').innerHTML = body; drawHistogram(statistics.histogram); return;
  } else if (id === '1.2' && measured) {
    const o=measured.output;
    body = `<p>${esc(o.extraction_status)} inventory · ${o.segment_count} segments · ${o.scan_count} scans · trailing bytes: ${o.trailing_bytes===null?'unknown':o.trailing_bytes}</p>` + table(['Marker','Offset','Bytes'],o.segments.map(s=>[s.marker,s.offset,s.byte_length])) + `<p class="muted">${esc(o.interpretation)}</p><details><summary>Frames, sampling and scan layout</summary><pre>${esc(JSON.stringify({frames:o.frames,scans:o.scans,restart_intervals:o.restart_intervals},null,2))}</pre></details>` + (measured.warnings||[]).map(w=>`<p class="warning-note">${esc(w)}</p>`).join('');
  } else if (id === '1.2' && preview) {
    body = table(['Marker','Byte offset','Length'], preview.segments.slice(0,256).map(s => [s.marker, s.offset, `${s.length} B`]));
    if (preview.segments.length > 256) body += '<p class="muted">First 256 segments shown.</p>';
    body += `<p class="warning-note">${esc(preview.complete ? 'EOI reached; not a complete validity check.' : 'Partial structural report.')} ${esc(preview.warnings.join(' '))}</p>`;
  } else if (id === '1.3' && measured) {
    const o=measured.output;
    body=`<p>${esc(o.extraction_status)} metadata inventory · ${esc(o.reader)}</p>`+table(['Block','Kind','Bytes'],o.blocks.map(b=>[b.marker,b.kind,b.payload_bytes]))+`<details><summary>Exif declarations</summary><pre>${esc(JSON.stringify(o.exif,null,2))}</pre></details><p class="muted">${esc(o.interpretation||'No reader executed.')}</p>`+(measured.warnings||[]).map(w=>`<p class="warning-note">${esc(w)}</p>`).join('');
  } else if (id === '1.3' && preview) {
    const entries = preview.exif.flatMap(e => e.entries).filter(e => state.settings[id].include_gps || !e.ifd.startsWith('GPS')).slice(0,100);
    body = entries.length ? table(['Directory','Tag','Stored value'], entries.map(e => [e.ifd,e.name, typeof e.value === 'object' ? JSON.stringify(e.value) : e.value])) : '<p class="muted">No readable EXIF entries in this preview. Other metadata formats and vendor data are not decoded here.</p>';
    body += '<p class="warning-note">Stored declarations are not verified provenance. GPS preview rows are hidden unless enabled above. Browser values are not exported as Python results.</p>';
  } else if (id === '1.4' && measured) {
    body = `<p>${esc(measured.output.extraction_status)} extraction · ${measured.output.definition_count} table definitions</p>` + table(['Table / definition','Precision','Min / max','Mean'], measured.output.tables.map(t => [t.table_id+' / '+t.definition_index, t.precision_bits+'-bit', t.minimum+' / '+t.maximum, t.mean.toFixed(2)])) + `<p class="muted">${esc(measured.output.interpretation)}</p><details><summary>Exact tables and component assignments</summary><pre>${esc(JSON.stringify(measured.output,null,2))}</pre></details>` + (measured.warnings||[]).map(w=>`<p class="warning-note">${esc(w)}</p>`).join('');
  } else if (id === '1.4' && preview) {
    body = table(['Table','Precision','Min / max','Mean'], preview.quantizationTables.map(t => [t.id,`${t.precision}-bit`,`${t.statistics.minimum} / ${t.statistics.maximum}`,t.statistics.mean.toFixed(2)]));
    body += '<p class="muted">The atlas above shows actual stored quantization steps, not DCT coefficient samples.</p>';
  } else if (id === '1.5' && measured) {
    const o=measured.output;
    body=`<p>${esc(o.extraction_status)} extraction · ${o.definition_count} definitions · ${o.scan_count} scans</p>`+table(['Class','Table / definition','Symbols'],o.definitions.map(t=>[t.class,t.table_id+' / '+t.definition_index,t.symbol_count]))+`<details><summary>Codebooks and scan assignments</summary><pre>${esc(JSON.stringify(o,null,2))}</pre></details><p class="muted">${esc(o.interpretation)}</p>`+(measured.warnings||[]).map(w=>`<p class="warning-note">${esc(w)}</p>`).join('');
  } else if (id === '1.5' && preview) {
    body = table(['Class','Table','Assigned symbols'], preview.huffmanTables.map(t => [t.class ? 'AC' : 'DC',t.id,t.total]));
    body += '<p class="muted">Definitions only; actual symbol usage is not measured.</p>';
  } else body = `<div class="config-note">${state.file ? 'Parameters ready for a future method adapter. No analytical output has been produced for this step.' : 'Load a JPEG to begin. You can configure this step in advance.'}</div>`;
  $('evidence-content').innerHTML = body;
  if(id==='1.12' && measured) $('download-evidence-report').onclick=()=>downloadJson(measured.output,'gazoken-evidence-report.json');
}
function drawHistogram(histogram, canvas = $('distribution-chart')) {
  if (!canvas) return;
  const width = Math.max(256, canvas.clientWidth), height = 120, scale = window.devicePixelRatio || 1;
  canvas.width = width * scale; canvas.height = height * scale;
  const ctx = canvas.getContext('2d'); ctx.scale(scale,scale);
  const max = Math.max(...histogram, 1);
  for (let i=0; i<256; i++) { const h = histogram[i]/max*110; ctx.fillStyle = i % 16 === 0 ? '#163f36' : '#72a488'; ctx.fillRect(i*width/256,height-h,Math.max(1,width/256-0.7),h); }
}
function setMode(mode) {
  state.mode = mode;state.modeByPhase[state.phase]=mode;
  document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('active',b.dataset.mode===mode); b.setAttribute('aria-pressed',String(b.dataset.mode===mode)); });
  $('image-wrap').hidden = !state.url || mode !== 'source';
  $('byte-map').hidden = !state.bytes || mode !== 'bytes';
  $('quant-stage').hidden = !state.preview || mode !== 'quantization';
  $('empty').hidden = !!state.bytes;
  $('preview-unavailable').hidden = !(state.bytes && !state.url && mode === 'source');
  $('view-tag').textContent = {source:'DISPLAY PREVIEW',bytes:'ORIGINAL ENCODED BYTES',quantization:'BROWSER STRUCTURE PREVIEW'}[mode];
  $('preview-caption').textContent = {source:'Display preview is separate from encoded-byte analysis.',bytes:'Color represents byte value; rows are consecutive bytes, not image pixels.',quantization:'Exact table values · not stored DCT coefficients.'}[mode];
  $('grid').disabled = mode !== 'source'; $('zoom').disabled = mode !== 'source';
  if (mode==='bytes') drawByteMap();
  if (mode==='quantization') drawQuantization();
  if (mode==='source') fitImage();
}
function drawByteMap() {
  if (!state.bytes) return;
  const canvas=$('byte-map'), w=256, h=Math.min(220,Math.ceil(state.bytes.length/w));
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d'), image=ctx.createImageData(w,h);
  const stride=Math.max(1,Math.ceil(state.bytes.length/(w*h)));
  for(let i=0;i<w*h;i++) { const value=state.bytes[i*stride]; const p=i*4;
    image.data[p]=value===undefined?20:30+value*.28;
    image.data[p+1]=value===undefined?33:70+value*.65;
    image.data[p+2]=value===undefined?38:64+value*.3;image.data[p+3]=255;
  }
  ctx.putImageData(image,0,0);
  $('stage-label').textContent=`BYTE MAP / ${stride===1?'EVERY BYTE':`1 SAMPLE PER ${stride} BYTES`}`;
  canvas.dataset.stride=stride;
}
function drawQuantization() {
  if (!state.preview) return;
  const zigzag=state.settings['1.4'].order==='Stored zigzag';
  const tables=state.preview.quantizationTables.slice(0,4);
  $('quant-stage').innerHTML=tables.length ? tables.map(t=>{
    const lo=t.statistics.minimum, hi=t.statistics.maximum;
    return `<div><h3>TABLE ${t.id} / ${t.precision}-BIT · DEFINITION ${t.definition}</h3><div class="quant-grid">${(zigzag?t.zigzag:t.natural).map((v,i)=>`<span class="quant-cell" style="background:hsl(${125+(v-lo)/Math.max(1,hi-lo)*35} 38% ${78-(v-lo)/Math.max(1,hi-lo)*43}%)" title="${zigzag?`Sequence ${i}`:`u=${i%8}, v=${Math.floor(i/8)}`}: ${v}">${v}</span>`).join('')}</div><p class="quant-key">${zigzag?'ZIGZAG SEQUENCE WRAPPED TO 8 COLUMNS':'DC ↖ · COLUMNS u / ROWS v'}<br>COLOR SCALE ${lo}–${hi} · PER TABLE</p></div>`;
  }).join('') : '<p class="muted">No quantization definitions available.</p>';
  $('stage-label').textContent='QUANTIZATION STEPS / FIRST FOUR DEFINITIONS';
}
function fitImage() {
  const img=$('source-image'); if (!state.url || !img.naturalWidth) return;
  const stage=$('stage'), zoom=$('zoom').value;
  const scale=zoom==='fit'? Math.min((stage.clientWidth-40)/img.naturalWidth,(stage.clientHeight-45)/img.naturalHeight,1) : Number(zoom);
  const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
  $('image-wrap').style.width=`${w}px`;$('image-wrap').style.height=`${h}px`;
  const canvas=$('overlay');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  if ($('grid').checked) {
    ctx.strokeStyle='#ccee94b0';ctx.lineWidth=0.7;
    // A coordinate guide only. It is not a detected compression grid.
    const spacing=64*scale;
    ctx.beginPath();for(let x=0;x<w;x+=spacing){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=0;y<h;y+=spacing){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
  }
  $('stage-label').textContent=$('grid').checked?'64-PIXEL DISPLAY GUIDE / NOT A DETECTOR':'SOURCE DISPLAY / BROWSER COLOR & ORIENTATION';
}
function previewInWorker(bytes) {
  state.worker?.terminate();
  return new Promise((resolve,reject)=>{
    const worker=new Worker('/inspector/jpeg-worker.mjs',{type:'module'});state.worker=worker;
    worker.onmessage=({data})=>{worker.terminate();if(state.worker===worker)state.worker=null;data.ok?resolve(data.report):reject(new Error(data.message));};
    worker.onerror=()=>{worker.terminate();reject(new Error('Structural preview worker failed.'));};
    worker.postMessage(bytes.slice().buffer);
  });
}
async function requestRun(file, plan) {
  const form=new FormData();form.append('image',file,file.name);form.append('configuration',JSON.stringify(plan));
  const response=await fetch('/api/run',{method:'POST',body:form});
  const result=await response.json();
  if(!response.ok)throw new Error(typeof result.detail==='string'?result.detail:'Python request failed.');
  return result;
}
async function load(file) {
  if(!state.catalog.length)return notify('Start or restart the Gazoken Python app, then refresh to load its step catalog.');
  if(state.busy) return notify('Wait for the current operation to finish.');
  if(!file || !file.size || file.size>25*1024*1024)return notify('Choose a non-empty JPEG up to 25 MiB.');
  const token=++state.generation;
  state.busy=true;updateSelection();$('run-status').textContent='Reading original bytes…';
  try {
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(bytes[0]!==255 || bytes[1]!==216)throw new Error('Not a JPEG: FF D8 source signature is missing.');
    const [run,preview]=await Promise.all([requestRun(file,[{id:'1.1',parameters:state.settings['1.1']}]),previewInWorker(bytes).catch(e=>({warnings:[e.message],frames:[],segments:[],quantizationTables:[],huffmanTables:[],exif:[],size:bytes.length,complete:false}))]);
    if(token!==state.generation)return;
    if(state.url)URL.revokeObjectURL(state.url);
    state.file=file;state.bytes=bytes;state.preview=preview;state.source=run.source;state.runs=[run];state.url=null;
    $('source-image').removeAttribute('src');
    const frame=preview.frames[0];
    if(frame && frame.width*frame.height<=12_000_000 && frame.width>0 && frame.height>0){
      state.url=URL.createObjectURL(file);$('source-image').src=state.url;
    }else notify('Original bytes loaded. Display preview is unavailable or exceeds the 12-megapixel preview limit.');
    $('filename').textContent=file.name;$('filesize').textContent=size(file.size);$('hash').textContent=run.source.sha256;
    $('dimensions').textContent=frame?`${frame.width} × ${frame.height} PX`:'DIMENSIONS UNKNOWN';
    $('encoding').textContent=frame?`${frame.marker} · ${preview.scans?.length || 0} scan(s)`:'Partial / unsupported';
    $('run-status').textContent='Source identity recorded. Choose your next steps.';
    renderJournal();renderSteps();setMode(state.mode);showEvidence();updateReferenceBanner();
  } catch(e) { if(token===state.generation){notify(e.message);$('run-status').textContent='Source not replaced. '+e.message;} }
  finally {if(token===state.generation){state.busy=false;updateSelection();}}
}
async function run(ids) {
  if(state.busy || !state.file)return;
  const plan=visibleSteps().filter(s=>ids.includes(s.id)).map(s=>({id:s.id,parameters:structuredClone(state.settings[s.id])}));
  if(!plan.length)return notify('Select at least one step.');
  if(![...document.querySelectorAll('.param input')].every(i=>i.checkValidity()))return notify('Check the highlighted parameter ranges.');
  const token=state.generation;state.busy=true;updateSelection();$('run-status').textContent=state.phase!==1?`Recording Phase ${state.phase} configuration in Python…`:'Running selected plan in Python…';
  try {
    const result=await requestRun(state.file,plan);
    if(token!==state.generation)return;
    state.runs.push(result);renderJournal();showEvidence();
    const complete=result.results.filter(r=>r.status==='completed').length;
    const planned=result.results.filter(r=>r.status==='not_implemented').length;
    const issues=result.results.length-complete-planned;
    $('run-status').textContent=`${complete} measured · ${planned} planned${issues?` · ${issues} blocked / failed`:''}. Run recorded.`;
    notify('Tool calls recorded with their individual status and input provenance.');
  }catch(e){if(token===state.generation){notify(e.message);$('run-status').textContent='Run failed: '+e.message;}}
  finally{if(token===state.generation){state.busy=false;updateSelection();}}
}
function renderJournal() {
  const runs=visibleRuns();
  $('run-count').textContent=`${runs.length} PHASE ${state.phase} RUN${runs.length===1?'':'S'}`;
  $('journal').innerHTML=runs.length ? [...runs].reverse().map(({run:r})=>`<div class="run-row"><span>↳</span><div>${esc(new Date(r.created_at).toLocaleTimeString())}<small>${r.results.map(s=>`${esc(s.id)} ${esc(statusLabel(s.status))}`).join(' · ')}</small></div><b class="${r.results.some(s=>s.status!=='completed')?'planned':''}">${r.results.filter(s=>s.status==='completed').length} MEASURED</b></div>`).join(''):'<p class="muted">No measurements in this session.</p>';
  renderReports();
}
const statusLabel = status => ({completed:'Measured',not_implemented:'Not implemented',not_run:'Not run',blocked:'Inputs unavailable',failed:'Failed'}[status] || status);
function renderReports() {
  const records=visibleRecords();
  $('report-count').textContent=`${records.length} RECORD${records.length===1?'':'S'}`;
  $('reports').innerHTML=records.length?records.map(({run,result:r,runIndex},i)=>{
    const step=state.catalog.find(s=>s.id===r.id), measured=r.status==='completed';
    let output='';
    if(measured && r.id==='1.1') output=definitionList(Object.entries(r.output));
    else if(measured && r.id==='1.7') output=`<canvas class="chart" id="report-chart-${i}" aria-label="Run ${runIndex+1}, step 1.7: whole-file byte frequencies"></canvas><div class="chart-label"><span>BYTE VALUE 0 → 255</span><span>${r.output.entropy_bits_per_byte.toFixed(4)} BITS / BYTE</span></div><p class="muted">${esc(size(r.output.count))} measured · whole file · descriptive entropy, not a tampering score.</p>`;
    else if(measured) output=`<details><summary>Recorded measurements · expand JSON</summary><pre class="report-json">${esc(JSON.stringify(r.output,null,2))}</pre></details>`;
    else output=`<p class="muted">${esc(r.message)} No measurement or graphic was generated.</p>`;
    return `<article class="result-card ${measured?'measured':'unimplemented'}"><div class="observation-head"><h3><span>${esc(r.id)}</span> ${esc(step?.title||r.id)}</h3><span class="mini-pill">${esc(statusLabel(r.status))}</span></div>${measured?'':'<details class="unconnected-record"><summary>Inspect configuration-only record</summary>'}<p class="result-provenance">Run ${runIndex+1} · ${esc(new Date(run.created_at).toLocaleString())} · ${esc(r.elapsed_ms)} ms · method ${esc(r.method_version||'not registered')}</p><div class="result-output evidence-content">${output}</div><details class="record-parameters"><summary>Parameters used for this execution</summary>${definitionList(Object.entries(r.parameters))}</details>${r.inputs?`<details class="record-parameters"><summary>Tool input provenance</summary>${definitionList([['adapter',r.tool_key],['input contract',r.input_contract_version],['source SHA-256',r.inputs.source_sha256],['pixel package',r.inputs.pixels],['coefficient package',r.inputs.coefficients],['required inputs',r.required_inputs],['missing inputs',r.missing_inputs]])}</details>`:''}${measured?'':'</details>'}</article>`;
  }).join(''):'<p class="muted">Run a step to collect its measurements, plots, or tables here.</p>';
  records.forEach(({result:r},i)=>{if(r.status==='completed'&&r.id==='1.7')drawHistogram(r.output.histogram,$(`report-chart-${i}`));});
  const report=phaseReport(state.catalog,state.source,state.runs,state.phase);
  $('export-phase').disabled=!state.source;
  if(!state.source){$('phase-summary').innerHTML='<p class="muted">Load a source to begin a report. Unrun and unimplemented steps remain visible.</p>';return;}
  const c=report.coverage;
  $('phase-summary').innerHTML=`<div class="coverage"><strong>${c.completed}<small>of ${c.total} steps measured</small></strong><div><b>${report.status==='complete'?'Execution complete':'Partial phase report'}</b><p>${c.not_implemented} not implemented · ${c.not_run} not run${c.other?` · ${c.other} other status`:''}</p></div></div><p class="report-source">${esc(state.source.filename)}<br><code>SHA-256 ${esc(state.source.sha256)}</code></p>${table(['Step','Latest execution','Attempts'],report.steps.map(s=>[`${s.id} ${s.title}`,statusLabel(s.status),s.attempt_count]))}<p class="warning-note">This is a framework summary of recorded outputs. Planned methods and browser previews do not count as completed Python steps. It is not an authenticity verdict and is separate from ${state.phase===1?'the 1.12 current-run evidence assembler':state.phase===2?'the future 2.11 analysis adapter':'processing-history interpretation'}.</p>`;
}
function downloadJson(report,filename) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportSession() {
  const report=sessionRecord(state.catalog,state.settings,state.selected,state.source,state.runs);
  downloadJson(report,'gazoken-session.json');
  notify('Session download requested with settings and actual run records.');
}
function importSettings(report) {
  const imported=readSettings(report,state.catalog);
  state.settings=imported.settings;state.selected=imported.selected;renderSteps();showEvidence();if(state.mode==='quantization')drawQuantization();
  notify(report.schema_version===1?'Phase 1 settings imported; Phases 2 and 3 initialized to defaults. Source and runs unchanged.':report.schema_version===2?'Phase 1 and 2 settings imported; Phase 3 initialized to defaults. Source and runs unchanged.':'Settings for all three phases imported. Source and runs unchanged.');
}
function clearSession() {
  if(state.busy)return notify('Wait for the current operation to finish.');
  state.generation++;state.worker?.terminate();if(state.url)URL.revokeObjectURL(state.url);
  Object.assign(state,{file:null,bytes:null,preview:null,source:null,runs:[],url:null});
  $('source-image').removeAttribute('src');$('file').value='';$('filename').textContent='No source selected';$('filesize').textContent='—';$('hash').textContent='Load a source to record its identity';$('encoding').textContent='—';$('dimensions').textContent='— × —';$('stage-label').textContent='NO SOURCE LOADED';$('run-status').textContent='Source cleared. Settings retained.';
  renderJournal();setMode('source');showEvidence();updateSelection();updateReferenceBanner();
}
$('steps').addEventListener('input',e=>{
  const el=e.target;if(!el.dataset.param)return;
  state.settings[el.dataset.step][el.dataset.param]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
  if(el.dataset.step==='1.4' && state.mode==='quantization')drawQuantization();
  if(el.dataset.step===state.active)showEvidence();
});
$('steps').addEventListener('change',e=>{if(e.target.dataset.select){e.target.checked?state.selected.add(e.target.dataset.select):state.selected.delete(e.target.dataset.select);updateSelection();}});
$('steps').addEventListener('click',e=>{
  const inspect=e.target.closest('[data-inspect]'), one=e.target.closest('[data-run]');
  if(inspect){const step=state.catalog.find(s=>s.id===inspect.dataset.inspect);showEvidence(step.id);setMode(['structure','metadata'].includes(step.view)?'bytes':step.view);}
  if(one)run([one.dataset.run]);
});
$('steps').addEventListener('toggle',e=>{
  const id=e.target.dataset.step;if(!id || !e.target.isConnected || !id.startsWith(`${state.phase}.`))return;
  if(e.target.open){state.openByPhase[state.phase].add(id);showEvidence(id);}else state.openByPhase[state.phase].delete(id);
},true);
for(const button of document.querySelectorAll('[data-phase]'))button.addEventListener('click',()=>switchPhase(Number(button.dataset.phase)));
for(const id of ['choose','replace'])$(id).addEventListener('click',()=>$('file').click());
$('file').addEventListener('change',()=>{const file=$('file').files[0];$('file').value='';load(file);});
for(const name of ['dragenter','dragover'])$('dropzone').addEventListener(name,e=>{e.preventDefault();$('dropzone').classList.add('dragover');});
for(const name of ['dragleave','drop'])$('dropzone').addEventListener(name,e=>{e.preventDefault();$('dropzone').classList.remove('dragover');if(name==='drop')load(e.dataTransfer.files[0]);});
$('sample').addEventListener('click',async()=>{try{const r=await fetch('/api/sample');if(!r.ok)throw new Error('Synthetic reference unavailable.');await load(new File([await r.blob()],'synthetic-reference-q90.jpg',{type:'image/jpeg'}));}catch(e){notify(e.message);}});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('source-image').addEventListener('load',fitImage);
$('source-image').addEventListener('error',()=>{state.url && URL.revokeObjectURL(state.url);state.url=null;setMode('bytes');notify('Browser display failed; the original-byte analysis is still available.');});
$('grid').addEventListener('change',fitImage);$('zoom').addEventListener('change',fitImage);
new ResizeObserver(()=>{if(state.mode==='source')fitImage();showEvidence();visibleRecords().forEach(({result:r},i)=>{if(r.id==='1.7'&&r.status==='completed')drawHistogram(r.output.histogram,$(`report-chart-${i}`));});}).observe($('stage'));
$('select-ready').addEventListener('click',()=>selectVisible('ready'));
$('select-all').addEventListener('click',()=>selectVisible('all'));
$('select-none').addEventListener('click',()=>selectVisible('none'));
$('run').addEventListener('click',()=>run([...state.selected]));$('export').addEventListener('click',exportSession);$('clear-session').addEventListener('click',clearSession);
$('export-phase').addEventListener('click',()=>{downloadJson(phaseReport(state.catalog,state.source,state.runs,state.phase),`gazoken-phase-${state.phase}-report.json`);notify('Phase report download requested.');});
$('import').addEventListener('click',()=>$('config-file').click());
$('config-file').addEventListener('change',async()=>{const f=$('config-file').files[0];$('config-file').value='';if(!f)return;try{if(f.size>2*1024*1024)throw new Error('Settings file exceeds 2 MiB.');importSettings(JSON.parse(await f.text()));}catch(e){notify(e.message);}});
try {
  const r=await fetch('/api/catalog');if(!r.ok)throw new Error('Python backend unavailable.');const catalog=await r.json();state.catalog=catalog.steps;if(!state.catalog.some(s=>s.id==='3.14') || !state.catalog.every(s=>s.tool?.contract_version===1))throw new Error('Restart Gazoken to load the tool-interface catalog, then refresh.');
  for(const step of state.catalog){state.settings[step.id]=Object.fromEntries(step.parameters.map(p=>[p.key,p.default]));if(step.selected)state.selected.add(step.id);}
  $('connection').textContent='Python connected · local';renderSteps();showEvidence();updateReferenceBanner();
}catch(e){state.catalog=[];$('connection').textContent='Python unavailable / restart needed';$('run-status').textContent=e.message;notify(e.message+' Start or restart the local Gazoken Python app.');}

// Bundled, documented fixtures use the same load/reset path as user files.
let samples = [];
async function openSample(id) {
  const entry = samples.find(item => item.id === id);
  if (!entry) return;
  $('open-sample').disabled = true;
  try {
    const response = await fetch(`/api/sample?id=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('Sample unavailable.');
    await load(new File([await response.blob()], entry.file, {type: entry.mime}));
  } catch (error) { notify(error.message); }
  finally { $('open-sample').disabled = !$('sample-choice').value; }
}
$('sample-choice').addEventListener('change', () => {
  const entry = samples.find(item => item.id === $('sample-choice').value);
  $('sample-description').textContent = entry?.description || 'Known inputs for exploration, not a detector benchmark.';
  $('open-sample').disabled = !entry;
});
$('open-sample').addEventListener('click', () => openSample($('sample-choice').value));
fetch('/api/samples').then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(items => {
  samples = items;
  for (const item of items) $('sample-choice').add(new Option(item.title, item.id));
}).catch(() => { $('sample-description').textContent = 'Sample catalog unavailable. You can still load your own JPEG.'; });
