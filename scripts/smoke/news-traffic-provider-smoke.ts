import assert from 'node:assert/strict';

import {
  createDisabledNewsTrafficResult,
  createMockNewsTrafficProvider,
  filterMockNewsTrafficEvents,
  mockNewsTrafficEvents,
  validateNewsTrafficQuery
} from '@/lib/domain/signals/news-traffic-provider';

async function main() {
  const provider = createMockNewsTrafficProvider();
  const result = await provider.getEvents({
    symbols: ['NVDA', 'QQQ'],
    keyword: 'chip',
    limit: 2
  });

  assert.equal(result.providerKind, 'mock');
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].publicId, 'news_traffic_ai_chip_headlines');
  assert.equal(result.events[0].isMock, true);
  assert.equal(result.events[0].availability, 'available');
  assert.equal(result.events[0].dataSourceLabel.includes('mock'), true);
  assert.deepEqual(result.events[0].relatedSymbols.includes('NVDA'), true);
  assert.match(result.warnings.join(' '), /observation-only/);
  assert.doesNotMatch(result.warnings.join(' '), /buy|sell|hold/i);

  const capturedAfterResult = filterMockNewsTrafficEvents(
    mockNewsTrafficEvents,
    {
      keyword: 'traffic',
      capturedAfter: '2026-07-14T00:10:00+09:00',
      limit: 20
    }
  );

  assert.deepEqual(
    capturedAfterResult.map((event) => event.publicId),
    ['news_traffic_asia_tech_earnings', 'news_traffic_consumer_fading']
  );

  const invalidQuery = validateNewsTrafficQuery({ limit: 5 });

  assert.equal(invalidQuery.success, false);

  const invalidProviderResult = await provider.getEvents({ limit: 5 });

  assert.equal(invalidProviderResult.events.length, 0);
  assert.equal(invalidProviderResult.warnings.length > 0, true);

  const disabledResult = createDisabledNewsTrafficResult({
    symbols: ['SPY'],
    limit: 1
  });

  assert.equal(disabledResult.providerKind, 'paid_api_disabled');
  assert.equal(disabledResult.events[0].availability, 'provider_disabled');
  assert.equal(disabledResult.events[0].isMock, true);
  assert.match(disabledResult.warnings.join(' '), /security review/);

  console.log('News traffic provider smoke test passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
