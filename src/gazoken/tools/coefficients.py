"""Immutable stored quantized-DCT representation, separate from decoded pixels."""
from dataclasses import dataclass
import hashlib
import json
import struct

MAX_COEFFICIENTS = 8_000_000


@dataclass(frozen=True)
class CoefficientComponent:
    index: int
    component_id: int
    block_rows: int
    block_columns: int
    horizontal_sampling: int
    vertical_sampling: int
    table_id: int
    quantization: tuple[int, ...]
    data: bytes

    def __post_init__(self):
        for name in ('index','component_id','block_rows','block_columns','horizontal_sampling','vertical_sampling','table_id'):
            if type(getattr(self,name)) is not int:raise ValueError('Coefficient geometry must be integers.')
        if not 0<=self.index<=2 or not 0<=self.component_id<=255 or not 0<=self.table_id<=3:
            raise ValueError('Invalid component identity.')
        if min(self.block_rows,self.block_columns)<1 or not 1<=self.horizontal_sampling<=4 or not 1<=self.vertical_sampling<=4:
            raise ValueError('Invalid coefficient geometry.')
        count=self.block_rows*self.block_columns*64
        if count>MAX_COEFFICIENTS or not isinstance(self.data,(bytes,bytearray,memoryview)) or len(self.data)!=count*2:
            raise ValueError('Coefficient buffer length or limit mismatch.')
        object.__setattr__(self,'data',bytes(self.data))
        if not isinstance(self.quantization,tuple) or len(self.quantization)!=64 or any(type(v) is not int or not 1<=v<=65535 for v in self.quantization):
            raise ValueError('Expected 64 natural-order quantization values.')

    def block(self,row,column):
        if type(row) is not int or type(column) is not int or not 0<=row<self.block_rows or not 0<=column<self.block_columns:
            raise ValueError('Block coordinate outside component.')
        return struct.unpack_from('<64h',self.data,(row*self.block_columns+column)*128)

    def record(self):
        return {'index':self.index,'component_id':self.component_id,
                'shape':[self.block_rows,self.block_columns,8,8],
                'horizontal_sampling':self.horizontal_sampling,'vertical_sampling':self.vertical_sampling,
                'table_id':self.table_id,'quantization':list(self.quantization),
                'byte_count':len(self.data),'sha256':hashlib.sha256(self.data).hexdigest()}


@dataclass(frozen=True)
class CoefficientPackage:
    source_sha256: str
    width: int
    height: int
    reader_version: str
    codec_version: str
    components: tuple[CoefficientComponent, ...]

    def __post_init__(self):
        if not isinstance(self.source_sha256,str) or len(self.source_sha256)!=64 or any(c not in '0123456789abcdef' for c in self.source_sha256):
            raise ValueError('Invalid coefficient source identity.')
        if type(self.width) is not int or type(self.height) is not int or min(self.width,self.height)<1 or self.width*self.height>12_000_000:
            raise ValueError('Invalid coefficient image dimensions.')
        if not self.reader_version or not self.codec_version:raise ValueError('Reader and codec provenance required.')
        if not isinstance(self.components,tuple) or not 1<=len(self.components)<=3 or any(not isinstance(c,CoefficientComponent) for c in self.components):
            raise ValueError('Invalid coefficient components.')
        if len({c.index for c in self.components})!=len(self.components) or len({c.component_id for c in self.components})!=len(self.components):
            raise ValueError('Duplicate coefficient component.')
        if sum(len(c.data)//2 for c in self.components)>MAX_COEFFICIENTS:raise ValueError('Coefficient package limit exceeded.')

    def record(self):
        metadata={'source_sha256':self.source_sha256,'width':self.width,'height':self.height,
                  'reader':'jpeglib','reader_version':self.reader_version,'codec_version':self.codec_version,
                  'representation':'stored_quantized_dct','dtype':'int16_le',
                  'layout':'block_row, block_column, v, u; natural frequency order',
                  'components':[c.record() for c in self.components]}
        return {**metadata,'sha256':hashlib.sha256(json.dumps(metadata,sort_keys=True).encode()).hexdigest()}
