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
const frontend_stack_1 = require("../lib/frontend-stack");
const app = new cdk.App();
// Retrieve deploymentId from CDK context — used to namespace stack and resource names
// Usage: cdk synth --context deploymentId=my-preview
const deploymentId = app.node.tryGetContext("deploymentId") || "default";
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "us-east-1";
// Instantiate the FrontendStack with a deployment-specific CloudFormation stack
// name to prevent collisions when multiple deployments run concurrently.
new frontend_stack_1.FrontendStack(app, `FrontendStack-${deploymentId}`, {
    stackName: `FrontendStack-${deploymentId}`,
    env: { account, region },
    description: `Frontend static hosting stack for deployment: ${deploymentId}`,
});
// Global tags
cdk.Tags.of(app).add("Project", "PawRush");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("DeploymentId", deploymentId);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsMERBQXNEO0FBRXRELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLHNGQUFzRjtBQUN0RixxREFBcUQ7QUFDckQsTUFBTSxZQUFZLEdBQ2hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUV0RCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksV0FBVyxDQUFDO0FBRTdELGdGQUFnRjtBQUNoRix5RUFBeUU7QUFDekUsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsWUFBWSxFQUFFLEVBQUU7SUFDdEQsU0FBUyxFQUFFLGlCQUFpQixZQUFZLEVBQUU7SUFDMUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtJQUN4QixXQUFXLEVBQUUsaURBQWlELFlBQVksRUFBRTtDQUM3RSxDQUFDLENBQUM7QUFFSCxjQUFjO0FBQ2QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgXCJzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXJcIjtcbmltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7IEZyb250ZW5kU3RhY2sgfSBmcm9tIFwiLi4vbGliL2Zyb250ZW5kLXN0YWNrXCI7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIFJldHJpZXZlIGRlcGxveW1lbnRJZCBmcm9tIENESyBjb250ZXh0IOKAlCB1c2VkIHRvIG5hbWVzcGFjZSBzdGFjayBhbmQgcmVzb3VyY2UgbmFtZXNcbi8vIFVzYWdlOiBjZGsgc3ludGggLS1jb250ZXh0IGRlcGxveW1lbnRJZD1teS1wcmV2aWV3XG5jb25zdCBkZXBsb3ltZW50SWQ6IHN0cmluZyA9XG4gIGFwcC5ub2RlLnRyeUdldENvbnRleHQoXCJkZXBsb3ltZW50SWRcIikgfHwgXCJkZWZhdWx0XCI7XG5cbmNvbnN0IGFjY291bnQgPSBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UO1xuY29uc3QgcmVnaW9uID0gcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIHx8IFwidXMtZWFzdC0xXCI7XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBGcm9udGVuZFN0YWNrIHdpdGggYSBkZXBsb3ltZW50LXNwZWNpZmljIENsb3VkRm9ybWF0aW9uIHN0YWNrXG4vLyBuYW1lIHRvIHByZXZlbnQgY29sbGlzaW9ucyB3aGVuIG11bHRpcGxlIGRlcGxveW1lbnRzIHJ1biBjb25jdXJyZW50bHkuXG5uZXcgRnJvbnRlbmRTdGFjayhhcHAsIGBGcm9udGVuZFN0YWNrLSR7ZGVwbG95bWVudElkfWAsIHtcbiAgc3RhY2tOYW1lOiBgRnJvbnRlbmRTdGFjay0ke2RlcGxveW1lbnRJZH1gLFxuICBlbnY6IHsgYWNjb3VudCwgcmVnaW9uIH0sXG4gIGRlc2NyaXB0aW9uOiBgRnJvbnRlbmQgc3RhdGljIGhvc3Rpbmcgc3RhY2sgZm9yIGRlcGxveW1lbnQ6ICR7ZGVwbG95bWVudElkfWAsXG59KTtcblxuLy8gR2xvYmFsIHRhZ3NcbmNkay5UYWdzLm9mKGFwcCkuYWRkKFwiUHJvamVjdFwiLCBcIlBhd1J1c2hcIik7XG5jZGsuVGFncy5vZihhcHApLmFkZChcIk1hbmFnZWRCeVwiLCBcIkNES1wiKTtcbmNkay5UYWdzLm9mKGFwcCkuYWRkKFwiRGVwbG95bWVudElkXCIsIGRlcGxveW1lbnRJZCk7XG4iXX0=