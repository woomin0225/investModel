import { Bell, Search } from 'lucide-react';
import { MobileShell } from '@/components/invest-model';

const previewCards = [
  {
    title: 'Active model',
    value: 'US Momentum AI',
    description: 'Mock portfolio mode'
  },
  {
    title: 'Today signal',
    value: 'Risk check ready',
    description: 'News and price traffic placeholder'
  }
];

export default function InvestModelPreviewPage() {
  return (
    <MobileShell
      activeTab="home"
      eyebrow="Mobile preview"
      title="My AI Investment"
      trailing={
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search models"
            className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
          >
            <Search aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
          >
            <Bell aria-hidden className="size-5" />
          </button>
        </div>
      }
    >
      <section className="space-y-invest-card-gap">
        <div className="rounded-invest-card border border-invest-border bg-invest-primary-soft p-invest-card-padding">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-invest-primary">
            Prototype
          </p>
          <h2 className="mt-2 text-[22px] font-bold leading-[30px] text-invest-text">
            Mobile shell is ready
          </h2>
          <p className="mt-2 text-sm leading-6 text-invest-text-muted">
            This preview uses mock-only mobile layout tokens. It does not move
            real money or place orders.
          </p>
        </div>

        <div className="grid gap-invest-card-gap">
          {previewCards.map((card) => (
            <article
              key={card.title}
              className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
            >
              <p className="text-xs font-medium text-invest-text-muted">
                {card.title}
              </p>
              <h3 className="mt-2 text-[17px] font-semibold leading-6 text-invest-text">
                {card.value}
              </h3>
              <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
