#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticWebsiteStack } from '../lib/static-website-stack';

const app = new cdk.App();

// Get environment variables or use defaults
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new StaticWebsiteStack(app, 'PawRushStaticWebsiteStack', {
  env,
  description: 'Static website hosting for PawRush app with S3 and CloudFront',
});
