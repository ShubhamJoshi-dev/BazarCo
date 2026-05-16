/** Full legal text shown to sellers only during signup (before account creation). */

export type AgreementBlock = {
  heading: string;
  body?: string[];
  bullets?: string[];
};

export type AgreementDocument = {
  title: string;
  intro?: string;
  blocks: AgreementBlock[];
};

export const SELLER_ONBOARDING_DOCUMENTS: AgreementDocument[] = [
  {
    title: "SELLER AGREEMENT",
    intro:
      'This Seller Agreement ("Agreement") is entered between BazarCo and the registered seller ("Seller").',
    blocks: [
      {
        heading: "1. Registration & Account",
        body: [
          "Seller must provide accurate identity, contact, and bank details. BazarCo may require KYC verification as per Nepal regulations.",
        ],
      },
      {
        heading: "2. Product Listings",
        body: ["Seller agrees that:"],
        bullets: [
          "All products are genuine and legally allowed",
          "Listings (images/videos/descriptions) are accurate",
          "No counterfeit, illegal, or restricted goods will be listed",
        ],
      },
      {
        heading: "3. Product Video Content",
        body: ["Seller may upload product videos. Seller guarantees:"],
        bullets: [
          "Content is owned or licensed",
          "Content is not misleading, offensive, or infringing",
          "BazarCo reserves the right to remove content.",
        ],
      },
      {
        heading: "4. Pricing & Negotiation",
        bullets: [
          "Seller sets base price",
          "Buyer may submit an offer",
          "Seller may Accept / Reject / Counter",
          "Once accepted, the agreed price becomes binding",
        ],
      },
      {
        heading: "5. Orders & Delivery",
        body: ["Seller must:"],
        bullets: [
          "Process orders within defined time",
          "Ensure proper packaging and shipping",
        ],
      },
      {
        heading: "6. Commission & Fees",
        body: [
          "BazarCo charges a commission of [X%] per sale.",
          "Additional payment gateway or service fees may apply.",
        ],
      },
      {
        heading: "7. Payment Settlement",
        body: ["Payments will be released to Seller:"],
        bullets: [
          "After successful delivery",
          "Within [X days]",
          "BazarCo may hold funds in case of disputes.",
        ],
      },
      {
        heading: "8. Returns & Refunds",
        body: [
          "Seller must clearly define return policy.",
          "Seller is responsible for defective/damaged products.",
        ],
      },
      {
        heading: "9. Seller Obligations",
        body: ["Seller shall:"],
        bullets: [
          "Maintain product quality",
          "Respond to customer queries",
          "Follow all applicable Nepal laws",
        ],
      },
      {
        heading: "10. Prohibited Activities",
        body: ["Seller shall not:"],
        bullets: [
          "Sell counterfeit or illegal items",
          "Manipulate offers/pricing",
          "Abuse negotiation system",
          "Commit fraud",
        ],
      },
      {
        heading: "11. Suspension & Termination",
        body: ["BazarCo may suspend Seller for:"],
        bullets: [
          "Policy violations",
          "Customer complaints",
          "Fraudulent activity",
        ],
      },
      {
        heading: "12. Liability",
        body: [
          "BazarCo acts as intermediary only.",
          "Seller is fully responsible for product quality and fulfillment.",
        ],
      },
      {
        heading: "13. Intellectual Property",
        body: ["Seller grants BazarCo a non-exclusive right to display product content."],
      },
      {
        heading: "14. Dispute Resolution",
        bullets: [
          "BazarCo may mediate disputes.",
          "Final decision may be binding.",
        ],
      },
      {
        heading: "15. Governing Law",
        body: ["This Agreement is governed by the laws of Nepal."],
      },
    ],
  },
  {
    title: "BUYER TERMS & CONDITIONS",
    blocks: [
      {
        heading: "1. Account",
        body: ["Buyer must provide accurate information."],
      },
      {
        heading: "2. Orders & Negotiation",
        bullets: [
          "Buyer may place orders at listed price OR negotiate",
          "Once seller accepts an offer, the order is binding",
        ],
      },
      {
        heading: "3. Payments",
        body: ["Payments must be made via BazarCo-approved methods."],
      },
      {
        heading: "4. Delivery",
        body: ["Delivery timelines depend on the seller."],
      },
      {
        heading: "5. Returns & Refunds",
        bullets: [
          "Governed by seller's policy",
          "BazarCo may assist in disputes",
        ],
      },
      {
        heading: "6. Buyer Responsibilities",
        body: ["Buyer agrees not to:"],
        bullets: [
          "Place fake offers/orders",
          "Abuse negotiation system",
        ],
      },
      {
        heading: "7. Limitation of Liability",
        body: ["BazarCo is not responsible for:"],
        bullets: ["Product defects", "Delivery delays"],
      },
    ],
  },
  {
    title: "PRIVACY POLICY",
    blocks: [
      {
        heading: "1. Data Collection",
        body: ["We collect:"],
        bullets: ["Name, phone, email", "Payment details", "Usage data"],
      },
      {
        heading: "2. Use of Data",
        body: ["Data is used for:"],
        bullets: ["Order processing", "BazarCo's improvement", "Customer support"],
      },
      {
        heading: "3. Data Sharing",
        body: ["We may share data with:"],
        bullets: [
          "Payment gateways",
          "Delivery partners",
          "Legal authorities (if required)",
        ],
      },
      {
        heading: "4. Data Security",
        body: ["We implement reasonable security measures."],
      },
      {
        heading: "5. User Rights",
        body: ["Users may request:"],
        bullets: ["Data access", "Correction or deletion"],
      },
      {
        heading: "6. Cookies",
        body: ["BazarCo may use cookies for better experience."],
      },
      {
        heading: "7. Updates",
        body: ["Policy may change anytime."],
      },
    ],
  },
];
