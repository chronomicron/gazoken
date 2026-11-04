// UI-independent session serialization and phase/source-isolated reporting.
export const phaseSteps = (catalog, phase) => catalog.filter(s => s.id.startsWith(`${phase}.`));
const phaseIds = catalog => [...new Set(catalog.map(s => Number(s.id.split('.')[0])))].sort();

export function sessionRecord(catalog, settings, selected, source, runs) {
  return structuredClone({schema_version:2,framework:'gazoken',version:'0.3.0',exported_at:new Date().toISOString(),source,
    configuration:catalog.map(s=>({id:s.id,selected:selected.has(s.id),parameters:settings[s.id]})),runs,
    phase_reports:phaseIds(catalog).map(phase=>phaseReport(catalog,source,runs,phase)),
    limitations:['Only steps 1.1 and 1.7 have Python handlers.','Phase 2 has configuration records only; no Python decoded reference exists.','Browser previews are not Python measurements.','No source pixels or original file bytes are included.']});
}
export function phaseReport(catalog,source,runs,phase=1) {
  const catalogForPhase=phaseSteps(catalog,phase);
  // Keep original session run numbers even when another phase is filtered out.
  const matching=source ? runs.map((run,index)=>({run,index})).filter(({run})=>run.source?.sha256===source.sha256) : [];
  const steps=catalogForPhase.map(step=>{
    const attempts=matching.flatMap(({run,index})=>run.results.filter(r=>r.id===step.id).map(result=>({run_number:index+1,created_at:run.created_at,...result})));
    return {id:step.id,title:step.title,implementation:step.implementation,attempt_count:attempts.length,
      latest:attempts.at(-1)||null,status:attempts.at(-1)?.status||'not_run'};
  });
  const count=status=>steps.filter(s=>s.status===status).length;
  const completed=count('completed');
  const runCount=matching.filter(({run})=>run.results.some(r=>r.id.startsWith(`${phase}.`))).length;
  return structuredClone({schema_version:1,report_type:'gazoken_phase_summary',phase,generated_at:new Date().toISOString(),source,
    status:!source?'no_source':steps.length>0&&completed===steps.length?'complete':runCount?'partial':'not_started',
    coverage:{total:steps.length,completed,not_implemented:count('not_implemented'),not_run:count('not_run'),other:steps.filter(s=>!['completed','not_implemented','not_run'].includes(s.status)).length},
    steps,run_count:runCount,
    limitations:['Framework summary of recorded step execution, not an authenticity verdict.','Only implemented methods produce measurements. Browser previews are excluded.','Latest attempts define coverage; session export retains every run.']});
}
export function readSettings(report,catalog) {
  if(report?.framework!=='gazoken' || ![1,2].includes(report.schema_version) || !Array.isArray(report.configuration))throw new Error('Not a supported Gazoken session.');
  // Version 1 exports contain only Phase 1; initialize newly added Phase 2 defaults.
  const expected=report.schema_version===1?phaseSteps(catalog,1):catalog;
  if(report.configuration.length!==expected.length)throw new Error('Incompatible configuration count.');
  const settings={},selected=new Set();
  for(const step of catalog){
    const entries=report.configuration.filter(s=>s?.id===step.id);
    if(report.schema_version===1 && !step.id.startsWith('1.')){
      settings[step.id]=Object.fromEntries(step.parameters.map(p=>[p.key,p.default]));
      if(step.selected)selected.add(step.id);
      continue;
    }
    if(entries.length!==1)throw new Error(`Expected one configuration for ${step.id}.`);
    const item=entries[0];if(typeof item.selected!=='boolean')throw new Error('Invalid selection.');
    settings[step.id]={};
    for(const p of step.parameters){const v=item.parameters?.[p.key];
      const valid=p.type==='checkbox'?typeof v==='boolean':p.type==='number'?Number.isFinite(v)&&v>=p.min&&v<=p.max&&(p.step<1||Number.isInteger(v)):p.type==='select'?p.options.includes(v):typeof v==='string'&&v.length<=2000;
      if(!valid)throw new Error(`Invalid setting for ${step.id}/${p.key}.`);settings[step.id][p.key]=v;
    }if(item.selected)selected.add(step.id);
  }
  return {settings,selected};
}
