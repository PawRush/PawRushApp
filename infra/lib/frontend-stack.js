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
exports.FrontendStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
class FrontendStack extends cdk.Stack {
    distributionDomainName;
    bucketName;
    distributionId;
    constructor(scope, id, props) {
        super(scope, id, props);
        // Retrieve deploymentId from CDK context for namespacing
        const deploymentId = this.node.tryGetContext("deploymentId") || "default";
        // ── S3 bucket (private, with auto-delete for easy teardown) ──────────
        const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
            bucketName: `frontend-${deploymentId}-${this.account}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned: false,
        });
        // ── CloudFront Function for SPA URL rewriting ─────────────────────────
        // Rewrites requests that don't have a file extension (no dot in the last
        // path segment) to append /index.html so that Next.js static-export
        // routes like /book or /confirmation are served correctly.
        const urlRewriteFunction = new cloudfront.Function(this, "UrlRewriteFunction", {
            functionName: `url-rewrite-${deploymentId}`,
            comment: "Append index.html for SPA routing",
            code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If the URI ends with '/' append 'index.html'
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  }
  // If the URI has no file extension, append '/index.html'
  else if (!uri.includes('.', uri.lastIndexOf('/'))) {
    request.uri = uri + '/index.html';
  }

  return request;
}
        `),
            runtime: cloudfront.FunctionRuntime.JS_2_0,
        });
        // ── CloudFront Distribution with OAC ─────────────────────────────────
        const distribution = new cloudfront.Distribution(this, "Distribution", {
            comment: `Frontend distribution - ${deploymentId}`,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress: true,
                functionAssociations: [
                    {
                        function: urlRewriteFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    },
                ],
            },
            defaultRootObject: "index.html",
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                    ttl: cdk.Duration.minutes(5),
                },
            ],
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            enableIpv6: true,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        });
        // Store public properties
        this.distributionDomainName = distribution.distributionDomainName;
        this.bucketName = websiteBucket.bucketName;
        this.distributionId = distribution.distributionId;
        // ── CfnOutputs ────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, "BucketName", {
            value: websiteBucket.bucketName,
            description: "S3 bucket name for static assets",
            exportName: `${id}-BucketName`,
        });
        new cdk.CfnOutput(this, "DistributionId", {
            value: distribution.distributionId,
            description: "CloudFront distribution ID",
            exportName: `${id}-DistributionId`,
        });
        new cdk.CfnOutput(this, "DistributionDomainName", {
            value: distribution.distributionDomainName,
            description: "CloudFront distribution domain name",
            exportName: `${id}-DistributionDomainName`,
        });
        // Tags
        cdk.Tags.of(this).add("Stack", "Frontend");
        cdk.Tags.of(this).add("DeploymentId", deploymentId);
    }
}
exports.FrontendStack = FrontendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmcm9udGVuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsdUVBQXlEO0FBQ3pELDRFQUE4RDtBQUc5RCxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMxQixzQkFBc0IsQ0FBUztJQUMvQixVQUFVLENBQVM7SUFDbkIsY0FBYyxDQUFTO0lBRXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIseURBQXlEO1FBQ3pELE1BQU0sWUFBWSxHQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxTQUFTLENBQUM7UUFFdkQsd0VBQXdFO1FBQ3hFLE1BQU0sYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3pELFVBQVUsRUFBRSxZQUFZLFlBQVksSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ3RELGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxVQUFVLEVBQUUsSUFBSTtZQUNoQixTQUFTLEVBQUUsS0FBSztTQUNqQixDQUFDLENBQUM7UUFFSCx5RUFBeUU7UUFDekUseUVBQXlFO1FBQ3pFLG9FQUFvRTtRQUNwRSwyREFBMkQ7UUFDM0QsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLFVBQVUs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R0FBRyxFQUFFLHlCQUF5QjtTQUMzQyxDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMzQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3RELENBQUM7Q0FDRjtBQTNIRCxzQ0EySEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udFwiO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2luc1wiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuZXhwb3J0IGNsYXNzIEZyb250ZW5kU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgZGlzdHJpYnV0aW9uRG9tYWluTmFtZTogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0TmFtZTogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgZGlzdHJpYnV0aW9uSWQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBSZXRyaWV2ZSBkZXBsb3ltZW50SWQgZnJvbSBDREsgY29udGV4dCBmb3IgbmFtZXNwYWNpbmdcbiAgICBjb25zdCBkZXBsb3ltZW50SWQ6IHN0cmluZyA9XG4gICAgICB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dChcImRlcGxveW1lbnRJZFwiKSB8fCBcImRlZmF1bHRcIjtcblxuICAgIC8vIOKUgOKUgCBTMyBidWNrZXQgKHByaXZhdGUsIHdpdGggYXV0by1kZWxldGUgZm9yIGVhc3kgdGVhcmRvd24pIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgIGNvbnN0IHdlYnNpdGVCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiV2Vic2l0ZUJ1Y2tldFwiLCB7XG4gICAgICBidWNrZXROYW1lOiBgZnJvbnRlbmQtJHtkZXBsb3ltZW50SWR9LSR7dGhpcy5hY2NvdW50fWAsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIOKUgOKUgCBDbG91ZEZyb250IEZ1bmN0aW9uIGZvciBTUEEgVVJMIHJld3JpdGluZyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICAvLyBSZXdyaXRlcyByZXF1ZXN0cyB0aGF0IGRvbid0IGhhdmUgYSBmaWxlIGV4dGVuc2lvbiAobm8gZG90IGluIHRoZSBsYXN0XG4gICAgLy8gcGF0aCBzZWdtZW50KSB0byBhcHBlbmQgL2luZGV4Lmh0bWwgc28gdGhhdCBOZXh0LmpzIHN0YXRpYy1leHBvcnRcbiAgICAvLyByb3V0ZXMgbGlrZSAvYm9vayBvciAvY29uZmlybWF0aW9uIGFyZSBzZXJ2ZWQgY29ycmVjdGx5LlxuICAgIGNvbnN0IHVybFJld3JpdGVGdW5jdGlvbiA9IG5ldyBjbG91ZGZyb250LkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgIFwiVXJsUmV3cml0ZUZ1bmN0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogYHVybC1yZXdyaXRlLSR7ZGVwbG95bWVudElkfWAsXG4gICAgICAgIGNvbW1lbnQ6IFwiQXBwZW5kIGluZGV4Lmh0bWwgZm9yIFNQQSByb3V0aW5nXCIsXG4gICAgICAgIGNvZGU6IGNsb3VkZnJvbnQuRnVuY3Rpb25Db2RlLmZyb21JbmxpbmUoYFxuZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICB2YXIgcmVxdWVzdCA9IGV2ZW50LnJlcXVlc3Q7XG4gIHZhciB1cmkgPSByZXF1ZXN0LnVyaTtcblxuICAvLyBJZiB0aGUgVVJJIGVuZHMgd2l0aCAnLycgYXBwZW5kICdpbmRleC5odG1sJ1xuICBpZiAodXJpLmVuZHNXaXRoKCcvJykpIHtcbiAgICByZXF1ZXN0LnVyaSA9IHVyaSArICdpbmRleC5odG1sJztcbiAgfVxuICAvLyBJZiB0aGUgVVJJIGhhcyBubyBmaWxlIGV4dGVuc2lvbiwgYXBwZW5kICcvaW5kZXguaHRtbCdcbiAgZWxzZSBpZiAoIXVyaS5pbmNsdWRlcygnLicsIHVyaS5sYXN0SW5kZXhPZignLycpKSkge1xuICAgIHJlcXVlc3QudXJpID0gdXJpICsgJy9pbmRleC5odG1sJztcbiAgfVxuXG4gIHJldHVybiByZXF1ZXN0O1xufVxuICAgICAgICBgKSxcbiAgICAgICAgcnVudGltZTogY2xvdWRmcm9udC5GdW5jdGlvblJ1bnRpbWUuSlNfMl8wLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyDilIDilIAgQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gd2l0aCBPQUMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsIFwiRGlzdHJpYnV0aW9uXCIsIHtcbiAgICAgIGNvbW1lbnQ6IGBGcm9udGVuZCBkaXN0cmlidXRpb24gLSAke2RlcGxveW1lbnRJZH1gLFxuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogb3JpZ2lucy5TM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbCh3ZWJzaXRlQnVja2V0KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6XG4gICAgICAgICAgY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFEX09QVElPTlMsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgZnVuY3Rpb25Bc3NvY2lhdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmdW5jdGlvbjogdXJsUmV3cml0ZUZ1bmN0aW9uLFxuICAgICAgICAgICAgZXZlbnRUeXBlOiBjbG91ZGZyb250LkZ1bmN0aW9uRXZlbnRUeXBlLlZJRVdFUl9SRVFVRVNULFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6IFwiaW5kZXguaHRtbFwiLFxuICAgICAgZXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiBcIi9pbmRleC5odG1sXCIsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiBcIi9pbmRleC5odG1sXCIsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBwcmljZUNsYXNzOiBjbG91ZGZyb250LlByaWNlQ2xhc3MuUFJJQ0VfQ0xBU1NfMTAwLFxuICAgICAgZW5hYmxlSXB2NjogdHJ1ZSxcbiAgICAgIGh0dHBWZXJzaW9uOiBjbG91ZGZyb250Lkh0dHBWZXJzaW9uLkhUVFAyX0FORF8zLFxuICAgICAgbWluaW11bVByb3RvY29sVmVyc2lvbjpcbiAgICAgICAgY2xvdWRmcm9udC5TZWN1cml0eVBvbGljeVByb3RvY29sLlRMU19WMV8yXzIwMjEsXG4gICAgfSk7XG5cbiAgICAvLyBTdG9yZSBwdWJsaWMgcHJvcGVydGllc1xuICAgIHRoaXMuZGlzdHJpYnV0aW9uRG9tYWluTmFtZSA9IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lO1xuICAgIHRoaXMuYnVja2V0TmFtZSA9IHdlYnNpdGVCdWNrZXQuYnVja2V0TmFtZTtcbiAgICB0aGlzLmRpc3RyaWJ1dGlvbklkID0gZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkO1xuXG4gICAgLy8g4pSA4pSAIENmbk91dHB1dHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJCdWNrZXROYW1lXCIsIHtcbiAgICAgIHZhbHVlOiB3ZWJzaXRlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogXCJTMyBidWNrZXQgbmFtZSBmb3Igc3RhdGljIGFzc2V0c1wiLFxuICAgICAgZXhwb3J0TmFtZTogYCR7aWR9LUJ1Y2tldE5hbWVgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJEaXN0cmlidXRpb25JZFwiLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gSURcIixcbiAgICAgIGV4cG9ydE5hbWU6IGAke2lkfS1EaXN0cmlidXRpb25JZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkRpc3RyaWJ1dGlvbkRvbWFpbk5hbWVcIiwge1xuICAgICAgdmFsdWU6IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gZG9tYWluIG5hbWVcIixcbiAgICAgIGV4cG9ydE5hbWU6IGAke2lkfS1EaXN0cmlidXRpb25Eb21haW5OYW1lYCxcbiAgICB9KTtcblxuICAgIC8vIFRhZ3NcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoXCJTdGFja1wiLCBcIkZyb250ZW5kXCIpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZChcIkRlcGxveW1lbnRJZFwiLCBkZXBsb3ltZW50SWQpO1xuICB9XG59XG4iXX0=