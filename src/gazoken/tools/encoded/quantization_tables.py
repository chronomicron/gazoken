"""Bounded DQT extraction without decoding coefficients or pixels."""
from ..contracts import ToolOutput

VERSION = '1.0.0'
# Stored zigzag index -> row-major frequency index.
ZIGZAG = (0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,
          41,34,27,20,13,6,7,14,21,28,35,42,49,56,57,50,43,36,29,22,15,23,
          30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63)
SOF = set(range(0xc0, 0xd0)) - {0xc4, 0xc8, 0xcc}
MAX_MARKERS = 4096
MAX_TABLES = 1024


def run(inputs, parameters):
    data = inputs.source.data
    definitions, frames, scans, active = [], [], [], {}
    pos, in_scan, reached_eoi, markers = 2, False, False, 0
    warnings = []
    try:
        while pos < len(data):
            if in_scan:
                pos = data.find(b'\xff', pos)
                if pos < 0:
                    break
            if data[pos] != 255:
                raise ValueError(f'Expected marker at byte {pos}.')
            offset = pos
            while pos < len(data) and data[pos] == 255:
                pos += 1
            if pos == len(data):
                raise ValueError('Truncated marker.')
            code = data[pos]; pos += 1
            if in_scan and (code == 0 or 0xd0 <= code <= 0xd7):
                continue
            in_scan = False
            markers += 1
            if markers > MAX_MARKERS:
                raise ValueError('Marker limit exceeded.')
            if code == 0xd9:
                reached_eoi = True
                break
            if code == 0x01:
                continue
            if code == 0 or code == 0xd8 or 0xd0 <= code <= 0xd7:
                raise ValueError('Unexpected standalone marker outside scan data.')
            if pos + 2 > len(data):
                raise ValueError('Truncated segment length.')
            length = int.from_bytes(data[pos:pos+2], 'big')
            if length < 2 or pos + length > len(data):
                raise ValueError('Invalid or truncated segment length.')
            payload_start = pos + 2
            payload = data[payload_start:pos+length]
            pos += length
            if code == 0xdb:
                if not payload:
                    raise ValueError('Empty DQT segment.')
                cursor = 0
                while cursor < len(payload):
                    header = payload[cursor]; cursor += 1
                    precision, table_id = header >> 4, header & 15
                    if precision not in (0, 1) or table_id > 3:
                        raise ValueError('Invalid DQT precision or table identifier.')
                    width = precision + 1
                    if cursor + 64*width > len(payload):
                        raise ValueError('Truncated quantization table.')
                    values = [int.from_bytes(payload[cursor+i*width:cursor+(i+1)*width], 'big') for i in range(64)]
                    if 0 in values:
                        raise ValueError('Zero quantization step is invalid.')
                    natural = [0]*64
                    for i, value in enumerate(values):
                        natural[ZIGZAG[i]] = value
                    if len(definitions) >= MAX_TABLES:
                        raise ValueError('Table definition limit exceeded.')
                    definition = {'definition_index':len(definitions), 'table_id':table_id,
                                  'marker_offset':offset, 'payload_offset':payload_start+cursor-1,
                                  'precision_bits':width*8,
                                  'layout':parameters['order'],
                                  'values':natural if parameters['order']=='Natural 8 × 8' else values,
                                  'minimum':min(values), 'maximum':max(values), 'mean':sum(values)/64}
                    definitions.append(definition)
                    active[table_id] = definition['definition_index']
                    cursor += 64*width
            elif code in SOF:
                if len(payload) < 6 or not payload[5] or len(payload) != 6+3*payload[5]:
                    raise ValueError('Invalid frame component declarations.')
                components = [{'component_id':payload[6+3*i], 'table_id':payload[8+3*i]} for i in range(payload[5])]
                if any(c['table_id'] > 3 for c in components) or len({c['component_id'] for c in components}) != len(components):
                    raise ValueError('Invalid frame component assignments.')
                frames.append({'marker_offset':offset, 'marker':f'FF{code:02X}', 'components':components})
            elif code == 0xda:
                if not payload or not payload[0] or len(payload) != 4+2*payload[0]:
                    raise ValueError('Invalid scan header.')
                components = {c['component_id']:c['table_id'] for c in frames[-1]['components']} if frames else {}
                assignments = []
                for i in range(payload[0]):
                    component = payload[1+2*i]
                    table_id = components.get(component)
                    index = active.get(table_id)
                    assignments.append({'component_id':component,'table_id':table_id,'definition_index':index})
                    if index is None:
                        warnings.append(f'Scan at {offset}: no in-file table definition for component {component}.')
                scans.append({'marker_offset':offset,'assignments':assignments})
                in_scan = True
    except ValueError as error:
        warnings.append(str(error))
    if not reached_eoi:
        warnings.append('EOI not reached; extraction is partial.')
    if not definitions:
        warnings.append('No complete quantization table found; absence does not establish lossless encoding.')
    # All scan references use stable definition indices even when history is hidden.
    retained = definitions if parameters['retain_history'] else [definitions[i] for i in sorted(active.values())]
    return ToolOutput({'extraction_status':'complete' if reached_eoi and not warnings else 'partial',
                       'eoi_reached':reached_eoi,'definition_count':len(definitions),
                       'history_retained':parameters['retain_history'],'tables':retained,
                       'final_table_definitions':{str(k):v for k,v in active.items()},
                       'frames':frames,'scans':scans,
                       'interpretation':'Stored encoding choices only; no quality, encoder, prior-save or editing estimate.'}, tuple(warnings))
