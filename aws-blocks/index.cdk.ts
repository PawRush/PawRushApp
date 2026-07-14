import * as cdk from 'aws-cdk-lib';
import { RemovalPolicies, Mixins } from 'aws-cdk-lib';

import { Hosting, BlocksStack, SandboxDisableDeletionProtection } from '@aws-blocks/blocks/cdk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new cdk.App();

cdk.Tags.of(app).add("aws-mcp:deploy:sop", "migrate-static-site-to-blocks");

const sandboxMode = app.node.tryGetContext('sandboxMode') === 'true';

const sandboxId = sandboxMode ? (process.env.SANDBOX_ID || 'dev') : undefined;
const stackName = sandboxMode ? `pawrushapp-stack-${sandboxId}` : 'pawrushapp-stack';

export const blocksStack = await BlocksStack.create(app, stackName, {
  backendHandlerPath: join(__dirname, 'index.handler.ts'),
  backendCDKPath: join(__dirname, 'index.ts')
});

if (sandboxMode) {
  // Make all resources deletable so sandbox:destroy can clean up the entire stack.
  RemovalPolicies.of(blocksStack).destroy();
  Mixins.of(blocksStack).apply(new SandboxDisableDeletionProtection());

  // Tell the runtime that cookies need cross-domain attributes (frontend on
  // localhost, API on API Gateway — different registrable domains).
  blocksStack.handler.addEnvironment('BLOCKS_SANDBOX', 'true');
}

// Add static site hosting only when deploying (not in sandbox mode)
if (!sandboxMode) {
  new Hosting(blocksStack, 'Hosting', {
    root: join(__dirname, '..'),
    buildCommand: 'npm run build',
    buildOutputDir: 'out',
    framework: 'static',
    contentSecurityPolicy: "font-src 'self' fonts.gstatic.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; connect-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  });
}