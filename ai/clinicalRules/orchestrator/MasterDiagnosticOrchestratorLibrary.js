import {
  MasterDiagnosticOrchestrator,
} from "./application/MasterDiagnosticOrchestrator.js";

export function createMasterDiagnosticOrchestrator(
  dependencies = {},
) {
  return new MasterDiagnosticOrchestrator(
    dependencies,
  );
}
