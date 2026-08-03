# ADR-003 — Public Module Entry Points

Status: Accepted

Modules communicate only through their public `index.js`. Importing another
module's private implementation files is prohibited.
