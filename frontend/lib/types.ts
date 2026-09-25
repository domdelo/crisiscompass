// Mirrors backend/app/models/*.py. Keep in sync with the API contracts
// documented for the team — do not rename fields without team agreement.

export interface Household {
  adults: number | null;
  children: number | null;
}

export interface Documents {
  identification: string;
  proof_of_residence: string;
  damage_documentation: string;
  insurance_claim: string;
}

export interface RecoveryPassport {
  disaster: string | null;
  location: string | null;
  household: Household;
  immediate_needs: string[];
  barriers: string[];
  documents: Documents;
  next_best_action: string | null;
}

export interface RecoveryStep {
  category: string;
  action: string;
  status: string;
}

export interface ResourceRecommendation {
  name: string;
  agency: string;
  reason: string;
  source_title: string;
  source_url: string;
  required_information: string[];
  next_action: string;
  eligibility_status: string;
}

export interface RecoveryState {
  passport: RecoveryPassport;
  plan: RecoveryStep[];
  resources: ResourceRecommendation[];
  next_best_action: string | null;
}

// POST /api/intake
export interface IntakeRequest {
  message: string;
}
export type IntakeResponse = RecoveryPassport;

// POST /api/recovery
export interface RecoveryRequest {
  passport: RecoveryPassport;
}
export type RecoveryResponse = RecoveryState;

// POST /api/resources
export interface ResourceRequest {
  location: string;
  needs: string[];
  barriers: string[];
}
export interface ResourceResponse {
  resources: ResourceRecommendation[];
}

// POST /api/scam-check
export interface ScamCheckRequest {
  message: string;
}
export interface ScamCheckResponse {
  risk: string;
  warning_signs: string[];
  recommendation: string;
  source_title: string;
  source_url: string;
}

// POST /api/escalate
export interface EscalationRequest {
  passport: RecoveryPassport;
  reason: string;
  actions_taken: string[];
}
export interface HumanHandoffSummary {
  disaster: string | null;
  location: string | null;
  immediate_needs: string[];
  household_summary: string;
  barriers: string[];
  actions_taken: string[];
  reason_for_escalation: string;
  sensitive_data_collected: string;
}
export interface EscalationResponse {
  escalated: boolean;
  handoff_summary: HumanHandoffSummary;
}
