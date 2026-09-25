export interface JourneyStepContent {
  guidance: string;
  checklist: string[];
}

// Keyed by RecoveryStep.category, as returned by POST /api/recovery.
// General disaster-recovery guidance (FEMA Individual Assistance,
// D-SNAP, SBA disaster loans, etc. are well-established public
// programs) — not tied to any specific survivor's eligibility.
export const JOURNEY_CONTENT: Record<string, JourneyStepContent> = {
  housing: {
    guidance:
      "If your home is unsafe or uninhabitable, prioritize finding a safe place to stay tonight before anything else.",
    checklist: [
      "Contact local emergency shelters or the Red Cross for immediate shelter",
      "Ask whether shelters can accommodate children and pets",
      "Avoid re-entering a home that may be structurally unsafe",
      "Keep any hotel or shelter receipts — they may be needed for reimbursement",
    ],
  },
  food: {
    guidance:
      "Emergency food assistance is available through local disaster relief organizations and government programs.",
    checklist: [
      "Look for mobile food distribution sites or shelters offering meals",
      "Ask about Disaster SNAP (D-SNAP) if your state has activated it",
      "Contact local food banks — many prioritize disaster survivors",
      "Keep food-related receipts in case they're needed for reimbursement",
    ],
  },
  documents: {
    guidance:
      "Losing identification can make it harder to access other help, so replacing it early is worthwhile.",
    checklist: [
      "Contact your state's DMV or vital records office to start replacing a driver's license or state ID",
      "Request a free replacement Social Security card if needed",
      "Ask disaster relief organizations about expedited ID replacement programs",
      "Write down any ID numbers you remember to speed up replacement",
    ],
  },
  insurance: {
    guidance:
      "Starting your insurance claim early can help speed up your recovery timeline.",
    checklist: [
      "Call your homeowner's or renter's insurance provider to report the damage",
      "Photograph or video damage before cleaning up, if it's safe to do so",
      "Keep receipts for any emergency repairs or temporary housing",
      "Ask your insurer about advance payments for immediate needs",
    ],
  },
  financial_assistance: {
    guidance:
      "Federal and local programs may be able to help with recovery costs.",
    checklist: [
      "Review eligibility for FEMA Individual Assistance",
      "Check with your state or local emergency management office for local grants",
      "Ask about low-interest disaster loans through the Small Business Administration",
      "Gather documentation of losses to support any applications",
    ],
  },
};

export const DEFAULT_JOURNEY_CONTENT: JourneyStepContent = {
  guidance: "Here's what to do next for this step.",
  checklist: ["Review official disaster assistance sources for guidance"],
};

export function getJourneyContent(category: string): JourneyStepContent {
  return JOURNEY_CONTENT[category] ?? DEFAULT_JOURNEY_CONTENT;
}
