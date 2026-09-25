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
    throw new ApiError(await errorMessage(response), response.status);
  }

  return response.json() as Promise<TResponse>;
}

// FastAPI puts a plain-language string in `detail` for deliberate errors
// (e.g. 503 "The intake AI service is temporarily unavailable."), but a
// list of field errors for 422s -- only the string form is survivor-safe.
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // Non-JSON error body: fall through to a generic message.
  }

  if (response.status === 422) {
    return "Something in your request didn't look right. Please check it and try again.";
  }
  return "CrisisCompass is having trouble right now. Please try again in a moment.";
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
