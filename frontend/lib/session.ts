import { useMemo, useSyncExternalStore } from "react";
import type { RecoveryState, ResourceRecommendation } from "@/lib/types";

// Kept in sessionStorage (cleared when the tab closes) so the plan
// survives navigating to /guide and back without being persisted long-term.
const STORAGE_KEY = "crisiscompass:session";

export interface StoredSession {
  recovery: RecoveryState;
  resources: ResourceRecommendation[];
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
