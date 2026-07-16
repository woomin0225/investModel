/**
 * Guards the IS-004 mock-ingestion boundary without making network calls.
 *
 * The smoke scans only IS-004-relevant code surfaces, then checks policy docs
 * for the labels and blocked-source language that future real integrations
 * must not bypass.
 */

import fs from 'node:fs';
import path from 'node:path';

type ScanTarget = {
  path: string;
  requiredIncludes?: string[];
};

type ForbiddenPattern = {
  label: string;
  pattern: RegExp;
};

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath: string) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function walkFiles(dirPath: string): string[] {
  return fs
    .readdirSync(path.resolve(dirPath), { withFileTypes: true })
    .flatMap((entry) => {
      const childPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return walkFiles(childPath);
      }

      return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [childPath] : [];
    })
    .sort();
}

function assertIncludes(text: string, needle: string, message: string) {
  assertCondition(text.includes(needle), message);
}

function assertNoForbiddenPatterns(
  targets: ScanTarget[],
  patterns: ForbiddenPattern[]
) {
  const failures = targets.flatMap((target) => {
    const source = readText(target.path);

    return patterns
      .filter(({ pattern }) => pattern.test(source))
      .map(({ label }) => `${target.path}: ${label}`);
  });

  assertCondition(
    failures.length === 0,
    `IS-004 mock boundary found forbidden code patterns:\n${failures.join('\n')}`
  );
}

function assertRequiredIncludes(targets: ScanTarget[]) {
  targets.forEach((target) => {
    if (!target.requiredIncludes?.length) {
      return;
    }

    const source = readText(target.path);

    target.requiredIncludes.forEach((needle) => {
      assertIncludes(source, needle, `${target.path} includes ${needle}`);
    });
  });
}

const relevantSmokeTargets: ScanTarget[] = [
  {
    path: 'scripts/smoke/market-data-provider-smoke.ts',
    requiredIncludes: ['paid_api_disabled', 'provider_disabled', 'security review']
  },
  {
    path: 'scripts/smoke/news-traffic-provider-smoke.ts',
    requiredIncludes: ['paid_api_disabled', 'provider_disabled', 'security review']
  },
  {
    path: 'scripts/smoke/mock-decision-engine-smoke.ts',
    requiredIncludes: ['pre-order simulation only', 'not_persisted']
  },
  {
    path: 'scripts/smoke/signal-score-ingestion-plan-smoke.ts',
    requiredIncludes: ['mock_seed', 'scheduled_mock', 'No external paid API keys']
  },
  {
    path: 'scripts/smoke/signal-scoring-service-smoke.ts',
    requiredIncludes: ['mock_seed', 'after.trade_intent_count === before.trade_intent_count']
  }
];

const codeTargets: ScanTarget[] = [
  ...walkFiles('lib/mock').map((filePath) => ({ path: filePath })),
  ...walkFiles('lib/domain/signals').map((filePath) => ({ path: filePath })),
  ...relevantSmokeTargets
];

const forbiddenPatterns: ForbiddenPattern[] = [
  {
    label: 'network fetch call',
    pattern: /\bfetch\s*\(/i
  },
  {
    label: 'axios import or usage',
    pattern: /\b(?:import\s+.*\s+from\s+['"]axios['"]|axios\.)/i
  },
  {
    label: 'undici import or usage',
    pattern: /\b(?:from\s+['"]undici['"]|undici\.)/i
  },
  {
    label: 'got/ky/request network client usage',
    pattern:
      /\b(?:from\s+['"](?:got|ky|request)['"]|(?:got|ky|request)\s*\()/i
  },
  {
    label: 'Node http client import',
    pattern: /\bfrom\s+['"]node:https?['"]/i
  },
  {
    label: 'streaming external client usage',
    pattern: /\b(?:WebSocket|EventSource)\b/
  },
  {
    label: 'external URL literal',
    pattern: /https?:\/\/(?!localhost|127\.0\.0\.1)/i
  },
  {
    label: 'secret-like environment access',
    pattern:
      /process\.env\[[^\]]*(?:API|KEY|SECRET|TOKEN)[^\]]*\]|process\.env\.[A-Z0-9_]*(?:API|KEY|SECRET|TOKEN)[A-Z0-9_]*/i
  },
  {
    label: 'real-looking provider credential',
    pattern: /\b(?:sk_live|pk_live|rk_live|whsec|xoxb|ghp)_[A-Za-z0-9]{12,}\b/
  },
  {
    label: 'live/external/paid provider factory',
    pattern: /\bcreate(?:Live|External|Paid)[A-Za-z0-9_]*Provider\b/
  },
  {
    label: 'live external fallback wording',
    pattern: /\bfallback\b.{0,80}\b(?:fetch|live|external)\b|\b(?:fetch|live|external)\b.{0,80}\bfallback\b/i
  },
  {
    label: 'non-mock signal/provider fixture',
    pattern: /\bisMock\s*:\s*false\b/
  }
];

assertNoForbiddenPatterns(codeTargets, forbiddenPatterns);
assertRequiredIncludes(relevantSmokeTargets);

const mockPolicy = readText('docs/mock-data/mock-data-policy.md');
const ingestionPlan = readText(
  'docs/database/seeds/signal-score-mock-ingestion-job.md'
);
const signalEventSource = readText('lib/domain/signals/signal-event.ts');

[
  '`IS-004` remains open',
  'Allowed before `IS-004` is resolved',
  'Blocked before `IS-004` is resolved',
  'fallback behavior that silently replaces missing seed/mock rows with live',
  'tracked TypeScript fixtures under `lib/mock/**`',
  'mock_seed',
  'scheduled_mock',
  'observed_placeholder'
].forEach((needle) => {
  assertIncludes(mockPolicy, needle, `mock policy documents ${needle}`);
});

[
  'must not fetch external realtime search',
  'No external paid API keys',
  'No browser search volume or news traffic provider connection while IS-004 is',
  'No `TradeIntent` creation',
  'No portfolio, MockDeposit, broker, bank, order, execution, fill, or account'
].forEach((needle) => {
  assertIncludes(ingestionPlan, needle, `mock ingestion plan documents ${needle}`);
});

[
  "dataContext: 'mock' | 'observed_placeholder'",
  "'mock_seed'",
  "'scheduled_mock'",
  "'external_review_required'"
].forEach((needle) => {
  assertIncludes(signalEventSource, needle, `SignalEvent DTO keeps ${needle}`);
});

console.log(
  `mock-ingestion-boundary smoke passed: ${codeTargets.length} IS-004 code files scanned with no live external fallback`
);
