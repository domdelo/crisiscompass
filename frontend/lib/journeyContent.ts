import { LINKS, type ResourceLink } from "@/lib/resourceLinks";
import type { RecoveryStep, ResourceRecommendation } from "@/lib/types";

export interface JourneyGroup {
  category: string;
  actions: string[];
  done: boolean;
}

// The recovery engine can emit several steps with the same category (e.g.
// three "documents" steps); the journey and guide show one entry per category.
export function groupStepsByCategory(
  steps: RecoveryStep[],
  completedSteps: string[]
): JourneyGroup[] {
  const groups: JourneyGroup[] = [];
  for (const step of steps) {
    let group = groups.find((g) => g.category === step.category);
    if (!group) {
      group = { category: step.category, actions: [], done: true };
      groups.push(group);
    }
    group.actions.push(step.action);
    if (step.status !== "done") group.done = false;
  }
  for (const group of groups) {
    if (completedSteps.includes(group.category)) group.done = true;
  }
  return groups;
}

export interface JourneyStepContent {
  guidance: string;
  links: ResourceLink[];
}

// Keyed by RecoveryStep.category, as produced by the backend's
// recovery_engine. `links` are fallbacks for when grounded search has
// nothing for the step.
export const JOURNEY_CONTENT: Record<string, JourneyStepContent> = {
  medical: {
    guidance: "If anyone is seriously hurt or ill, call 911 first.",
    links: [LINKS.twoOneOne, LINKS.ready],
  },
  housing: {
    guidance:
      "If your home is unsafe or uninhabitable, these can help you find a safe place to stay tonight.",
    links: [LINKS.redCrossShelter, LINKS.femaSheltering],
  },
  water: {
    guidance:
      "Safe drinking water comes first. Don't drink tap water until you know it's safe.",
    links: [LINKS.twoOneOne, LINKS.ready],
  },
  food: {
    guidance:
      "Emergency food assistance is available through local relief organizations and government programs.",
    links: [LINKS.dsnap, LINKS.feedingAmerica],
  },
  transportation: {
    guidance:
      "If you can't get to shelter, food, or appointments, local services may be able to help with rides.",
    links: [LINKS.twoOneOne],
  },
  documents: {
    guidance:
      "Losing identification can make it harder to access other help, so replacing it early is worthwhile.",
    links: [LINKS.usaDocuments, LINKS.readyDocuments],
  },
  utilities: {
    guidance:
      "Power and utility outages can be dangerous, especially for medical equipment and generators.",
    links: [LINKS.ready, LINKS.twoOneOne],
  },
  financial_assistance: {
    guidance: "Federal and local programs may be able to help with recovery costs.",
    links: [LINKS.disasterAssistance, LINKS.femaApplication, LINKS.sba],
  },
  insurance: {
    guidance:
      "Starting your insurance claim early can help speed up your recovery timeline.",
    links: [LINKS.iii, LINKS.naic],
  },
};

export const DEFAULT_JOURNEY_CONTENT: JourneyStepContent = {
  guidance: "Here's where to find official guidance for this step.",
  links: [LINKS.disasterAssistance, LINKS.twoOneOne],
};

export function getJourneyContent(category: string): JourneyStepContent {
  return JOURNEY_CONTENT[category] ?? DEFAULT_JOURNEY_CONTENT;
}

// Needs to send to POST /api/resources when searching for one step's
// resources. Includes the vocabulary used in data/government_sources
// (e.g. "documentation", "disaster_assistance") so search can match it.
export const CATEGORY_NEEDS: Record<string, string[]> = {
  medical: ["medical_care"],
  housing: ["emergency_housing", "temporary_housing"],
  water: ["water"],
  food: ["food"],
  transportation: ["transportation"],
  documents: ["identification_replacement", "documentation"],
  utilities: ["utilities"],
  financial_assistance: ["financial_assistance", "disaster_assistance"],
  insurance: ["insurance_claim", "damage_documentation"],
};

export function toResourceLink(resource: ResourceRecommendation): ResourceLink {
  return {
    title: resource.name,
    agency: resource.agency,
    description: resource.next_action,
    url: resource.source_url,
  };
}
