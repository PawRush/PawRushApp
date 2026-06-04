#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

// Resolve deploymentId from CDK context; fall back to the default deployment ID
const deploymentId: string =
  app.node.tryGetContext("deploymentId") || "PawRushApp-1780584400";

new FrontendStack(app, `FrontendStack-${deploymentId}`, {
  stackName: `FrontendStack-${deploymentId}`,
});
