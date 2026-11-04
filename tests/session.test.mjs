import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionRecord,readSettings,phaseReport,phaseSteps} from '../src/gazoken/web/session.mjs';

const catalog=JSON.parse(readFileSync(new URL('../src/gazoken/web/steps.json',import.meta.url)));
const defaults=()=>Object.fromEntries(catalog.map(s=>[s.id,Object.fromEntries(s.parameters.map(p=>[p.key,p.default]))]));
test('session export snapshots settings and measurements without image bytes',()=>{
  const settings=defaults(),runs=[{source:{sha256:'original'},results:[{id:'1.1',parameters:{note:'at execution'},status:'completed'}]}];
  const record=sessionRecord(catalog,settings,new Set(['1.1','1.7']),{sha256:'original'},runs);
  settings['1.1'].note='edited';runs[0].results[0].parameters.note='later mutation';
  assert.equal(record.configuration[0].parameters.note,'');
  assert.equal(record.runs[0].results[0].parameters.note,'at execution');
  assert.equal(record.configuration.length,23);
  assert.ok(!('bytes' in record));
});
test('settings roundtrip preserves values and never imports source or history',()=>{
  const settings=defaults();settings['1.1'].note='Controlled input';settings['1.2'].segment_limit=512;
  const record=sessionRecord(catalog,settings,new Set(['1.2']),{sha256:'different'},[{results:[]}]);
  const imported=readSettings(JSON.parse(JSON.stringify(record)),catalog);
  assert.deepEqual(imported.settings,settings);assert.deepEqual([...imported.selected],['1.2']);
  assert.deepEqual(Object.keys(imported).sort(),['selected','settings']);
});
test('reject incompatible, missing, duplicate and out-of-range settings',()=>{
  const base=()=>sessionRecord(catalog,defaults(),new Set(),null,[]);
  for(const mutate of [r=>r.schema_version=99,r=>r.configuration.pop(),r=>r.configuration[1]=r.configuration[0],r=>r.configuration[1].parameters.segment_limit=0,r=>r.configuration[0].parameters.note=4,r=>r.configuration[2].parameters.reader='unrecognized']){
    const record=base();mutate(record);assert.throws(()=>readSettings(record,catalog));
  }
});
test('phase coverage counts unique steps and keeps the latest executed parameters',()=>{
  const source={sha256:'known'}, run=(results)=>({source,created_at:'2026-11-04T00:00:00Z',results});
  const runs=[run([{id:'1.1',status:'completed',parameters:{note:'first'},output:{size:10}}, {id:'1.2',status:'not_implemented',output:null}]),run([{id:'1.1',status:'completed',parameters:{note:'second'},output:{size:10}}])];
  const report=phaseReport(catalog,source,runs);
  assert.equal(report.status,'partial');
  assert.deepEqual(report.coverage,{total:12,completed:1,not_implemented:1,not_run:10,other:0});
  assert.equal(report.steps[0].attempt_count,2);
  assert.equal(report.steps[0].latest.parameters.note,'second');
  assert.equal(report.steps[1].latest.output,null);
  runs[1].results[0].parameters.note='changed after report';
  assert.equal(report.steps[0].latest.parameters.note,'second');
});
test('phase report excludes other-source evidence and resets when source is cleared',()=>{
  const runs=[{source:{sha256:'other'},results:[{id:'1.7',status:'completed',output:{entropy:8}}]}];
  const report=phaseReport(catalog,{sha256:'current'},runs);
  assert.equal(report.status,'not_started');assert.equal(report.coverage.completed,0);assert.equal(report.run_count,0);
  assert.equal(phaseReport(catalog,null,runs).status,'no_source');
});
test('reports isolate phase history while retaining global run numbers and source identity',()=>{
  const source={sha256:'shared',filename:'same.jpg'};
  const runs=[{source,created_at:'first',results:[{id:'1.1',status:'completed',output:{size:20}}]},
    {source,created_at:'second',results:[{id:'2.1',status:'not_implemented',parameters:{decoder:'Awaiting decoder selection'},output:null}]}];
  const first=phaseReport(catalog,source,runs,1), second=phaseReport(catalog,source,runs,2);
  assert.equal(first.coverage.total,12);assert.equal(second.coverage.total,11);
  assert.equal(first.coverage.completed,1);assert.equal(second.coverage.completed,0);
  assert.equal(second.coverage.not_implemented,1);assert.equal(second.steps[0].latest.run_number,2);
  assert.equal(second.steps[0].latest.output,null);assert.equal(second.source.sha256,first.source.sha256);
  assert.equal(phaseReport(catalog,source,runs.slice(0,1),2).status,'not_started');
  const exported=sessionRecord(catalog,defaults(),new Set(['1.1','2.1']),source,runs);
  assert.equal(exported.schema_version,2);assert.deepEqual(exported.phase_reports.map(r=>r.phase),[1,2]);
});
test('legacy Phase 1 settings import initializes Phase 2 defaults without importing records',()=>{
  const legacyCatalog=phaseSteps(catalog,1), settings=defaults();settings['1.1'].note='Legacy source note';
  const legacy={framework:'gazoken',schema_version:1,configuration:legacyCatalog.map(s=>({id:s.id,selected:s.id==='1.1',parameters:settings[s.id]})),runs:[{results:[]}]};
  const imported=readSettings(legacy,catalog);
  assert.equal(imported.settings['1.1'].note,'Legacy source note');
  assert.equal(imported.settings['2.1'].decoder,'Awaiting decoder selection');
  assert.ok(imported.selected.has('2.1'));assert.ok(!('runs' in imported));
});
test('Phase 2 fractional geometry settings roundtrip and invalid numerics are rejected',()=>{
  const settings=defaults();settings['2.8'].period_increment=.75;settings['2.9'].minimum_angle=-12.5;
  const exported=sessionRecord(catalog,settings,new Set(['2.8','2.9']),null,[]);
  assert.equal(readSettings(exported,catalog).settings['2.9'].minimum_angle,-12.5);
  for(const value of [Infinity,NaN,0,'0.5',true]){
    const invalid=structuredClone(exported);
    invalid.configuration.find(s=>s.id==='2.8').parameters.period_increment=value;
    assert.throws(()=>readSettings(invalid,catalog));
  }
});
