import { Bell, Radio, Search } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  ModelCard,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import {
  investModelCopy,
  resolveInvestModelLocale
} from '@/lib/i18n/invest-model';
import { investModelHomeMock } from '@/lib/mock/invest-model-home';

type InvestModelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestModelPreviewPage({
  searchParams
}: InvestModelPageProps) {
  const locale = resolveInvestModelLocale(await searchParams);
  const copy = investModelCopy[locale];
  const homeCopy = copy.home;
  const { account } = investModelHomeMock;

  return (
    <MobileShell
      activeTab="home"
      eyebrow={homeCopy.eyebrow}
      title={homeCopy.title}
      locale={locale}
      currentPath="/invest-model"
      trailing={
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={copy.actions.searchModels}
            className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
          >
            <Search aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label={copy.actions.notifications}
            className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
          >
            <Bell aria-hidden className="size-5" />
          </button>
        </div>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow={homeCopy.bannerEyebrow}
          title={homeCopy.signal.title}
          description={homeCopy.signal.description}
          icon={Radio}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label={homeCopy.metrics.mockBalance}
            value={account.mockBalanceLabel}
            description={homeCopy.metrics.simulatedBalanceOnly}
            trend={homeCopy.metrics.mock}
          />
          <MetricCard
            label={homeCopy.metrics.backtestMove}
            value={account.backtestReturnLabel}
            description={homeCopy.metrics.sampleBacktestMovement}
            trend={homeCopy.metrics.sample}
            tone="positive"
          />
        </div>

        <MetricCard
          label={homeCopy.metrics.policyStatus}
          value={homeCopy.metrics.review}
          description={homeCopy.metrics.noLiveTrading}
          trend={homeCopy.metrics.blocked}
          tone="risk"
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={homeCopy.activeModelSection.title}
            description={homeCopy.activeModelSection.description}
            actionLabel={copy.actions.view}
          />
          <ModelCard
            name={homeCopy.activeModel.name}
            summary={homeCopy.activeModel.summary}
            market={homeCopy.activeModel.market}
            riskLabel={homeCopy.activeModel.riskLabel}
            riskTone="high"
            performanceLabel={homeCopy.activeModel.performanceLabel}
            mandateLabel={homeCopy.activeModel.mandateLabel}
          />
        </div>

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title={homeCopy.activitySection.title}
            description={homeCopy.activitySection.description}
          />
          <div className="space-y-3">
            {homeCopy.timeline.map((item) => (
              <article
                key={`${item.time}-${item.title}`}
                className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
              >
                <div className="flex items-start gap-3">
                  <RiskBadge>{item.time}</RiskBadge>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold leading-6 text-invest-text">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-invest-text-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex flex-wrap gap-2">
            <RiskBadge tone="blocked">
              {homeCopy.footerBadges.noLiveOrders}
            </RiskBadge>
            <RiskBadge>{homeCopy.signal.source}</RiskBadge>
            <RiskBadge tone="medium">{homeCopy.signal.status}</RiskBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-invest-text-muted">
            {homeCopy.footer}
          </p>
        </div>
      </section>
    </MobileShell>
  );
}
