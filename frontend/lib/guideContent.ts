import { LINKS, type ResourceLink } from "@/lib/resourceLinks";
import type { RecoveryPassport } from "@/lib/types";

export type GuideAnswers = Record<string, string>;

export interface GuideOption {
  value: string;
  label: string;
}

export interface GuideQuestion {
  id: string;
  prompt: string;
  options: GuideOption[];
  // Answer already known from the Recovery Passport -- skip asking.
  prefill?: (passport: RecoveryPassport) => string | undefined;
  showIf?: (context: {
    passport: RecoveryPassport;
    answers: GuideAnswers;
  }) => boolean;
}

export interface GuideResult {
  headline: string;
  tips: string[];
  links: ResourceLink[];
}

export interface GuideStep {
  intro: string;
  questions: GuideQuestion[];
  buildResult: (answers: GuideAnswers, passport: RecoveryPassport) => GuideResult;
}

const YES_NO: GuideOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const YES_NO_UNSURE: GuideOption[] = [
  ...YES_NO,
  { value: "unsure", label: "I'm not sure" },
];

function uniqueLinks(links: ResourceLink[]): ResourceLink[] {
  return links.filter(
    (link, index) => links.findIndex((l) => l.url === link.url) === index
  );
}

const housing: GuideStep = {
  intro: "A few questions about where you're staying so we can point you to the right help.",
  questions: [
    {
      id: "tonight",
      prompt: "Where are you staying tonight?",
      options: [
        { value: "nowhere", label: "I don't have a safe place yet" },
        { value: "damaged_home", label: "At home, but it's damaged" },
        { value: "family", label: "With friends or family" },
        { value: "hotel", label: "In a hotel or motel" },
      ],
    },
    {
      id: "pets",
      prompt: "Do you have pets with you?",
      options: YES_NO,
    },
    {
      id: "transport",
      prompt: "Can you get to a shelter on your own?",
      options: YES_NO,
      prefill: (passport) =>
        passport.barriers.includes("no_transportation") ? "no" : undefined,
    },
  ],
  buildResult: (answers, passport) => {
    const tips: string[] = [];
    const links: ResourceLink[] = [];
    let headline: string;

    switch (answers.tonight) {
      case "nowhere":
        headline = "Finding shelter tonight comes first.";
        tips.push("If you are in immediate danger, call 911.");
        tips.push(
          "Emergency shelters open after major disasters. The Red Cross and 211 can tell you which ones are open near you."
        );
        links.push(LINKS.redCrossShelter, LINKS.twoOneOne);
        break;
      case "damaged_home":
        headline = "Your home may not be safe to stay in.";
        tips.push(
          "Leave if you see structural damage, smell gas, or have standing flood water inside."
        );
        tips.push(
          "If it's safe, take photos of the damage before cleaning up. You'll need them for insurance and FEMA."
        );
        links.push(LINKS.redCrossShelter, LINKS.ready);
        break;
      case "hotel":
        headline = "You have a place for tonight. Keep your receipts.";
        tips.push(
          "Save every hotel receipt. FEMA assistance may help cover lodging costs if you're eligible."
        );
        tips.push(
          "Ask FEMA whether Transitional Sheltering Assistance is available for this disaster."
        );
        links.push(LINKS.disasterAssistance);
        break;
      default:
        headline = "You're safe for now. Next, plan for the weeks ahead.";
        tips.push(
          "Apply for FEMA assistance even if you're staying with family. It may help with temporary housing costs later."
        );
        links.push(LINKS.disasterAssistance);
    }

    if (answers.pets === "yes") {
      tips.push("Ask the shelter or 211 about pet-friendly options before you go.");
    }
    if (answers.transport === "no") {
      tips.push("Call 211. They can help you find transportation to a shelter.");
      links.push(LINKS.twoOneOne);
    }
    if ((passport.household.children ?? 0) > 0) {
      tips.push(
        "Tell shelter staff you have children so they can keep your family together."
      );
    }

    return { headline, tips, links: uniqueLinks(links) };
  },
};

