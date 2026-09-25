import { LINKS, type ResourceLink } from "@/lib/resourceLinks";

export interface JourneyStepContent {
  guidance: string;
  links: ResourceLink[];
}

// Keyed by RecoveryStep.category, as returned by POST /api/recovery.
export const JOURNEY_CONTENT: Record<string, JourneyStepContent> = {
  housing: {
    guidance:
      "If your home is unsafe or uninhabitable, these can help you find a safe place to stay tonight.",
    links: [LINKS.redCrossShelter, LINKS.twoOneOne],
  },
  food: {
    guidance:
      "Emergency food assistance is available through local relief organizations and government programs.",
    links: [LINKS.feedingAmerica, LINKS.dsnap],
  },
  documents: {
    guidance:
      "Losing identification can make it harder to access other help, so replacing it early is worthwhile.",
    links: [LINKS.usaVitalRecords, LINKS.ssa],
  },
  insurance: {
    guidance:
      "Starting your insurance claim early can help speed up your recovery timeline.",
    links: [LINKS.iii, LINKS.naic],
  },
  financial_assistance: {
    guidance: "Federal and local programs may be able to help with recovery costs.",
    links: [LINKS.disasterAssistance, LINKS.sba],
  },
  water: {
    guidance: "Safe drinking water comes first. Don't drink tap water until you know it's safe.",
    links: [LINKS.twoOneOne, LINKS.ready],
  },
  power: {
    guidance: "Power outages can be dangerous, especially for medical equipment and generators.",
    links: [LINKS.ready, LINKS.twoOneOne],
  },
  medical: {
    guidance: "If anyone is seriously hurt or ill, call 911 first.",
    links: [LINKS.twoOneOne, LINKS.ready],
  },
};

export const DEFAULT_JOURNEY_CONTENT: JourneyStepContent = {
  guidance: "Here's where to find official guidance for this step.",
  links: [LINKS.disasterAssistance, LINKS.twoOneOne],
};

export function getJourneyContent(category: string): JourneyStepContent {
  return JOURNEY_CONTENT[category] ?? DEFAULT_JOURNEY_CONTENT;
}
