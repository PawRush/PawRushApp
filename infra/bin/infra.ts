#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

// Deployment ID – used to namespace all resource names and the stack name
// so multiple concurrent deployments never collide.
const deploymentId: string =
  app.node.tryGetContext("deploymentId") || "PawRushApp";

new FrontendStack(app, `FrontendStack-${deploymentId}`, {
  stackName: `FrontendStack-${deploymentId}`,
});
