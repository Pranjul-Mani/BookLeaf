/**
 * BookLeaf Knowledge Base & Policy Engine
 * Extracted directly from official BookLeaf operational specifications.
 */

export const BOOKLEAF_KNOWLEDGE_BASE = {
  company: {
    name: "BookLeaf Publishing",
    description: "Self-publishing company operating in India and the US with 22,000+ titles and 1,200+ monthly releases.",
    facilities: "In-house printing facility and warehouse located in Delhi. Print partners include Repro India and Epitome Books.",
    packages: [
      { name: "Standard Free", description: "No upfront cost, cover design, ISBN, printing on demand, distribution, 80/20 royalty." },
      { name: "Bestseller Breakthrough", description: "Premium paid package with marketing, priority production, and distribution add-ons." }
    ],
    productionStages: [
      "Manuscript Received",
      "Editing (if opted)",
      "Cover Design",
      "Typesetting",
      "Proofreading",
      "ISBN Assignment",
      "Printing",
      "Distribution Setup",
      "Published & Live"
    ]
  },

  policies: {
    royalty: {
      split: "80/20 (80% net profit to author, 20% to BookLeaf)",
      netProfitFormula: "MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges",
      payoutFrequency: "Quarterly, paid within 45 days after the quarter ends",
      payoutThreshold: "₹1,000 minimum threshold. Balances under ₹1,000 roll over automatically to the subsequent quarter.",
      payoutMethod: "Direct bank transfer to the account verified in author dashboard",
      breakdownAvailable: "Line-by-line breakdown by platform is viewable in author dashboard"
    },
    isbn: {
      assignment: "Every book receives a unique BookLeaf-assigned ISBN under BookLeaf's publisher imprint.",
      customImprint: "Authors wishing to publish under their own imprint must acquire their own ISBN independently.",
      errorHandling: "ISBN mismatch or wrong book linked is treated as High/Critical priority and escalated immediately to the production team with a 48-hour resolution timeline."
    },
    printingAndQuality: {
      turnaround: "Standard print turnaround is 5–7 business days from order confirmation.",
      qualityDefects: "For misprints, binding defects, or color inconsistencies, BookLeaf arranges a 100% free reprint once verified.",
      verificationRequirement: "Author must share clear photos/evidence of the defective copies.",
      reprintTimeline: "Free reprints ship within 5–7 business days post-verification."
    },
    distribution: {
      platforms: ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"],
      listingTimeline: "New listings typically go live within 7–10 business days after publication finishes.",
      stockSyncIssue: "When a live book shows as 'Currently Unavailable', it is typically a stock synchronization delay with Amazon/Flipkart. Ops triggers a re-sync within 24–48 hours."
    },
    productionUpdates: {
      commonDelayPoints: "Cover Design (awaiting author feedback/approval) and Proofreading (author revision iterations).",
      turnaroundNotice: "Check real-time production stage. Maintain transparent, collaborative tone without deflecting responsibility."
    },
    general: {
      metadataUpdates: "Title descriptions, author bios, and pricing updates can be submitted via dashboard or support, taking 3–5 business days to reflect on retail channels."
    }
  },

  toneGuidelines: [
    "Empathetic & Professional: Treat authors as creative partners, not support tickets.",
    "Acknowledge & Validate: Validate emotional concerns before presenting logistics or policies.",
    "Specifics over Generalities: Include precise figures (₹, copies sold, dates, timelines) whenever available.",
    "Accountability: Own BookLeaf mistakes directly (e.g. overdue payouts, sync errors) with zero corporate evasion.",
    "Timelines: Offer explicit escalation windows (e.g., 'escalated to production with a 48-hour resolution window').",
    "Clear Call-to-Action: Conclude every communication with a precise next step for the author or internal ops team."
  ],

  categories: [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry"
  ]
};

/**
 * Smart context selector to minimize token overhead while maximizing accuracy.
 * Only retrieves relevant policy slices based on detected category.
 */
export function getContextForCategory(category) {
  const kb = BOOKLEAF_KNOWLEDGE_BASE;
  let relevantPolicy = "";

  switch (category) {
    case "Royalty & Payments":
      relevantPolicy = `ROYALTY POLICY:
- Split: ${kb.policies.royalty.split}
- Net Profit: ${kb.policies.royalty.netProfitFormula}
- Schedule: ${kb.policies.royalty.payoutFrequency}
- Minimum Threshold: ${kb.policies.royalty.payoutThreshold}
- Payout Method: ${kb.policies.royalty.payoutMethod}`;
      break;

    case "ISBN & Metadata Issues":
      relevantPolicy = `ISBN & METADATA POLICY:
- ${kb.policies.isbn.assignment}
- Custom Imprint: ${kb.policies.isbn.customImprint}
- Priority & Escalation: ${kb.policies.isbn.errorHandling}
- Metadata updates reflect in 3-5 business days.`;
      break;

    case "Printing & Quality":
      relevantPolicy = `PRINTING & QUALITY POLICY:
- Print facility: ${kb.company.facilities}
- Turnaround: ${kb.policies.printingAndQuality.turnaround}
- Defects (misprints, binding, colors): ${kb.policies.printingAndQuality.qualityDefects}
- Verification: ${kb.policies.printingAndQuality.verificationRequirement}
- Reprint timeline: ${kb.policies.printingAndQuality.reprintTimeline}`;
      break;

    case "Distribution & Availability":
      relevantPolicy = `DISTRIBUTION & AVAILABILITY POLICY:
- Retail channels: ${kb.policies.distribution.platforms.join(", ")}
- Live Timeline: ${kb.policies.distribution.listingTimeline}
- Unavailable/Stock sync: ${kb.policies.distribution.stockSyncIssue}`;
      break;

    case "Book Status & Production Updates":
      relevantPolicy = `PRODUCTION WORKFLOW:
- Stages: ${kb.company.productionStages.join(" -> ")}
- Delay factors: ${kb.policies.productionUpdates.commonDelayPoints}
- Communication: Transparent, collaborative update.`;
      break;

    default:
      relevantPolicy = `GENERAL POLICY & PACKAGES:
- Packages: Standard Free vs Bestseller Breakthrough
- Metadata & Bio updates: 3-5 business days.`;
  }

  return relevantPolicy;
}
