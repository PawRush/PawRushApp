#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { execSync } from "child_process";
import { FrontendStack } from "../lib/stacks/frontend-stack";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

// Environment detection
const getDefaultEnvironment = (): string => {
  try {
    const username = process.env.USER || execSync('whoami').toString().trim();
    return `preview-${username}`;
  } catch {
    return 'preview-local';
  }
};

// Get context values
const codeConnectionArn = app.node.tryGetContext("codeConnectionArn");
const repositoryName = app.node.tryGetContext("repositoryName") || "PawRush/PawRushApp";
const branchName = app.node.tryGetContext("branchName") || "main";
const pipelineOnly = app.node.tryGetContext("pipelineOnly") === "true";

const environment =
  app.node.tryGetContext("environment") || getDefaultEnvironment();
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "us-east-1";

// Build output path (Next.js static export outputs to 'out' directory)
const buildOutputPath = app.node.tryGetContext("buildPath") || "../out";

// ========================================================================
// DEPLOYMENT STRATEGY
// ========================================================================
// This CDK app supports two deployment modes:
//
// 1. Pipeline Mode (pipelineOnly=true):
//    - Creates ONLY PipelineStack (CI/CD infrastructure)
//    - Used when deploying the pipeline itself
//    - Command: cdk deploy --context pipelineOnly=true
//
// 2. Application Mode (pipelineOnly=false or not set):
//    - Creates FrontendStack for dev/prod environments
//    - Used by the pipeline's buildspecs to deploy application stacks
//    - Also used by run-deployment-assistant for preview environments
//
// Preview vs Dev/Prod environments:
// - Preview (preview-<username>): Created by deployment-assistant for local testing
// - Dev/Prod: Created by THIS pipeline for team-shared environments
// ========================================================================

// Create frontend stack (only if not pipeline-only mode)
if (!pipelineOnly) {
  new FrontendStack(app, `PawRushFrontend-${environment}`, {
    env: { account, region },
    environment,
    buildOutputPath,
    description: `PawRush static website hosting - ${environment}`,
  });
}

// Create pipeline stack (only if CodeConnection ARN is provided)
if (codeConnectionArn) {
  new PipelineStack(app, "PawRushPipelineStack", {
    env: { account, region },
    description: "CI/CD Pipeline for PawRush",
    codeConnectionArn,
    repositoryName,
    branchName,
  });
} else if (pipelineOnly) {
  console.warn(
    "⚠️  CodeConnection ARN not provided. Pipeline stack will not be created.",
  );
  console.warn(
    "   Create connection: See Step 1.9 in setup-codepipeline script",
  );
}

// Global tags
cdk.Tags.of(app).add("Project", "PawRush");
cdk.Tags.of(app).add("ManagedBy", "CDK");
if (!pipelineOnly) {
  cdk.Tags.of(app).add("Environment", environment);
}
