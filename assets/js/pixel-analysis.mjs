const MAX_REGIONS = 4096;

function validatePixels(pixels, width, height) {
  if (!(pixels instanceof Uint8Array) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || width * height > 12_000_000 || pixels.length !== width * height * 4) {
    throw new Error('Invalid or unsupported decoded pixel package.');
  }
}
function lumaAt(pixels, width, height, x, y) {
  const px = Math.max(0, Math.min(width - 1, x));
  const py = Math.max(0, Math.min(height - 1, y));
  const offset = (py * width + px) * 4;
  return 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
}

export function measureSpatial(pixels, width, height, options = {}) {
  validatePixels(pixels, width, height);
  const channel = options.channel ?? 'Derived RGB luminance';
  const windowSize = options.window_size ?? 64;
  const markClipping = options.mark_clipping ?? true;
  if (!['Derived RGB luminance', 'Separate RGB channels'].includes(channel)) {
    throw new TypeError('Choose derived RGB luminance or separate RGB channels.');
  }
  if (!Number.isInteger(windowSize) || windowSize < 8 || windowSize > 512) {
    throw new RangeError('Local window size must be an integer from 8 to 512.');
  }
  if (typeof markClipping !== 'boolean') throw new TypeError('Clipping control must be true or false.');

  const histogramChannels = channel === 'Separate RGB channels' ? ['R', 'G', 'B'] : ['Y'];
  const histograms = Object.fromEntries(histogramChannels.map(name => [name, Array(256).fill(0)]));
  const pixelCount = width * height;
  let globalLumaMean = 0;
  let globalLumaM2 = 0;
  let globalClippedCount = 0;
  for (let index = 0; index < pixelCount; index++) {
    const offset = index * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const luma = 0.299 * red + 0.587 * green + 0.114 * blue;
    if (channel === 'Separate RGB channels') {
      histograms.R[red]++;
      histograms.G[green]++;
      histograms.B[blue]++;
    } else histograms.Y[Math.max(0, Math.min(255, Math.round(luma)))]++;
    const n = index + 1;
    const delta = luma - globalLumaMean;
    globalLumaMean += delta / n;
    globalLumaM2 += delta * (luma - globalLumaMean);
    if (red === 0 || red === 255 || green === 0 || green === 255 || blue === 0 || blue === 255) globalClippedCount++;
  }

  const sourceRows = Math.ceil(height / windowSize);
  const sourceColumns = Math.ceil(width / windowSize);
  let rowStep = 1;
  let columnStep = 1;
  while (Math.ceil(sourceRows / rowStep) * Math.ceil(sourceColumns / columnStep) > MAX_REGIONS) {
    if (Math.ceil(sourceRows / rowStep) >= Math.ceil(sourceColumns / columnStep)) rowStep++;
    else columnStep++;
  }
  const windows = [];
  let sampledPixels = 0;
  for (let gridRow = 0, row = 0; row < sourceRows; gridRow++, row += rowStep) {
    for (let gridColumn = 0, column = 0; column < sourceColumns; gridColumn++, column += columnStep) {
      const x = column * windowSize;
      const y = row * windowSize;
      const sampleWidth = Math.min(windowSize, width - x);
      const sampleHeight = Math.min(windowSize, height - y);
      const count = sampleWidth * sampleHeight;
      let sum = 0;
      let sumSquares = 0;
      let gradientSum = 0;
      let clippedCount = 0;
      for (let py = y; py < y + sampleHeight; py++) {
        for (let px = x; px < x + sampleWidth; px++) {
          const value = lumaAt(pixels, width, height, px, py);
          sum += value;
          sumSquares += value * value;
          const gx = (lumaAt(pixels, width, height, px + 1, py) - lumaAt(pixels, width, height, px - 1, py)) / 2;
          const gy = (lumaAt(pixels, width, height, px, py + 1) - lumaAt(pixels, width, height, px, py - 1)) / 2;
          gradientSum += Math.hypot(gx, gy);
          if (markClipping) {
            const offset = (py * width + px) * 4;
            const red = pixels[offset];
            const green = pixels[offset + 1];
            const blue = pixels[offset + 2];
            if (red === 0 || red === 255 || green === 0 || green === 255 || blue === 0 || blue === 255) clippedCount++;
          }
        }
      }
      sampledPixels += count;
      const mean = sum / count;
      const variance = Math.max(0, sumSquares / count - mean * mean);
      windows.push({
        gridRow,
        gridColumn,
        x,
        y,
        width: sampleWidth,
        height: sampleHeight,
        pixelCount: count,
        meanLuma: mean,
        lumaStandardDeviation: Math.sqrt(variance),
        meanGradientMagnitude: gradientSum / count,
        ...(markClipping ? { endpointClippedFraction: clippedCount / count } : {}),
      });
    }
  }
  const sampledRows = Math.ceil(sourceRows / rowStep);
  const sampledColumns = Math.ceil(sourceColumns / columnStep);
  return {
    channel,
    pixelCount,
    histograms,
    globalMeanLuma: globalLumaMean,
    globalLumaStandardDeviation: Math.sqrt(globalLumaM2 / pixelCount),
    ...(markClipping ? { endpointClippedFraction: globalClippedCount / pixelCount } : {}),
    windowSize,
    sourceWindowRows: sourceRows,
    sourceWindowColumns: sourceColumns,
    sampledWindowRows: sampledRows,
    sampledWindowColumns: sampledColumns,
    rowSamplingStep: rowStep,
    columnSamplingStep: columnStep,
    sampledWindowCount: windows.length,
    sampledPixelCoverage: sampledPixels / pixelCount,
    windows,
  };
}

