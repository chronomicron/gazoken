"""Bounded jpeglib coefficient adapter; native work occurs in a subprocess."""
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from ..contracts import ToolInputs, ToolOutput, ToolError
from ..coefficients import CoefficientComponent, CoefficientPackage, MAX_COEFFICIENTS
from .file_structure import run as structure
from .quantization_tables import run as quantization
from .entropy_coding import run as entropy

VERSION='1.0.0'


def run(inputs,parameters):
    choice=parameters['reader']
    if choice=='Not selected':raise ToolError('Select Auto (jpeglib) or jpeglib to read stored coefficients.')
    if choice=='jpegio candidate':raise ToolError('jpegio is not integrated; choose jpeglib.')
    try:
        if importlib.metadata.version('jpeglib')!='0.14.0':raise ToolError('Install the tested coefficients extra: jpeglib 0.14.0 required.')
        importlib.metadata.version('numpy')
        importlib.metadata.version('setuptools')
    except importlib.metadata.PackageNotFoundError as error:
        raise ToolError('Install Gazoken coefficients extra before running 1.9.') from error
    inventory=structure(inputs,{'segment_limit':4096,'include_scan_layout':True})
    o=inventory.measurements
    if inventory.warnings or not o['eoi_reached'] or len(o['frames'])!=1 or not o['scans']:
        raise ToolError('Coefficient reader requires one complete supported JPEG frame with scans.')
    frame=o['frames'][0];components=frame['components']
    if frame['marker'] not in ('SOF0','SOF2') or frame['sample_precision_bits']!=8 or len(components) not in (1,3):
        raise ToolError('Only 8-bit baseline/progressive grayscale or three-component DCT JPEG is supported.')
    width,height=frame['width'],frame['height']
    if min(width,height)<1 or width*height>12_000_000:raise ToolError('Image geometry exceeds reader limit.')
    maxh=max(c['horizontal_sampling'] for c in components);maxv=max(c['vertical_sampling'] for c in components)
    shapes=[((height*c['vertical_sampling']+maxv*8-1)//(maxv*8),
             (width*c['horizontal_sampling']+maxh*8-1)//(maxh*8)) for c in components]
    if sum(r*c*64 for r,c in shapes)>MAX_COEFFICIENTS:raise ToolError('Stored coefficient count exceeds 8 million limit.')
    tables=quantization(inputs,{'order':'Natural 8 × 8','retain_history':True})
    if tables.warnings or len(tables.measurements['tables'])!=len(tables.measurements['final_table_definitions']):
        raise ToolError('Invalid or redefined quantization tables are outside this reader increment.')
    known={t['table_id']:t['values'] for t in tables.measurements['tables']}
    if entropy(inputs,{'codebooks':False,'scan_script':False}).warnings:
        raise ToolError('Malformed or incomplete Huffman declarations.')
    with tempfile.TemporaryDirectory(prefix='gazoken-dct-') as folder:
        root=Path(folder);(root/'source.jpg').write_bytes(inputs.source.data)
        environment={**os.environ,'OPENBLAS_NUM_THREADS':'1','OMP_NUM_THREADS':'1'}
        try:
            with (root/'reader.stderr').open('wb') as diagnostics:
                result=subprocess.run([sys.executable,'-m','gazoken.tools.encoded._dct_worker',folder],
                                      stdout=subprocess.DEVNULL,stderr=diagnostics,
                                      timeout=30,env=environment,check=False)
        except subprocess.TimeoutExpired as error:raise ToolError('Native coefficient reader timed out.') from error
        if result.returncode!=0:raise ToolError('Native coefficient reader failed; no coefficient package produced.')
        if (root/'reader.stderr').stat().st_size:
            raise ToolError('Native JPEG reader reported warnings; no coefficients accepted.')
        if (root/'metadata.json').stat().st_size>65536 or (root/'coefficients.bin').stat().st_size>MAX_COEFFICIENTS*2:
            raise ToolError('Native output limit exceeded.')
        meta=json.loads((root/'metadata.json').read_text());raw=(root/'coefficients.bin').read_bytes()
        if (meta['width'],meta['height'])!=(width,height) or len(meta['components'])!=len(components):
            raise ToolError('Reader/frame geometry mismatch.')
        selected=[];cursor=0
        for index,(entry,source,shape) in enumerate(zip(meta['components'],components,shapes)):
            count=shape[0]*shape[1]*128
            if (entry['index']!=index or entry['shape']!=[*shape,8,8] or entry['offset']!=cursor
                or entry['byte_count']!=count or entry['table_id']!=source['quantization_table_id']
                or entry['quantization']!=known.get(entry['table_id'])):
                raise ToolError('Reader representation or table assignment mismatch.')
            component=CoefficientComponent(index,source['component_id'],*shape,
                source['horizontal_sampling'],source['vertical_sampling'],entry['table_id'],
                tuple(entry['quantization']),raw[cursor:cursor+count])
            if parameters['components']=='All stored components' or index==0:selected.append(component)
            cursor+=count
        if cursor!=len(raw):raise ToolError('Unexpected coefficient output bytes.')
    package=CoefficientPackage(inputs.source.sha256,width,height,meta['reader_version'],meta['codec_version'],tuple(selected))
    output={'representation':'stored_quantized_dct','package':package.record(),
            'components':[{'index':c.index,'first_block':list(c.block(0,0))} for c in package.components],
            'interpretation':'Exact stored quantized coefficients; no IDCT, pixel processing, editing verdict or previous-compression estimate.'}
    return ToolOutput(output,coefficients=package)
