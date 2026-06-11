import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Retrieve deployment ID from CDK context
    const deploymentId: string =
      scope.node.tryGetContext("deploymentId") || id;

    // ----------------------------------------------------------------
    // S3 Bucket (private, auto-deleted on stack removal)
    // ----------------------------------------------------------------
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `frontend-${deploymentId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // ----------------------------------------------------------------
    // CloudFront Function – SPA URL rewriting (append index.html)
    // ----------------------------------------------------------------
    const spaRewriteFunction = new cloudfront.Function(
      this,
      "SpaRewriteFunction",
      {
        functionName: `spa-rewrite-${deploymentId.replace(/[^a-zA-Z0-9-]/g, "-")}`,
        comment: "Rewrite clean URLs to index.html for SPA routing",
        code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If the URI has no file extension, or ends with '/', append index.html
  if (!uri.match(/\\/[^/]+\\.[^/]+$/) || uri.endsWith('/')) {
    if (uri.endsWith('/')) {
      request.uri = uri + 'index.html';
    } else {
      request.uri = uri + '/index.html';
    }
  }

  return request;
}
        `),
        runtime: cloudfront.FunctionRuntime.JS_2_0,
      }
    );

    // ----------------------------------------------------------------
    // CloudFront Distribution with OAC
    // ----------------------------------------------------------------
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `FrontendStack-${deploymentId}`,
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

    // ----------------------------------------------------------------
    // CfnOutputs
    // ----------------------------------------------------------------
    new cdk.CfnOutput(this, "BucketName", {
      value: websiteBucket.bucketName,
      description: "S3 bucket name for website assets",
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
