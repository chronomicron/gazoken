import { parseExif } from './exif.mjs';
export const JPEG_INSPECTOR_VERSION='0.1.0';
export const ZIGZAG=[0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,41,34,27,20,13,6,7,14,21,28,35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63];
const SOF={0xc0:'Baseline sequential DCT / Huffman',0xc1:'Extended sequential DCT / Huffman',0xc2:'Progressive DCT / Huffman',0xc3:'Lossless / Huffman',0xc5:'Differential sequential DCT / Huffman',0xc6:'Differential progressive DCT / Huffman',0xc7:'Differential lossless / Huffman',0xc9:'Extended sequential DCT / arithmetic',0xca:'Progressive DCT / arithmetic',0xcb:'Lossless / arithmetic',0xcd:'Differential sequential DCT / arithmetic',0xce:'Differential progressive DCT / arithmetic',0xcf:'Differential lossless / arithmetic'};
export const markerName=(code)=>SOF[code]?`SOF${code-0xc0}`:({0xd8:'SOI',0xd9:'EOI',0xda:'SOS',0xdb:'DQT',0xc4:'DHT',0xcc:'DAC',0xdd:'DRI',0xdc:'DNL',0xde:'DHP',0xdf:'EXP',0xfe:'COM',0x01:'TEM'}[code] || (code>=0xe0&&code<=0xef?`APP${code-0xe0}`:code>=0xd0&&code<=0xd7?`RST${code-0xd0}`:`0xFF${code.toString(16).toUpperCase()}`));
export function byteStatistics(bytes) {
  const histogram=Array(256).fill(0);
  for(const value of bytes) histogram[value]++;
  let entropy=0;
  for(const n of histogram) if(n) { const p=n/bytes.length; entropy-=p*Math.log2(p); }
  return {count:bytes.length,histogram,entropy:bytes.length?entropy:0};
}
function distribution(values) {
  const histogram={};
  for(const v of values) histogram[v]=(histogram[v]||0)+1;
  return {minimum:Math.min(...values),maximum:Math.max(...values),mean:values.reduce((a,b)=>a+b,0)/values.length,histogram};
}
export function inspectJpeg(input, options = {}) {
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  if(bytes.length>25*1024*1024) throw new Error('JPEG inspection is limited to 25 MiB.');
  if(bytes.length<2 || bytes[0]!==255 || bytes[1]!==216) throw new Error('Not a JPEG file: the SOI signature FF D8 is missing.');
  const report={version:JPEG_INSPECTOR_VERSION,size:bytes.length,complete:false,segments:[{marker:'SOI',code:216,offset:0,length:2,payloadOffset:2,payloadLength:0}],frames:[],quantizationTables:[],huffmanTables:[],scans:[],exif:[],applications:[],comments:[],restartIntervals:[],warnings:[],trailingBytes:0,statistics:byteStatistics(bytes)};
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const warnings=report.warnings;
  const warn=(s)=>{if(warnings.length<100) warnings.push(s);};
  const need=(p,n,end=bytes.length)=>{if(p+n>end) throw new Error(`Truncated field at byte ${p}; expected ${n} bytes.`);};
  const u16=(p)=>{need(p,2);return view.getUint16(p,false);};
  const text=(p,n)=>new TextDecoder('utf-8').decode(bytes.subarray(p,p+n)).replace(/\0+$/,'');
  const latestQ=new Map();
  let offset=2,frame=null;
  try {
    while(offset<bytes.length) {
      if(report.segments.length>=4096 || report.quantizationTables.length>=256 || report.huffmanTables.length>=256 || report.scans.length>=256) { warn('Structural inspection limit reached; remaining data was not parsed.'); break; }
      const markerStart=offset;
      if(bytes[offset]!==255) throw new Error(`Expected a JPEG marker at byte ${offset}.`);
      while(bytes[offset]===255) offset++;
      need(offset,1);
      const code=bytes[offset++];
      if(code===0) throw new Error(`Unexpected stuffed byte outside a scan at byte ${markerStart}.`);
      if(code===0xd9) {
        report.segments.push({marker:'EOI',code,offset:markerStart,length:offset-markerStart,payloadOffset:offset,payloadLength:0});
        report.complete=true;
        report.trailingBytes=bytes.length-offset;
        if(report.trailingBytes) warn(`${report.trailingBytes} bytes follow EOI; their purpose is unknown.`);
        break;
      }
      if(code===0xd8 || code===0x01 || (code>=0xd0&&code<=0xd7)) {
        report.segments.push({marker:markerName(code),code,offset:markerStart,length:offset-markerStart,payloadOffset:offset,payloadLength:0});
        warn(`Standalone ${markerName(code)} encountered outside scan data at byte ${markerStart}.`);
        continue;
      }
      const length=u16(offset);
      if(length<2) throw new Error(`Invalid segment length ${length} at byte ${offset}.`);
      const start=offset+2,end=offset+length;
      need(offset,length);
      const segment={marker:markerName(code),code,offset:markerStart,length:end-markerStart,payloadOffset:start,payloadLength:end-start};
      report.segments.push(segment);
      offset=end;
      if(code===0xdb) {
        let p=start;
        while(p<end) {
          if(report.quantizationTables.length>=256) throw new Error('Quantization table limit reached.');
          const tableOffset=p,info=bytes[p++],precision=info>>4,id=info&15;
          if(precision>1 || id>3) throw new Error(`Invalid DQT precision or table ID at byte ${tableOffset}.`);
          need(p,64*(precision+1),end);
          const zigzag=[],natural=Array(64);
          for(let i=0;i<64;i++) { const value=precision?u16(p):bytes[p]; p+=precision+1; zigzag.push(value); natural[ZIGZAG[i]]=value; }
          if(zigzag.includes(0)) warn(`Quantization table ${id} contains a zero value.`);
          const table={id,precision:precision?16:8,offset:tableOffset,segmentOffset:markerStart,zigzag,natural,statistics:distribution(zigzag),definition:report.quantizationTables.filter(t=>t.id===id).length+1};
          latestQ.set(id,table.offset);
          report.quantizationTables.push(table);
        }
      } else if(SOF[code]) {
        if(report.frames.length>=32) throw new Error('Frame inspection limit reached.');
        need(start,6,end);
        const count=bytes[start+5];
        need(start+6,count*3,end);
        const components=[];
        for(let i=0;i<count;i++) {
          const p=start+6+i*3;
          components.push({id:bytes[p],horizontal:bytes[p+1]>>4,vertical:bytes[p+1]&15,quantizationTable:bytes[p+2]});
        }
        frame={offset:markerStart,marker:markerName(code),process:SOF[code],precision:bytes[start],height:u16(start+1),width:u16(start+3),components};
        report.frames.push(frame);
        if(![0xc0,0xc1,0xc2].includes(code)) warn(`${frame.process}: structural fields only; this process has not been validated by Gazoken.`);
        if(components.some(c=>!c.horizontal||!c.vertical)) warn('A frame component has zero sampling factors.');
      } else if(code===0xc4) {
        let p=start;
        while(p<end) {
          if(report.huffmanTables.length>=256) throw new Error('Huffman table limit reached.');
          const tableOffset=p;
          need(p,17,end);
          const info=bytes[p++],counts=Array.from(bytes.subarray(p,p+16));p+=16;
          const total=counts.reduce((a,b)=>a+b,0);
          need(p,total,end);
          const symbols=Array.from(bytes.subarray(p,p+total));p+=total;
          const table={id:info&15,class:info>>4,offset:tableOffset,codeCounts:counts,symbols,total};
          if(table.id>3 || table.class>1 || total>256) warn(`Invalid Huffman table parameters at byte ${tableOffset}.`);
          let slots=1;
          for(const n of counts) { slots=slots*2-n; if(slots<0) {warn(`Oversubscribed Huffman code lengths at byte ${tableOffset}.`);break;} }
          report.huffmanTables.push(table);
        }
      } else if(code===0xdd) {
        need(start,2,end);
        report.restartIntervals.push({offset:markerStart,mcus:u16(start)});
      } else if(code===0xdc) {
        need(start,2,end);
        segment.lines=u16(start);
      } else if(code===0xda) {
        need(start,1,end);
        const count=bytes[start];
        need(start+1,count*2+3,end);
        const components=[];
        for(let i=0;i<count;i++) {const p=start+1+i*2;components.push({id:bytes[p],dcTable:bytes[p+1]>>4,acTable:bytes[p+1]&15});}
        const p=start+1+count*2;
        const scan={offset:markerStart,dataOffset:end,components,spectralStart:bytes[p],spectralEnd:bytes[p+1],successiveHigh:bytes[p+2]>>4,successiveLow:bytes[p+2]&15,quantizationDefinitions:Object.fromEntries(latestQ),restartMarkers:0,stuffedBytes:0,encodedBytes:0};
        if(!frame) warn('A scan appears before a recognized frame header.');
        let q=end;
        while(q<bytes.length) {
          if(bytes[q]!==255) {q++;continue;}
          const begin=q;
          while(bytes[q]===255) q++;
          if(q>=bytes.length) {q=bytes.length;break;}
          if(bytes[q]===0) {scan.stuffedBytes++;q++;continue;}
          if(bytes[q]>=0xd0&&bytes[q]<=0xd7) {scan.restartMarkers++;q++;continue;}
          q=begin;break;
        }
        scan.encodedBytes=q-end;
        scan.dataEnd=q;
        scan.statistics=byteStatistics(bytes.subarray(end,q));
        report.scans.push(scan);
        offset=q;
      } else if(code>=0xe0&&code<=0xef) {
        const prefix=text(start,Math.min(32,end-start));
        let kind='Application data (uninterpreted)';
        if(code===0xe1 && end-start>=6 && text(start,6)==='Exif') {
          kind='Exif / TIFF';
          if(options.includeExif!==false) {
            if(report.exif.length<32) report.exif.push(parseExif(bytes,start,end,{
              includeGps: options.includeGps !== false,
              includeVendor: options.includeVendor !== false,
            }));
            else warn('Exif segment limit reached.');
          }
        } else if(code===0xe0 && prefix.startsWith('JFIF\0')) {
          kind='JFIF';
          if(end-start>=14) segment.jfif={version:`${bytes[start+5]}.${String(bytes[start+6]).padStart(2,'0')}`,densityUnit:bytes[start+7],xDensity:u16(start+8),yDensity:u16(start+10),thumbnailWidth:bytes[start+12],thumbnailHeight:bytes[start+13]};
        } else if(code===0xe2 && prefix.startsWith('ICC_PROFILE\0')) kind='ICC profile chunk';
        else if(code===0xee && prefix.startsWith('Adobe')) {
          kind='Adobe APP14';
          if(end-start>=12) segment.adobe={version:u16(start+5),flags0:u16(start+7),flags1:u16(start+9),transform:bytes[start+11]};
        } else if(code===0xe1 && prefix.startsWith('http://ns.adobe.com/')) kind='XMP packet (not decoded)';
        report.applications.push({offset:markerStart,marker:segment.marker,kind,payloadLength:end-start});
      } else if(code===0xfe) {
        report.comments.push({offset:markerStart,text:text(start,Math.min(end-start,2048)),truncated:end-start>2048});
      }
    }
  } catch(error) {warn(error.message);}
  if(!report.complete) warn('EOI was not reached. This is a partial structural report, not a validity certificate.');
  if(!report.frames.length) warn('No recognized JPEG frame header was extracted.');
  if(!report.scans.length) warn('No scan header was extracted.');
  return report;
}

