import * as cdk from 'aws-cdk-lib';
import { Scope } from '@aws-blocks/blocks';

const scope = new Scope('pawrush');

// No API, auth, or data blocks needed for a static site.
// The Hosting construct in index.cdk.ts handles everything.

cdk.Tags.of(scope).add("aws-mcp:deploy:sop", "migrate-static-site-to-blocks");
