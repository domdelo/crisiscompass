import { useMemo, useSyncExternalStore } from "react";
import type { GuideAnswers } from "@/lib/guideContent";
import type {
  EscalationResponse,
  RecoveryState,
  ResourceRecommendation,
  ScamCheckResponse,
} from "@/lib/types";

// Kept in sessionStorage (cleared when the tab closes) so progress survives
// navigation and refreshes without lingering on a shared or borrowed device.
const STORAGE_KEY = "crisiscompass:session";

export interface GuideProgress {
  answers: GuideAnswers;
  position: number;
}

export interface StoredSession {
  recovery: RecoveryState;
  resources: ResourceRecommendation[];
  // Grounded resources from POST /api/resources, searched per journey step.
  stepResources?: Record<string, ResourceRecommendation[]>;
  guideProgress?: Record<string, GuideProgress>;
  completedSteps?: string[];
  escalation?: EscalationResponse;
  scamCheck?: { message: string; result: ScamCheckResponse };
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (e.g. private mode): the plan just won't persist.
  }
  notify();
}

export function updateSession(
  update: (session: StoredSession) => StoredSession
) {
  const raw = readRaw();
  if (!raw) return;
  try {
    saveSession(update(JSON.parse(raw) as StoredSession));
  } catch {
    // Corrupt stored value: leave it; the next full save replaces it.
  }
}

export function setStepComplete(category: string, complete: boolean) {
  updateSession((session) => {
    const others = (session.completedSteps ?? []).filter(
      (step) => step !== category
    );
    return {
      ...session,
      completedSteps: complete ? [...others, category] : others,
    };
  });
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  notify();
}

export function useStoredSession(): StoredSession | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }, [raw]);
}

const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
