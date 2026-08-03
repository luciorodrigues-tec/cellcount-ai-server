import { blastKnowledge } from "../cells/blast.js";
import { promyelocyteKnowledge } from "../cells/promyelocyte.js";
import { myelocyteKnowledge } from "../cells/myelocyte.js";
import { metamyelocyteKnowledge } from "../cells/metamyelocyte.js";
import { bandKnowledge } from "../cells/band.js";
import { segmentedNeutrophilKnowledge } from "../cells/segmentedNeutrophil.js";
import { lymphocyteKnowledge } from "../cells/lymphocyte.js";
import { reactiveLymphocyteKnowledge } from "../cells/reactiveLymphocyte.js";
import { plasmaCellKnowledge } from "../cells/plasmaCell.js";
import { plasmablastKnowledge } from "../cells/plasmablast.js";
import { monocyteKnowledge } from "../cells/monocyte.js";
import { eosinophilKnowledge } from "../cells/eosinophil.js";
import { basophilKnowledge } from "../cells/basophil.js";
import { erythroblastKnowledge } from "../cells/erythroblast.js";
import { megakaryocyteKnowledge } from "../cells/megakaryocyte.js";

export const cellKnowledgeLibrary = Object.freeze([
  blastKnowledge,
  promyelocyteKnowledge,
  myelocyteKnowledge,
  metamyelocyteKnowledge,
  bandKnowledge,
  segmentedNeutrophilKnowledge,
  lymphocyteKnowledge,
  reactiveLymphocyteKnowledge,
  plasmaCellKnowledge,
  plasmablastKnowledge,
  monocyteKnowledge,
  eosinophilKnowledge,
  basophilKnowledge,
  erythroblastKnowledge,
  megakaryocyteKnowledge,
]);
