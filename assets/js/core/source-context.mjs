/**
 * Browser-side source wrapper shared by independently loaded investigation steps.
 * Original encoded bytes and decoded pixels remain distinct representations.
 */
export class SourceContext {
  #file;
  #decodedPixels = null;
  #sourceSha256 = null;

  constructor(file, mediaType) {
    if (!(file instanceof Blob) || file.size < 1) {
      throw new TypeError('SourceContext requires a non-empty File or Blob.');
    }
    if (typeof mediaType !== 'string' || !mediaType.startsWith('image/')) {
      throw new TypeError('SourceContext requires a detected image media type.');
    }
    this.#file = file;
    this.mediaType = mediaType;
    this.filename = typeof file.name === 'string' ? file.name.slice(0, 255) : 'unnamed-image';
    this.declaredMediaType = file.type || '';
    this.byteLength = file.size;
    this.lastModified = Number.isFinite(file.lastModified) ? file.lastModified : null;
    this.contextId = crypto.randomUUID();
  }

  /** Return a fresh copy so a tool cannot mutate the preserved browser File. */
  async readOriginalBytes() {
    return new Uint8Array(await this.#file.arrayBuffer());
  }

  /** Attach a named decoded representation without replacing the encoded source. */
  attachDecodedPixels({ data, width, height, channels = ['R', 'G', 'B', 'A'], provenance }) {
    if (!(data instanceof Uint8Array || data instanceof Uint8ClampedArray)) {
      throw new TypeError('Decoded pixels must be an 8-bit typed array.');
    }
    if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 || width * height > 12_000_000) {
      throw new RangeError('Decoded pixel dimensions are invalid or exceed the browser limit.');
    }
    if (!Array.isArray(channels) || channels.length < 1 || channels.length > 4 || channels.some(channel => typeof channel !== 'string' || !channel)) {
      throw new TypeError('Decoded pixels require one to four named channels.');
    }
    if (data.length !== width * height * channels.length) {
      throw new RangeError('Decoded pixel buffer length does not match its shape.');
    }
    if (!provenance || typeof provenance !== 'object') {
      throw new TypeError('Decoded pixels require explicit decoder provenance.');
    }
    this.#decodedPixels = {
      // The workbench already owns this decoded buffer. Keep one stored copy;
      // tools receive a detached copy only when they explicitly request pixels.
      data, width, height, channels: [...channels],
      dtype: 'uint8', layout: 'row-major interleaved', sourceContextId: this.contextId,
      provenance: { ...provenance },
    };
  }

  /** Return a detached pixel buffer and cryptographic link to the encoded source. */
  async getDecodedPixels() {
    if (!this.#decodedPixels) return null;
    const pixels = this.#decodedPixels;
    return {
      ...pixels,
      data: new Uint8Array(pixels.data),
      channels: [...pixels.channels],
      provenance: { ...pixels.provenance },
      sourceSha256: await this.getSourceSha256(),
    };
  }

  async getSourceSha256() {
    if (!this.#sourceSha256) {
      const bytes = await this.readOriginalBytes();
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      this.#sourceSha256 = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
    }
    return this.#sourceSha256;
  }

  record() {
    return {
      contextVersion: 1,
      contextId: this.contextId,
      filename: this.filename,
      mediaType: this.mediaType,
      declaredMediaType: this.declaredMediaType,
      byteLength: this.byteLength,
      lastModified: this.lastModified,
      representations: {
        original: { kind: 'encoded-file', available: true, immutable: true },
        decodedPixels: this.#decodedPixels ? {
          kind: 'decoded-pixels', available: true,
          width: this.#decodedPixels.width, height: this.#decodedPixels.height,
          channels: [...this.#decodedPixels.channels], dtype: this.#decodedPixels.dtype,
          layout: this.#decodedPixels.layout,
          sourceContextId: this.contextId,
          provenance: { ...this.#decodedPixels.provenance },
        } : { kind: 'decoded-pixels', available: false },
      },
    };
  }
}
