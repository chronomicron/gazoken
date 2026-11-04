/** Public fixtures only. Relative URLs work on a GitHub Pages project path. */
export async function installSamples({container, load, status, jpegOnly = false}) {
  const label = document.createElement('label');
  label.textContent = 'Explore a sample ';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Sample image');
  select.add(new Option('Choose a synthetic test case…', ''));
  label.append(select);
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'text-button';
  button.textContent = 'Open sample'; button.disabled = true;
  const note = document.createElement('p'); note.className = 'fine-print';
  note.textContent = 'Known inputs for exploration, not a detector benchmark.';
  container.append(label, button, note);
  try {
    const response = await fetch(new URL('../samples.json', import.meta.url));
    if (!response.ok) throw new Error('Sample catalog unavailable.');
    const cases = (await response.json()).filter(item => !jpegOnly || item.mime === 'image/jpeg');
    for (const item of cases) select.add(new Option(item.title, item.id));
    select.onchange = () => {
      note.textContent = cases.find(item => item.id === select.value)?.description || 'Choose a documented test case.';
      button.disabled = !select.value;
    };
    button.onclick = async () => {
      const item = cases.find(item => item.id === select.value);
      if (!item) return;
      button.disabled = true; select.disabled = true;
      try {
        const file = await fetch(new URL(`../../tests/fixtures/images/${item.file}`, import.meta.url));
        if (!file.ok) throw new Error('Sample image unavailable.');
        await load(new File([await file.blob()], item.file, {type:item.mime}));
      } catch (error) { status(error.message, true); }
      finally { select.disabled = false; button.disabled = !select.value; }
    };
  } catch (error) { note.textContent = `${error.message} You can still choose your own image.`; }
}
