export interface JourneyLink {
  title: string;
  agency: string;
  description: string;
  url: string;
}

export interface JourneyStepContent {
  guidance: string;
  links: JourneyLink[];
}

// Keyed by RecoveryStep.category, as returned by POST /api/recovery.
// These are placeholder links to well-known agencies for demo
// purposes — not verified live and not personalized to any survivor's
// specific eligibility. Before this ships to real users, replace with
// grounded, verified sources (see Person 2 / resource-engine's
// Azure AI Search + source grounding work).
export const JOURNEY_CONTENT: Record<string, JourneyStepContent> = {
  housing: {
    guidance:
      "If your home is unsafe or uninhabitable, these can help you find a safe place to stay tonight.",
    links: [
      {
        title: "Find an Open Shelter",
        agency: "American Red Cross",
        description:
          "Locate emergency shelters that may accept your household, including pets.",
        url: "https://www.redcross.org/get-help",
      },
      {
        title: "Emergency Housing Guidance",
        agency: "Ready.gov (FEMA)",
        description:
          "General guidance on emergency and temporary housing after a disaster.",
        url: "https://www.ready.gov/",
      },
    ],
  },
  food: {
    guidance:
      "Emergency food assistance is available through local relief organizations and government programs.",
    links: [
      {
        title: "Find a Local Food Bank",
        agency: "Feeding America",
        description: "Search for food banks and pantries near you.",
        url: "https://www.feedingamerica.org/find-your-local-foodbank",
      },
      {
        title: "Disaster Food Assistance (D-SNAP)",
        agency: "USDA Food and Nutrition Service",
        description:
          "Check whether Disaster SNAP has been activated in your state.",
        url: "https://www.fns.usda.gov/disaster",
      },
    ],
  },
  documents: {
    guidance:
      "Losing identification can make it harder to access other help, so replacing it early is worthwhile.",
    links: [
      {
        title: "Replace Vital Records",
        agency: "USA.gov",
        description:
          "Steps to replace a lost driver's license, birth certificate, or other ID.",
        url: "https://www.usa.gov/replace-vital-records",
      },
      {
        title: "Replace a Social Security Card",
        agency: "Social Security Administration",
        description: "Request a free replacement Social Security card.",
        url: "https://www.ssa.gov/",
      },
    ],
  },
  insurance: {
    guidance:
      "Starting your insurance claim early can help speed up your recovery timeline.",
    links: [
      {
        title: "Filing a Disaster Insurance Claim",
        agency: "Insurance Information Institute",
        description:
          "General guidance on documenting damage and filing a claim.",
        url: "https://www.iii.org/",
      },
      {
        title: "State Insurance Regulator Help",
        agency: "National Association of Insurance Commissioners",
        description:
          "Find your state's insurance regulator if you have a dispute with your insurer.",
        url: "https://www.naic.org/",
      },
    ],
  },
  financial_assistance: {
    guidance: "Federal and local programs may be able to help with recovery costs.",
    links: [
      {
        title: "Apply for Disaster Assistance",
        agency: "DisasterAssistance.gov",
        description:
          "Check eligibility and apply for FEMA Individual Assistance and other federal aid.",
        url: "https://www.disasterassistance.gov/",
      },
      {
        title: "Disaster Loans",
        agency: "U.S. Small Business Administration",
        description:
          "Low-interest federal disaster loans for homeowners, renters, and businesses.",
        url: "https://www.sba.gov/funding-programs/disaster-assistance",
      },
    ],
  },
};

export const DEFAULT_JOURNEY_CONTENT: JourneyStepContent = {
  guidance: "Here's where to find official guidance for this step.",
  links: [
    {
      title: "Disaster Assistance",
      agency: "DisasterAssistance.gov",
      description: "Browse official federal disaster assistance programs.",
      url: "https://www.disasterassistance.gov/",
    },
  ],
};

export function getJourneyContent(category: string): JourneyStepContent {
  return JOURNEY_CONTENT[category] ?? DEFAULT_JOURNEY_CONTENT;
}
