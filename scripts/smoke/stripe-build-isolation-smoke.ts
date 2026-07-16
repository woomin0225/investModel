import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const stripeIsolationDoc = readProjectFile(
  'docs/deployment/stripe-build-isolation.md'
);
const verificationRulesDoc = readProjectFile(
  'docs/automation/verification-commit-push-rules.md'
);
const stripePaymentSource = readProjectFile('lib/payments/stripe.ts');
const checkoutRouteSource = readProjectFile('app/api/stripe/checkout/route.ts');
const webhookRouteSource = readProjectFile('app/api/stripe/webhook/route.ts');
const pricingPageSource = readProjectFile('app/(dashboard)/pricing/page.tsx');
const ciWorkflowSource = readProjectFile('.github/workflows/ci.yml');
const dbSeedSource = readProjectFile('lib/db/seed.ts');
const dbSetupSource = readProjectFile('lib/db/setup.ts');
const readmeSource = readProjectFile('README.md');

assertCondition(
  stripeIsolationDoc.includes('Related issue: IS-001') &&
    stripeIsolationDoc.includes('It does not add Stripe keys') &&
    stripeIsolationDoc.includes('A passing targeted investModel check is not a passing production release build.') &&
    stripeIsolationDoc.includes('Entering or inventing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or Stripe CLI credentials.') &&
    stripeIsolationDoc.includes('next build skipped because IS-001 requires external Stripe test secret validation.') &&
    stripeIsolationDoc.includes('`IS-001` remains open.'),
  'Stripe build isolation doc must keep IS-001 open and avoid production-build-ready claims'
);

assertCondition(
  verificationRulesDoc.includes('production build needs real Stripe key') &&
    verificationRulesDoc.includes('do not run or claim successful `next build` for production until `IS-001` is resolved') &&
    verificationRulesDoc.includes('`IS-001` should be mentioned only when production build, Stripe, Docker, or local DB setup is directly relevant.'),
  'Verification rules must keep production build and Stripe secret requirements explicit'
);

assertCondition(
  stripePaymentSource.includes('const stripeSecretKey = process.env.STRIPE_SECRET_KEY') &&
    stripePaymentSource.includes("Boolean(stripeSecretKey?.startsWith('sk_'))") &&
    stripePaymentSource.includes("!stripeSecretKey?.toLowerCase().includes('placeholder')") &&
    stripePaymentSource.includes("stripeSecretKey || 'sk_test_placeholder_disabled'") &&
    stripePaymentSource.includes('function assertStripeConfigured') &&
    stripePaymentSource.includes("assertStripeConfigured('Starter Stripe checkout')") &&
    stripePaymentSource.includes("assertStripeConfigured('Starter Stripe customer portal')") &&
    stripePaymentSource.includes('if (!isStripeConfigured) {\n    return [];\n  }'),
  'Stripe starter helper must avoid live API calls when STRIPE_SECRET_KEY is missing or placeholder-like'
);

assertCondition(
  checkoutRouteSource.includes('if (!isStripeConfigured)') &&
    checkoutRouteSource.includes("NextResponse.redirect(new URL('/pricing', request.url))") &&
    webhookRouteSource.includes('const isStripeWebhookConfigured') &&
    webhookRouteSource.includes("Boolean(webhookSecret?.startsWith('whsec_'))") &&
    webhookRouteSource.includes("!webhookSecret?.toLowerCase().includes('placeholder')") &&
    webhookRouteSource.includes("{ error: 'Starter Stripe webhook is not configured.' }") &&
    webhookRouteSource.includes('{ status: 503 }'),
  'Stripe checkout and webhook routes must stay guarded when test secrets are absent'
);

assertCondition(
  pricingPageSource.includes('Starter billing surface') &&
    pricingPageSource.includes('not an\n          investModel deposit, brokerage account, order, or live payment flow') &&
    pricingPageSource.includes('production Stripe setup remains blocked by IS-001') &&
    readmeSource.includes('starter residue, not investModel funding or deposit features') &&
    readmeSource.includes('Do not enter Stripe secrets, claim production build readiness'),
  'Starter pricing UI and README must not present Stripe as investModel funding or release readiness'
);

assertCondition(
  ciWorkflowSource.includes('Stripe build isolation smoke') &&
    ciWorkflowSource.includes('pnpm run test:stripe-build-isolation') &&
    ciWorkflowSource.includes('Build when Stripe secret is configured') &&
    ciWorkflowSource.includes('STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}') &&
    ciWorkflowSource.includes('if [ -z "$STRIPE_SECRET_KEY" ]; then') &&
    ciWorkflowSource.includes('Skipping pnpm build because STRIPE_SECRET_KEY is not configured for CI.') &&
    ciWorkflowSource.includes('pnpm run build') &&
    dbSeedSource.includes('if (!isStripeConfigured)') &&
    dbSeedSource.includes('Skipping starter Stripe product seed because STRIPE_SECRET_KEY is not configured.') &&
    dbSetupSource.includes('investModel mock-only MVP does not require Stripe CLI, Stripe secrets, or webhook setup.') &&
    dbSetupSource.includes('Configure original starter Stripe billing now? (y/n): ') &&
    dbSetupSource.includes('Skipping starter Stripe billing setup for mock-only MVP.'),
  'CI, seed, and setup flows must skip or gate starter Stripe work when secrets are absent'
);

const trackedFiles = execFileSync('git', ['ls-files'], {
  cwd: projectRoot,
  encoding: 'utf8'
})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.includes('pnpm-lock.yaml'));

const trackedText = trackedFiles
  .map((file) => `${file}\n${readProjectFile(file)}`)
  .join('\n');

const realStripeSecretPattern =
  /\b(?:sk_live|rk_live|whsec)_[A-Za-z0-9]{16,}\b/;

assertCondition(
  !realStripeSecretPattern.test(trackedText),
  'Tracked files must not contain real-looking Stripe secret or webhook values'
);

assertCondition(
  !/\bSTRIPE_SECRET_KEY\s*=\s*sk_live_/i.test(trackedText) &&
    !/\bSTRIPE_WEBHOOK_SECRET\s*=\s*whsec_[A-Za-z0-9]{16,}/i.test(trackedText),
  'Tracked env examples must not include live Stripe or webhook secret values'
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      scope: 'Stripe starter build isolation while IS-001 is open',
      secretHandling: 'no real Stripe secrets required or exposed',
      productionBuild: 'not claimed while IS-001 remains open'
    },
    null,
    2
  )
);
