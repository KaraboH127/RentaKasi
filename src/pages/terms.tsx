const sections = [
  {
    title: 'Platform Responsibilities',
    body: 'RentaKasi provides tools for discovering, publishing, saving, reporting, and reviewing township rental listings. We may improve listing quality through verification labels, expiry checks, moderation workflows, and safety prompts, but we are not a party to rental agreements between landlords and tenants.',
  },
  {
    title: 'Landlord Responsibilities',
    body: 'Landlords must provide accurate listing details, current pricing, true availability, real photos, valid contact information, exact property location data, and lawful rental terms. Landlords may not request deceptive fees, impersonate another person, or publish listings they do not control.',
  },
  {
    title: 'Tenant Responsibilities',
    body: 'Tenants are responsible for inspecting a room, confirming landlord identity, understanding rental terms, and making safe payment decisions. Tenants should report suspicious listings, avoid paying before verification, and use platform safety guidance when contacting landlords.',
  },
  {
    title: 'Fraud and Scam Disclaimer',
    body: 'RentaKasi works to reduce risk through reporting, verification status, and trust signals, but no platform can guarantee that every user or listing is safe. Never send deposits, admin fees, or personal documents until you are confident the listing and landlord are legitimate.',
  },
  {
    title: 'Listing Accuracy Limitations',
    body: 'Listing prices, availability, descriptions, photos, landmarks, transport notes, and coordinates are supplied by landlords. RentaKasi may mark listings for review, expire stale listings, or remove content, but tenants should still verify details before making commitments.',
  },
  {
    title: 'Moderation Rights',
    body: 'We may remove listings, restrict accounts, change verification status, review reports, hide unsafe content, and cooperate with lawful requests where necessary to protect the community and the integrity of the platform.',
  },
]

export default function Terms() {
  return (
    <div className="bg-background">
      <section className="border-b bg-muted/40">
        <div className="container mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">Terms of Service</p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Clear rules keep the community safer.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            These terms explain how RentaKasi works, what landlords and tenants are responsible for, and how we handle trust, reports, and moderation.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="prose prose-neutral max-w-none">
          {sections.map((section) => (
            <section key={section.title} id={section.title === 'Fraud and Scam Disclaimer' ? 'safety' : undefined} className="mb-8 rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">Safety Flow</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Use listing and landlord report buttons when something feels wrong. Include factual details so moderation can review the issue quickly. Urgent safety concerns should also be handled through appropriate local authorities.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
