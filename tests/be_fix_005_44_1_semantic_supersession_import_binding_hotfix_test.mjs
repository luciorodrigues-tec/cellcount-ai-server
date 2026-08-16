import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("PASS 0 — 005.44.1 server imports semantic supersession symbols from the engine", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.match(
    server,
    /import\s*\{[\s\S]*?applyMarrowPositiveBlastEvidenceSemanticSupersession[\s\S]*?MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION[\s\S]*?MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION[\s\S]*?\}\s*from\s*["']\.\/ai\/boneMarrow\/marrowPositiveBlastEvidenceSemanticSupersessionEngine\.js["'];/,
  );
});

test("PASS 1 — 005.44.1 server still applies semantic supersession in production flow", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");
  const uses = server.match(/applyMarrowPositiveBlastEvidenceSemanticSupersession\s*\(/g) || [];
  assert.ok(uses.length >= 3);
});

test("PASS 2 — 005.44.1 runtime fingerprints remain registered", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.match(server, /marrowPositiveBlastEvidenceSemanticSupersessionVersion/);
  assert.match(server, /marrowFinalBlastProjectionLockVersion/);
});
