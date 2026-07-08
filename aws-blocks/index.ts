import { Scope } from '@aws-blocks/blocks';
import * as cdk from 'aws-cdk-lib';

const scope = new Scope('pawrushapp');

// Tag all resources for tracking
cdk.Tags.of(scope).add("aws-mcp:deploy:sop", "migrate-static-site-to-blocks");

// No API, auth, or data blocks needed for a static site.
// The Hosting construct in index.cdk.ts handles everything.

