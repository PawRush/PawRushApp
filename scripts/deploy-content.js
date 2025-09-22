#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PawRush Content Deployment Script');
console.log('=====================================\n');

// Configuration
const PROJECT_DIR = path.resolve(__dirname, '..');
const BUILD_OUTPUT_DIR = path.join(PROJECT_DIR, 'out');
const STACK_NAME = 'PawRushStaticWebsiteStack';

function executeCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { 
      cwd: PROJECT_DIR, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} completed successfully\n`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
    process.exit(1);
  }
}

function getStackOutputs() {
  console.log('🔍 Getting deployment information...');
  try {
    const output = execSync(`aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs" --output json`, {
      cwd: PROJECT_DIR,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    const outputs = JSON.parse(output);
    const result = {};
    
    outputs.forEach(output => {
      result[output.OutputKey] = output.OutputValue;
    });
    
    console.log('✅ Stack information retrieved\n');
    return result;
  } catch (error) {
    console.error('❌ Failed to get stack outputs. Make sure infrastructure is deployed first.');
    console.error('Run: npm run deploy:infra');
    process.exit(1);
  }
}

function main() {
  // Step 1: Build the Next.js application
  executeCommand('npm run build', 'Building Next.js application');
  
  // Step 2: Verify build output exists
  if (!fs.existsSync(BUILD_OUTPUT_DIR)) {
    console.error(`❌ Build output directory not found: ${BUILD_OUTPUT_DIR}`);
    console.error('Make sure your Next.js build creates an "out" directory');
    process.exit(1);
  }
  
  console.log(`✅ Build output verified at: ${BUILD_OUTPUT_DIR}\n`);
  
  // Step 3: Get stack outputs
  const stackOutputs = getStackOutputs();
  const bucketName = stackOutputs.BucketName;
  const distributionId = stackOutputs.DistributionId;
  const websiteUrl = stackOutputs.WebsiteURL;
  
  if (!bucketName || !distributionId) {
    console.error('❌ Required stack outputs not found');
    process.exit(1);
  }
  
  console.log(`📦 S3 Bucket: ${bucketName}`);
  console.log(`🌐 CloudFront Distribution: ${distributionId}`);
  console.log(`🔗 Website URL: ${websiteUrl}\n`);
  
  // Step 4: Sync files to S3
  executeCommand(
    `aws s3 sync "${BUILD_OUTPUT_DIR}" s3://${bucketName} --delete --cache-control "max-age=86400"`,
    'Syncing files to S3'
  );
  
  // Step 5: Invalidate CloudFront cache
  executeCommand(
    `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`,
    'Creating CloudFront invalidation'
  );
  
  console.log('🎉 Deployment completed successfully!');
  console.log(`🌐 Your website is available at: ${websiteUrl}`);
  console.log('⏳ CloudFront invalidation may take a few minutes to propagate globally.');
}

// Run the deployment
main();
