# CI-001B.5 — Bone Marrow Safety Governor

A specimen-aware clinical safety framework now audits the final marrow result.

The first rule pack implements ten traceable rules, BM-001 through BM-010.
Every triggered rule records an audit entry with severity, field, before,
after, reason and action.

Blocking failures return HTTP 422 before the result reaches Flutter.
Peripheral-blood output bypasses the marrow governor unchanged.
