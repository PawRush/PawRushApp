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
        // Retrieve deploymentId from CDK context to namespace resource names
        const deploymentId = this.node.tryGetContext("deploymentId") || "default";
        // ---------------------------------------------------------------
        // S3 Bucket (private, auto-deleted on stack removal)
        // ---------------------------------------------------------------
        const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
            bucketName: `frontend-${deploymentId}-${this.account}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
        });
        // ---------------------------------------------------------------
        // CloudFront Function — SPA URL rewriting
        // Appends /index.html to requests that don't already have a file
        // extension, so client-side routing works correctly.
        // ---------------------------------------------------------------
        const spaRewriteFunction = new cloudfront.Function(this, "SpaRewriteFunction", {
            functionName: `spa-rewrite-${deploymentId}`,
            comment: "Rewrite URLs for SPA routing — append index.html",
            code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If the URI ends with '/', serve index.html
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  // If the URI has no file extension, append /index.html
  var lastSegment = uri.split('/').pop();
  if (lastSegment && !lastSegment.includes('.')) {
    request.uri = uri + '/index.html';
  }

  return request;
}
        `.trim()),
            runtime: cloudfront.FunctionRuntime.JS_2_0,
        });
        // ---------------------------------------------------------------
        // CloudFront Distribution with OAC
        // ---------------------------------------------------------------
        const distribution = new cloudfront.Distribution(this, "Distribution", {
            comment: `FrontendStack-${deploymentId}`,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress: true,
                functionAssociations: [
                    {
                        function: spaRewriteFunction,
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
        // ---------------------------------------------------------------
        // CloudFormation Outputs
        // ---------------------------------------------------------------
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
    }
}
exports.FrontendStack = FrontendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmcm9udGVuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsdUVBQXlEO0FBQ3pELDRFQUE4RDtBQUc5RCxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMxQixzQkFBc0IsQ0FBUztJQUMvQixVQUFVLENBQVM7SUFDbkIsY0FBYyxDQUFTO0lBRXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIscUVBQXFFO1FBQ3JFLE1BQU0sWUFBWSxHQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxTQUFTLENBQUM7UUFFdkQsa0VBQWtFO1FBQ2xFLHFEQUFxRDtRQUNyRCxrRUFBa0U7UUFDbEUsTUFBTSxhQUFhLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDekQsVUFBVSxFQUFFLFlBQVksWUFBWSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDdEQsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLFVBQVUsRUFBRSxJQUFJO1NBQ2pCLENBQUMsQ0FBQztRQUVILGtFQUFrRTtRQUNsRSwwQ0FBMEM7UUFDMUMsaUVBQWlFO1FBQ2pFLHFEQUFxRDtRQUNyRCxrRUFBa0U7UUFDbEUsTUFBTSxrQkFB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QUFFLHdCQUF3QixFQUFFO1lBQ2hELEtBQUssRUFBRSxZQUFZLENBQUMsc0JBQXNCO1lBQzFDLFdBQVcsRUFBRSxxQ0FBcUM7WUFDbEQsVUFBVSxFQUFFLEdBQUcsRUFBRSx5QkFBeUI7U0FDM0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaElELHNDQWdJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczNcIjtcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZGZyb250XCI7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuXG5leHBvcnQgY2xhc3MgRnJvbnRlbmRTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBkaXN0cmlidXRpb25Eb21haW5OYW1lOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXROYW1lOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBkaXN0cmlidXRpb25JZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFJldHJpZXZlIGRlcGxveW1lbnRJZCBmcm9tIENESyBjb250ZXh0IHRvIG5hbWVzcGFjZSByZXNvdXJjZSBuYW1lc1xuICAgIGNvbnN0IGRlcGxveW1lbnRJZDogc3RyaW5nID1cbiAgICAgIHRoaXMubm9kZS50cnlHZXRDb250ZXh0KFwiZGVwbG95bWVudElkXCIpIHx8IFwiZGVmYXVsdFwiO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gUzMgQnVja2V0IChwcml2YXRlLCBhdXRvLWRlbGV0ZWQgb24gc3RhY2sgcmVtb3ZhbClcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdCB3ZWJzaXRlQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIldlYnNpdGVCdWNrZXRcIiwge1xuICAgICAgYnVja2V0TmFtZTogYGZyb250ZW5kLSR7ZGVwbG95bWVudElkfS0ke3RoaXMuYWNjb3VudH1gLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIENsb3VkRnJvbnQgRnVuY3Rpb24g4oCUIFNQQSBVUkwgcmV3cml0aW5nXG4gICAgLy8gQXBwZW5kcyAvaW5kZXguaHRtbCB0byByZXF1ZXN0cyB0aGF0IGRvbid0IGFscmVhZHkgaGF2ZSBhIGZpbGVcbiAgICAvLyBleHRlbnNpb24sIHNvIGNsaWVudC1zaWRlIHJvdXRpbmcgd29ya3MgY29ycmVjdGx5LlxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0IHNwYVJld3JpdGVGdW5jdGlvbiA9IG5ldyBjbG91ZGZyb250LkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgIFwiU3BhUmV3cml0ZUZ1bmN0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogYHNwYS1yZXdyaXRlLSR7ZGVwbG95bWVudElkfWAsXG4gICAgICAgIGNvbW1lbnQ6IFwiUmV3cml0ZSBVUkxzIGZvciBTUEEgcm91dGluZyDigJQgYXBwZW5kIGluZGV4Lmh0bWxcIixcbiAgICAgICAgY29kZTogY2xvdWRmcm9udC5GdW5jdGlvbkNvZGUuZnJvbUlubGluZShgXG5mdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gIHZhciByZXF1ZXN0ID0gZXZlbnQucmVxdWVzdDtcbiAgdmFyIHVyaSA9IHJlcXVlc3QudXJpO1xuXG4gIC8vIElmIHRoZSBVUkkgZW5kcyB3aXRoICcvJywgc2VydmUgaW5kZXguaHRtbFxuICBpZiAodXJpLmVuZHNXaXRoKCcvJykpIHtcbiAgICByZXF1ZXN0LnVyaSA9IHVyaSArICdpbmRleC5odG1sJztcbiAgICByZXR1cm4gcmVxdWVzdDtcbiAgfVxuXG4gIC8vIElmIHRoZSBVUkkgaGFzIG5vIGZpbGUgZXh0ZW5zaW9uLCBhcHBlbmQgL2luZGV4Lmh0bWxcbiAgdmFyIGxhc3RTZWdtZW50ID0gdXJpLnNwbGl0KCcvJykucG9wKCk7XG4gIGlmIChsYXN0U2VnbWVudCAmJiAhbGFzdFNlZ21lbnQuaW5jbHVkZXMoJy4nKSkge1xuICAgIHJlcXVlc3QudXJpID0gdXJpICsgJy9pbmRleC5odG1sJztcbiAgfVxuXG4gIHJldHVybiByZXF1ZXN0O1xufVxuICAgICAgICBgLnRyaW0oKSksXG4gICAgICAgIHJ1bnRpbWU6IGNsb3VkZnJvbnQuRnVuY3Rpb25SdW50aW1lLkpTXzJfMCxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gd2l0aCBPQUNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgXCJEaXN0cmlidXRpb25cIiwge1xuICAgICAgY29tbWVudDogYEZyb250ZW5kU3RhY2stJHtkZXBsb3ltZW50SWR9YCxcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IG9yaWdpbnMuUzNCdWNrZXRPcmlnaW4ud2l0aE9yaWdpbkFjY2Vzc0NvbnRyb2wod2Vic2l0ZUJ1Y2tldCksXG4gICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OlxuICAgICAgICAgIGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFEX09QVElPTlMsXG4gICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRF9PUFRJT05TLFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICAgIGZ1bmN0aW9uQXNzb2NpYXRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZnVuY3Rpb246IHNwYVJld3JpdGVGdW5jdGlvbixcbiAgICAgICAgICAgIGV2ZW50VHlwZTogY2xvdWRmcm9udC5GdW5jdGlvbkV2ZW50VHlwZS5WSUVXRVJfUkVRVUVTVCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiBcImluZGV4Lmh0bWxcIixcbiAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvaW5kZXguaHRtbFwiLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDQsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvaW5kZXguaHRtbFwiLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcbiAgICAgIGVuYWJsZUlwdjY6IHRydWUsXG4gICAgICBodHRwVmVyc2lvbjogY2xvdWRmcm9udC5IdHRwVmVyc2lvbi5IVFRQMl9BTkRfMyxcbiAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246XG4gICAgICAgIGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDIxLFxuICAgIH0pO1xuXG4gICAgLy8gU3RvcmUgcHVibGljIHByb3BlcnRpZXNcbiAgICB0aGlzLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWUgPSBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZTtcbiAgICB0aGlzLmJ1Y2tldE5hbWUgPSB3ZWJzaXRlQnVja2V0LmJ1Y2tldE5hbWU7XG4gICAgdGhpcy5kaXN0cmlidXRpb25JZCA9IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25JZDtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIENsb3VkRm9ybWF0aW9uIE91dHB1dHNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkJ1Y2tldE5hbWVcIiwge1xuICAgICAgdmFsdWU6IHdlYnNpdGVCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlMzIGJ1Y2tldCBuYW1lIGZvciBzdGF0aWMgYXNzZXRzXCIsXG4gICAgICBleHBvcnROYW1lOiBgJHtpZH0tQnVja2V0TmFtZWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkRpc3RyaWJ1dGlvbklkXCIsIHtcbiAgICAgIHZhbHVlOiBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICBkZXNjcmlwdGlvbjogXCJDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiBJRFwiLFxuICAgICAgZXhwb3J0TmFtZTogYCR7aWR9LURpc3RyaWJ1dGlvbklkYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiRGlzdHJpYnV0aW9uRG9tYWluTmFtZVwiLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogXCJDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiBkb21haW4gbmFtZVwiLFxuICAgICAgZXhwb3J0TmFtZTogYCR7aWR9LURpc3RyaWJ1dGlvbkRvbWFpbk5hbWVgLFxuICAgIH0pO1xuICB9XG59XG4iXX0=