export function measureColorRelationships(pixels, width, height, options = {}) {
  validatePixels(pixels, width, height);
  const saturationFloor = options.saturation_floor ?? 0.05;
  const includeChannels = options.include_channels ?? true;
  if (!Number.isFinite(saturationFloor) || saturationFloor < 0 || saturationFloor > 1) {
    throw new RangeError('Saturation floor must be between 0 and 1.');
  }
  if (typeof includeChannels !== 'boolean') throw new TypeError('Channel histogram control must be true or false.');

  const histogram = includeChannels ? { R: Array(256).fill(0), G: Array(256).fill(0), B: Array(256).fill(0) } : null;
  const count = width * height;
  let meanR = 0, meanG = 0, meanB = 0;
  let m2R = 0, m2G = 0, m2B = 0;
  let covarianceRG = 0, covarianceRB = 0, covarianceGB = 0;
  let belowSaturationFloor = 0;
  for (let index = 0; index < count; index++) {
    const offset = index * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    if (histogram) {
      histogram.R[red]++;
      histogram.G[green]++;
      histogram.B[blue]++;
    }
    const n = index + 1;
    const deltaR = red - meanR;
    const deltaG = green - meanG;
    const deltaB = blue - meanB;
    meanR += deltaR / n;
    meanG += deltaG / n;
    meanB += deltaB / n;
    m2R += deltaR * (red - meanR);
    m2G += deltaG * (green - meanG);
    m2B += deltaB * (blue - meanB);
    covarianceRG += deltaR * (green - meanG);
    covarianceRB += deltaR * (blue - meanB);
    covarianceGB += deltaG * (blue - meanB);
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
    if (saturation < saturationFloor) belowSaturationFloor++;
  }
  const standardDeviation = value => Math.sqrt(Math.max(0, value / count));
  const correlation = (covariance, firstMoment, secondMoment) => {
    const denominator = Math.sqrt(firstMoment * secondMoment);
    return denominator ? Math.max(-1, Math.min(1, covariance / denominator)) : null;
  };
  return {
    width,
    height,
    pixelCount: count,
    channels: {
      R: { mean: meanR, standardDeviation: standardDeviation(m2R) },
      G: { mean: meanG, standardDeviation: standardDeviation(m2G) },
      B: { mean: meanB, standardDeviation: standardDeviation(m2B) },
    },
    pairwisePearsonCorrelation: {
      'R-G': correlation(covarianceRG, m2R, m2G),
      'R-B': correlation(covarianceRB, m2R, m2B),
      'G-B': correlation(covarianceGB, m2G, m2B),
    },
    saturationFloor,
    pixelsBelowSaturationFloor: belowSaturationFloor,
    fractionBelowSaturationFloor: belowSaturationFloor / count,
    ...(histogram ? { histograms: histogram } : {}),
  };
}
