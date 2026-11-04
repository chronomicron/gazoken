import { installSamples } from './samples.mjs';
const $=(id)=>document.getElementById(id);
const node=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e;};
const SVG='http://www.w3.org/2000/svg';
let raw=null,report=null,fileName='',generation=0,active=null,hexStart=0;
function status(message,error=false) { $('jpeg-status').textContent=message;$('jpeg-status').classList.toggle('error',error); }
function reset() {
  generation++;
  active?.cancel();active=null;
  raw=null;report=null;fileName='';hexStart=0;
  $('jpeg-report').hidden=true;
  $('jpeg-clear').disabled=true;
  for(const id of ['jpeg-summary','jpeg-warnings','jpeg-opinion','jpeg-quantization','jpeg-bytes','jpeg-coding','jpeg-metadata','jpeg-segments','jpeg-hex']) $(id).replaceChildren();
}
function inspect(buffer) {
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./jpeg-worker.mjs',import.meta.url),{type:'module'});
    const finish=()=>{clearTimeout(timer);worker.terminate();if(active===job) active=null;};
    const job={cancel(){finish();reject(new DOMException('Cancelled','AbortError'));}};
    const timer=setTimeout(()=>{finish();reject(new Error('Inspection timed out. Try a smaller file.'));},30_000);
    active=job;
    worker.onmessage=({data})=>{finish();data.ok?resolve(data.report):reject(new Error(data.message));};
    worker.onerror=()=>{finish();reject(new Error('The JPEG worker failed. Use a modern browser and serve the page over HTTP/HTTPS.'));};
    // Clone for the worker; retain the exact original buffer for read-only hex inspection.
    worker.postMessage(buffer);
  });
}
async function load(file) {
  if(!file) return;
  reset();const token=generation;
  $('jpeg-clear').disabled=false;
  status('Reading original JPEG bytes…');
  try {
    if(file.size>25*1024*1024) throw new Error('This inspector accepts files up to 25 MiB.');
    const buffer=await file.arrayBuffer();
    if(token!==generation) return;
    const result=await inspect(buffer);
    if(token!==generation) return;
    raw=new Uint8Array(buffer);report=result;fileName=file.name;
    render();
    $('jpeg-report').hidden=false;
    status(`${fileName} · ${report.complete?'EOI reached':'Partial report'} · ${report.segments.length} segments · ${report.scans.length} scans${report.warnings.length?' · review structural warnings':''}`);
  } catch(error) {
    if(token===generation) { status(error.message,true);$('jpeg-clear').disabled=true; }
  }
}
function table(parent,caption,headers,rows) {
  const wrapper=node('div','','table-scroll');
  const table=node('table','','data-table');
  table.append(node('caption',caption));
  const head=node('thead'),hr=node('tr');
  for(const h of headers) {const th=node('th',h);th.scope='col';hr.append(th);}
  head.append(hr);table.append(head);
  const body=node('tbody');
  for(const row of rows.slice(0,1000)) {
    const tr=node('tr');
    for(const value of row) {const td=node('td');if(value instanceof Node) td.append(value);else td.textContent=String(value??'—');if(String(value).length>60) td.className='wrap';tr.append(td);}
    body.append(tr);
  }
  table.append(body);wrapper.append(table);
  if(rows.length>1000) wrapper.append(node('p','First 1,000 rows displayed. Full extracted records are available in the JSON report.','muted'));
  parent.append(wrapper);
}
function chart(parent,values,label,{xLabel='Value',labels=null}={}) {
  const entries=Array.isArray(values)?values.map((v,i)=>[labels?.[i]??i,v]):Object.entries(values).map(([k,v])=>[Number(k),v]).sort((a,b)=>a[0]-b[0]);
  if(!entries.length) return;
  const make=(tag,attrs,text)=>{const e=document.createElementNS(SVG,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;};
  const svg=make('svg',{viewBox:'0 0 560 190',role:'img','aria-label':label,class:'chart'});
  svg.append(make('title',{},label));
  const max=Math.max(1,...entries.map(e=>e[1]));
  const width=500/entries.length;
  for(let i=0;i<entries.length;i++) {
    const [value,count]=entries[i],height=count/max*130;
    const bar=make('rect',{x:40+i*width,y:145-height,width:Math.max(.5,width-1),height});
    bar.append(make('title',{},`${xLabel} ${value}: ${count}`));svg.append(bar);
    if(entries.length<=20 || i===0 || i===entries.length-1) svg.append(make('text',{x:40+(i+.5)*width,y:161,'text-anchor':'middle'},value));
  }
  svg.append(make('line',{x1:40,x2:540,y1:145,y2:145}));
  svg.append(make('text',{x:36,y:18,'text-anchor':'end'},max));
  svg.append(make('text',{x:36,y:145,'text-anchor':'end'},0));
  svg.append(make('text',{x:290,y:184,'text-anchor':'middle'},xLabel));
  parent.append(svg);
}
function card(parent,title) {const box=node('article','','jpeg-card');box.append(node('h3',title));parent.append(box);return box;}
function hex(offset,label='Original bytes') {
  if(!raw) return;
  hexStart=Math.max(0,Math.min(raw.length-1,Math.floor(offset)));
  $('hex-offset').value=String(hexStart);
  const end=Math.min(raw.length,hexStart+256);
  const lines=[];
  for(let p=hexStart;p<end;p+=16) {
    const chunk=raw.subarray(p,Math.min(end,p+16));
    const bytes=[...chunk].map(v=>v.toString(16).padStart(2,'0')).join(' ').padEnd(47);
    const text=[...chunk].map(v=>v>=32&&v<=126?String.fromCharCode(v):'.').join('');
    lines.push(`${p.toString(16).padStart(8,'0')}  ${bytes}  ${text}`);
  }
  $('jpeg-hex').textContent=lines.join('\n');
  $('hex-caption').textContent=`${label} · bytes ${hexStart}–${end-1} of ${raw.length}`;
  $('hex-prev').disabled=hexStart===0;$('hex-next').disabled=end>=raw.length;
}
function valueText(value) {
  if(typeof value==='string') return value;
  return JSON.stringify(value);
}
function render() {
  const frame=report.frames[0];
  const cells=[['File',fileName],['File size',`${report.size.toLocaleString()} bytes`],['Frame dimensions',frame?`${frame.width} × ${frame.height}`:'Unavailable'],['Coding process',frame?.process||'Unavailable']];
  for(const [key,value] of cells) {const box=node('dl','','summary-item');box.append(node('dt',key),node('dd',value));$('jpeg-summary').append(box);}
  $('jpeg-hash').textContent=report.sha256?`SHA-256 ${report.sha256}`:'SHA-256 unavailable in this browser context.';
  for(const warning of report.warnings) $('jpeg-warnings').append(node('p',warning));
  for(const exif of report.exif) for(const warning of exif.warnings) $('jpeg-warnings').append(node('p',`Exif: ${warning}`));
  for(const note of report.interpretation) {const box=node('article','','interpretation');box.append(node('h3',note.label),node('p',note.text));$('jpeg-opinion').append(box);}
  if(!report.quantizationTables.length) $('jpeg-quantization').append(node('p','No quantization tables extracted.','muted'));
  for(const qt of report.quantizationTables.slice(0,16)) {
    const box=card($('jpeg-quantization'),`Table ${qt.id} · definition ${qt.definition} · ${qt.precision}-bit`);
    const associations=report.frames.flatMap(f=>f.components.filter(c=>c.quantizationTable===qt.id).map(c=>c.id));
    box.append(node('p',`Byte ${qt.offset} · frame component IDs referencing this destination: ${[...new Set(associations)].join(', ')||'none'}. Definitions may be replaced between scans.`));
    const grid=node('div','','quant-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label',`Table ${qt.id}, rows v=0–7 and columns u=0–7`);
    for(let i=0;i<64;i++) {
      const value=qt.natural[i],range=qt.statistics.maximum-qt.statistics.minimum;
      const t=range?(value-qt.statistics.minimum)/range:0;
      const cell=node('span',String(value),'quant-cell');
      cell.style.backgroundColor=`hsl(225 65% ${94-t*22}%)`;
      cell.title=`u=${i%8}, v=${Math.floor(i/8)}: ${value}`;
      grid.append(cell);
    }
    box.append(grid,node('p',`Min ${qt.statistics.minimum} · max ${qt.statistics.maximum} · mean ${qt.statistics.mean.toFixed(2)} · DC ${qt.natural[0]}`));
    chart(box,qt.statistics.histogram,'Quantization value counts across 64 frequency positions',{xLabel:'Quantization value (bars are distinct values; gaps omitted)'});
    const details=node('details');details.append(node('summary','Exact value counts'));
    table(details,'Quantization distribution',['Value','Count'],Object.entries(qt.statistics.histogram));box.append(details);
  }
  if(report.quantizationTables.length>16) $('jpeg-quantization').append(node('p','First 16 definitions displayed. The JSON report includes all extracted definitions.','muted'));
  const whole=card($('jpeg-bytes'),'Whole-file byte distribution');
  chart(whole,report.statistics.histogram,'Whole-file histogram of encoded byte values 0–255',{xLabel:'Encoded byte value (0–255)'});
  whole.append(node('p',`${report.statistics.count.toLocaleString()} bytes · Shannon byte entropy ${report.statistics.entropy.toFixed(4)} bits/byte. This includes headers, metadata, stuffing, and scan data.`));
  const scans=card($('jpeg-bytes'),'Scan-data byte distribution');
  const totalHistogram=Array(256).fill(0);let scanBytes=0;
  for(const scan of report.scans) {scan.statistics.histogram.forEach((n,i)=>totalHistogram[i]+=n);scanBytes+=scan.encodedBytes;}
  chart(scans,totalHistogram,'Combined encoded scan-byte histogram',{xLabel:'Encoded byte value (0–255)'});
  scans.append(node('p',`${scanBytes.toLocaleString()} stored scan bytes (${(100*scanBytes/report.size).toFixed(1)}% of file). Includes byte stuffing and restart markers; no Huffman symbols or DCT coefficients have been decoded.`));
  table($('jpeg-coding'),'Frame components',['Frame offset','Component ID','Horizontal factor','Vertical factor','Quantization destination'],report.frames.flatMap(f=>f.components.map(c=>[f.offset,c.id,c.horizontal,c.vertical,c.quantizationTable])));
  table($('jpeg-coding'),'Scans',['#','Header offset','Data bytes','Components: ID → DC/AC table','Spectral start–end','Successive high/low','Restarts','Stuffed zeros'],report.scans.map((s,i)=>[i+1,s.offset,s.encodedBytes,s.components.map(c=>`${c.id} → ${c.dcTable}/${c.acTable}`).join('; '),`${s.spectralStart}–${s.spectralEnd}`,`${s.successiveHigh}/${s.successiveLow}`,s.restartMarkers,s.stuffedBytes]));
  if(report.restartIntervals.length) table($('jpeg-coding'),'Restart interval declarations',['Offset','MCUs per interval'],report.restartIntervals.map(r=>[r.offset,r.mcus]));
  const codingGrid=node('div','','results-grid');$('jpeg-coding').append(codingGrid);
  for(const h of report.huffmanTables.slice(0,16)) {
    const box=card(codingGrid,`${h.class===0?'DC':h.class===1?'AC':'Unknown class'} Huffman table ${h.id} · byte ${h.offset}`);
    chart(box,h.codeCounts,'Number of assigned Huffman symbols by code length',{xLabel:'Code length (bits)',labels:Array.from({length:16},(_,i)=>i+1)});
    box.append(node('p',`${h.total} symbol entries. Code-length counts are table definitions, not observed symbol frequencies or coding efficiency.`));
    const details=node('details');details.append(node('summary','Symbol values (stored order)'));
    details.append(node('pre',h.symbols.map(s=>s.toString(16).padStart(2,'0')).join(' '),'symbol-values'));box.append(details);
  }
  if(!report.huffmanTables.length) $('jpeg-coding').append(node('p','No Huffman tables extracted. Absence may reflect an unsupported or abbreviated coding process.','muted'));
  if(report.huffmanTables.length>16) $('jpeg-coding').append(node('p','First 16 Huffman definitions displayed; all extracted definitions are in the report.','muted'));
  table($('jpeg-metadata'),'Application blocks',['Offset','Marker','Kind','Payload bytes'],report.applications.map(a=>[a.offset,a.marker,a.kind,a.payloadLength]));
  if(!report.exif.length) $('jpeg-metadata').append(node('p','No recognized Exif block found.','muted'));
  let metadataBudget=1000;
  for(const block of report.exif) {
    const box=card($('jpeg-metadata'),`Exif / TIFF · byte ${block.offset} · ${block.byteOrder||'unknown byte order'}`);
    table(box,'Exif fields (value offsets point into the original file)',['IFD','Tag','Field','Type / count','Value offset','Value'],block.entries.slice(0,metadataBudget).map(e=>[e.ifd,e.tag,e.name,`${e.type} / ${e.count}`,e.valueOffset,`${valueText(e.value)}${e.truncated?' … [preview truncated]':''}`]));
    metadataBudget=Math.max(0,metadataBudget-block.entries.length);
  }
  if(report.exif.reduce((n,e)=>n+e.entries.length,0)>1000) $('jpeg-metadata').append(node('p','Metadata display is limited to 1,000 entries. The JSON report retains all extracted entries.','muted'));
  for(const comment of report.comments.slice(0,64)) {const box=card($('jpeg-metadata'),`Comment · byte ${comment.offset}`);box.append(node('p',`${comment.text}${comment.truncated?' … [preview truncated]':''}`));}
  const rows=report.segments.slice(0,512).map(s=>{
    const button=node('button',`${s.marker} @ ${s.offset}`);button.type='button';button.onclick=()=>hex(s.offset,`${s.marker} begins here; segment length ${s.length} bytes`);
    return [button,s.length,s.payloadLength];
  });
  table($('jpeg-segments'),'JPEG marker segments',['Select segment','Total bytes','Payload bytes'],rows);
  if(report.segments.length>512) $('jpeg-segments').append(node('p','First 512 segments shown. All parsed segments are in the JSON report.','muted'));
  hex(0);
}
$('jpeg-file').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';load(file);});
$('jpeg-clear').onclick=()=>{reset();status('No JPEG loaded.');};
const drop=$('jpeg-drop');
for(const event of ['dragenter','dragover']) drop.addEventListener(event,e=>{e.preventDefault();drop.classList.add('dragover');});
for(const event of ['dragleave','drop']) drop.addEventListener(event,e=>{e.preventDefault();drop.classList.remove('dragover');});
drop.addEventListener('drop',e=>{if(e.dataTransfer.files.length===1)load(e.dataTransfer.files[0]);else status('Drop one JPEG at a time.',true);});
$('jpeg-demo').onclick=async ()=>{
  const token=generation;
  $('jpeg-demo').disabled=true;
  try {
    const response=await fetch(new URL('../../tests/fixtures/images/02-reference-q90.jpg',import.meta.url));
    if(!response.ok)throw new Error('The bundled reference JPEG could not be loaded.');
    const blob=await response.blob();
    if(token===generation)await load(new File([blob],'02-reference-q90.jpg',{type:'image/jpeg'}));
  } catch(error){if(token===generation)status(error.message,true);}
  finally{$('jpeg-demo').disabled=false;}
};
$('hex-form').onsubmit=e=>{
  e.preventDefault();const value=$('hex-offset').value.trim();
  if(!/^(?:0x[0-9a-f]+|\d+)$/i.test(value)||!raw){$('hex-caption').textContent='Enter a decimal or hexadecimal byte offset.';return;}
  const p=Number(value);
  if(!Number.isSafeInteger(p)||p<0||p>=raw.length){$('hex-caption').textContent=`Offset must be between 0 and ${raw.length-1}.`;return;}
  hex(p);
};
$('hex-prev').onclick=()=>hex(Math.max(0,hexStart-256));
$('hex-next').onclick=()=>hex(hexStart+256);
$('jpeg-export').onclick=()=>{
  if(!report)return;
  const blob=new Blob([JSON.stringify({fileName,...report},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download=`${fileName}-gazoken-report.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
};

installSamples({container: document.getElementById('sample-gallery'), load:load, status, jpegOnly:true});
