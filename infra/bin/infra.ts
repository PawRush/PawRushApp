#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/stacks/frontend-stack";

const app = new cdk.App();

// Resolve deploymentId from CDK context (required for unique stack naming)
const deploymentId: string =
  app.node.tryGetContext("deploymentId") || "default";

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "us-east-1";

// Instantiate with a deployment-specific CloudFormation stack name to prevent
// collisions when multiple deployments run concurrently.
new FrontendStack(app, `FrontendStack-${deploymentId}`, {
  stackName: `FrontendStack-${deploymentId}`,
  env: { account, region },
  description: `Frontend static site hosting – deployment ${deploymentId}`,
});

// Global tags
cdk.Tags.of(app).add("Project", "PawRush");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("DeploymentId", deploymentId);
