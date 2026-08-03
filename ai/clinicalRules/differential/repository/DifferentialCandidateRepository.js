export const DIFFERENTIAL_CANDIDATE_REPOSITORY_VERSION = "CRR-000007-v1.0.0";
export class DifferentialCandidateRepository {
  constructor({version=DIFFERENTIAL_CANDIDATE_REPOSITORY_VERSION}={}) { this.version=String(version); this._items=new Map(); }
  register(candidate,{replace=false}={}) { if(!candidate?.id) throw new TypeError("Differential candidate with id is required."); if(this._items.has(candidate.id)&&!replace) throw new Error(`Differential candidate already registered: ${candidate.id}`); this._items.set(candidate.id,candidate); return candidate; }
  get(id){ return this._items.get(String(id))||null; }
  list(){ return Object.freeze([...this._items.values()]); }
}
