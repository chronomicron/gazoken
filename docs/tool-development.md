# Adding and running isolated tools

Updated: 2026-11-04  
Status: implemented local framework contract v1; method validation remains separate

## Shared call pattern

Each tool has a stable key, one module (or a package when it grows), a version,
and the same `run(inputs, parameters) -> ToolOutput` interface. Tools import no
FastAPI, DOM, or browser state. The GUI and notebooks call the same Python runner.

```text
src/gazoken/
├── catalog.py                    Shared catalog; actual registration sets readiness
├── pipeline.py                   Validate plan, dispatch sequentially, record results
├── server.py                     HTTP transport only; currently JPEG bytes in
├── tools/
│   ├── contracts.py              ImageSource, PixelPackage, ToolInputs, ToolOutput
│   ├── registry.py               Explicit executable-adapter allowlist
│   ├── encoded/                  Phase 1: original file and compressed-domain tools
│   │   ├── source_identity.py    Step 1.1, registered
│   │   └── byte_distribution.py  Step 1.7, registered
│   ├── decoded/                  Phase 2: reference provider and spatial tools
│   └── history/                  Phase 3: processing-history specialists
└── web/
    ├── steps.json                Stable IDs, tool keys/inputs and parameter schemas
    ├── workbench.mjs             Controls, selected call order and result rendering
    └── session.mjs               Snapshot/export and backwards settings migration

tests/tools/                     Contract checks and future adapter-specific tests
docs/templates/                  Adapter and implementation-note starting points
```

Phase folder READMEs enumerate reserved module names. A reserved name is not an
existing algorithm. Do not create dozens of empty executable stubs. Add a module
when its implementation work starts; larger methods may use a directory with the
same import path and `__init__.py` exposing the same interface.

## Inputs and lifecycle

`ImageSource` copies mutable inputs to immutable encoded `bytes`, bounds size,
checks SOI, and records source identity. Its SOI check is not JPEG conformance
validation. Every adapter in a plan receives the same preserved source.

`PixelPackage` v1 is a tightly packed row-major interleaved uint8 buffer, with
width, height, one/three/four named channels, source SHA-256, decoder/version,
color policy, orientation policy, and coordinate description. It is bounded to
12 megapixels. Its identity hashes both bytes and representation/provenance.
Layout and source linkage are checked; the contract does not verify a decoder's
scientific accuracy. More numeric types or planar layouts require an explicit
contract extension; never silently reinterpret a buffer.

`ToolInputs(source, pixels=None)` is the common packet. Parameters are validated
against the step schema and exposed as a read-only mapping; current schemas are
flat scalar values. Tools create their own working arrays. Frozen Python objects
are a cooperative in-process boundary, not a security sandbox for untrusted code.

`ToolOutput(measurements, warnings=(), pixels=None)` returns JSON-compatible
measurements and explicit warnings. Only the catalog's declared pixel provider,
2.1, may emit a new `PixelPackage`. A successful explicitly selected provider can
supply that package to subsequent selected tools in the same plan. Once supplied,
a different fixed reference cannot replace it during that plan. Derived filters,
rotations, or recompressions must not overwrite the source/reference.

No actual Python decoder is registered today. The HTTP route still accepts only
JPEG bytes and configurations; it does not accept browser previews as pixels,
cache decoded packages, or transport generated image artifacts. Future decoder
integration needs source-bound lifecycle/transport tests and a renderer/storage
choice, in addition to its adapter. The notebook API can already accept an
explicitly constructed package; no pixels are inferred from a filename.

Other declared inputs (coefficients, sensor references, weights, evaluated evidence)
are extension points, currently unavailable. Add provenance-checked typed packages
and resource handling before registering a method that needs them. A text field
containing a manifest name does not load that resource.

## Selection and dispatch

The GUI shows the active phase's selected call order and each tool's input contract
and module target. **Run step / Record settings** and **Run selected / Record selected
plan** use `/api/run`, which calls `run_plan`. Nothing invokes a module named in a
user request; executable adapters are explicitly imported in `tools/registry.py`.

Plans execute synchronously in numeric phase/step order, not click order or
implementation-priority order. Gopher's difficulty ranking helps choose which
module to implement next; it does not change analytical IDs or execution order.
The browser receives the completed run together, not streaming progress.

