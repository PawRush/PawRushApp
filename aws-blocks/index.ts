import { Scope } from '@aws-blocks/blocks';

const scope = new Scope('pawrushapp');

// No API, auth, or data blocks needed for a static site.
// The Hosting construct in index.cdk.ts handles everything.
