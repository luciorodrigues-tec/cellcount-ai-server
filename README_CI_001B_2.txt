CELLCOUNT — CI-001B.2
END-TO-END SPECIMEN VALIDATION V1

PURPOSE
-------
Validate the complete local flow with two real images:

1. Peripheral blood image
2. Bone marrow image

The suite calls:
- GET /health
- POST /classify-specimen
- POST /analyze-slide

It validates:
- specimen classification
- specimenDecision transport
- peripheral versus marrow routing
- specimen metadata in the final response
- absence of forbidden peripheral-blood phrases in marrow reports
- presence of the expanded marrow contract
- JSON report generation

INSTALL
-------
Extract this package inside:

C:\CELLCOUNT_V1.0.0-beta.4\backend

The final structure must include:

backend\
  server.js
  tests\
    ci001b2_e2e.mjs
    ci001b2_contract_test.mjs
    run_ci001b2_e2e.cmd
    run_ci001b2_e2e.ps1
  reports\

PREPARATION
-----------
Keep the backend running in one terminal:

cd /d "C:\CELLCOUNT_V1.0.0-beta.4\backend"
npm start

Use another terminal for the test.

CONTRACT TEST
-------------
node tests\ci001b2_contract_test.mjs

END-TO-END TEST — CMD
---------------------
tests\run_ci001b2_e2e.cmd ^
  "C:\IMAGENS\sangue_periferico.jpg" ^
  "C:\IMAGENS\medula_ossea.jpg"

END-TO-END TEST — POWERSHELL
----------------------------
powershell -ExecutionPolicy Bypass -File tests\run_ci001b2_e2e.ps1 `
  -PeripheralImage "C:\IMAGENS\sangue_periferico.jpg" `
  -MarrowImage "C:\IMAGENS\medula_ossea.jpg"

DIRECT NODE COMMAND
-------------------
node tests\ci001b2_e2e.mjs ^
  "C:\IMAGENS\sangue_periferico.jpg" ^
  "C:\IMAGENS\medula_ossea.jpg" ^
  "reports\ci001b2_e2e_report.json"

EXPECTED
--------
Sangue periférico:
- classification normally PERIPHERAL_BLOOD
- routing peripheral_blood

Medula:
- classification normally BONE_MARROW_ASPIRATE,
  HEMODILUTED_BONE_MARROW or BONE_MARROW_BIOPSY
- routing bone_marrow
- no peripheral-normal global conclusions

IMPORTANT
---------
A classification mismatch is initially reported as a warning because real
microscopy images can be technically limited. Routing inconsistencies and
forbidden marrow language are failures.

OUTPUT
------
reports\ci001b2_e2e_report.json
