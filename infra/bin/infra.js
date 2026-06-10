#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const child_process_1 = require("child_process");
const frontend_stack_1 = require("../lib/stacks/frontend-stack");
const pipeline_stack_1 = require("../lib/pipeline-stack");
const app = new cdk.App();
// Environment detection
const getDefaultEnvironment = () => {
    try {
        const username = process.env.USER || (0, child_process_1.execSync)('whoami').toString().trim();
        return `preview-${username}`;
    }
    catch {
        return 'preview-local';
    }
};
// Get context values
const codeConnectionArn = app.node.tryGetContext("codeConnectionArn");
const repositoryName = app.node.tryGetContext("repositoryName") || "PawRush/PawRushApp";
const branchName = app.node.tryGetContext("branchName") || "main";
const pipelineOnly = app.node.tryGetContext("pipelineOnly") === "true";
const environment = app.node.tryGetContext("environment") || getDefaultEnvironment();
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
    new frontend_stack_1.FrontendStack(app, `PawRushFrontend-${environment}`, {
        env: { account, region },
        environment,
        buildOutputPath,
        description: `PawRush static website hosting - ${environment}`,
    });
}
// Create pipeline stack (only if CodeConnection ARN is provided)
if (codeConnectionArn) {
    new pipeline_stack_1.PipelineStack(app, "PawRushPipelineStack", {
        env: { account, region },
        description: "CI/CD Pipeline for PawRush",
        codeConnectionArn,
        repositoryName,
        branchName,
    });
}
else if (pipelineOnly) {
    console.warn("⚠️  CodeConnection ARN not provided. Pipeline stack will not be created.");
    console.warn("   Create connection: See Step 1.9 in setup-codepipeline script");
}
// Global tags
cdk.Tags.of(app).add("Project", "PawRush");
cdk.Tags.of(app).add("ManagedBy", "CDK");
if (!pipelineOnly) {
    cdk.Tags.of(app).add("Environment", environment);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsaURBQXlDO0FBQ3pDLGlFQUE2RDtBQUM3RCwwREFBc0Q7QUFFdEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsd0JBQXdCO0FBQ3hCLE1BQU0scUJBQXFCLEdBQUcsR0FBVyxFQUFFO0lBQ3pDLElBQUksQ0FBQztRQUNILE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUEsd0JBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxRSxPQUFPLFdBQVcsUUFBUSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUFDLE1BQU0sQ0FBQztRQUNQLE9BQU8sZUFBZSxDQUFDO0lBQ3pCLENBQUM7QUFDSCxDQUFDLENBQUM7QUFFRixxQkFBcUI7QUFDckIsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3RFLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLElBQUksb0JBQW9CLENBQUM7QUFDeEYsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksTUFBTSxDQUFDO0FBQ2xFLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxLQUFLLE1BQU0sQ0FBQztBQUV2RSxNQUFNLFdBQVcsR0FDZixHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO0FBQ25FLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUM7QUFDaEQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxXQUFXLENBQUM7QUFFN0QsdUVBQXVFO0FBQ3ZFLE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFFBQVEsQ0FBQztBQUV4RSwyRUFBMkU7QUFDM0Usc0JBQXNCO0FBQ3RCLDJFQUEyRTtBQUMzRSw4Q0FBOEM7QUFDOUMsRUFBRTtBQUNGLHdDQUF3QztBQUN4Qyx5REFBeUQ7QUFDekQsK0NBQStDO0FBQy9DLHVEQUF1RDtBQUN2RCxFQUFFO0FBQ0YsdURBQXVEO0FBQ3ZELHVEQUF1RDtBQUN2RCxzRUFBc0U7QUFDdEUsc0VBQXNFO0FBQ3RFLEVBQUU7QUFDRixvQ0FBb0M7QUFDcEMsb0ZBQW9GO0FBQ3BGLG9FQUFvRTtBQUNwRSwyRUFBMkU7QUFFM0UseURBQXlEO0FBQ3pELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNsQixJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLG1CQUFtQixXQUFXLEVBQUUsRUFBRTtRQUN2RCxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO1FBQ3hCLFdBQVc7UUFDWCxlQUFlO1FBQ2YsV0FBVyxFQUFFLG9DQUFvQyxXQUFXLEVBQUU7S0FDL0QsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGlFQUFpRTtBQUNqRSxJQUFJLGlCQUFpQixFQUFFLENBQUM7SUFDdEIsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsRUFBRTtRQUM3QyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO1FBQ3hCLFdBQVcsRUFBRSw0QkFBNEI7UUFDekMsaUJBQWlCO1FBQ2pCLGNBQWM7UUFDZCxVQUFVO0tBQ1gsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztLQUFNLElBQUksWUFBWSxFQUFFLENBQUM7SUFDeEIsT0FBTyxDQUFDLElBQUksQ0FDViwwRUFBMEUsQ0FDM0UsQ0FBQztJQUNGLE9BQU8sQ0FBQyxJQUFJLENBQ1YsaUVBQWlFLENBQ2xFLENBQUM7QUFDSixDQUFDO0FBRUQsY0FBYztBQUNkLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDM0MsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN6QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNuRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0IFwic291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBGcm9udGVuZFN0YWNrIH0gZnJvbSBcIi4uL2xpYi9zdGFja3MvZnJvbnRlbmQtc3RhY2tcIjtcbmltcG9ydCB7IFBpcGVsaW5lU3RhY2sgfSBmcm9tIFwiLi4vbGliL3BpcGVsaW5lLXN0YWNrXCI7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIEVudmlyb25tZW50IGRldGVjdGlvblxuY29uc3QgZ2V0RGVmYXVsdEVudmlyb25tZW50ID0gKCk6IHN0cmluZyA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdXNlcm5hbWUgPSBwcm9jZXNzLmVudi5VU0VSIHx8IGV4ZWNTeW5jKCd3aG9hbWknKS50b1N0cmluZygpLnRyaW0oKTtcbiAgICByZXR1cm4gYHByZXZpZXctJHt1c2VybmFtZX1gO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gJ3ByZXZpZXctbG9jYWwnO1xuICB9XG59O1xuXG4vLyBHZXQgY29udGV4dCB2YWx1ZXNcbmNvbnN0IGNvZGVDb25uZWN0aW9uQXJuID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dChcImNvZGVDb25uZWN0aW9uQXJuXCIpO1xuY29uc3QgcmVwb3NpdG9yeU5hbWUgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KFwicmVwb3NpdG9yeU5hbWVcIikgfHwgXCJQYXdSdXNoL1Bhd1J1c2hBcHBcIjtcbmNvbnN0IGJyYW5jaE5hbWUgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KFwiYnJhbmNoTmFtZVwiKSB8fCBcIm1haW5cIjtcbmNvbnN0IHBpcGVsaW5lT25seSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoXCJwaXBlbGluZU9ubHlcIikgPT09IFwidHJ1ZVwiO1xuXG5jb25zdCBlbnZpcm9ubWVudCA9XG4gIGFwcC5ub2RlLnRyeUdldENvbnRleHQoXCJlbnZpcm9ubWVudFwiKSB8fCBnZXREZWZhdWx0RW52aXJvbm1lbnQoKTtcbmNvbnN0IGFjY291bnQgPSBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UO1xuY29uc3QgcmVnaW9uID0gcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIHx8IFwidXMtZWFzdC0xXCI7XG5cbi8vIEJ1aWxkIG91dHB1dCBwYXRoIChOZXh0LmpzIHN0YXRpYyBleHBvcnQgb3V0cHV0cyB0byAnb3V0JyBkaXJlY3RvcnkpXG5jb25zdCBidWlsZE91dHB1dFBhdGggPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KFwiYnVpbGRQYXRoXCIpIHx8IFwiLi4vb3V0XCI7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gREVQTE9ZTUVOVCBTVFJBVEVHWVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBUaGlzIENESyBhcHAgc3VwcG9ydHMgdHdvIGRlcGxveW1lbnQgbW9kZXM6XG4vL1xuLy8gMS4gUGlwZWxpbmUgTW9kZSAocGlwZWxpbmVPbmx5PXRydWUpOlxuLy8gICAgLSBDcmVhdGVzIE9OTFkgUGlwZWxpbmVTdGFjayAoQ0kvQ0QgaW5mcmFzdHJ1Y3R1cmUpXG4vLyAgICAtIFVzZWQgd2hlbiBkZXBsb3lpbmcgdGhlIHBpcGVsaW5lIGl0c2VsZlxuLy8gICAgLSBDb21tYW5kOiBjZGsgZGVwbG95IC0tY29udGV4dCBwaXBlbGluZU9ubHk9dHJ1ZVxuLy9cbi8vIDIuIEFwcGxpY2F0aW9uIE1vZGUgKHBpcGVsaW5lT25seT1mYWxzZSBvciBub3Qgc2V0KTpcbi8vICAgIC0gQ3JlYXRlcyBGcm9udGVuZFN0YWNrIGZvciBkZXYvcHJvZCBlbnZpcm9ubWVudHNcbi8vICAgIC0gVXNlZCBieSB0aGUgcGlwZWxpbmUncyBidWlsZHNwZWNzIHRvIGRlcGxveSBhcHBsaWNhdGlvbiBzdGFja3Ncbi8vICAgIC0gQWxzbyB1c2VkIGJ5IHJ1bi1kZXBsb3ltZW50LWFzc2lzdGFudCBmb3IgcHJldmlldyBlbnZpcm9ubWVudHNcbi8vXG4vLyBQcmV2aWV3IHZzIERldi9Qcm9kIGVudmlyb25tZW50czpcbi8vIC0gUHJldmlldyAocHJldmlldy08dXNlcm5hbWU+KTogQ3JlYXRlZCBieSBkZXBsb3ltZW50LWFzc2lzdGFudCBmb3IgbG9jYWwgdGVzdGluZ1xuLy8gLSBEZXYvUHJvZDogQ3JlYXRlZCBieSBUSElTIHBpcGVsaW5lIGZvciB0ZWFtLXNoYXJlZCBlbnZpcm9ubWVudHNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vLyBDcmVhdGUgZnJvbnRlbmQgc3RhY2sgKG9ubHkgaWYgbm90IHBpcGVsaW5lLW9ubHkgbW9kZSlcbmlmICghcGlwZWxpbmVPbmx5KSB7XG4gIG5ldyBGcm9udGVuZFN0YWNrKGFwcCwgYFBhd1J1c2hGcm9udGVuZC0ke2Vudmlyb25tZW50fWAsIHtcbiAgICBlbnY6IHsgYWNjb3VudCwgcmVnaW9uIH0sXG4gICAgZW52aXJvbm1lbnQsXG4gICAgYnVpbGRPdXRwdXRQYXRoLFxuICAgIGRlc2NyaXB0aW9uOiBgUGF3UnVzaCBzdGF0aWMgd2Vic2l0ZSBob3N0aW5nIC0gJHtlbnZpcm9ubWVudH1gLFxuICB9KTtcbn1cblxuLy8gQ3JlYXRlIHBpcGVsaW5lIHN0YWNrIChvbmx5IGlmIENvZGVDb25uZWN0aW9uIEFSTiBpcyBwcm92aWRlZClcbmlmIChjb2RlQ29ubmVjdGlvbkFybikge1xuICBuZXcgUGlwZWxpbmVTdGFjayhhcHAsIFwiUGF3UnVzaFBpcGVsaW5lU3RhY2tcIiwge1xuICAgIGVudjogeyBhY2NvdW50LCByZWdpb24gfSxcbiAgICBkZXNjcmlwdGlvbjogXCJDSS9DRCBQaXBlbGluZSBmb3IgUGF3UnVzaFwiLFxuICAgIGNvZGVDb25uZWN0aW9uQXJuLFxuICAgIHJlcG9zaXRvcnlOYW1lLFxuICAgIGJyYW5jaE5hbWUsXG4gIH0pO1xufSBlbHNlIGlmIChwaXBlbGluZU9ubHkpIHtcbiAgY29uc29sZS53YXJuKFxuICAgIFwi4pqg77iPICBDb2RlQ29ubmVjdGlvbiBBUk4gbm90IHByb3ZpZGVkLiBQaXBlbGluZSBzdGFjayB3aWxsIG5vdCBiZSBjcmVhdGVkLlwiLFxuICApO1xuICBjb25zb2xlLndhcm4oXG4gICAgXCIgICBDcmVhdGUgY29ubmVjdGlvbjogU2VlIFN0ZXAgMS45IGluIHNldHVwLWNvZGVwaXBlbGluZSBzY3JpcHRcIixcbiAgKTtcbn1cblxuLy8gR2xvYmFsIHRhZ3NcbmNkay5UYWdzLm9mKGFwcCkuYWRkKFwiUHJvamVjdFwiLCBcIlBhd1J1c2hcIik7XG5jZGsuVGFncy5vZihhcHApLmFkZChcIk1hbmFnZWRCeVwiLCBcIkNES1wiKTtcbmlmICghcGlwZWxpbmVPbmx5KSB7XG4gIGNkay5UYWdzLm9mKGFwcCkuYWRkKFwiRW52aXJvbm1lbnRcIiwgZW52aXJvbm1lbnQpO1xufVxuIl19