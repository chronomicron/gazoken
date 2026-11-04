"""Private fixed-command native reader worker. Writes only into its temporary folder."""
import json
import os
from pathlib import Path
import sys


def main():
    if os.name=='posix':
        import resource
        resource.setrlimit(resource.RLIMIT_CPU,(20,20))
        resource.setrlimit(resource.RLIMIT_AS,(3*1024**3,3*1024**3))
        resource.setrlimit(resource.RLIMIT_FSIZE,(32*1024**2,32*1024**2))
    import warnings
    warnings.filterwarnings("ignore", message="pkg_resources is deprecated as an API.*", category=UserWarning)
    import importlib.metadata
    import jpeglib
    import numpy as np
    root=Path(sys.argv[1])
    jpeglib.version.set('6b')
    jpeg=jpeglib.read_dct(str(root/'source.jpg'))
    # No spatial decode or IDCT. Lazy coefficient loading happens here.
    arrays=[jpeg.Y]
    if jpeg.num_components==3:arrays.extend([jpeg.Cb,jpeg.Cr])
    components=[];position=0
    with (root/'coefficients.bin').open('wb') as stream:
        for index,array in enumerate(arrays):
            if array is None or array.ndim!=4 or tuple(array.shape[2:])!=(8,8) or array.dtype.kind!='i':
                raise ValueError('Unexpected coefficient tensor.')
            if array.size>8_000_000:raise ValueError('Coefficient limit exceeded.')
            if int(array.min()) < -32768 or int(array.max()) > 32767:raise ValueError('Coefficient value range exceeded.')
            raw=np.asarray(array,dtype='<i2',order='C').tobytes()
            stream.write(raw)
            components.append({'index':index,'shape':list(array.shape),'offset':position,'byte_count':len(raw),
                               'table_id':int(jpeg.quant_tbl_no[index]),
                               'quantization':jpeg.get_component_qt(index).reshape(-1).tolist()})
            position+=len(raw)
    (root/'metadata.json').write_text(json.dumps({'width':jpeg.width,'height':jpeg.height,
        'reader_version':importlib.metadata.version('jpeglib'),'codec_version':jpeglib.version.get(),
        'components':components}))


if __name__=='__main__':main()