export function interpretJpeg(report) {
  const notes=[];
  if(report.frames.length) {
    const f=report.frames[0];
    notes.push({label:'Observed encoding',text:`The first frame declares ${f.process}, ${f.width} × ${f.height} samples, ${f.precision}-bit precision, and ${f.components.length} components. This describes the current file, not a known camera or its full history.`});
  }
  if(report.quantizationTables.length) notes.push({label:'Quantization evidence',text:`${report.quantizationTables.length} table definitions were extracted. Their values describe the stored quantization choices. No encoder-signature database is applied, and a camera, editor, or source quality setting is not identified from these values.`});
  const software=report.exif.flatMap(e=>e.entries).filter(e=>e.name==='Software'&&typeof e.value==='string');
  for(const item of software.slice(0,8)) notes.push({label:'Metadata claim',text:`The Exif Software field declares “${item.value}”. This is editable file metadata, not independently verified software attribution or proof of content editing.`});
  const dates=report.exif.flatMap(e=>e.entries).filter(e=>['DateTime','DateTimeOriginal','DateTimeDigitized'].includes(e.name));
  if(dates.length) notes.push({label:'Declared chronology',text:'Capture/digitization/modification date fields are displayed below as recorded. They can be changed or lack time-zone context; this inspector does not establish a trustworthy timeline.'});
  if(!report.exif.length) notes.push({label:'Metadata coverage',text:'No recognized Exif APP1 block was found. Missing Exif is compatible with many normal workflows and does not establish manipulation.'});
  if(report.applications.some(a=>a.kind==='Adobe APP14')) notes.push({label:'Encoding marker',text:'An Adobe APP14 marker is present. This marker alone does not establish Photoshop use; other encoders may write it.'});
  notes.push({label:'History remains unresolved',text:'This structural inspector cannot establish the number of past encodings, whether the image was resized or locally edited, or whether AI was used. Those questions require evaluated statistical methods beyond these byte summaries. Byte entropy is not a tampering probability.'});
  return notes;
}
