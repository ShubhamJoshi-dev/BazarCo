import { SELLER_ONBOARDING_DOCUMENTS } from "@/content/sellerOnboardingAgreement";

export function SellerAgreementDocument() {
  return (
    <div className="space-y-8">
      {SELLER_ONBOARDING_DOCUMENTS.map((doc, docIndex) => (
        <article
          key={doc.title}
          className={docIndex > 0 ? "border-t border-[var(--brand-border)] pt-8" : undefined}
        >
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-[var(--brand-red)] sm:text-base">
            {doc.title}
          </h3>
          {doc.intro ? (
            <p className="mb-4 text-sm leading-relaxed text-[var(--foreground)] sm:text-[15px]">
              {doc.intro}
            </p>
          ) : null}
          <div className="space-y-4">
            {doc.blocks.map((block) => (
              <section
                key={block.heading}
                className="rounded-xl bg-white/60 px-3 py-2.5 sm:px-4 sm:py-3"
              >
                <h4 className="mb-1.5 text-sm font-bold text-[var(--foreground)] sm:text-[15px]">
                  {block.heading}
                </h4>
                {block.body?.map((line) => (
                  <p
                    key={line}
                    className="text-sm leading-relaxed text-[var(--brand-muted)] sm:text-[15px]"
                  >
                    {line}
                  </p>
                ))}
                {block.bullets ? (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-[var(--brand-muted)] sm:text-[15px]">
                    {block.bullets.map((item) => (
                      <li key={item} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
