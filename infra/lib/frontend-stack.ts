import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Retrieve deploymentId from CDK context for namespacing resources
    const deploymentId: string =
      this.node.tryGetContext("deploymentId") ?? "default";

    // -------------------------------------------------------------------------
    // S3 Bucket – private, cleaned up automatically on stack deletion
    // No explicit bucketName: CDK generates a unique, valid name automatically.
    // -------------------------------------------------------------------------
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // -------------------------------------------------------------------------
    // CloudFront Function – SPA URL rewriting
    // Rewrites paths that have no file extension to append /index.html so that
    // the S3 origin always receives a valid object key.
    // -------------------------------------------------------------------------
    const spaRewriteFunction = new cloudfront.Function(
      this,
      "SpaRewriteFunction",
      {
        functionName: `spa-rewrite-${deploymentId}`,
        comment: `SPA index.html rewrite for deployment ${deploymentId}`,
        code: cloudfront.FunctionCode.fromInline(
          [
            "function handler(event) {",
            "  var request = event.request;",
            "  var uri = request.uri;",
            "  // If the URI has a file extension, pass through unchanged",
            "  if (uri.match(/\\.[a-zA-Z0-9]+$/)) {",
            "    return request;",
            "  }",
            "  // Append index.html for SPA routes",
            "  if (uri.endsWith('/')) {",
            "    request.uri = uri + 'index.html';",
            "  } else {",
            "    request.uri = uri + '/index.html';",
            "  }",
            "  return request;",
            "}",
          ].join("\n")
        ),
        runtime: cloudfront.FunctionRuntime.JS_2_0,
      }
    );

    // -------------------------------------------------------------------------
    // CloudFront Distribution with OAC
    // -------------------------------------------------------------------------
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `FrontendStack-${deploymentId}`,
      defaultBehavior: {
        // withOriginAccessControl uses OAC (Origin Access Control)
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

    // -------------------------------------------------------------------------
    // Stack Outputs
    // -------------------------------------------------------------------------
    new cdk.CfnOutput(this, "BucketName", {
      value: websiteBucket.bucketName,
      description: "S3 bucket name for the static website",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      description: "CloudFront distribution ID",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain name",
    });
  }
}
