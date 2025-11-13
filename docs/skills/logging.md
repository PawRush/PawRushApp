# Application Logging System

This project uses AWS CloudWatch for centralized logging and browser console logging for frontend debugging.

## Deployed Infrastructure

**Environment:** preview-sergeyka
**Region:** us-east-1

### CloudFront Distribution
- Distribution ID: E4RVNSYZODY1V
- Domain: d2wiaidz31mk5l.cloudfront.net
- Access Logs: Stored in S3 bucket `pawrushfrontend-preview-sergeyka-logs-625164594347` under prefix `cloudfront/preview-sergeyka/`

## Accessing CloudFront Logs

**AWS CLI - List recent access logs:**
```bash
# List log files from the last 24 hours
aws s3 ls s3://pawrushfrontend-preview-sergeyka-logs-625164594347/cloudfront/preview-sergeyka/ --recursive \
  | awk '$1 >= "'$(date -u -d '24 hours ago' '+%Y-%m-%d')'"'

# Download and view recent logs
aws s3 cp s3://pawrushfrontend-preview-sergeyka-logs-625164594347/cloudfront/preview-sergeyka/ . --recursive
```

**CloudWatch Logs Insights - CDK Deployment Logs:**
```bash
# List log groups for deployment functions
aws logs describe-log-groups --region us-east-1 \
  --log-group-name-prefix "/aws/lambda/PawRushFrontend-preview-sergeyka"

# Get recent deployment function logs
aws logs tail /aws/lambda/PawRushFrontend-preview-sergeyka-CustomCDKBucketDeployment \
  --follow --region us-east-1
```

## Frontend Debugging

**Browser Developer Tools:**
1. Open Developer Tools (F12)
2. Navigate to Console tab
3. Filter by log level (Info, Warning, Error)

**Network Tab for CloudFront Issues:**
1. Open Developer Tools → Network tab
2. Reproduce the error
3. Check CloudFront response headers:
   - `X-Cache` header (Hit/Miss/RefreshHit)
   - `X-Amz-Cf-Id` (CloudFront request ID for AWS support)
4. Check response status codes

## Common Issues

**404 Errors on Refresh:**
- Verify CloudFront error responses are configured (403/404 → 200 /index.html)
- Check S3 bucket contains index.html at root

**Stale Content:**
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E4RVNSYZODY1V \
  --paths "/*" \
  --region us-east-1
```

**Access Denied Errors:**
- Verify Origin Access Control is configured
- Check S3 bucket policy allows CloudFront access

## Troubleshooting

When encountering errors:
1. Check browser console for JavaScript errors
2. Check Network tab for failed requests and CloudFront headers
3. Check CloudFront access logs in S3 for request patterns
4. Check CDK deployment logs for infrastructure issues

For other environments, replace `preview-sergeyka` with your environment name in all commands.
