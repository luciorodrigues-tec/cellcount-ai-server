# Dependency Rules

1. `kernel/` must never import from `ai/` or scientific packs.
2. `engineering/` must never import scientific domain modules.
3. Scientific packs may depend on public Kernel contracts.
4. Presentation may consume application contracts but not private engine files.
5. Cross-module imports must target `index.js`.
6. Circular dependencies are prohibited.
