import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("PASS 0 — 005.47.1 runtime identity is registered", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.match(
    server,
    /FINAL_RESULT_INITIALIZATION_ORDER_HOTFIX_VERSION\s*=\s*\n?\s*"BE-FIX-005\.47\.1"/,
  );

  assert.match(
    server,
    /finalResultInitializationOrderHotfixVersion:\s*\n?\s*FINAL_RESULT_INITIALIZATION_ORDER_HOTFIX_VERSION/,
  );
});

test("PASS 1 — finalResult is initialized before any 005.47 projection-lock use in final assembly", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  const finalGovernorMarker =
    server.indexOf("FINAL CLINICAL GOVERNOR — única autoridade final");
  assert.ok(finalGovernorMarker >= 0);

  const declaration =
    server.indexOf("let finalResult =", finalGovernorMarker);
  assert.ok(declaration > finalGovernorMarker);

  const projectionAfterDeclaration =
    server.indexOf(
      "applyMarrowMorphologyAdequacyProjectionLock(finalResult)",
      declaration,
    );

  assert.ok(
    projectionAfterDeclaration > declaration,
    "005.47 projection lock must run only after finalResult initialization",
  );
});

test("PASS 2 — no finalResult access exists between FINAL VALIDATED RESULT preamble and declaration", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  const preamble =
    server.indexOf('console.log("FINAL VALIDATED RESULT")');
  const declaration =
    server.indexOf("let finalResult =", preamble);

  assert.ok(preamble >= 0);
  assert.ok(declaration > preamble);

  const between = server.slice(preamble, declaration);

  assert.doesNotMatch(
    between,
    /\bfinalResult\b/,
    "finalResult must not be read or assigned before its let declaration",
  );
});

test("PASS 3 — final governor still initializes from validation.result", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.match(
    server,
    /let finalResult\s*=\s*\n?\s*applyFinalClinicalGovernor\(\s*\n?\s*validation\.result,\s*\n?\s*\);/,
  );
});

test("PASS 4 — 005.47 terminal morphology/adequacy lock remains present downstream", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  const declaration =
    server.indexOf("let finalResult =");

  const lateLock =
    server.indexOf(
      "applyMarrowMorphologyAdequacyProjectionLock(finalResult)",
      declaration,
    );

  assert.ok(lateLock > declaration);

  assert.match(
    server,
    /BE-FIX-005\.47 — TERMINAL MARROW MORPHOLOGY \/ ADEQUACY AXIS PROJECTION LOCK/,
  );
});
