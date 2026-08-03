# CI-002C.8 — Morphologic Evidence Graph

The complete morphology decision is now represented as an explicit graph.

Cells, features, criteria, confidence factors, penalties, specimen context,
alternatives, rejected candidates and human-review requirements are linked
through typed and weighted edges.

The graph is deterministic, deduplicated, queryable and does not mutate the
upstream ranking, confidence or explanation outputs.
