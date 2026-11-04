"""Assemble current-run Phase 1 records, without adding forensic conclusions."""
from datetime import datetime, timezone
import platform
from ... import __version__
from ..contracts import ToolOutput

VERSION = '1.0.0'


def run(inputs, parameters):
    if inputs.evidence is None:
        raise ValueError('Run evidence is required.')
    records=[record for record in inputs.evidence.records()
             if record['id'].startswith('1.') and record['id']!='1.12']
    latest={record['id']:record for record in records}
    coverage=[]
    for number in range(1,12):
        step_id=f'1.{number}'
        result=latest.get(step_id)
        coverage.append({'id':step_id,'status':result['status'] if result else 'not_run',
                         'has_warnings':bool(result and result.get('warnings')),
                         'partial_extraction':bool(result and isinstance(result.get('output'),dict)
                                                   and result['output'].get('extraction_status')=='partial')})
    warning_count=sum(len(record.get('warnings',[])) for record in records)
    for record in records:
        if not parameters['include_measurements']:
            record.pop('output',None)
        if not parameters['include_warnings']:
            record.pop('warnings',None)
    limitations=['Only earlier Phase 1 records from this run are included; separate GUI runs and prior sessions are not merged.',
                 'Unselected methods are not run automatically. The report itself is not a detector.',
                 'Completed execution does not imply complete extraction or scientific validation.',
                 'Processing traces do not establish deceptive editing; correlated outputs are not independent evidence.']
    return ToolOutput({'report_schema_version':1,'source':inputs.source.record(),
                       'framework_version':__version__,'report_method_version':VERSION,
                       'report_parameters':dict(parameters),'environment':{'python':platform.python_version()},
                       'created_at':datetime.now(timezone.utc).isoformat(),
                       'evidence_provenance':inputs.evidence.record(),
                       'scope':'Earlier Phase 1 results in this run; report step excluded from coverage',
                       'coverage':coverage,'record_count':len(records),
                       'completed_count':sum(row['status']=='completed' for row in coverage),
                       'warning_count':warning_count,
                       'measurements_included':parameters['include_measurements'],
                       'warning_details_included':parameters['include_warnings'],
                       'records':records,
                       'limitations':limitations if parameters['include_warnings'] else [],
                       'interpretation':'Evidence inventory only; no authenticity verdict, combined score or probability.'},
                      ('No earlier Phase 1 results in this run. Select tools and 1.12 together to assemble a report.',) if not records else ())
