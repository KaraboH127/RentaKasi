import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BadgeCheck, HeartHandshake, MapPinned, Smartphone, ShieldCheck } from 'lucide-react'

export default function About() {
  return (
    <div className="bg-background">
      <section className="border-b bg-muted/40">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">About RentaKasi</p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              Finding housing in the kasi should feel safer, simpler, and closer to home.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              RentaKasi exists because finding a room should not mean walking street-to-street, relying on scattered posts, or risking scams before you even know who owns the property.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/listings"><Button size="lg">Browse rooms</Button></Link>
              <Link to="/register"><Button size="lg" variant="outline">Join the community</Button></Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="grid gap-3">
              {[
                ['Trust first', 'Verified landlords, report flows, property checks, and clear safety guidance.'],
                ['Built for township life', 'Areas, landmarks, taxi routes, and mobile-first details tenants actually use.'],
                ['Low-friction access', 'Fast pages, simple filters, WhatsApp contact, and no unnecessary steps.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-xl border bg-background p-4">
                  <p className="font-display font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: HeartHandshake, title: 'Mission', copy: 'Help tenants find real rooms from real people, without losing time, money, or dignity.' },
            { icon: MapPinned, title: 'Vision', copy: 'A trusted township rental network where every room can be discovered clearly and safely.' },
            { icon: ShieldCheck, title: 'Trust', copy: 'Reports, verification badges, expiry checks, and property details make safety visible.' },
            { icon: Smartphone, title: 'Access', copy: 'Designed for phones first, with lightweight flows that work for everyday data realities.' },
          ].map(({ icon: Icon, title, copy }) => (
            <article key={title} className="rounded-2xl border bg-card p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="container mx-auto max-w-4xl px-4 py-12 text-center sm:py-16">
          <BadgeCheck className="mx-auto mb-5 h-10 w-10 text-primary" />
          <h2 className="font-display text-3xl font-bold">Community is the product.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-background/70 sm:text-base">
            RentaKasi is built for tenants, landlords, families, and neighborhoods that already know how trust works. The platform simply makes that trust easier to see, share, and protect.
          </p>
        </div>
      </section>
    </div>
  )
}
