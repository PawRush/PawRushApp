import * as cdk from 'aws-cdk-lib';
import { Hosting } from '@aws-blocks/blocks/cdk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new cdk.App();
const stack = new cdk.Stack(app, 'pawrushapp-stack');

cdk.Tags.of(app).add("aws-mcp:deploy:sop", "migrate-static-site-to-blocks");

new Hosting(stack, 'Web', {
  root: join(__dirname, '..'),
  buildOutputDir: 'out',
  framework: 'static',
});