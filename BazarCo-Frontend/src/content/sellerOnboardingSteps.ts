export type SellerOnboardingStepId = "welcome" | "kyc" | "product" | "video" | "ready";

export type SellerOnboardingStep = {
  id: SellerOnboardingStepId;
  image: string;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  href: string;
};

export const SELLER_ONBOARDING_STEPS: SellerOnboardingStep[] = [
  {
    id: "welcome",
    image: "/OnboardingSeller/seller1.jpeg",
    titleKey: "stepWelcomeTitle",
    descKey: "stepWelcomeDesc",
    ctaKey: "stepWelcomeCta",
    href: "/dashboard",
  },
  {
    id: "kyc",
    image: "/OnboardingSeller/seller2.jpeg",
    titleKey: "stepKycTitle",
    descKey: "stepKycDesc",
    ctaKey: "stepKycCta",
    href: "/dashboard/kyc",
  },
  {
    id: "product",
    image: "/OnboardingSeller/seller3.jpeg",
    titleKey: "stepProductTitle",
    descKey: "stepProductDesc",
    ctaKey: "stepProductCta",
    href: "/dashboard/products/new",
  },
  {
    id: "video",
    image: "/OnboardingSeller/seller4.jpeg",
    titleKey: "stepVideoTitle",
    descKey: "stepVideoDesc",
    ctaKey: "stepVideoCta",
    href: "/dashboard/videos",
  },
  {
    id: "ready",
    image: "/OnboardingSeller/seller5.jpeg",
    titleKey: "stepReadyTitle",
    descKey: "stepReadyDesc",
    ctaKey: "stepReadyCta",
    href: "/dashboard/products",
  },
];

export const SELLER_ONBOARDING_STORAGE_KEY = "bazarco-seller-onboarding-v1";
