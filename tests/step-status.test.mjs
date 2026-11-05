import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepStatus} from '../src/gazoken/web/step-status.mjs';
const catalog=JSON.parse(readFileSync(new URL('../src/gazoken/web/steps.json',import.meta.url)));
const settings=Object.fromEntries(catalog.map(s=>[s.id,Object.fromEntries(s.parameters.map(p=>[p.key,p.default]))]));
const status=(id,extra={})=>stepStatus(catalog.find(s=>s.id===id),{selected:new Set([id]),settings:structuredClone(settings),hasSource:true,catalog,...extra});
test('unselected gray, selected ready green, no source amber',()=>{
 assert.equal(status('1.1',{selected:new Set()}).color,'gray');
 assert.equal(status('1.1').color,'green');
 assert.equal(status('1.1',{hasSource:false}).color,'amber');
});
test('planned methods and missing coefficient prerequisites amber',()=>{
 assert.equal(status('1.8').color,'amber');assert.equal(status('1.10').color,'amber');
 assert.equal(status('1.9').color,'amber');assert.equal(status('1.12').color,'amber');
 assert.equal(status('1.12',{selected:new Set(['1.1','1.12'])}).color,'green');
});
test('invalid parameters red and correction restores readiness',()=>{
 const changed=structuredClone(settings);changed['1.2'].segment_limit=0;
 assert.equal(status('1.2',{settings:changed}).color,'red');
 changed['1.2'].segment_limit=4096;assert.equal(status('1.2',{settings:changed}).color,'green');
 changed['1.2'].segment_limit=NaN;assert.equal(status('1.2',{settings:changed}).color,'red');
});
test('failed matching attempt red, editing clears stale failure, deselecting gray',()=>{
 const attempt={status:'failed',parameters:{...settings['1.1']}};
 assert.equal(status('1.1',{attempt}).color,'red');
 const changed=structuredClone(settings);changed['1.1'].note='new settings';
 assert.equal(status('1.1',{attempt,settings:changed}).color,'green');
 assert.equal(status('1.1',{attempt,selected:new Set()}).color,'gray');
});
test('warnings and blocked attempts amber; a clean completed attempt clears them',()=>{
 const attempt={parameters:settings['1.1'],status:'completed',warnings:['Partial input']};
 assert.equal(status('1.1',{attempt}).color,'amber');
 attempt.warnings=[];assert.equal(status('1.1',{attempt}).color,'green');
 attempt.status='blocked';assert.equal(status('1.1',{attempt}).color,'amber');
});
test('coefficient consumers still need provider selection after a successful earlier run',()=>{
 const attempt={parameters:settings['1.10'],status:'completed',warnings:[]};
 assert.equal(status('1.10',{attempt}).color,'amber');
 assert.equal(status('1.10',{attempt,selected:new Set(['1.9','1.10'])}).color,'green');
 const changed=structuredClone(settings);changed['1.3'].reader='ExifTool (not connected)';
 assert.equal(status('1.3',{settings:changed}).color,'amber');
});

test('a failed provider keeps a previously successful consumer amber',()=>{
 const attempt={parameters:settings['1.10'],status:'completed',warnings:[]};
 const attempts={'1.9':{parameters:settings['1.9'],status:'failed'}};
 assert.equal(status('1.10',{attempt,attempts,selected:new Set(['1.9','1.10'])}).color,'amber');
 const changed=structuredClone(settings);changed['1.9'].reader='Not selected';
 assert.equal(status('1.10',{attempt,settings:changed,selected:new Set(['1.9','1.10'])}).color,'amber');
});