const food: GuideStep = {
  intro: "Let's figure out what kind of food help fits your situation.",
  questions: [
    {
      id: "supply",
      prompt: "Do you have enough food for the next 24 hours?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "some", label: "Some, but not enough" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "snap",
      prompt: "Were you getting SNAP (food stamp) benefits before the disaster?",
      options: YES_NO_UNSURE,
    },
    {
      id: "cook",
      prompt: "Can you cook or keep food cold right now?",
      options: YES_NO,
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    const links: ResourceLink[] = [];
    let headline: string;

    if (answers.supply === "no") {
      headline = "Let's get you food today.";
    } else if (answers.supply === "some") {
      headline = "Let's make sure you don't run out.";
    } else {
      headline = "You're covered for now. Here's help for the days ahead.";
    }

    if (answers.supply !== "yes") {
      tips.push(
        "Shelters and disaster relief sites often serve free meals. 211 can tell you where."
      );
      links.push(LINKS.twoOneOne);
    }

    if (answers.snap === "yes") {
      tips.push(
        "If food you bought with SNAP was lost in the disaster, you may be able to get replacement benefits. Contact your state SNAP office soon, since there are deadlines."
      );
    } else {
      tips.push(
        "Your state may offer Disaster SNAP (D-SNAP) after a major disaster, even if you didn't qualify for SNAP before."
      );
    }
    links.push(LINKS.dsnap);

    if (answers.cook === "no") {
      tips.push(
        "Ask food banks and relief sites for ready-to-eat meals that don't need cooking or refrigeration."
      );
    }

    links.push(LINKS.feedingAmerica);

    return { headline, tips, links: uniqueLinks(links) };
  },
};

const DOCUMENT_LABELS: Record<string, string> = {
  license: "driver's license or state ID",
  ssn: "Social Security card",
  birth: "birth certificate",
};

const documents: GuideStep = {
  intro: "Replacing documents is easier when you start with the right one.",
  questions: [
    {
      id: "which",
      prompt: "Which lost document do you need most right now?",
      options: [
        { value: "license", label: "Driver's license or state ID" },
        { value: "ssn", label: "Social Security card" },
        { value: "birth", label: "Birth certificate" },
        { value: "unsure", label: "I'm not sure" },
      ],
    },
    {
      id: "other_id",
      prompt: "Do you still have any other ID, like a passport or work or school ID?",
      options: YES_NO,
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    const links: ResourceLink[] = [];
    const label = DOCUMENT_LABELS[answers.which];
    const headline = label
      ? `Here's how to start replacing your ${label}.`
      : "Start with the document you'll need first.";

    switch (answers.which) {
      case "license":
        tips.push(
          "Your state's DMV handles driver's licenses and state IDs. Some states lower or waive fees after a declared disaster, so ask."
        );
        links.push(LINKS.stateDmv);
        break;
      case "ssn":
        tips.push("Replacement Social Security cards are free.");
        links.push(LINKS.ssa);
        break;
      case "birth":
        tips.push(
          "Birth certificates come from the vital records office in the state where you were born."
        );
        links.push(LINKS.birthCertificate);
        break;
      default:
        tips.push(
          "You usually need a photo ID to replace other documents, so start with your driver's license or state ID."
        );
        links.push(LINKS.stateDmv, LINKS.usaDocuments);
    }

    if (answers.other_id === "yes") {
      tips.push("Bring the ID you still have. It will make replacing the others faster.");
    } else {
      tips.push(
        "Replacing ID is harder without another ID. Tell relief workers and FEMA your ID was lost. They can explain what other proof they accept."
      );
    }

    return { headline, tips, links: uniqueLinks(links) };
  },
};

const insurance: GuideStep = {
  intro: "Your insurance situation changes which help you'll need.",
  questions: [
    {
      id: "type",
      prompt: "What insurance covers your home or belongings?",
      options: [
        { value: "homeowners", label: "Homeowner's insurance" },
        { value: "renters", label: "Renter's insurance" },
        { value: "none", label: "No insurance" },
        { value: "unsure", label: "I'm not sure" },
      ],
    },
    {
      id: "filed",
      prompt: "Have you started an insurance claim yet?",
      options: YES_NO,
      showIf: ({ answers }) =>
        answers.type === "homeowners" || answers.type === "renters",
    },
    {
      id: "flood",
      prompt: "Do you have a separate flood insurance policy?",
      options: YES_NO_UNSURE,
      showIf: ({ passport, answers }) =>
        passport.disaster === "flood" && answers.type !== "none",
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    const links: ResourceLink[] = [];
    let headline: string;

    if (answers.type === "none") {
      headline = "Without insurance, federal assistance matters even more.";
      tips.push(
        "FEMA assistance may help with some costs insurance would normally cover. Apply even if you're unsure you qualify."
      );
      links.push(LINKS.disasterAssistance);
    } else if (answers.type === "unsure") {
      headline = "First, find out what coverage you have.";
      tips.push(
        "Check your lease or mortgage paperwork, or ask your landlord or lender. They often know what coverage exists."
      );
      links.push(LINKS.iii);
    } else if (answers.filed === "yes") {
      headline = "Your claim is started. Keep good records.";
      tips.push("Write down every call with your insurer: the date, who you spoke to, and what they said.");
      tips.push("If you disagree with a decision, your state insurance department can help.");
      links.push(LINKS.naic, LINKS.iii);
    } else {
      headline = "Call your insurer as soon as you can.";
      tips.push("If it's safe, photograph the damage before cleaning up.");
      tips.push(
        "Ask about Additional Living Expenses (ALE) coverage. It may pay for somewhere to stay while your home is unlivable."
      );
      links.push(LINKS.iii);
    }

    if (answers.type === "renters") {
      tips.push(
        "Renter's insurance usually covers your belongings, not the building. The building is your landlord's policy."
      );
    }

    if (answers.flood === "yes") {
      tips.push("File your flood claim separately from any homeowner's or renter's claim.");
      links.push(LINKS.floodSmart);
    } else if (answers.flood === "no" || answers.flood === "unsure") {
      tips.push(
        "Standard homeowner's and renter's policies usually don't cover flood damage. FEMA assistance may help with flood losses."
      );
      links.push(LINKS.disasterAssistance, LINKS.floodSmart);
    }

    return { headline, tips, links: uniqueLinks(links) };
  },
};

const financialAssistance: GuideStep = {
  intro: "A few questions to find the financial help that fits you.",
  questions: [
    {
      id: "fema",
      prompt: "Have you applied for FEMA assistance for this disaster?",
      options: YES_NO_UNSURE,
    },
    {
      id: "home",
      prompt: "Do you rent or own your home?",
      options: [
        { value: "rent", label: "I rent" },
        { value: "own", label: "I own" },
      ],
    },
    {
      id: "income",
      prompt: "Did you lose work or income because of the disaster?",
      options: YES_NO,
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    const links: ResourceLink[] = [LINKS.disasterAssistance];
    let headline: string;

    if (answers.fema === "yes") {
      headline = "You've applied. Here's what else may help.";
      tips.push("Keep your FEMA application number handy and check your status online.");
    } else {
      headline = "Apply for FEMA assistance first.";
      tips.push(
        "Apply at DisasterAssistance.gov. You'll be asked about your household, the damage, and your insurance."
      );
    }

    if (answers.home === "own") {
      tips.push(
        "SBA disaster loans can help homeowners repair or rebuild. They're low-interest loans, and not just for businesses."
      );
    } else {
      tips.push("SBA disaster loans can also help renters replace belongings that were lost.");
    }
    links.push(LINKS.sba);

    if (answers.income === "yes") {
      tips.push(
        "Ask your state unemployment office about Disaster Unemployment Assistance (DUA). It can cover people who don't normally qualify for unemployment."
      );
    }

    return { headline, tips, links: uniqueLinks(links) };
  },
};

const water: GuideStep = {
  intro: "Let's make sure you have safe water to drink.",
  questions: [
    {
      id: "supply",
      prompt: "Do you have safe water to drink?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "some", label: "Some, but not much" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "boil",
      prompt: "Has your area been told to boil tap water?",
      options: YES_NO_UNSURE,
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    const headline =
      answers.supply === "yes"
        ? "You have water for now. Here's how to keep it safe."
        : "Let's get you safe drinking water.";

    if (answers.supply !== "yes") {
      tips.push("Relief sites often hand out bottled water. 211 can tell you where.");
    }
    if (answers.boil === "yes") {
      tips.push(
        "Bring tap water to a rolling boil for at least one minute before drinking or cooking, or use bottled water."
      );
    } else if (answers.boil === "unsure") {
      tips.push(
        "Check local news or your city's website for boil-water notices before drinking tap water."
      );
    }

    return { headline, tips, links: [LINKS.twoOneOne, LINKS.ready] };
  },
};

const power: GuideStep = {
  intro: "Power outages bring their own risks. Let's check yours.",
  questions: [
    {
      id: "medical_equipment",
      prompt: "Does anyone in your home rely on medical equipment that needs electricity?",
      options: YES_NO,
    },
    {
      id: "generator",
      prompt: "Are you using a generator?",
      options: YES_NO,
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    let headline = "Stay safe while the power is out.";

    if (answers.medical_equipment === "yes") {
      headline = "Medical equipment needs a backup plan now.";
      tips.push("If someone's life depends on the equipment and it has no power, call 911.");
      tips.push(
        "Tell your power company. Some keep a list of customers who rely on medical equipment."
      );
    }
    if (answers.generator === "yes") {
      tips.push(
        "Never run a generator indoors or in a garage. Carbon monoxide can kill without warning."
      );
    }
    tips.push("Keep refrigerator and freezer doors closed to keep food cold longer.");

    return { headline, tips, links: [LINKS.ready, LINKS.twoOneOne] };
  },
};

const medical: GuideStep = {
  intro: "Health comes first. Let's check what you need.",
  questions: [
    {
      id: "emergency",
      prompt: "Is anyone having a medical emergency right now?",
      options: YES_NO,
    },
    {
      id: "refill",
      prompt: "Do you need a prescription refill?",
      options: YES_NO,
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    const headline =
      answers.emergency === "yes"
        ? "Call 911 now."
        : "Here's how to get the medical help you need.";

    if (answers.emergency === "yes") {
      tips.push("If someone is seriously hurt or ill, call 911 before doing anything else.");
    }
    if (answers.refill === "yes") {
      tips.push(
        "Many pharmacies can give emergency refills during a declared disaster. Ask any pharmacist, even if it isn't your usual pharmacy."
      );
    }

    return { headline, tips, links: [LINKS.twoOneOne, LINKS.ready] };
  },
};

const general: GuideStep = {
  intro: "Tell us what would help most right now.",
  questions: [
    {
      id: "priority",
      prompt: "What would help most right now?",
      options: [
        { value: "shelter", label: "A safe place to stay" },
        { value: "money", label: "Money for recovery" },
        { value: "person", label: "Talking to a person" },
      ],
    },
  ],
  buildResult: (answers) => {
    const tips: string[] = [];
    if (answers.priority === "person") {
      tips.push("211 connects you with a real person who knows local services.");
    } else if (answers.priority === "shelter") {
      tips.push("211 and the Red Cross can tell you which shelters are open near you.");
    } else {
      tips.push("Start by applying for FEMA assistance at DisasterAssistance.gov.");
    }
    return {
      headline: "Here's where to start.",
      tips,
      links: [LINKS.twoOneOne, LINKS.disasterAssistance],
    };
  },
};

// Keyed by RecoveryStep.category, as returned by POST /api/recovery.
const GUIDE_STEPS: Record<string, GuideStep> = {
  housing,
  food,
  documents,
  insurance,
  financial_assistance: financialAssistance,
  water,
  power,
  medical,
};

export function getGuideStep(category: string): GuideStep {
  return GUIDE_STEPS[category] ?? general;
}

export function initialAnswers(
  step: GuideStep,
  passport: RecoveryPassport
): GuideAnswers {
  const answers: GuideAnswers = {};
  for (const question of step.questions) {
    const value = question.prefill?.(passport);
    if (value !== undefined) answers[question.id] = value;
  }
  return answers;
}

export function askableQuestions(
  step: GuideStep,
  passport: RecoveryPassport,
  answers: GuideAnswers
): GuideQuestion[] {
  return step.questions.filter(
    (question) =>
      question.prefill?.(passport) === undefined &&
      (question.showIf?.({ passport, answers }) ?? true)
  );
}
