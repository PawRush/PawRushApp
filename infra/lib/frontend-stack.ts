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

    // Read deploymentId from CDK context to namespace resource names
    const deploymentId: string =
      scope.node.tryGetContext("deploymentId") || id;

    // ---------------------------------------------------------------
    // S3 Bucket (private, DESTROY policy, auto-delete objects)
    // ---------------------------------------------------------------
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `frontend-${deploymentId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // ---------------------------------------------------------------
    // CloudFront Function – SPA URL rewriting
    // Appends /index.html to requests that don't have a file extension
    // ---------------------------------------------------------------
    const spaUrlRewriteFunction = new cloudfront.Function(
      this,
      "SpaUrlRewriteFunction",
      {
        functionName: `spa-rewrite-${deploymentId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
        comment: "Rewrite URLs for SPA routing – append index.html",
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

    // ---------------------------------------------------------------
    // CloudFront Distribution with OAC
    // ---------------------------------------------------------------
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
            function: spaUrlRewriteFunction,
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
    this.distributionId = distribution.distributionId;
    this.bucketName = websiteBucket.bucketName;

    // ---------------------------------------------------------------
    // CfnOutputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, "BucketName", {
      value: websiteBucket.bucketName,
      description: "S3 bucket name for static assets",
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
