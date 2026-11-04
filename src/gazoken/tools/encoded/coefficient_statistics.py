"""Exact frequency-wise descriptive statistics on stored quantized DCT values."""
from collections import Counter
import struct
from ..contracts import ToolError, ToolOutput
from .quantization_tables import ZIGZAG

VERSION='1.0.0'
MAX_HISTOGRAM_BINS=100_000


def run(inputs,parameters):
    package=inputs.coefficients
    if package is None:raise ToolError('Stored coefficients required; select 1.9 and 1.10 together.')
    components=[];total_bins=0
    for component in package.components:
        frequencies=[]
        count=component.block_rows*component.block_columns
        for zigzag_index,natural in enumerate(ZIGZAG[:parameters['frequency_count']+1]):
            histogram=Counter(struct.unpack_from('<h',component.data,offset+natural*2)[0]
                              for offset in range(0,len(component.data),128))
            total_bins+=len(histogram)
            if total_bins>MAX_HISTOGRAM_BINS:
                raise ToolError('Exact histogram output exceeds 100,000 nonempty bins; inspect fewer frequencies or components.')
            total=sum(value*n for value,n in histogram.items())
            squares=sum(value*value*n for value,n in histogram.items())
            frequency={'zigzag_index':zigzag_index,'kind':'DC' if zigzag_index==0 else 'AC',
                       'u':natural%8,'v':natural//8,'sample_count':count,
                       'quantization_step':component.quantization[natural],
                       'minimum':min(histogram),'maximum':max(histogram),
                       'mean':total/count,'population_variance':(squares*count-total*total)/(count*count),
                       'histogram':[[value,n] for value,n in sorted(histogram.items())]}
            if parameters['zero_fractions']:
                frequency.update(zero_count=histogram.get(0,0),zero_fraction=histogram.get(0,0)/count)
            frequencies.append(frequency)
        components.append({'index':component.index,'component_id':component.component_id,
                           'block_rows':component.block_rows,'block_columns':component.block_columns,
                           'sampling':[component.horizontal_sampling,component.vertical_sampling],
                           'table_id':component.table_id,'frequencies':frequencies})
    return ToolOutput({'representation':'stored_quantized_dct','coefficient_provenance':package.record(),
                       'frequency_order':'DC then first N AC positions in stored zigzag order; coordinates u,v refer to natural frequency layout',
                       'ac_frequency_count':parameters['frequency_count'],
                       'zero_fractions_included':parameters['zero_fractions'],
                       'histogram_bin_count':total_bins,'components':components,
                       'interpretation':'Descriptive coefficient distributions only. Samples are stored blocks, including edge blocks. No dequantization, prior-compression test or editing probability.'})
