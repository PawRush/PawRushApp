import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      // Generate a unique bucket name
      bucketName: `pawrush-website-${this.account}-${this.region}`,
      
      // Block all public access - CloudFront will handle access via OAC
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Enable versioning for better content management
      versioned: true,
      
      // Enable server-side encryption
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Retention policy for production
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Create CloudFront distribution with S3 origin
    // Using S3Origin which automatically handles access control for CDK 2.150.0
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        // Use S3Origin which automatically creates appropriate access control
        origin: new origins.S3Origin(websiteBucket),
        
        // Viewer protocol policy - redirect HTTP to HTTPS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        
        // Cache policy for HTML files - no caching for dynamic content
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        
        // Allowed HTTP methods
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      
      // Additional behaviors for static assets
      additionalBehaviors: {
        // Cache static assets for longer
        '/assets/*': {
          origin: new origins.S3Origin(websiteBucket),
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        '/_next/static/*': {
          origin: new origins.S3Origin(websiteBucket),
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      
      // Default root object
      defaultRootObject: 'index.html',
      
      // Error pages configuration for SPA behavior
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      
      // Price class optimization - use only North America and Europe edge locations
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      
      // Enable HTTP/2
      httpVersion: cloudfront.HttpVersion.HTTP2,
      
      // Comment for identification
      comment: 'PawRush Static Website Distribution',
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });
  }
}
