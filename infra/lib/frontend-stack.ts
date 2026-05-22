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

    // Retrieve deploymentId from CDK context for namespacing
    const deploymentId: string =
      this.node.tryGetContext("deploymentId") || "default";

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
    const urlRewriteFunction = new cloudfront.Function(
      this,
      "UrlRewriteFunction",
      {
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
      }
    );

    // ── CloudFront Distribution with OAC ─────────────────────────────────
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `Frontend distribution - ${deploymentId}`,
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
      minimumProtocolVersion:
        cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
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
