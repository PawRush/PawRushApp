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
// Retrieve deploymentId from CDK context — used to namespace resource names
// and prevent stack-name collisions when multiple deployments run concurrently.
const deploymentId = app.node.tryGetContext("deploymentId") || "default";
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "us-east-1";
// Instantiate the FrontendStack with a deployment-specific CloudFormation
// stack name so concurrent deployments never collide.
new frontend_stack_1.FrontendStack(app, `FrontendStack-${deploymentId}`, {
    stackName: `FrontendStack-${deploymentId}`,
    env: { account, region },
    description: `Frontend static hosting stack for deployment ${deploymentId}`,
});
// Global tags
cdk.Tags.of(app).add("Project", "PawRush");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("DeploymentId", deploymentId);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsMERBQXNEO0FBRXRELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLDRFQUE0RTtBQUM1RSxnRkFBZ0Y7QUFDaEYsTUFBTSxZQUFZLEdBQ2hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUV0RCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksV0FBVyxDQUFDO0FBRTdELDBFQUEwRTtBQUMxRSxzREFBc0Q7QUFDdEQsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsWUFBWSxFQUFFLEVBQUU7SUFDdEQsU0FBUyxFQUFFLGlCQUFpQixZQUFZLEVBQUU7SUFDMUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtJQUN4QixXQUFXLEVBQUUsZ0RBQWdELFlBQVksRUFBRTtDQUM1RSxDQUFDLENBQUM7QUFFSCxjQUFjO0FBQ2QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgXCJzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXJcIjtcbmltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7IEZyb250ZW5kU3RhY2sgfSBmcm9tIFwiLi4vbGliL2Zyb250ZW5kLXN0YWNrXCI7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIFJldHJpZXZlIGRlcGxveW1lbnRJZCBmcm9tIENESyBjb250ZXh0IOKAlCB1c2VkIHRvIG5hbWVzcGFjZSByZXNvdXJjZSBuYW1lc1xuLy8gYW5kIHByZXZlbnQgc3RhY2stbmFtZSBjb2xsaXNpb25zIHdoZW4gbXVsdGlwbGUgZGVwbG95bWVudHMgcnVuIGNvbmN1cnJlbnRseS5cbmNvbnN0IGRlcGxveW1lbnRJZDogc3RyaW5nID1cbiAgYXBwLm5vZGUudHJ5R2V0Q29udGV4dChcImRlcGxveW1lbnRJZFwiKSB8fCBcImRlZmF1bHRcIjtcblxuY29uc3QgYWNjb3VudCA9IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQ7XG5jb25zdCByZWdpb24gPSBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgXCJ1cy1lYXN0LTFcIjtcblxuLy8gSW5zdGFudGlhdGUgdGhlIEZyb250ZW5kU3RhY2sgd2l0aCBhIGRlcGxveW1lbnQtc3BlY2lmaWMgQ2xvdWRGb3JtYXRpb25cbi8vIHN0YWNrIG5hbWUgc28gY29uY3VycmVudCBkZXBsb3ltZW50cyBuZXZlciBjb2xsaWRlLlxubmV3IEZyb250ZW5kU3RhY2soYXBwLCBgRnJvbnRlbmRTdGFjay0ke2RlcGxveW1lbnRJZH1gLCB7XG4gIHN0YWNrTmFtZTogYEZyb250ZW5kU3RhY2stJHtkZXBsb3ltZW50SWR9YCxcbiAgZW52OiB7IGFjY291bnQsIHJlZ2lvbiB9LFxuICBkZXNjcmlwdGlvbjogYEZyb250ZW5kIHN0YXRpYyBob3N0aW5nIHN0YWNrIGZvciBkZXBsb3ltZW50ICR7ZGVwbG95bWVudElkfWAsXG59KTtcblxuLy8gR2xvYmFsIHRhZ3NcbmNkay5UYWdzLm9mKGFwcCkuYWRkKFwiUHJvamVjdFwiLCBcIlBhd1J1c2hcIik7XG5jZGsuVGFncy5vZihhcHApLmFkZChcIk1hbmFnZWRCeVwiLCBcIkNES1wiKTtcbmNkay5UYWdzLm9mKGFwcCkuYWRkKFwiRGVwbG95bWVudElkXCIsIGRlcGxveW1lbnRJZCk7XG4iXX0=