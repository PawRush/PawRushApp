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
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
class FrontendStack extends cdk.Stack {
    distributionDomainName;
    bucketName;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment, buildOutputPath } = props;
        // S3 bucket for static website (private)
        const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
            bucketName: `${id.toLowerCase()}-${this.account}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned: false,
        });
        // S3 bucket for logs
        const logBucket = new s3.Bucket(this, "LogBucket", {
            bucketName: `${id.toLowerCase()}-logs-${this.account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            publicReadAccess: false,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            lifecycleRules: [
                {
                    id: "DeleteOldLogs",
                    enabled: true,
                    expiration: environment === "prod" ? cdk.Duration.days(3650) : cdk.Duration.days(7),
                },
            ],
        });
        // CloudFront distribution
        const distribution = new cloudfront.Distribution(this, "Distribution", {
            comment: `${id} - ${environment}`,
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress: true,
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
            enableLogging: true,
            logBucket: logBucket,
            logFilePrefix: `cloudfront/${environment}/`,
            logIncludesCookies: false,
        });
        // Deploy website assets to S3
        const withAssets = this.node.tryGetContext("withAssets") !== "false";
        if (withAssets) {
            new s3deploy.BucketDeployment(this, "DeployWebsite", {
                sources: [s3deploy.Source.asset(buildOutputPath)],
                destinationBucket: websiteBucket,
                distribution,
                distributionPaths: ["/*"],
                prune: true,
                memoryLimit: 512,
            });
        }
        // Store for cross-stack reference
        this.distributionDomainName = distribution.distributionDomainName;
        this.bucketName = websiteBucket.bucketName;
        // Outputs
        new cdk.CfnOutput(this, "WebsiteURL", {
            value: `https://${distribution.distributionDomainName}`,
            description: "CloudFront distribution URL",
            exportName: `${id}-WebsiteURL`,
        });
        new cdk.CfnOutput(this, "BucketName", {
            value: websiteBucket.bucketName,
            description: "S3 bucket name",
            exportName: `${id}-BucketName`,
        });
        new cdk.CfnOutput(this, "DistributionId", {
            value: distribution.distributionId,
            description: "CloudFront distribution ID",
            exportName: `${id}-DistributionId`,
        });
        new cdk.CfnOutput(this, "DistributionDomainName", {
            value: distribution.distributionDomainName,
            description: "CloudFront domain name",
            exportName: `${id}-DistributionDomain`,
        });
        new cdk.CfnOutput(this, "LogBucketName", {
            value: logBucket.bucketName,
            description: "Bucket for logs",
            exportName: `${id}-LogBucket`,
        });
        // Tags
        cdk.Tags.of(this).add("Stack", "Frontend");
        cdk.Tags.of(this).add("Environment", environment);
    }
}
exports.FrontendStack = FrontendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmcm9udGVuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsdUVBQXlEO0FBQ3pELDRFQUE4RDtBQUM5RCx3RUFBMEQ7QUFRMUQsTUFBYSxhQUFjLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDMUIsc0JBQXNCLENBQVM7SUFDL0IsVUFBVSxDQUFTO0lBRW5DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBeUI7UUFDakUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFL0MseUNBQXlDO1FBQ3pDLE1BQU0sYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3pELFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pELGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxVQUFVLEVBQUUsSUFBSTtZQUNoQixTQUFTLEVBQUUsS0FBSztTQUNqQixDQUFDLENBQUM7UUFFSCxxQkFBcUI7UUFDckIsTUFBTSxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDakQsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLFdB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LEtBQUssRUFBRSxTQUFTLENBQUMsVUFBVTtZQUMzQixXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLFVBQVUsRUFBRSxHQUFHLEVBQUUsWUFBWTtTQUM5QixDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMzQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDRjtBQWxJRCxzQ0FrSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udFwiO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2luc1wiO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50XCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZyb250ZW5kU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgYnVpbGRPdXRwdXRQYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBGcm9udGVuZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGRpc3RyaWJ1dGlvbkRvbWFpbk5hbWU6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldE5hbWU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRnJvbnRlbmRTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50LCBidWlsZE91dHB1dFBhdGggfSA9IHByb3BzO1xuXG4gICAgLy8gUzMgYnVja2V0IGZvciBzdGF0aWMgd2Vic2l0ZSAocHJpdmF0ZSlcbiAgICBjb25zdCB3ZWJzaXRlQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIldlYnNpdGVCdWNrZXRcIiwge1xuICAgICAgYnVja2V0TmFtZTogYCR7aWQudG9Mb3dlckNhc2UoKX0tJHt0aGlzLmFjY291bnR9YCxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgICB2ZXJzaW9uZWQ6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gUzMgYnVja2V0IGZvciBsb2dzXG4gICAgY29uc3QgbG9nQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIkxvZ0J1Y2tldFwiLCB7XG4gICAgICBidWNrZXROYW1lOiBgJHtpZC50b0xvd2VyQ2FzZSgpfS1sb2dzLSR7dGhpcy5hY2NvdW50fWAsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgb2JqZWN0T3duZXJzaGlwOiBzMy5PYmplY3RPd25lcnNoaXAuQlVDS0VUX09XTkVSX1BSRUZFUlJFRCxcbiAgICAgIGFjY2Vzc0NvbnRyb2w6IHMzLkJ1Y2tldEFjY2Vzc0NvbnRyb2wuTE9HX0RFTElWRVJZX1dSSVRFLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcIkRlbGV0ZU9sZExvZ3NcIixcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIGV4cGlyYXRpb246IGVudmlyb25tZW50ID09PSBcInByb2RcIiA/IGNkay5EdXJhdGlvbi5kYXlzKDM2NTApIDogY2RrLkR1cmF0aW9uLmRheXMoNyksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRGcm9udCBkaXN0cmlidXRpb25cbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgXCJEaXN0cmlidXRpb25cIiwge1xuICAgICAgY29tbWVudDogYCR7aWR9IC0gJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogb3JpZ2lucy5TM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbCh3ZWJzaXRlQnVja2V0KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6XG4gICAgICAgICAgY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFEX09QVElPTlMsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogXCJpbmRleC5odG1sXCIsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6IFwiL2luZGV4Lmh0bWxcIixcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6IFwiL2luZGV4Lmh0bWxcIixcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHByaWNlQ2xhc3M6IGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsXG4gICAgICBlbmFibGVJcHY2OiB0cnVlLFxuICAgICAgaHR0cFZlcnNpb246IGNsb3VkZnJvbnQuSHR0cFZlcnNpb24uSFRUUDJfQU5EXzMsXG4gICAgICBtaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBjbG91ZGZyb250LlNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzJfMjAyMSxcbiAgICAgIGVuYWJsZUxvZ2dpbmc6IHRydWUsXG4gICAgICBsb2dCdWNrZXQ6IGxvZ0J1Y2tldCxcbiAgICAgIGxvZ0ZpbGVQcmVmaXg6IGBjbG91ZGZyb250LyR7ZW52aXJvbm1lbnR9L2AsXG4gICAgICBsb2dJbmNsdWRlc0Nvb2tpZXM6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gRGVwbG95IHdlYnNpdGUgYXNzZXRzIHRvIFMzXG4gICAgY29uc3Qgd2l0aEFzc2V0cyA9IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KFwid2l0aEFzc2V0c1wiKSAhPT0gXCJmYWxzZVwiO1xuICAgIGlmICh3aXRoQXNzZXRzKSB7XG4gICAgICBuZXcgczNkZXBsb3kuQnVja2V0RGVwbG95bWVudCh0aGlzLCBcIkRlcGxveVdlYnNpdGVcIiwge1xuICAgICAgICBzb3VyY2VzOiBbczNkZXBsb3kuU291cmNlLmFzc2V0KGJ1aWxkT3V0cHV0UGF0aCldLFxuICAgICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogd2Vic2l0ZUJ1Y2tldCxcbiAgICAgICAgZGlzdHJpYnV0aW9uLFxuICAgICAgICBkaXN0cmlidXRpb25QYXRoczogW1wiLypcIl0sXG4gICAgICAgIHBydW5lOiB0cnVlLFxuICAgICAgICBtZW1vcnlMaW1pdDogNTEyLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU3RvcmUgZm9yIGNyb3NzLXN0YWNrIHJlZmVyZW5jZVxuICAgIHRoaXMuZGlzdHJpYnV0aW9uRG9tYWluTmFtZSA9IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lO1xuICAgIHRoaXMuYnVja2V0TmFtZSA9IHdlYnNpdGVCdWNrZXQuYnVja2V0TmFtZTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIldlYnNpdGVVUkxcIiwge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkNsb3VkRnJvbnQgZGlzdHJpYnV0aW9uIFVSTFwiLFxuICAgICAgZXhwb3J0TmFtZTogYCR7aWR9LVdlYnNpdGVVUkxgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJCdWNrZXROYW1lXCIsIHtcbiAgICAgIHZhbHVlOiB3ZWJzaXRlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogXCJTMyBidWNrZXQgbmFtZVwiLFxuICAgICAgZXhwb3J0TmFtZTogYCR7aWR9LUJ1Y2tldE5hbWVgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJEaXN0cmlidXRpb25JZFwiLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gSURcIixcbiAgICAgIGV4cG9ydE5hbWU6IGAke2lkfS1EaXN0cmlidXRpb25JZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkRpc3RyaWJ1dGlvbkRvbWFpbk5hbWVcIiwge1xuICAgICAgdmFsdWU6IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ2xvdWRGcm9udCBkb21haW4gbmFtZVwiLFxuICAgICAgZXhwb3J0TmFtZTogYCR7aWR9LURpc3RyaWJ1dGlvbkRvbWFpbmAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkxvZ0J1Y2tldE5hbWVcIiwge1xuICAgICAgdmFsdWU6IGxvZ0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246IFwiQnVja2V0IGZvciBsb2dzXCIsXG4gICAgICBleHBvcnROYW1lOiBgJHtpZH0tTG9nQnVja2V0YCxcbiAgICB9KTtcblxuICAgIC8vIFRhZ3NcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoXCJTdGFja1wiLCBcIkZyb250ZW5kXCIpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZChcIkVudmlyb25tZW50XCIsIGVudmlyb25tZW50KTtcbiAgfVxufVxuIl19