/** Bounded TIFF/Exif reader. Values are file claims, not verified provenance. */
const TYPES = {1:['BYTE',1],2:['ASCII',1],3:['SHORT',2],4:['LONG',4],5:['RATIONAL',8],6:['SBYTE',1],7:['UNDEFINED',1],8:['SSHORT',2],9:['SLONG',4],10:['SRATIONAL',8],11:['FLOAT',4],12:['DOUBLE',8],13:['IFD',4]};
const TAGS = {0x0100:'ImageWidth',0x0101:'ImageLength',0x010e:'ImageDescription',0x010f:'Make',0x0110:'Model',0x0112:'Orientation',0x011a:'XResolution',0x011b:'YResolution',0x0128:'ResolutionUnit',0x0131:'Software',0x0132:'DateTime',0x013b:'Artist',0x014a:'SubIFDs',0x0201:'JPEGInterchangeFormat',0x0202:'JPEGInterchangeFormatLength',0x8298:'Copyright',0x829a:'ExposureTime',0x829d:'FNumber',0x8769:'ExifIFDPointer',0x8822:'ExposureProgram',0x8825:'GPSIFDPointer',0x8827:'PhotographicSensitivity',0x9000:'ExifVersion',0x9003:'DateTimeOriginal',0x9004:'DateTimeDigitized',0x9010:'OffsetTime',0x9011:'OffsetTimeOriginal',0x9101:'ComponentsConfiguration',0x9201:'ShutterSpeedValue',0x9202:'ApertureValue',0x9204:'ExposureBiasValue',0x9207:'MeteringMode',0x9209:'Flash',0x920a:'FocalLength',0x927c:'MakerNote',0x9286:'UserComment',0xa000:'FlashpixVersion',0xa001:'ColorSpace',0xa002:'PixelXDimension',0xa003:'PixelYDimension',0xa005:'InteroperabilityIFDPointer',0xa217:'SensingMethod',0xa300:'FileSource',0xa301:'SceneType',0xa401:'CustomRendered',0xa402:'ExposureMode',0xa403:'WhiteBalance',0xa405:'FocalLengthIn35mmFilm',0xa406:'SceneCaptureType',0xa420:'ImageUniqueID',0xa430:'CameraOwnerName',0xa431:'BodySerialNumber',0xa432:'LensSpecification',0xa433:'LensMake',0xa434:'LensModel',0xa435:'LensSerialNumber'};
const GPS = {0:'GPSVersionID',1:'GPSLatitudeRef',2:'GPSLatitude',3:'GPSLongitudeRef',4:'GPSLongitude',5:'GPSAltitudeRef',6:'GPSAltitude',7:'GPSTimeStamp',12:'GPSSpeedRef',13:'GPSSpeed',16:'GPSImgDirectionRef',17:'GPSImgDirection',18:'GPSMapDatum',29:'GPSDateStamp'};
const hex = (n) => `0x${n.toString(16).padStart(4,'0').toUpperCase()}`;
export function parseExif(bytes, start, end, options = {}) {
  const includeGps = options.includeGps !== false;
  const includeVendor = options.includeVendor !== false;
  const result = { offset:start, byteOrder:null, entries:[], warnings:[] };
  const base = start + 6;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const warn = (s) => { if (result.warnings.length < 50) result.warnings.push(s); };
  const check = (p, n) => {
    if (!Number.isSafeInteger(p) || !Number.isSafeInteger(n) || n < 0 || p < base || p + n > end) throw new Error('Exif value or directory extends outside its APP1 segment.');
  };
  try {
    check(base,8);
    const endian = String.fromCharCode(bytes[base],bytes[base+1]);
    if (!['II','MM'].includes(endian)) throw new Error('Invalid TIFF byte-order signature.');
    const little = endian === 'II';
    result.byteOrder = little ? 'Little-endian (II)' : 'Big-endian (MM)';
    const u16 = (p) => { check(p,2); return view.getUint16(p,little); };
    const u32 = (p) => { check(p,4); return view.getUint32(p,little); };
    if (u16(base+2) !== 42) throw new Error('Unsupported TIFF header (expected classic TIFF magic 42).');
    const queue = [{relative:u32(base+4), name:'IFD0',depth:0}];
    const visited = new Set();
    let examined = 0;
    while (queue.length) {
      const {relative, name, depth} = queue.shift();
      if (!relative) continue;
      if (visited.has(relative)) { warn(`Repeated/cyclic directory pointer at TIFF offset ${relative}.`); continue; }
      if (depth > 8 || visited.size >= 32 || result.entries.length >= 1000) { warn('Exif directory/entry inspection limit reached.'); break; }
      visited.add(relative);
      try {
        const dir = base + relative;
        const count = u16(dir);
        check(dir+2,count*12+4);
        for (let i=0; i<count; i++) {
          if (examined >= 1000) { warn('Exif entry limit reached.'); break; }
          examined++;
          const p=dir+2+i*12;
          const tag=u16(p), type=u16(p+2), length=u32(p+4);
          if (tag===0x8825 && !includeGps) continue;
          const definition=TYPES[type];
          const entry={ifd:name,tag:hex(tag),name:(name==='GPS'?GPS[tag]:TAGS[tag]) || `Unknown ${hex(tag)}`,type:definition?.[0] || `Unknown type ${type}`,count:length,entryOffset:p,valueOffset:null,value:null,truncated:false};
          result.entries.push(entry);
          if (!definition) { entry.value='Unsupported TIFF field type'; continue; }
          const size=definition[1]*length;
          const valueOffset=size<=4?p+8:base+u32(p+8);
          entry.valueOffset=valueOffset;
          if (tag===0x927c && !includeVendor) { entry.omitted='Vendor data excluded'; continue; }
          try {
            check(valueOffset,size);
            if (type===2) {
              const limit=Math.min(length,1024);
              entry.value=new TextDecoder('utf-8').decode(bytes.subarray(valueOffset,valueOffset+limit)).replace(/\0+$/,'');
              entry.truncated=length>limit;
            } else {
              const values=[];
              const limit=Math.min(length,64);
              entry.truncated=length>limit;
              for(let j=0;j<limit;j++) {
                const q=valueOffset+j*definition[1];
                let v;
                if([1,7].includes(type)) v=view.getUint8(q);
                else if(type===6) v=view.getInt8(q);
                else if(type===3) v=view.getUint16(q,little);
                else if([4,13].includes(type)) v=view.getUint32(q,little);
                else if(type===8) v=view.getInt16(q,little);
                else if(type===9) v=view.getInt32(q,little);
                else if([5,10].includes(type)) {
                  const get=type===5?'getUint32':'getInt32';
                  const numerator=view[get](q,little), denominator=view[get](q+4,little);
                  v={numerator,denominator,decimal:denominator?numerator/denominator:null};
                } else {
                  v=type===11?view.getFloat32(q,little):view.getFloat64(q,little);
                  if(!Number.isFinite(v)) v=String(v);
                }
                values.push(v);
              }
              entry.value=length===1?values[0]:values;
              if ([0x8769,0x8825,0xa005,0x014a].includes(tag) && [4,13].includes(type)) {
                const names={0x8769:'Exif',0x8825:'GPS',0xa005:'Interop',0x014a:'SubIFD'};
                for(const relative of values) {
                  if(queue.length>=64) { warn('Exif pointer queue limit reached.'); break; }
                  queue.push({relative,name:names[tag],depth:depth+1});
                }
              }
            }
          } catch(error) { entry.value='Unreadable'; warn(`${entry.name}: ${error.message}`); }
        }
        const next=u32(dir+2+count*12);
        if(next) queue.push({relative:next,name:name==='IFD0'?'IFD1':`${name} next`,depth:depth+1});
      } catch(error) { warn(`${name}: ${error.message}`); }
    }
  } catch(error) { warn(error.message); }
  return result;
}
