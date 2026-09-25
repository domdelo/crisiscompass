export interface ResourceLink {
  title: string;
  agency: string;
  description: string;
  url: string;
}

// Checked on 2026-09-25: all load except ssa.gov and naic.org, which block
// automated requests (official agency homepages). General guidance only --
// not personalized to eligibility. Prefer grounded sources from the
// resource engine as they become available.
export const LINKS = {
  redCrossShelter: {
    title: "Find an Open Shelter",
    agency: "American Red Cross",
    description:
      "Locate emergency shelters near you, including options for families.",
    url: "https://www.redcross.org/get-help.html",
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
    agency: "USDA Food and Nutrition Administration",
    description:
      "Check whether Disaster SNAP or replacement SNAP benefits are available in your state.",
    url: "https://www.fna.usda.gov/disaster",
  },
  stateDmv: {
    title: "Find Your State's DMV",
    agency: "USA.gov",
    description:
      "Links to your state's motor vehicle office for replacing a driver's license or state ID.",
    url: "https://www.usa.gov/state-motor-vehicle-services",
  },
  usaDocuments: {
    title: "Replace Vital Records and IDs",
    agency: "USA.gov",
    description:
      "How to get copies of birth certificates, Social Security cards, and other documents.",
    url: "https://www.usa.gov/request-documents",
  },
  birthCertificate: {
    title: "Replace a Birth Certificate",
    agency: "USA.gov",
    description:
      "How to get a certified copy of a U.S. birth certificate from your state.",
    url: "https://www.usa.gov/birth-certificate",
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
    url: "https://www.sba.gov/disaster/",
  },
} satisfies Record<string, ResourceLink>;
