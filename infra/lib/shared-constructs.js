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
exports.ArtifactsBucket = exports.CodeBuildRole = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const constructs_1 = require("constructs");
class CodeBuildRole extends constructs_1.Construct {
    role;
    constructor(scope, id, props = {}) {
        super(scope, id);
        this.role = new iam.Role(this, "Role", {
            assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
            description: `CodeBuild role for ${id}`,
        });
        // CloudWatch Logs (always required)
        this.role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
            ],
            resources: ["arn:aws:logs:*:*:log-group:/aws/codebuild/*"],
        }));
        // S3 Artifacts
        if (props.allowS3Artifacts) {
            this.role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:GetBucketLocation",
                    "s3:ListBucket",
                ],
                resources: [
                    `arn:aws:s3:::*-pipeline-artifacts-*`,
                    `arn:aws:s3:::*-pipeline-artifacts-*/*`,
                ],
            }));
        }
        // Secrets Manager
        if (props.allowSecretsManager) {
            this.role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret",
                ],
                resources: ["arn:aws:secretsmanager:*:*:secret:*"],
            }));
        }
        // CloudFormation
        if (props.allowCloudFormation) {
            this.role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "cloudformation:DescribeStacks",
                    "cloudformation:DescribeStackEvents",
                    "cloudformation:DescribeStackResources",
                    "cloudformation:GetTemplate",
                    "cloudformation:ListStacks",
                    "cloudformation:CreateStack",
                    "cloudformation:UpdateStack",
                    "cloudformation:DeleteStack",
                    "cloudformation:CreateChangeSet",
                    "cloudformation:DescribeChangeSet",
                    "cloudformation:ExecuteChangeSet",
                    "cloudformation:DeleteChangeSet",
                ],
                resources: ["*"],
            }));
        }
        // CDK Bootstrap
        if (props.allowCdkBootstrap) {
            this.role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "sts:AssumeRole",
                    "iam:PassRole",
                ],
                resources: [
                    "arn:aws:iam::*:role/cdk-*",
                ],
            }));
            this.role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ssm:GetParameter",
                    "ssm:PutParameter",
                ],
                resources: [
                    "arn:aws:ssm:*:*:parameter/cdk-bootstrap/*",
                ],
            }));
        }
        // Additional policies
        if (props.additionalPolicies) {
            props.additionalPolicies.forEach((policy) => {
                this.role.addToPolicy(policy);
            });
        }
    }
}
exports.CodeBuildRole = CodeBuildRole;
class ArtifactsBucket extends constructs_1.Construct {
    bucket;
    constructor(scope, id) {
        super(scope, id);
        const account = cdk.Stack.of(this).account;
        this.bucket = new s3.Bucket(this, "Bucket", {
            bucketName: `pawrush-pipeline-artifacts-${account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            versioned: true,
            lifecycleRules: [
                {
                    id: "DeleteOldVersions",
                    enabled: true,
                    noncurrentVersionExpiration: cdk.Duration.days(30),
                },
                {
                    id: "AbortIncompleteMultipartUpload",
                    enabled: true,
                    abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
                },
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
    }
}
exports.ArtifactsBucket = ArtifactsBucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLWNvbnN0cnVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaGFyZWQtY29uc3RydWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMseURBQTJDO0FBQzNDLDJDQUF1QztBQVV2QyxNQUFhLGFBQWMsU0FBUSxzQkFBUztJQUMxQixJQUFJLENBQVc7SUFFL0IsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxRQUE0QixFQUFFO1FBQ3RFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtZQUNyQyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMseUJBQXlCLENBQUM7WUFDOUQsV0FBVyxFQUFFLHNCQUFzQixFQUFFLEVBQUU7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUNuQixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN4QixPQUFPLEVBQUU7Z0JBQ1AscUJBQXFCO2dCQUNyQixzQkFBc0I7Z0JBQ3RCLG1CQUFtQjthQUNwQjtZQUNELFNBQVMsRUFBRSxDQUFDLDZDQUE2QyxDQUFDO1NBQzNELENBQUMsQ0FDSCxDQUFDO1FBRUYsZUFBZTtRQUNmLElBQUksS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQ25CLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztnQkFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztnQkFDeEIsT0FBTyxFQUFFO29CQUNQ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QUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsVUFBVSxFQUFFLElBQUk7WUFDaEIsU0FBUyxFQUFFLElBQUk7WUFDZixjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLG1CQUFtQjtvQkFDdkIsT0FBTyxFQUFFLElBQUk7b0JBQ2IsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2lCQUNuRDtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsZ0NBQWdDO29CQUNwQyxPQUFPLEVBQUUsSUFBSTtvQkFDYixtQ0FBbUMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7aUJBQzFEO2FBQ0Y7WUFDRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBOUJELDBDQThCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczNcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDb2RlQnVpbGRSb2xlUHJvcHMge1xuICBhbGxvd1NlY3JldHNNYW5hZ2VyPzogYm9vbGVhbjtcbiAgYWxsb3dTM0FydGlmYWN0cz86IGJvb2xlYW47XG4gIGFsbG93Q2xvdWRGb3JtYXRpb24/OiBib29sZWFuO1xuICBhbGxvd0Nka0Jvb3RzdHJhcD86IGJvb2xlYW47XG4gIGFkZGl0aW9uYWxQb2xpY2llcz86IGlhbS5Qb2xpY3lTdGF0ZW1lbnRbXTtcbn1cblxuZXhwb3J0IGNsYXNzIENvZGVCdWlsZFJvbGUgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgcm9sZTogaWFtLlJvbGU7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENvZGVCdWlsZFJvbGVQcm9wcyA9IHt9KSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIHRoaXMucm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBcIlJvbGVcIiwge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoXCJjb2RlYnVpbGQuYW1hem9uYXdzLmNvbVwiKSxcbiAgICAgIGRlc2NyaXB0aW9uOiBgQ29kZUJ1aWxkIHJvbGUgZm9yICR7aWR9YCxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2ggTG9ncyAoYWx3YXlzIHJlcXVpcmVkKVxuICAgIHRoaXMucm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ0dyb3VwXCIsXG4gICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ1N0cmVhbVwiLFxuICAgICAgICAgIFwibG9nczpQdXRMb2dFdmVudHNcIixcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXCJhcm46YXdzOmxvZ3M6KjoqOmxvZy1ncm91cDovYXdzL2NvZGVidWlsZC8qXCJdLFxuICAgICAgfSksXG4gICAgKTtcblxuICAgIC8vIFMzIEFydGlmYWN0c1xuICAgIGlmIChwcm9wcy5hbGxvd1MzQXJ0aWZhY3RzKSB7XG4gICAgICB0aGlzLnJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcbiAgICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCIsXG4gICAgICAgICAgICBcInMzOkdldEJ1Y2tldExvY2F0aW9uXCIsXG4gICAgICAgICAgICBcInMzOkxpc3RCdWNrZXRcIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgYGFybjphd3M6czM6OjoqLXBpcGVsaW5lLWFydGlmYWN0cy0qYCxcbiAgICAgICAgICAgIGBhcm46YXdzOnMzOjo6Ki1waXBlbGluZS1hcnRpZmFjdHMtKi8qYCxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gU2VjcmV0cyBNYW5hZ2VyXG4gICAgaWYgKHByb3BzLmFsbG93U2VjcmV0c01hbmFnZXIpIHtcbiAgICAgIHRoaXMucm9sZS5hZGRUb1BvbGljeShcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICBcInNlY3JldHNtYW5hZ2VyOkdldFNlY3JldFZhbHVlXCIsXG4gICAgICAgICAgICBcInNlY3JldHNtYW5hZ2VyOkRlc2NyaWJlU2VjcmV0XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFtcImFybjphd3M6c2VjcmV0c21hbmFnZXI6KjoqOnNlY3JldDoqXCJdLFxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ2xvdWRGb3JtYXRpb25cbiAgICBpZiAocHJvcHMuYWxsb3dDbG91ZEZvcm1hdGlvbikge1xuICAgICAgdGhpcy5yb2xlLmFkZFRvUG9saWN5KFxuICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIFwiY2xvdWRmb3JtYXRpb246RGVzY3JpYmVTdGFja3NcIixcbiAgICAgICAgICAgIFwiY2xvdWRmb3JtYXRpb246RGVzY3JpYmVTdGFja0V2ZW50c1wiLFxuICAgICAgICAgICAgXCJjbG91ZGZvcm1hdGlvbjpEZXNjcmliZVN0YWNrUmVzb3VyY2VzXCIsXG4gICAgICAgICAgICBcImNsb3VkZm9ybWF0aW9uOkdldFRlbXBsYXRlXCIsXG4gICAgICAgICAgICBcImNsb3VkZm9ybWF0aW9uOkxpc3RTdGFja3NcIixcbiAgICAgICAgICAgIFwiY2xvdWRmb3JtYXRpb246Q3JlYXRlU3RhY2tcIixcbiAgICAgICAgICAgIFwiY2xvdWRmb3JtYXRpb246VXBkYXRlU3RhY2tcIixcbiAgICAgICAgICAgIFwiY2xvdWRmb3JtYXRpb246RGVsZXRlU3RhY2tcIixcbiAgICAgICAgICAgIFwiY2xvdWRmb3JtYXRpb246Q3JlYXRlQ2hhbmdlU2V0XCIsXG4gICAgICAgICAgICBcImNsb3VkZm9ybWF0aW9uOkRlc2NyaWJlQ2hhbmdlU2V0XCIsXG4gICAgICAgICAgICBcImNsb3VkZm9ybWF0aW9uOkV4ZWN1dGVDaGFuZ2VTZXRcIixcbiAgICAgICAgICAgIFwiY2xvdWRmb3JtYXRpb246RGVsZXRlQ2hhbmdlU2V0XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFtcIipcIl0sXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDREsgQm9vdHN0cmFwXG4gICAgaWYgKHByb3BzLmFsbG93Q2RrQm9vdHN0cmFwKSB7XG4gICAgICB0aGlzLnJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgXCJzdHM6QXNzdW1lUm9sZVwiLFxuICAgICAgICAgICAgXCJpYW06UGFzc1JvbGVcIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgXCJhcm46YXdzOmlhbTo6Kjpyb2xlL2Nkay0qXCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICB0aGlzLnJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgXCJzc206R2V0UGFyYW1ldGVyXCIsXG4gICAgICAgICAgICBcInNzbTpQdXRQYXJhbWV0ZXJcIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgXCJhcm46YXdzOnNzbToqOio6cGFyYW1ldGVyL2Nkay1ib290c3RyYXAvKlwiLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBBZGRpdGlvbmFsIHBvbGljaWVzXG4gICAgaWYgKHByb3BzLmFkZGl0aW9uYWxQb2xpY2llcykge1xuICAgICAgcHJvcHMuYWRkaXRpb25hbFBvbGljaWVzLmZvckVhY2goKHBvbGljeSkgPT4ge1xuICAgICAgICB0aGlzLnJvbGUuYWRkVG9Qb2xpY3kocG9saWN5KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXJ0aWZhY3RzQnVja2V0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldDogczMuQnVja2V0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgYWNjb3VudCA9IGNkay5TdGFjay5vZih0aGlzKS5hY2NvdW50O1xuXG4gICAgdGhpcy5idWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiQnVja2V0XCIsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBwYXdydXNoLXBpcGVsaW5lLWFydGlmYWN0cy0ke2FjY291bnR9YCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcIkRlbGV0ZU9sZFZlcnNpb25zXCIsXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBcIkFib3J0SW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZFwiLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgYWJvcnRJbmNvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDcpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICB9KTtcbiAgfVxufVxuIl19