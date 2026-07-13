import { Bell, MessageSquareText, ShieldCheck } from 'lucide-react';
import {
  MetricCard,
  MobileShell,
  RiskBadge,
  SectionHeader,
  SoftBanner
} from '@/components/invest-model';
import { investModelFeedMock } from '@/lib/mock/invest-model-feed';

const postToneBadge = {
  neutral: 'neutral',
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const;

export default function InvestModelFeedPage() {
  const { summary, filters, posts } = investModelFeedMock;

  return (
    <MobileShell
      activeTab="feed"
      eyebrow="Insights"
      title="Feed"
      trailing={
        <button
          type="button"
          aria-label="Feed notifications"
          className="grid size-invest-touch-target place-items-center rounded-invest-control border border-invest-border bg-invest-surface text-invest-text shadow-invest-card"
        >
          <Bell aria-hidden className="size-5" />
        </button>
      }
    >
      <section className="space-y-invest-section-gap">
        <SoftBanner
          eyebrow="Mock feed"
          title={summary.title}
          description={summary.description}
          icon={MessageSquareText}
        />

        <div className="grid grid-cols-2 gap-invest-card-gap">
          <MetricCard
            label="Posts"
            value={summary.postCountLabel}
            description="Prototype content"
            trend="mock"
          />
          <MetricCard
            label="Sources"
            value={summary.sourceCountLabel}
            description="Approved model context"
            trend="sample"
          />
        </div>

        <MetricCard
          label="Disclosure state"
          value={summary.reviewLabel}
          description="Final legal and financial disclosure copy must be supplied by a qualified reviewer."
          trend="review"
          tone="risk"
        />

        <div className="space-y-invest-card-gap">
          <SectionHeader
            title="Latest insights"
            description="Model notes and market context for the mobile prototype."
          />

          <div className="-mx-invest-screen-x overflow-x-auto px-invest-screen-x [scrollbar-width:none]">
            <div className="flex w-max gap-2 pr-invest-screen-x">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className="min-h-invest-touch-target rounded-invest-control border border-invest-border bg-invest-surface px-3 text-sm font-semibold text-invest-text shadow-invest-card"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-invest-card-gap">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-invest-card border border-invest-border bg-invest-surface p-invest-card-padding shadow-invest-card"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-invest-control bg-invest-bg-soft text-invest-primary">
                    <MessageSquareText aria-hidden className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 text-[17px] font-semibold leading-6 text-invest-text">
                        {post.title}
                      </h3>
                      <RiskBadge tone={postToneBadge[post.tone]}>
                        {post.typeLabel}
                      </RiskBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-invest-text-muted">
                      {post.excerpt}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <RiskBadge>{post.authorLabel}</RiskBadge>
                      <RiskBadge>{post.sourceLabel}</RiskBadge>
                      <RiskBadge tone="medium">{post.timeLabel}</RiskBadge>
                      <RiskBadge tone="neutral">
                        {post.linkedModelName}
                      </RiskBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <RiskBadge key={`${post.id}-${tag}`} tone="neutral">
                          {tag}
                        </RiskBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-invest-card border border-invest-border bg-invest-surface-muted p-invest-card-padding">
          <div className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-invest-primary"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <RiskBadge tone="blocked">No advice</RiskBadge>
                <RiskBadge tone="medium">Review placeholder</RiskBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-invest-text-muted">
                Feed posts are mock commentary for app development. They do not
                recommend securities, guarantee returns, or execute model files,
                deposits, or orders.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
