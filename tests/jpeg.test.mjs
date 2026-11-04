import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectJpeg, interpretJpeg, byteStatistics, ZIGZAG } from '../assets/js/jpeg.mjs';
import { parseExif } from '../assets/js/exif.mjs';
const segment=(code,payload)=>[255,code,(payload.length+2)>>8,(payload.length+2)&255,...payload];
const jpeg=(...segments)=>Uint8Array.from([255,216,...segments.flat(),255,217]);
const dqt=()=>segment(219,[0,...Array.from({length:64},(_,i)=>i+1)]);
const sof=()=>segment(192,[8,0,24,0,32,1,1,0x11,0]);
const sos=()=>segment(218,[1,1,0,0,63,0]);
const warning=(r,text)=>r.warnings.some(w=>w.includes(text));

test('whole-file byte statistics have analytic entropy and counts',()=>{
  assert.equal(byteStatistics(Uint8Array.of(0,0,255,255)).entropy,1);
  assert.equal(byteStatistics(new Uint8Array()).entropy,0);
  assert.equal(byteStatistics(Uint8Array.from({length:256},(_,i)=>i)).entropy,8);
});
test('non-JPEG input fails instead of inventing a report',()=>{
  assert.throws(()=>inspectJpeg(Uint8Array.of(0,1,2)),/SOI/);
});
test('quantization tables are unzigzagged into the correct frequency positions',()=>{
  const r=inspectJpeg(jpeg(dqt(),sof(),sos(),[1,2,3]));
  assert.equal(r.complete,true);
  assert.equal(r.quantizationTables[0].natural[0],1);
  assert.equal(r.quantizationTables[0].natural[8],3);
  assert.equal(r.quantizationTables[0].natural[63],64);
  assert.equal(r.quantizationTables[0].statistics.mean,32.5);
  assert.equal(new Set(ZIGZAG).size,64);
  assert.equal(r.frames[0].width,32);
});
test('16-bit quantization values and multiple tables in one segment are preserved',()=>{
  const values=Array.from({length:64},(_,i)=>[1,i]);
  const payload=[0x11,...values.flat(),2,...Array(64).fill(9)];
  const r=inspectJpeg(jpeg(segment(219,payload)));
  assert.equal(r.quantizationTables.length,2);
  assert.equal(r.quantizationTables[0].precision,16);
  assert.equal(r.quantizationTables[0].zigzag[0],256);
  assert.equal(r.quantizationTables[1].id,2);
});
test('scan marker walking distinguishes stuffed data, restart markers, and EOI',()=>{
  const r=inspectJpeg(jpeg(sof(),sos(),[10,255,0,20,255,208,30]));
  assert.equal(r.scans[0].encodedBytes,7);
  assert.equal(r.scans[0].stuffedBytes,1);
  assert.equal(r.scans[0].restartMarkers,1);
  assert.equal(r.complete,true);
});
test('multiple scans keep table-definition history rather than overwrite it',()=>{
  const r=inspectJpeg(jpeg(dqt(),sof(),sos(),[10],dqt(),sos(),[20]));
  assert.equal(r.scans.length,2);
  assert.equal(r.quantizationTables[1].definition,2);
  assert.notEqual(r.scans[0].quantizationDefinitions[0],r.scans[1].quantizationDefinitions[0]);
});
test('Huffman code-length counts are separated from symbol values',()=>{
  const counts=[1,1,...Array(14).fill(0)];
  const r=inspectJpeg(jpeg(segment(196,[0,...counts,0,5])));
  assert.equal(r.huffmanTables[0].total,2);
  assert.deepEqual(r.huffmanTables[0].symbols,[0,5]);
  assert.deepEqual(r.huffmanTables[0].codeCounts,counts);
});
test('oversubscribed Huffman code lengths are flagged',()=>{
  const r=inspectJpeg(jpeg(segment(196,[0,3,...Array(15).fill(0),0,1,2])));
  assert.ok(warning(r,'Oversubscribed'));
});
test('truncated and invalid marker segments yield bounded partial reports',()=>{
  const r=inspectJpeg(Uint8Array.of(255,216,255,219,0,67,0,1));
  assert.equal(r.complete,false);
  assert.ok(warning(r,'Truncated'));
  assert.ok(warning(inspectJpeg(Uint8Array.of(255,216,255,219,0,1)),'Invalid segment length'));
});
test('trailing bytes are counted separately from EOI and never called hidden payloads',()=>{
  const r=inspectJpeg(Uint8Array.from([...jpeg(sof(),sos(),[1]),65,66,67]));
  assert.equal(r.trailingBytes,3);
  assert.ok(warning(r,'purpose is unknown'));
});
test('invalid quantization precision fails explicitly',()=>{
  const r=inspectJpeg(jpeg(segment(219,[0x20,...Array(64).fill(1)])));
  assert.ok(warning(r,'Invalid DQT'));
});
function exifPayload(little=false,{cycle=false,badOffset=false}={}) {
  const payload=new Uint8Array(6+8+2+12+4+8);
  payload.set([69,120,105,102,0,0],0);
  const view=new DataView(payload.buffer);
  payload.set(little?[73,73]:[77,77],6);
  view.setUint16(8,42,little);view.setUint32(10,8,little);
  view.setUint16(14,1,little);view.setUint16(16,0x131,little);
  view.setUint16(18,2,little);view.setUint32(20,8,little);view.setUint32(24,badOffset?10000:26,little);
  view.setUint32(28,cycle?8:0,little);
  payload.set(new TextEncoder().encode('Fixture\0'),32);
  return payload;
}
for(const little of [true,false]) test(`Exif ${little?'little':'big'} endian strings use TIFF-relative offsets`,()=>{
  const payload=exifPayload(little);
  const data=Uint8Array.from([9,9,...payload]);
  const e=parseExif(data,2,data.length);
  assert.equal(e.entries[0].name,'Software');assert.equal(e.entries[0].value,'Fixture');
  assert.equal(e.entries[0].valueOffset,34);assert.equal(e.warnings.length,0);
});
test('Exif cycles and malicious offsets are reported without following them',()=>{
  const cycle=exifPayload(false,{cycle:true});
  assert.ok(parseExif(cycle,0,cycle.length).warnings.some(w=>w.includes('cyclic')));
  const bad=exifPayload(false,{badOffset:true});
  assert.equal(parseExif(bad,0,bad.length).entries[0].value,'Unreadable');
});
test('APP1 Exif is extracted and software attribution is explicitly a metadata claim',()=>{
  const r=inspectJpeg(jpeg(segment(225,[...exifPayload()]),sof(),sos(),[1]));
  assert.equal(r.exif.length,1);
  const notes=interpretJpeg(r);
  assert.ok(notes.some(n=>n.label==='Metadata claim'&&n.text.includes('not independently verified')));
});
test('real fixture JPEG fields agree with independently generated dimensions and table values',()=>{
  const input=readFileSync(new URL('./fixtures/images/02-reference-q90.jpg',import.meta.url));
  const before=Buffer.from(input);
  const r=inspectJpeg(input);
  assert.equal(r.complete,true);assert.equal(r.frames[0].width,768);assert.equal(r.frames[0].height,512);
  assert.equal(r.quantizationTables.length,2);assert.equal(r.huffmanTables.length,4);assert.equal(r.scans.length,1);
  assert.deepEqual(r.quantizationTables[0].natural.slice(0,8),[3,2,2,3,5,8,10,12]);
  assert.deepEqual(input,before);
});
test('bounded random malformed segments never escape as an unhandled parser crash',()=>{
  const repeatedFrames=inspectJpeg(jpeg(...Array.from({length:40},sof)));
  assert.equal(repeatedFrames.frames.length,32);
  assert.ok(warning(repeatedFrames,'Frame inspection limit'));
  let seed=42;
  for(let i=0;i<200;i++) {
    const a=new Uint8Array(200);a[0]=255;a[1]=216;
    for(let j=2;j<a.length;j++) {seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[j]=seed>>>24;}
    const report=inspectJpeg(a);
    assert.equal(report.complete,false);assert.ok(report.warnings.length>0);
  }
});
const expected=JSON.parse(readFileSync(new URL('./fixtures/jpeg-inspector/expected.json',import.meta.url),'utf8'));
for(const name of ['baseline-exif.jpg','progressive-optimized.jpg']) test(`${name}: extracted fields match Pillow reference values`,()=>{
  const input=readFileSync(new URL(`./fixtures/jpeg-inspector/${name}`,import.meta.url));
  const r=inspectJpeg(input),ref=expected.files[name];
  assert.equal(r.complete,true);assert.equal(r.warnings.length,0);
  assert.equal(r.frames[0].width,ref.width);assert.equal(r.frames[0].height,ref.height);
  const finalTables=new Map(r.quantizationTables.map(t=>[String(t.id),t]));
  for(const [id,values]of Object.entries(ref.quantization))assert.deepEqual(finalTables.get(id).natural,values);
  assert.equal(r.frames[0].marker,ref.progressive?'SOF2':'SOF0');
  if(ref.progressive)assert.ok(r.scans.length>1);
  else {
    const entries=r.exif.flatMap(e=>e.entries);
    assert.equal(entries.find(e=>e.name==='Software').value,'Gazoken fixture generator');
    assert.equal(entries.find(e=>e.name==='Orientation').value,6);
    assert.equal(entries.find(e=>e.name==='DateTimeOriginal').ifd,'Exif');
    assert.equal(entries.find(e=>e.name==='ExposureTime').value.decimal,.008);
  }
});
test('real truncated JPEG and appended data preserve partial/unknown status',()=>{
  const file=(name)=>readFileSync(new URL(`./fixtures/jpeg-inspector/${name}`,import.meta.url));
  assert.equal(inspectJpeg(file('truncated.jpg')).complete,false);
  const r=inspectJpeg(file('trailing-data.jpg'));
  assert.equal(r.complete,true);assert.equal(r.trailingBytes,20);
});
