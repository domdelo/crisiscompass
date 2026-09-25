export interface ResourceLink {
  title: string;
  agency: string;
  description: string;
  url: string;
}

// Placeholder links to well-known agencies for the demo -- not verified
// live and not personalized to anyone's eligibility. Replace with grounded,
// verified sources from the resource engine before real survivors use this.
export const LINKS = {
  redCrossShelter: {
    title: "Find an Open Shelter",
    agency: "American Red Cross",
    description:
      "Locate emergency shelters near you, including options for families.",
    url: "https://www.redcross.org/get-help",
  },
  ready: {
    title: "Disaster Safety Guidance",
    agency: "Ready.gov (FEMA)",
    description:
      "Official guidance on staying safe during and after a disaster.",
    url: "https://www.ready.gov/",
  },
  twoOneOne: {
    title: "Call or Text 211",
    agency: "211",
    description:
      "Free, confidential help finding local shelter, food, transportation, and more.",
    url: "https://www.211.org/",
  },
  disasterAssistance: {
    title: "Apply for Disaster Assistance",
    agency: "DisasterAssistance.gov",
    description:
      "Check eligibility and apply for FEMA assistance and other federal aid.",
    url: "https://www.disasterassistance.gov/",
  },
  feedingAmerica: {
    title: "Find a Local Food Bank",
    agency: "Feeding America",
    description: "Search for food banks and pantries near you.",
    url: "https://www.feedingamerica.org/find-your-local-foodbank",
  },
  dsnap: {
    title: "Disaster Food Assistance (D-SNAP)",
    agency: "USDA Food and Nutrition Service",
    description:
      "Check whether Disaster SNAP or replacement SNAP benefits are available in your state.",
    url: "https://www.fns.usda.gov/disaster",
  },
  usaGov: {
    title: "Replace Lost Documents",
    agency: "USA.gov",
    description:
      "Official guides to replacing IDs and other documents, including your state's DMV.",
    url: "https://www.usa.gov/",
  },
  usaVitalRecords: {
    title: "Replace Vital Records",
    agency: "USA.gov",
    description:
      "How to replace a birth certificate or other vital record from your state.",
    url: "https://www.usa.gov/replace-vital-records",
  },
  ssa: {
    title: "Replace a Social Security Card",
    agency: "Social Security Administration",
    description: "Request a free replacement Social Security card.",
    url: "https://www.ssa.gov/",
  },
  iii: {
    title: "Filing a Disaster Insurance Claim",
    agency: "Insurance Information Institute",
    description:
      "General guidance on documenting damage and filing a claim.",
    url: "https://www.iii.org/",
  },
  naic: {
    title: "State Insurance Regulator Help",
    agency: "National Association of Insurance Commissioners",
    description:
      "Find your state's insurance department if you disagree with your insurer.",
    url: "https://www.naic.org/",
  },
  floodSmart: {
    title: "Flood Insurance Claims",
    agency: "FloodSmart (National Flood Insurance Program)",
    description:
      "How to file a flood insurance claim and what flood policies cover.",
    url: "https://www.floodsmart.gov/",
  },
  sba: {
    title: "Disaster Loans",
    agency: "U.S. Small Business Administration",
    description:
      "Low-interest federal disaster loans for homeowners, renters, and businesses.",
    url: "https://www.sba.gov/funding-programs/disaster-assistance",
  },
} satisfies Record<string, ResourceLink>;
