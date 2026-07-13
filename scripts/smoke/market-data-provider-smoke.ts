import {
  createDisabledMarketDataResult,
  createMockMarketDataProvider,
  filterMockMarketDataQuotes,
  mockMarketDataQuotes,
  validateMarketDataQuery
} from '@/lib/domain/signals/market-data-provider';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const provider = createMockMarketDataProvider();
  const result = await provider.getQuotes({
    symbols: ['QQQ', 'NVDA'],
    market: 'US'
  });

  assert(result.providerKind === 'mock', 'provider kind should be mock');
  assert(result.quotes.length === 2, 'mock provider should return matching quotes');
  assert(
    result.quotes.map((quote) => quote.instrument.symbol).join(',') === 'QQQ,NVDA',
    'quotes should follow requested symbol order'
  );
  assert(
    result.quotes.every(
      (quote) =>
        quote.isMock &&
        quote.providerKind === 'mock' &&
        quote.dataSourceLabel.includes('mock') &&
        quote.price !== '0' &&
        quote.previousClose &&
        quote.volume
    ),
    'quotes should be clearly marked as mock price observations'
  );
  assert(
    result.warnings.some((warning) => warning.includes('observation-only')),
    'mock provider should warn that data is observation-only'
  );
  assert(
    result.warnings.every(
      (warning) =>
        !/\b(buy|sell|hold|order|recommendation)\b/i.test(warning) ||
        warning.includes('does not create')
    ),
    'warnings should not read like trading advice'
  );

  const asOfQuotes = filterMockMarketDataQuotes(mockMarketDataQuotes, {
    symbols: ['NVDA', 'TQQQ'],
    market: 'US',
    asOf: '2026-07-14T00:02:00+09:00'
  });
  assert(asOfQuotes.length === 1, 'asOf filter should exclude later observations');
  assert(asOfQuotes[0]?.instrument.symbol === 'NVDA', 'asOf filter should keep NVDA');

  const invalidQuery = validateMarketDataQuery({ symbols: [] });
  assert(!invalidQuery.success, 'empty symbols should fail validation');
  const invalidResult = await provider.getQuotes({ symbols: [] });
  assert(invalidResult.quotes.length === 0, 'invalid query should return no quotes');
  assert(
    invalidResult.warnings.some((warning) => warning.includes('Required fields')),
    'invalid query should explain required fields'
  );

  const disabledResult = createDisabledMarketDataResult(
    { symbols: ['SPY'], market: 'US' },
    '2026-07-14T00:30:00+09:00'
  );
  assert(
    disabledResult.providerKind === 'paid_api_disabled',
    'disabled provider result should be explicit'
  );
  assert(
    disabledResult.quotes[0]?.availability === 'provider_disabled',
    'disabled provider quote should mark provider_disabled'
  );
  assert(
    disabledResult.quotes[0]?.isMock,
    'disabled provider fallback quote should remain mock'
  );
  assert(
    disabledResult.warnings.some((warning) => warning.includes('security review')),
    'disabled provider should mention security review'
  );

  console.log(
    `market-data-provider smoke passed: ${result.quotes.length} mock quotes, ${asOfQuotes.length} asOf quote`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
