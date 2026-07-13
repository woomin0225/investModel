# AWS Deployment Options

This note compares small AWS deployment paths for the current investModel mobile-first Next.js/PWA prototype.

## Scope

- Task: `BK-064`
- Reviewed date: `2026-07-14`
- Product shape: Next.js mobile web/PWA, mock-only financial flows, MySQL target, GitHub Actions basic CI.
- Out of scope: actual AWS account setup, production deployment, real deposits, broker orders, account connections, external paid API keys, and legal/disclosure approval.

## Sources Checked

- AWS Amplify Hosting Next.js SSR deployment: <https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html>
- AWS Amplify support for Next.js: <https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html>
- AWS App Runner overview: <https://docs.aws.amazon.com/apprunner/latest/dg/what-is-apprunner.html>
- AWS App Runner Node.js platform: <https://docs.aws.amazon.com/apprunner/latest/dg/service-source-code-nodejs.html>
- AWS App Runner public notice: <https://aws.amazon.com/apprunner/>
- Amazon Lightsail container services: <https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-container-services.html>
- Amazon Lightsail Node.js instance guide: <https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-quick-start-guide-nodejs.html>
- Amazon ECS Fargate overview: <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html>

## Candidate Summary

| Candidate | Fit | Complexity | Notes |
| --- | --- | --- | --- |
| AWS Amplify Hosting SSR | Best first AWS path | Low | Official Next.js SSR hosting path with Git repository connection. Good for early mobile web/PWA validation. |
| Amazon ECS on Fargate | Best later production container path | High | Stronger control for containerized services, VPC, observability, and future backend separation. More infrastructure work. |
| Amazon Lightsail containers | Prototype-only fallback | Medium | Simpler than ECS, but less aligned with a production finance-adjacent app requiring mature controls. |
| Amazon Lightsail Node.js instance | Not recommended | Medium | Server management and manual operations are a poor fit for this automation-heavy project. |
| AWS App Runner | Do not choose for new setup | Medium | AWS public page says App Runner stops accepting new customers from April 30, 2026. |

## Recommendation

Use AWS Amplify Hosting SSR as the first AWS deployment candidate after `IS-001` is resolved.

Rationale:

- The app is currently a Next.js mobile web/PWA, not a split container platform.
- Amplify Hosting supports Next.js SSR and Git repository based setup.
- It keeps initial infrastructure work small while the product is still mock-only.
- It avoids introducing Docker/ECS complexity before real staging requirements are known.

Do not deploy yet. `IS-001` remains open because production build requires a real Stripe test key and Docker/local database setup has not been fully verified.

## When To Move Beyond Amplify

Revisit ECS on Fargate when any of these become true:

- A real backend API is separated from the Next.js app.
- Private VPC connectivity to MySQL or other managed services becomes required.
- Background workers or model execution sandboxes are introduced.
- Audit log, compliance review, and observability requirements need infrastructure-level controls.
- Staging and production must be isolated with stricter IAM and network boundaries.

## Required Preconditions Before Any AWS Deployment

- Resolve `IS-001` with a real Stripe test key stored outside code.
- Define environment variable strategy in `BK-065`.
- Confirm no production build path implies real payment, real deposit, broker account, or order execution.
- Keep all `MockDeposit`, `TradeIntent`, `SignalEvent`, and `FeedPost` copy simulation-only.
- Ensure CI passes before deployment.
- Define staging/prod data separation before any user-facing production URL.
- Record AWS account, region, IAM owner, and secret owner decisions outside source code.

## Initial Amplify Checklist

Use this only after the preconditions are met:

1. Connect the GitHub repository in Amplify Hosting.
2. Select the protected branch intended for staging, not an unreviewed feature branch.
3. Configure build command only after `next build` succeeds with test secrets.
4. Add environment variables through AWS-managed configuration, not committed files.
5. Verify mobile 390px layout, safe area, bottom navigation, and mock-only labels on the hosted URL.
6. Keep the hosted app behind a staging-only access policy until legal/security review is complete.

## Deferred Decisions

- AWS region
- Staging domain
- Production domain
- IAM owner
- Secrets owner
- MySQL hosting option
- Observability and error monitoring tool

