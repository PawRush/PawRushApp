# Deploy to AWS

This branch uses [AWS Blocks](https://docs.aws.amazon.com/blocks/) to deploy your app. The `aws-blocks/` directory contains the infrastructure definition. Follow these steps to deploy it to your AWS account.

## 1. Prerequisites

Verify the following tools are installed:

- **Node.js** >= 22 (`node --version`)
- **AWS CLI** >= 2.32.0 (`aws --version`)
- **AWS CDK CLI** (`npx cdk --version`, or install globally: `npm install -g aws-cdk`)

If any are missing, install them before proceeding.

## 2. AWS Authentication

Log in with your AWS Builder ID:

```sh
aws login --profile aws-migrate --region us-east-1
```

This opens a browser window. Sign in with your Builder ID (the same one you used with the AWS web migration tool), then select your AWS account and role when prompted.

> Note: This command opens your browser for authentication. Complete the sign-in, then return here.

After signing in, verify:

```sh
aws sts get-caller-identity --profile aws-migrate
```

Expected output: your AWS account ID, IAM identity, and ARN.

Set the profile as default for this session:

```sh
export AWS_PROFILE=aws-migrate
```

### If `aws login` fails (no AWS account or IAM Identity Center not configured)

Builder ID and an AWS account are separate things. To use `aws login`, you need:
1. An AWS account — [create one here](https://portal.aws.amazon.com/billing/signup) if you don't have one
2. IAM Identity Center enabled on that account — [enable it here](https://console.aws.amazon.com/singlesignon)
3. Your Builder ID enrolled as a user in IAM Identity Center

If you prefer to use IAM access keys instead:

```sh
aws configure --profile aws-migrate
```

Enter your Access Key ID, Secret Access Key, and region (default: us-east-1) when prompted.

## 3. Bootstrap CDK (first-time only)

If this is your first CDK deployment to this account/region, install dependencies and bootstrap from the project root:

```sh
npm install
npx cdk bootstrap
```

If you see "Environment aws://ACCOUNT/REGION is already bootstrapped", skip this step.

## 4. Deploy

Install dependencies and deploy from the project root:

```sh
npm install

# Interactive — prompts for approval on IAM changes:
npx cdk deploy --all --require-approval broadening --progress events

# Unattended (CI or an agent) — the approval prompt hangs without a TTY:
npx cdk deploy --all --require-approval never --progress events
```

`cdk deploy` builds the frontend (`npm run build` → `out/`) and uploads the output to S3 + CloudFront automatically. Do **not** run `aws s3 sync` afterwards — the Hosting construct handles asset upload and cache invalidation.

## 5. Verify

CDK prints the CloudFront URL when the deploy completes. Open it in a browser — the app should load.

Allow 2-5 minutes for initial CloudFront propagation.

## Teardown (if needed)

To remove all deployed resources, run from the project root:

```sh
npx cdk destroy --all
```

---

## Next Steps

### Set up cost monitoring

We recommend setting up a budget to avoid unexpected AWS charges. If you're using an AI coding assistant with the [AWS Agent Toolkit](https://github.com/aws/agent-toolkit-for-aws), ask it:

> "Help me set up an AWS budget for my deployed app"

The toolkit's **aws-billing-and-cost-management** skill will work with you to determine an appropriate budget amount and create alerts. Without the toolkit, see the [AWS Budgets documentation](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).

## Troubleshooting

### `aws login` fails or credentials expired

Re-authenticate: `aws login --profile armadillo-btf74osc --region us-east-1`. Ensure AWS CLI >= 2.32.0 (`aws --version`). No IAM Identity Center? Use the `aws configure` access-key fallback in section 2.

### CDK bootstrap error

- "Access Denied": your IAM identity needs CloudFormation, S3, and IAM permissions — use an admin role for first-time setup.
- "already bootstrapped": safe to skip.

### Deploy fails part-way

CDK rolls back automatically. Read the error from the CloudFormation events output, fix it, and re-run `npx cdk deploy --all` — it is idempotent.

### "No stacks found" or wrong stack

Run `npx cdk ls` from the project root to list the stacks defined in `aws-blocks/index.cdk.ts`, then deploy with `npx cdk deploy --all`.

### Permission errors during deploy

Your identity needs CloudFormation, S3, CloudFront, Lambda, and IAM permissions. `AdministratorAccess` is the simplest path for a personal account.

### CloudFront returns 403

- Wait 2-5 minutes for distribution propagation
- Re-run `npx cdk deploy --all` to trigger a fresh deployment
- Check that `npm run build` produces output in the `out/` directory
