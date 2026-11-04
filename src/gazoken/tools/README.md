# Isolated tool adapters

All tools use `run(ToolInputs, parameters) -> ToolOutput`. The original bytes and
optional fixed pixel/coefficient packages are immutable; tools make their own working data.
The GUI, HTTP endpoint and Python runner share this interface and catalog.

- [Encoded tools](encoded/README.md): Phase 1 module inventory.
- [Decoded tools](decoded/README.md): Phase 2 module inventory.
- [History tools](history/README.md): Phase 3 module inventory.
- [Development guide](../../../docs/tool-development.md): contract, dispatch,
  registration, templates, outputs and verification.

`contracts.py` owns inputs/results. `registry.py` explicitly registers only real
implementations. No modules are imported from user-supplied paths or filenames.
