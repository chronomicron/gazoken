/** Run pixel-heavy static-workbench measurements off the page thread. */
export function runPixelAnalysisWorker(kind, pixelPackage, options = {}) {
  if (!pixelPackage || !(pixelPackage.data instanceof Uint8Array)) {
    return Promise.reject(new TypeError('A detached decoded pixel package is required.'));
  }
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL('../worker.mjs', import.meta.url), { type: 'module' });
    } catch (error) {
      reject(new Error(`The pixel analysis worker could not start: ${error.message}`));
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error('Pixel analysis timed out. Try a smaller image.'));
    }, 60_000);
    worker.onmessage = ({ data }) => {
      finish();
      data.ok ? resolve(data.result) : reject(new Error(data.message));
    };
    worker.onerror = () => {
      finish();
      reject(new Error('The pixel analysis worker failed. Serve this page over HTTP/HTTPS in a modern browser.'));
    };
    try {
      worker.postMessage({
        kind,
        pixels: pixelPackage.data,
        width: pixelPackage.width,
        height: pixelPackage.height,
        options,
      }, [pixelPackage.data.buffer]);
    } catch (error) {
      finish();
      reject(new Error(`The pixel package could not be sent to the worker: ${error.message}`));
    }
  });
}
