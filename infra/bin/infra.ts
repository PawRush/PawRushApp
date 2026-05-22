#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

// Retrieve deploymentId from CDK context; fall back to "default"
const deploymentId: string =
  app.node.tryGetContext("deploymentId") ?? "default";

// Instantiate with a deployment-specific CloudFormation stack name to prevent
// collisions when multiple deployments run concurrently.
new FrontendStack(app, `FrontendStack-${deploymentId}`, {
  stackName: `FrontendStack-${deploymentId}`,
});
