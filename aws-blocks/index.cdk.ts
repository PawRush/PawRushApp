import * as cdk from 'aws-cdk-lib';
import { Hosting } from '@aws-blocks/blocks/cdk';
import { getStackName } from '@aws-blocks/blocks/scripts';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new cdk.App();
cdk.Tags.of(app).add('aws-mcp:deploy:sop', 'migrate-static-site-to-blocks');

const sandboxMode = app.node.tryGetContext('sandboxMode') === 'true';
const projectRoot = app.node.tryGetContext('projectRoot') || process.cwd();

// getStackName reads .blocks/config.json and suffixes -sandbox/-prod, so the
// scaffold's scripts target the same stack and sandbox never overwrites prod.
const stack = new cdk.Stack(app, getStackName({ sandbox: sandboxMode, projectRoot }));

// Hosting builds the frontend and serves it from S3 + CloudFront. Prod only —
// in sandbox you run the site locally with npm run dev.
if (!sandboxMode) {
  new Hosting(stack, 'Hosting', {
    root: join(__dirname, '..'),
    framework: 'static',
    buildCommand: 'npm run build',
    buildOutputDir: 'out',
  });
}
