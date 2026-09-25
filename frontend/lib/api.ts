import type {
  EscalationRequest,
  EscalationResponse,
  IntakeRequest,
  IntakeResponse,
  RecoveryRequest,
  RecoveryResponse,
  ResourceRequest,
  ResourceResponse,
  ScamCheckRequest,
  ScamCheckResponse,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function postJson<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Could not reach CrisisCompass. Check your connection and try again.",
      0
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Request to ${path} failed with status ${response.status}.`,
      response.status
    );
  }

  return response.json() as Promise<TResponse>;
}

export function submitIntake(
  request: IntakeRequest
): Promise<IntakeResponse> {
  return postJson<IntakeResponse>("/api/intake", request);
}

export function buildRecoveryPlan(
  request: RecoveryRequest
): Promise<RecoveryResponse> {
  return postJson<RecoveryResponse>("/api/recovery", request);
}

export function getResources(
  request: ResourceRequest
): Promise<ResourceResponse> {
  return postJson<ResourceResponse>("/api/resources", request);
}

export function checkForScam(
  request: ScamCheckRequest
): Promise<ScamCheckResponse> {
  return postJson<ScamCheckResponse>("/api/scam-check", request);
}

export function escalateToHuman(
  request: EscalationRequest
): Promise<EscalationResponse> {
  return postJson<EscalationResponse>("/api/escalate", request);
}
