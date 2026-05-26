import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FrontendStack } from '../lib/frontend-stack';

test('FrontendStack creates S3 bucket and CloudFront distribution', () => {
  const app = new cdk.App({
    context: { deploymentId: 'test' },
  });
  const stack = new FrontendStack(app, 'FrontendStack-test', {
    stackName: 'FrontendStack-test',
  });
  const template = Template.fromStack(stack);

  // S3 bucket should exist with no public access
  template.hasResourceProperties('AWS::S3::Bucket', {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  });

  // CloudFront distribution should exist
  template.resourceCountIs('AWS::CloudFront::Distribution', 1);

  // CloudFront Function for SPA rewriting
  template.resourceCountIs('AWS::CloudFront::Function', 1);
});
