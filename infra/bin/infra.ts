#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

// Retrieve the deployment ID from CDK context (required for namespaced stack names)
const deploymentId: string =
  app.node.tryGetContext("deploymentId") || "default";

new FrontendStack(app, `FrontendStack-${deploymentId}`, {
  stackName: `FrontendStack-${deploymentId}`,
});
