#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

// Retrieve deploymentId from CDK context — used to namespace resource names
// and prevent stack-name collisions when multiple deployments run concurrently.
const deploymentId: string =
  app.node.tryGetContext("deploymentId") || "default";

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "us-east-1";

// Instantiate the FrontendStack with a deployment-specific CloudFormation
// stack name so concurrent deployments never collide.
new FrontendStack(app, `FrontendStack-${deploymentId}`, {
  stackName: `FrontendStack-${deploymentId}`,
  env: { account, region },
  description: `Frontend static hosting stack for deployment ${deploymentId}`,
});

// Global tags
cdk.Tags.of(app).add("Project", "PawRush");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("DeploymentId", deploymentId);
