/** Selection/readiness cue; never an authenticity assessment. */
function invalidSetting(step, values = {}) {
  return step.parameters.find(p => {
    const v = values[p.key];
    return !(p.type === 'number' ? typeof v === 'number' && Number.isFinite(v) && v >= p.min && v <= p.max && ((p.step ?? 1) < 1 || Number.isInteger(v))
      : p.type === 'checkbox' ? typeof v === 'boolean'
      : p.type === 'select' ? p.options.includes(v)
      : typeof v === 'string' && v.length <= 2000);
  });
}
const sameSettings = (step, values, attempt) => attempt && step.parameters.every(p => Object.is(attempt.parameters[p.key], values[p.key]));
export function stepStatus(step, {selected, settings, hasSource, attempt, attempts = {}, catalog = []}) {
  const signal = (color, text) => ({color, text});
  if (!selected.has(step.id)) return signal('gray', 'Not selected · will not run with Run selected');
  const values = settings[step.id];
  const invalid = invalidSetting(step, values);
  if (invalid) return signal('red', `Selected · invalid setting: ${invalid.label}`);
  const matches = sameSettings(step, values, attempt);
  if (matches && attempt.status === 'failed') return signal('red', 'Selected · latest attempt with these settings failed; inspect its result');
  if (!hasSource) return signal('amber', 'Selected · load a JPEG before running');
  if (step.implementation !== 'ready') return signal('amber', 'Selected · configuration only; method is not implemented');
  if (values.reader === 'Not selected' || values.reader?.startsWith('ExifTool') || values.reader === 'jpegio candidate')
    return signal('amber', 'Selected · choose an available reader');
  for (const kind of step.tool.inputs) {
    if (['jpeg_bytes', 'run_evidence'].includes(kind)) continue;
    const provider = catalog.find(s => s.tool.provides.includes(kind));
    if (!provider || !selected.has(provider.id) || provider.implementation !== 'ready')
      return signal('amber', `Selected · ${kind} requires a selected, implemented provider`);
    const providerValues = settings[provider.id];
    if (invalidSetting(provider, providerValues) || (sameSettings(provider, providerValues, attempts[provider.id]) && attempts[provider.id].status === 'failed'))
      return signal('amber', 'Selected · prerequisite provider has invalid settings or a failed attempt');
    const providerReader = providerValues?.reader;
    if (providerReader === 'Not selected' || providerReader === 'jpegio candidate')
      return signal('amber', 'Selected · prerequisite provider needs an available reader');
    if (kind === 'coefficients' && !matches) return signal('amber', 'Selected · coefficients depend on 1.9 succeeding in this run');
  }
  if (step.id === '1.9' && !(matches && attempt.status === 'completed'))
    return signal('amber', 'Selected · optional native reader availability and input support checked at execution');
  if (step.id === '1.12' && !catalog.some(s => s.id.startsWith('1.') && s.id !== '1.12' && selected.has(s.id) && s.implementation === 'ready'))
    return signal('amber', 'Selected · no other Phase 1 tools selected; report will be empty');
  if (matches && (attempt.status === 'blocked' || attempt.warnings?.length || attempt.output?.extraction_status === 'partial'))
    return signal('amber', 'Selected · latest attempt reported warnings, partial data or unavailable inputs');
  return signal('green', 'Selected · ready for Run selected; runtime checks still apply');
}
