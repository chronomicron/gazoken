import { inspectJpeg, interpretJpeg } from './jpeg.mjs';
self.onmessage=async ({data})=>{
  try {
    const report=inspectJpeg(data);
    report.interpretation=interpretJpeg(report);
    if(self.crypto?.subtle) {
      const digest=await crypto.subtle.digest('SHA-256',data);
      report.sha256=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
    } else report.sha256=null;
    self.postMessage({ok:true,report});
  } catch(error) {self.postMessage({ok:false,message:error.message});}
};
