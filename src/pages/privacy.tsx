const sections = [
  {
    title: 'Information We Collect',
    body: 'RentaKasi collects account details such as name, email address, role, and phone number. Landlords may add listing details including photos, rental prices, addresses, landmarks, transport notes, map coordinates, and WhatsApp contact information.',
  },
  {
    title: 'How We Use Information',
    body: 'We use information to create accounts, publish listings, show search results, display maps, help tenants contact landlords, send saved-search updates, improve safety, and support moderation or fraud-prevention workflows.',
  },
  {
    title: 'Location and Map Data',
    body: 'Listings may include approximate or exact coordinates supplied by landlords or selected through map tools. Tenants may use browser location features to explore nearby rooms, but location permission is controlled by the user and their browser.',
  },
  {
    title: 'WhatsApp Contact',
    body: 'When tenants choose Contact via WhatsApp, RentaKasi formats the landlord phone number and opens WhatsApp with a prepared message. WhatsApp interactions happen outside RentaKasi and are subject to WhatsApp policies and the choices of both users.',
  },
  {
    title: 'Reports and Moderation',
    body: 'Reports about listings or landlords may include reporter details, report reason, linked listing or landlord, timestamps, and factual notes. We use this information to review concerns, hide unsafe listings, suspend accounts, prevent repeat abuse, and maintain audit records.',
  },
  {
    title: 'User and Landlord Responsibilities',
    body: 'Users must provide accurate information, avoid impersonation, protect private documents, and use reporting tools honestly. Landlords are responsible for publishing lawful, current, and truthful rental information.',
  },
  {
    title: 'Data Retention',
    body: 'We keep account, listing, report, and moderation records for as long as needed to operate the service, comply with legal obligations, resolve disputes, protect users, and prevent repeat fraud or misuse.',
  },
  {
    title: 'Security',
    body: 'We use Supabase authentication, row-level security, restricted policies, and moderation controls to protect platform data. No online service can remove every risk, so users should still verify property details before paying money or sharing sensitive documents.',
  },
]

export default function Privacy() {
  return (
    <div className="bg-background">
      <section className="border-b bg-muted/40">
        <div className="container mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">Privacy Policy</p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Your information should help you rent more safely.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            This policy explains what RentaKasi collects, why it is used, and how platform safety, maps, WhatsApp contact, and moderation workflows handle user information.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="prose prose-neutral max-w-none">
          {sections.map((section) => (
            <section key={section.title} className="mb-8 rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
