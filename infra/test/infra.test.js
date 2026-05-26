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
const cdk = __importStar(require("aws-cdk-lib"));
const assertions_1 = require("aws-cdk-lib/assertions");
const frontend_stack_1 = require("../lib/frontend-stack");
test('FrontendStack creates S3 bucket and CloudFront distribution', () => {
    const app = new cdk.App({
        context: { deploymentId: 'test' },
    });
    const stack = new frontend_stack_1.FrontendStack(app, 'FrontendStack-test', {
        stackName: 'FrontendStack-test',
    });
    const template = assertions_1.Template.fromStack(stack);
    // S3 bucket should exist with no public access
    template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
        },
    });
    // CloudFront distribution should exist
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    // CloudFront Function for SPA rewriting
    template.resourceCountIs('AWS::CloudFront::Function', 1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmEudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluZnJhLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBa0Q7QUFDbEQsMERBQXNEO0FBRXRELElBQUksQ0FBQyw2REFBNkQsRUFBRSxHQUFHLEVBQUU7SUFDdkUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ3RCLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUU7S0FDbEMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxLQUFLLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxvQkFBb0IsRUFBRTtRQUN6RCxTQUFTLEVBQUUsb0JBQW9CO0tBQ2hDLENBQUMsQ0FBQztJQUNILE1BQU0sUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTNDLCtDQUErQztJQUMvQyxRQUFRLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUU7UUFDaEQsOEJBQThCLEVBQUU7WUFDOUIsZUFBZSxFQUFFLElBQUk7WUFDckIsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLHFCQUFxQixFQUFFLElBQUk7U0FDNUI7S0FDRixDQUFDLENBQUM7SUFFSCx1Q0FBdUM7SUFDdkMsUUFBUSxDQUFDLGVBQWUsQ0FBQywrQkFBK0IsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU3RCx3Q0FBd0M7SUFDeEMsUUFBUSxDQUFDLGVBQWUsQ0FBQywyQkFBMkIsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgRnJvbnRlbmRTdGFjayB9IGZyb20gJy4uL2xpYi9mcm9udGVuZC1zdGFjayc7XG5cbnRlc3QoJ0Zyb250ZW5kU3RhY2sgY3JlYXRlcyBTMyBidWNrZXQgYW5kIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uJywgKCkgPT4ge1xuICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCh7XG4gICAgY29udGV4dDogeyBkZXBsb3ltZW50SWQ6ICd0ZXN0JyB9LFxuICB9KTtcbiAgY29uc3Qgc3RhY2sgPSBuZXcgRnJvbnRlbmRTdGFjayhhcHAsICdGcm9udGVuZFN0YWNrLXRlc3QnLCB7XG4gICAgc3RhY2tOYW1lOiAnRnJvbnRlbmRTdGFjay10ZXN0JyxcbiAgfSk7XG4gIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICAvLyBTMyBidWNrZXQgc2hvdWxkIGV4aXN0IHdpdGggbm8gcHVibGljIGFjY2Vzc1xuICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcbiAgICBQdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZ3VyYXRpb246IHtcbiAgICAgIEJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgIEJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgSWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgIFJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICB9LFxuICB9KTtcblxuICAvLyBDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiBzaG91bGQgZXhpc3RcbiAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkNsb3VkRnJvbnQ6OkRpc3RyaWJ1dGlvbicsIDEpO1xuXG4gIC8vIENsb3VkRnJvbnQgRnVuY3Rpb24gZm9yIFNQQSByZXdyaXRpbmdcbiAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkNsb3VkRnJvbnQ6OkZ1bmN0aW9uJywgMSk7XG59KTtcbiJdfQ==