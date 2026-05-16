import { SELLER_ONBOARDING_DOCUMENTS } from "@/content/sellerOnboardingAgreement";

export function SellerAgreementDocument() {
  return (
    <div className="space-y-6">
      {SELLER_ONBOARDING_DOCUMENTS.map((doc) => (
        <article key={doc.title} className="space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-wide text-[var(--brand-red)]">
            {doc.title}
          </h3>
          {doc.intro ? (
            <p className="text-[var(--foreground)] leading-relaxed">{doc.intro}</p>
          ) : null}
          {doc.blocks.map((block) => (
            <section key={block.heading} className="space-y-1">
              <h4 className="font-semibold text-[var(--foreground)]">{block.heading}</h4>
              {block.body?.map((line) => (
                <p key={line} className="text-[var(--brand-muted)] leading-relaxed">
                  {line}
                </p>
              ))}
              {block.bullets ? (
                <ul className="list-disc pl-4 space-y-0.5 text-[var(--brand-muted)]">
                  {block.bullets.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      ))}
    </div>
  );
}
