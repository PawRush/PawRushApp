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
// Resolve deploymentId from CDK context; fall back to the default deployment ID
const deploymentId = app.node.tryGetContext("deploymentId") || "PawRushApp-1780584400";
new frontend_stack_1.FrontendStack(app, `FrontendStack-${deploymentId}`, {
    stackName: `FrontendStack-${deploymentId}`,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsMERBQXNEO0FBRXRELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLGdGQUFnRjtBQUNoRixNQUFNLFlBQVksR0FDaEIsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksdUJBQXVCLENBQUM7QUFFcEUsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsWUFBWSxFQUFFLEVBQUU7SUFDdEQsU0FBUyxFQUFFLGlCQUFpQixZQUFZLEVBQUU7Q0FDM0MsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0IFwic291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBGcm9udGVuZFN0YWNrIH0gZnJvbSBcIi4uL2xpYi9mcm9udGVuZC1zdGFja1wiO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG4vLyBSZXNvbHZlIGRlcGxveW1lbnRJZCBmcm9tIENESyBjb250ZXh0OyBmYWxsIGJhY2sgdG8gdGhlIGRlZmF1bHQgZGVwbG95bWVudCBJRFxuY29uc3QgZGVwbG95bWVudElkOiBzdHJpbmcgPVxuICBhcHAubm9kZS50cnlHZXRDb250ZXh0KFwiZGVwbG95bWVudElkXCIpIHx8IFwiUGF3UnVzaEFwcC0xNzgwNTg0NDAwXCI7XG5cbm5ldyBGcm9udGVuZFN0YWNrKGFwcCwgYEZyb250ZW5kU3RhY2stJHtkZXBsb3ltZW50SWR9YCwge1xuICBzdGFja05hbWU6IGBGcm9udGVuZFN0YWNrLSR7ZGVwbG95bWVudElkfWAsXG59KTtcbiJdfQ==