Only selected tools run. Dependencies are not inserted automatically. Declared
`requires` step IDs are informative; available input packages gate real execution.
A planned tool returns `not_implemented`. A registered tool lacking required inputs
returns `blocked`. Ordinary adapter exceptions or invalid JSON outputs produce a
`failed` record; later selected tools continue. Parameter/source validation fails
the request before any adapter runs. Cancellation, process crashes and resource
exhaustion are not isolated by this synchronous runner.

```python
from gazoken.pipeline import run_step, run_plan

one = run_step(jpeg_bytes, "source.jpg", "1.7", {"scope": "Whole file"})
several = run_plan(jpeg_bytes, "source.jpg", [
    {"id": "1.1", "parameters": {"note": "Known test input"}},
    {"id": "1.7"},
])
# Later, with an explicitly constructed provenance-linked PixelPackage:
# run_step(jpeg_bytes, "source.jpg", "2.2", pixels=reference)
```

Result schema 2 retains `source`, `results`, `output`, executed parameters and
runtime; it adds adapter key, method version, input contract, package provenance,
required/missing inputs, produced-input descriptors, warnings and failure type.
Planned adapters have a null method version and null output. No binary buffers are
serialized. Measurement dictionaries are copied and must contain finite JSON
values; units, representation, sample support, score meaning and limitations
belong in the method's documented output schema. File/figure artifacts need a
future explicit transport contract; arbitrary local paths are not an artifact API.

Full-session settings schema remains 3 because IDs/parameter keys are unchanged.
Schemas 1 and 2 still initialize newer phases to defaults; imports restore settings
only. Existing run records remain viewable in their old exports and are not
attached to newly loaded sources. Result cards display actual input provenance
when present and retain executed snapshots even after later edits.

## Checklist for each future tool

1. Select a bounded measurement/method scope. Keep scientific proposals and paper
   reviews private; write its public implementation coverage separately.
2. Use the reserved key/module in `steps.json`. Specify original bytes, pixels or
   other required packages; define actual units, parameters, bounds, outputs,
   applicability, resource requirements and error behavior. Existing keys stay
   stable. Parameter changes need an explicit settings migration or version policy.
3. Create `tools/<phase>/<name>.py` from the [adapter template](templates/tool_adapter.py.txt).
   Keep imports light and optional dependencies local to the adapter where practical.
   Record dependency versions, source attribution and terms when adopting code.
4. Implement `VERSION` and `run`; return descriptive measurements or a method-specific
   score with its meaning. Use warnings for supported but limited cases. Invalid
   inputs should fail clearly; unsupported cases need a documented method outcome.
5. Register that exact callable/version in `tools/registry.py`. `/api/catalog`
   derives readiness from registration; static `implementation` fields in the JSON
   are compatibility hints, not proof of executable coverage. No arbitrary discovery.
6. Add `tests/tools/test_<name>.py` with known/reference cases, source preservation,
   valid/invalid input, units, parameter behavior and reproducibility checks.
   Pixel-producing tools need buffer/provenance/coordinate tests. Test resource
   absence and API/GUI behavior where relevant. Scientific accuracy is a separate
   study with held-out inputs, not a software-test claim.
7. Write an implementation note using the [documentation template](templates/tool-implementation.md).
   Add a result-specific renderer only for outputs actually produced; otherwise
   the existing generic JSON renderer remains available. Show applicability and
   input provenance rather than fabricating plots or overlays.
8. Update coverage, the phase README and relevant project docs; check session
   compatibility, restart the local server for catalog changes and verify the UI.

For Phase 1, bounded file parsing and malformed/truncated inputs matter. For Phase
2, pin/record decoder behavior before pixel measurements and identify every derived
representation. For Phase 3, declare scene/model/reference assumptions; do not
convert descriptive differences into editing probabilities without evaluation.

## Checks and current limits

```bash
.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
node tests/session.test.mjs
node --check src/gazoken/web/workbench.mjs
```

The two existing byte tools were moved without changing their measurements. No
new forensic algorithm, Python decode, resource loader, background queue, plugin
installer, persistent artifact store or C/C++ ABI is introduced. Python tests use
synthetic test-only providers to exercise future handoff; those are not registered
production methods. Keep C/C++ integration behind this Python adapter boundary
when requirements justify it; language bindings remain undecided.
