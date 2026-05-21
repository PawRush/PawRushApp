import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

export class FrontendStack extends cdk.Stack {
  public readonly distributionDomainName: string;
  public readonly bucketName: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Resolve deploymentId from CDK context
    const deploymentId: string =
      this.node.tryGetContext("deploymentId") || id;

    // ----------------------------------------------------------------
    // S3 bucket – private, no public access
    // ----------------------------------------------------------------
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `frontend-${deploymentId.toLowerCase()}-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // ----------------------------------------------------------------
    // CloudFront Function – SPA URL rewriting
    // Appends /index.html to requests that do not have a file extension
    // so that direct navigation to sub-routes works correctly.
    // ----------------------------------------------------------------
    const spaRewriteFunction = new cloudfront.Function(
      this,
      "SpaRewriteFunction",
      {
        functionName: `spa-rewrite-${deploymentId}`,
        comment: "Append index.html for SPA routing",
        runtime: cloudfront.FunctionRuntime.JS_2_0,
        code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If the URI has no file extension, serve index.html
  if (!uri.includes('.') || uri.endsWith('/')) {
    request.uri = '/index.html';
  }

  return request;
}
`),
      }
    );

    // ----------------------------------------------------------------
    // CloudFront distribution with OAC (Origin Access Control)
    // ----------------------------------------------------------------
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `Frontend distribution – ${deploymentId}`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
      minimumProtocolVersion:
        cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Store for cross-stack reference
    this.distributionDomainName = distribution.distributionDomainName;
    this.bucketName = websiteBucket.bucketName;
    this.distributionId = distribution.distributionId;

    // ----------------------------------------------------------------
    // CfnOutputs
    // ----------------------------------------------------------------
    new cdk.CfnOutput(this, "BucketName", {
      value: websiteBucket.bucketName,
      description: "S3 bucket name for static assets",
      exportName: `${deploymentId}-BucketName`,
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      description: "CloudFront distribution ID",
      exportName: `${deploymentId}-DistributionId`,
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront domain name",
      exportName: `${deploymentId}-DistributionDomainName`,
    });

    // Tags
    cdk.Tags.of(this).add("Stack", "Frontend");
    cdk.Tags.of(this).add("DeploymentId", deploymentId);
  }
}
