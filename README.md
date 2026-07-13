# investModel

investModel is a mobile-first PWA prototype for an AI investment-model marketplace. The current MVP uses mock-only financial state so the team can validate model discovery, model detail, signals, feed, and portfolio screens without real deposits, real account linking, broker orders, legal approval, or live payment processing.

The repository still includes some original SaaS starter surfaces such as `/pricing`, Stripe checkout, and subscription management. Treat those as starter residue, not investModel funding or deposit features. `IS-001` remains open because production build validation still needs owner-provided Stripe test secrets outside the repository.

Project path:

```bash
C:\invest-model-project\invest-model
```

## Current investModel MVP

- Mobile PWA route at `/invest-model`
- Mock `InvestmentModel` discovery, detail, comparison, signals, feed, and portfolio screens
- `MockDeposit`, simulated portfolio values, and `TradeIntent` states for UI validation only
- Korean-first UI with English switching through `?lang=en`
- PWA manifest, app icons, mobile safe-area handling, and bottom-tab navigation
- Creator and admin review prototype screens with mock-safe data boundaries

## Starter Surfaces Kept For Now

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) from the starter, connected to Stripe Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for starter user events

The Stripe and pricing routes are not part of the approved investModel financial-operation scope. Do not enter Stripe secrets, claim production build readiness, or present these routes as real deposit/payment functionality until `IS-001` is resolved or the starter payment surface is isolated through a separate reviewed task.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [MySQL](https://www.mysql.com/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Starter payments**: [Stripe](https://stripe.com/) remains in the original SaaS starter surface only
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
cd C:\invest-model-project\invest-model
pnpm install
```

## Running Locally

Use the included setup script to create your `.env` file only when the project owner has provided the required local test secrets outside the repository:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000/invest-model](http://localhost:3000/invest-model) in your browser to see the current investModel PWA prototype.

The starter Stripe webhook flow is optional and remains outside the investModel MVP. Use it only with owner-provided test credentials:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Starter Payments

To test the starter Stripe payment surface after `IS-001` is resolved, use Stripe's documented test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

Do not treat the current repository as production-ready while `IS-001` and `IS-003` remain open. Public launch, real payments, real deposits, broker account connections, real orders, and final legal/disclosure copy all require separate review.

When the project owner is ready to deploy the starter payment surface, follow these steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `STRIPE_SECRET_KEY`: Use your Stripe secret key for the production environment. Never commit it.
3. `STRIPE_WEBHOOK_SECRET`: Use the webhook secret from the production webhook you created in step 1. Never commit it.
4. `MYSQL_URL`: Set this to your production database URL.
5. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
