const SPECIMEN_PROMPT = `
Classifique exclusivamente o tipo de material microscópico antes da interpretação clínica.
Classes: PERIPHERAL_BLOOD, BONE_MARROW_ASPIRATE, BONE_MARROW_BIOPSY, HEMODILUTED_BONE_MARROW, INADEQUATE, INDETERMINATE.
Não diagnostique doenças. Retorne apenas JSON com predictedType, confidence, alternativeType, alternativeConfidence, modelVersion e evidence.
`;

function safeJson(text="{}") { try { return JSON.parse(text); } catch { return {}; } }
function clamp01(value) { const n=Number(value); return Number.isFinite(n) ? Math.min(1,Math.max(0,n)) : 0; }
function normalizeClassification(raw={}) {
  const allowed=new Set(["PERIPHERAL_BLOOD","BONE_MARROW_ASPIRATE","BONE_MARROW_BIOPSY","HEMODILUTED_BONE_MARROW","INADEQUATE","INDETERMINATE"]);
  const predictedType=allowed.has(raw.predictedType) ? raw.predictedType : "INDETERMINATE";
  return {predictedType,confidence:clamp01(raw.confidence),alternativeType:allowed.has(raw.alternativeType)?raw.alternativeType:"INDETERMINATE",alternativeConfidence:clamp01(raw.alternativeConfidence),modelVersion:raw.modelVersion||"specimen-classifier-v1",evidence:Array.isArray(raw.evidence)?raw.evidence.slice(0,12).map(item=>({kind:String(item?.kind||"other"),description:String(item?.description||""),supports:allowed.has(item?.supports)?item.supports:predictedType,weight:clamp01(item?.weight),confidence:clamp01(item?.confidence)})):[]};
}

export function registerSpecimenRecognitionRoute({app,auth,upload,openai,model,buildGPTImagePayload}) {
  app.post("/classify-specimen",auth,upload.array("image",4),async(req,res)=>{
    try {
      const files=req.files||[];
      if (!files.length) return res.status(400).json({success:false,error:"Nenhuma imagem enviada."});
      const imagePayload=await buildGPTImagePayload(files);
      const response=await openai.chat.completions.create({model,temperature:0,response_format:{type:"json_object"},messages:[{role:"system",content:SPECIMEN_PROMPT},{role:"user",content:[{type:"text",text:"Classifique o tipo de material. Não faça interpretação clínica."},...imagePayload]}]});
      const classification=normalizeClassification(safeJson(response.choices?.[0]?.message?.content||"{}"));
      return res.json({success:true,specimenClassification:classification,metadata:{images:files.length,model,clinicalIntelligenceVersion:"CI-001A-v1"}});
    } catch(error) {
      console.error("CLASSIFY-SPECIMEN ERROR:",error);
      return res.status(500).json({success:false,error:"Erro ao classificar o tipo de material.",detail:error.message});
    }
  });
}

export function validateSpecimenGate(req) {
  let decision=null;
  try { const raw=req.body?.specimenDecision; decision=typeof raw==="string"?JSON.parse(raw):raw; } catch {}
  if (!decision) return {valid:false,status:422,error:"SpecimenDecision obrigatório antes da análise clínica."};
  if (!["accepted","reviewRequired"].includes(decision.status)) return {valid:false,status:422,error:"A classificação do material bloqueou o pipeline clínico."};
  return {valid:true,decision,specimenType:decision.effectiveType||req.body?.specimenType||"INDETERMINATE"};
}

export function buildSpecimenPromptContext(gate) {
  return `TIPO DE MATERIAL VALIDADO: ${gate?.specimenType||"INDETERMINATE"}
STATUS: ${gate?.decision?.status||"unknown"}
Use exclusivamente o motor compatível. Não misture sangue periférico e medula óssea. Se reviewRequired, declare revisão obrigatória.`;
}
