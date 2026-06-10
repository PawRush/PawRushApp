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
exports.PipelineStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const codepipeline = __importStar(require("aws-cdk-lib/aws-codepipeline"));
const codepipeline_actions = __importStar(require("aws-cdk-lib/aws-codepipeline-actions"));
const codebuild = __importStar(require("aws-cdk-lib/aws-codebuild"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const shared_constructs_1 = require("./shared-constructs");
class PipelineStack extends cdk.Stack {
    pipeline;
    artifactsBucket;
    props;
    constructor(scope, id, props) {
        super(scope, id, props);
        this.props = props;
        // Create artifacts bucket with lifecycle rules
        this.artifactsBucket = new shared_constructs_1.ArtifactsBucket(this, "ArtifactsBucket").bucket;
        // Create SNS topic for notifications
        const notificationTopic = new sns.Topic(this, "PipelineNotifications", {
            displayName: "PawRush Pipeline Notifications",
        });
        // Create CodeBuild roles
        const qualityRole = new shared_constructs_1.CodeBuildRole(this, "QualityRole", {
            allowSecretsManager: false,
            allowS3Artifacts: true,
        });
        const buildRole = new shared_constructs_1.CodeBuildRole(this, "BuildRole", {
            allowSecretsManager: false,
            allowS3Artifacts: true,
            allowCloudFormation: true,
            allowCdkBootstrap: true,
            additionalPolicies: [
                // Read-only CloudFront permissions for cdk synth/diff
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "cloudfront:GetDistribution",
                        "cloudfront:GetDistributionConfig",
                    ],
                    resources: ["*"],
                }),
            ],
        });
        const deployRole = new shared_constructs_1.CodeBuildRole(this, "DeployRole", {
            allowSecretsManager: false,
            allowS3Artifacts: true,
            allowCloudFormation: true,
            allowCdkBootstrap: true,
            additionalPolicies: [
                // S3 permissions for frontend deployment
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "s3:ListBucket",
                        "s3:GetBucketLocation",
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                    ],
                    resources: [
                        `arn:aws:s3:::pawrushfrontend-*`,
                        `arn:aws:s3:::pawrushfrontend-*/*`,
                    ],
                }),
                // CloudFront permissions
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "cloudfront:CreateInvalidation",
                        "cloudfront:GetInvalidation",
                    ],
                    resources: ["*"],
                }),
            ],
        });
        // Create CodeBuild projects
        const unitTestsProject = this.createUnitTestsProject(qualityRole.role);
        const depScanProject = this.createDepScanProject(qualityRole.role);
        const frontendBuildProject = this.createFrontendBuildProject(buildRole.role);
        const iacSynthProject = this.createIacSynthProject(buildRole.role);
        const deployFrontendProject = this.createDeployFrontendProject(deployRole.role);
        const updatePipelineProject = this.createUpdatePipelineProject(deployRole.role);
        // Define pipeline artifacts
        const artifacts = {
            source: new codepipeline.Artifact("SourceOutput"),
            unit: new codepipeline.Artifact("UnitTestsOutput"),
            depScan: new codepipeline.Artifact("DepScanOutput"),
            frontendBuild: new codepipeline.Artifact("FrontendBuildOutput"),
            iacSynth: new codepipeline.Artifact("IacSynthOutput"),
        };
        const [owner, repo] = props.repositoryName.split("/");
        // Define pipeline stages
        const stages = [
            {
                stageName: "Source",
                actions: [
                    new codepipeline_actions.CodeStarConnectionsSourceAction({
                        actionName: "Source",
                        owner,
                        repo,
                        branch: props.branchName,
                        connectionArn: props.codeConnectionArn,
                        output: artifacts.source,
                        triggerOnPush: true,
                    }),
                ],
            },
            {
                stageName: "UpdatePipeline",
                actions: [
                    new codepipeline_actions.CodeBuildAction({
                        actionName: "UpdatePipeline",
                        project: updatePipelineProject,
                        input: artifacts.source,
                    }),
                ],
            },
            {
                stageName: "Quality",
                actions: [
                    new codepipeline_actions.CodeBuildAction({
                        actionName: "UnitTests",
                        project: unitTestsProject,
                        input: artifacts.source,
                        outputs: [artifacts.unit],
                    }),
                    new codepipeline_actions.CodeBuildAction({
                        actionName: "DepScan",
                        project: depScanProject,
                        input: artifacts.source,
                        outputs: [artifacts.depScan],
                    }),
                ],
            },
            {
                stageName: "Build",
                actions: [
                    new codepipeline_actions.CodeBuildAction({
                        actionName: "FrontendBuild",
                        project: frontendBuildProject,
                        input: artifacts.source,
                        outputs: [artifacts.frontendBuild],
                    }),
                    new codepipeline_actions.CodeBuildAction({
                        actionName: "IacSynth",
                        project: iacSynthProject,
                        input: artifacts.source,
                        outputs: [artifacts.iacSynth],
                    }),
                ],
            },
            // Deploy to Dev
            {
                stageName: "DeployDev",
                actions: [
                    new codepipeline_actions.CodeBuildAction({
                        actionName: "DeployFrontendDev",
                        project: deployFrontendProject,
                        input: artifacts.source,
                        extraInputs: [artifacts.frontendBuild],
                        outputs: [new codepipeline.Artifact("FrontendDeployDev")],
                        environmentVariables: {
                            ENVIRONMENT: { value: "dev" },
                        },
                    }),
                ],
            },
            // Manual approval for production
            {
                stageName: "ManualApproval",
                actions: [
                    new codepipeline_actions.ManualApprovalAction({
                        actionName: "ApproveProductionDeployment",
                        additionalInformation: "Review dev deployment and approve production deployment",
                    }),
                ],
            },
            // Deploy to Prod
            {
                stageName: "DeployProd",
                actions: [
                    new codepipeline_actions.CodeBuildAction({
                        actionName: "DeployFrontendProd",
                        project: deployFrontendProject,
                        input: artifacts.source,
                        extraInputs: [artifacts.frontendBuild],
                        outputs: [new codepipeline.Artifact("FrontendDeployProd")],
                        environmentVariables: {
                            ENVIRONMENT: { value: "prod" },
                        },
                    }),
                ],
            },
        ];
        // Create pipeline
        this.pipeline = new codepipeline.Pipeline(this, "Pipeline", {
            pipelineName: "PawRushPipeline",
            pipelineType: codepipeline.PipelineType.V2,
            artifactBucket: this.artifactsBucket,
            stages,
        });
        // Subscribe to notifications
        this.pipeline.notifyOnExecutionStateChange("PipelineExecutionNotifications", notificationTopic);
        // Outputs
        new cdk.CfnOutput(this, "PipelineName", {
            value: this.pipeline.pipelineName,
            description: "CodePipeline Name",
        });
        new cdk.CfnOutput(this, "BuildRoleArn", {
            value: buildRole.role.roleArn,
            description: "CodeBuild Build Role ARN (for CDK bootstrap trust)",
            exportName: `${this.stackName}-BuildRoleArn`,
        });
        new cdk.CfnOutput(this, "DeployRoleArn", {
            value: deployRole.role.roleArn,
            description: "CodeBuild Deploy Role ARN (for CDK bootstrap trust)",
            exportName: `${this.stackName}-DeployRoleArn`,
        });
    }
    createUpdatePipelineProject(role) {
        return new codebuild.PipelineProject(this, "UpdatePipelineProject", {
            projectName: "PawRush-UpdatePipeline",
            role,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.SMALL,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspecs/update_pipeline.yml"),
            environmentVariables: {
                REPOSITORY_NAME: { value: this.props.repositoryName },
                BRANCH_NAME: { value: this.props.branchName },
                CODE_CONNECTION_ARN: { value: this.props.codeConnectionArn },
            },
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
        });
    }
    createUnitTestsProject(role) {
        return new codebuild.PipelineProject(this, "UnitTestsProject", {
            projectName: "PawRush-UnitTests",
            role,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.SMALL,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspecs/unit_tests.yml"),
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
        });
    }
    createDepScanProject(role) {
        return new codebuild.PipelineProject(this, "DepScanProject", {
            projectName: "PawRush-DepScan",
            role,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.SMALL,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspecs/dep_scan.yml"),
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
        });
    }
    createFrontendBuildProject(role) {
        return new codebuild.PipelineProject(this, "FrontendBuildProject", {
            projectName: "PawRush-FrontendBuild",
            role,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.MEDIUM,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspecs/frontend_build.yml"),
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
        });
    }
    createIacSynthProject(role) {
        return new codebuild.PipelineProject(this, "IacSynthProject", {
            projectName: "PawRush-IacSynth",
            role,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.SMALL,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspecs/iac_synth_diff_checkov.yml"),
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
        });
    }
    createDeployFrontendProject(role) {
        return new codebuild.PipelineProject(this, "DeployFrontendProject", {
            projectName: "PawRush-DeployFrontend",
            role,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.SMALL,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspecs/deploy_frontend.yml"),
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
        });
    }
}
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywyRUFBNkQ7QUFDN0QsMkZBQTZFO0FBQzdFLHFFQUF1RDtBQUV2RCx5REFBMkM7QUFDM0MseURBQTJDO0FBRTNDLDJEQUFxRTtBQVFyRSxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMxQixRQUFRLENBQXdCO0lBQ2hDLGVBQWUsQ0FBWTtJQUMxQixLQUFLLENBQXFCO0lBRTNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBeUI7UUFDakUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFFbkIsK0NBQStDO1FBQy9DLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxtQ0FBZSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUUzRSxxQ0FBcUM7UUFDckMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQ3JFLFdBQVcsRUFBRSxnQ0FBZ0M7U0FDOUMsQ0FBQyxDQUFDO1FBRUgseUJBQXlCO1FBQ3pCLE1BQU0sV0FBVyxHQUFHLElBQUksaUNBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3pELG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDLENBQUM7UUFFSCxNQUFNLFNBQVMsR0FBRyxJQUFJLGlDQUFhLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNyRCxtQkFBbUIsRUFBRSxLQUFLO1lBQzFCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGtCQUFrQixFQUFFO2dCQUNsQixzREFBc0Q7Z0JBQ3RELElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztvQkFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztvQkFDeEIsT0FBTyxFQUFFO3dCQUNQLDRCQUE0Qjt3QkFDNUIsa0NBQWtDO3FCQUNuQztvQkFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7aUJBQ2pCLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFHLElBQUksaUNBQWEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3ZELG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsa0JBQWtCLEVBQUU7Z0JBQ2xCLHlDQUF5QztnQkFDekMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO29CQUN0QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO29CQUN4QixPQUFPLEVBQUU7d0JBQ1AsZUFBZTt3QkFDZixzQkFBc0I7d0JBQ3RCLGNBQWM7d0JBQ2QsY0FBYzt3QkFDZCxpQkFBaUI7cUJBQ2xCO29CQUNELFNBQVMsRUFBRTt3QkFDVCxnQ0FBZ0M7d0JBQ2hDLGtDQUFrQztxQkFDbkM7aUJBQ0YsQ0FBQztnQkFDRix5QkFBeUI7Z0JBQ3pCLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztvQkFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztvQkFDeEIsT0FBTyxFQUFFO3dCQUNQLCtCQUErQjt3QkFDL0IsNEJBQTRCO3FCQUM3QjtvQkFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7aUJBQ2pCLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRSxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0UsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRSxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEYsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhGLDRCQUE0QjtRQUM1QixNQUFNLFNBQVMsR0FBRztZQUNoQixNQUFNLEVBQUUsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUNqRCxJQUFJLEVBQUUsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDO1lBQ2xELE9BQU8sRUFBRSxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDO1lBQ25ELGFBQWEsRUFBRSxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUM7WUFDL0QsUUFBUSxFQUFFLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztTQUN0RCxDQUFDO1FBRUYsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV0RCx5QkFBeUI7UUFDekIsTUFBTSxNQUFNLEdBQThCO1lBQ3hDO2dCQUNFLFNBQVMsRUFBRSxRQUFRO2dCQUNuQixPQUFPLEVBQUU7b0JBQ1AsSUFBSSxvQkFBb0IsQ0FBQywrQkFBK0IsQ0FBQzt3QkFDdkQsVUFBVSxFQUFFLFFBQVE7d0JBQ3BCLEtBQUs7d0JBQ0wsSUFBSTt3QkFDSixNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVU7d0JBQ3hCLGFBQWEsRUFBRSxLQUFLLENBQUMsaUJBQWlCO3dCQUN0QyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU07d0JBQ3hCLGFBQWEsRUFBRSxJQUFJO3FCQUNwQixDQUFDO2lCQUNIO2FBQ0Y7WUFDRDtnQkFDRSxTQUFTLEVBQUUsZ0JBQWdCO2dCQUMzQixPQUFPLEVBQUU7b0JBQ1AsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7d0JBQ3ZDLFVBQVUsRUFBRSxnQkFBZ0I7d0JBQzVCLE9BQU8sRUFBRSxxQkFBcUI7d0JBQzlCLEtBQUssRUFBRSxTQUFTLENBQUMsTUFBTTtxQkFDeEIsQ0FBQztpQkFDSDthQUNGO1lBQ0Q7Z0JBQ0UsU0FBUyxFQUFFLFNBQVM7Z0JBQ3BCLE9BQU8sRUFBRTtvQkFDUCxJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQzt3QkFDdkMsVUFBVSxFQUFFLFdBQVc7d0JBQ3ZCLE9BQU8sRUFBRSxnQkFBZ0I7d0JBQ3pCLEtBQUssRUFBRSxTQUFTLENBQUMsTUFBTTt3QkFDdkIsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztxQkFDMUIsQ0FBQztvQkFDRixJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQzt3QkFDdkMsVUFBVSxFQUFFLFNBQVM7d0JBQ3JCLE9BQU8sRUFBRSxjQUFjO3dCQUN2QixLQUFLLEVBQUUsU0FBUyxDQUFDLE1BQU07d0JBQ3ZCLE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7cUJBQzdCLENBQUM7aUJBQ0g7YUFDRjtZQUNEO2dCQUNFLFNBQVMsRUFBRSxPQUFPO2dCQUNsQixPQUFPLEVBQUU7b0JBQ1AsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7d0JBQ3ZDLFVBQVUsRUFBRSxlQUFlO3dCQUMzQixPQUFPLEVBQUUsb0JBQW9CO3dCQUM3QixLQUFLLEVBQUUsU0FBUyxDQUFDLE1BQU07d0JBQ3ZCLE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7cUJBQ25DLENBQUM7b0JBQ0YsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7d0JBQ3ZDLFVBQVUsRUFBRSxVQUFVO3dCQUN0QixPQUFPLEVBQUUsZUFBZTt3QkFDeEIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNO3dCQUN2QixPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO3FCQUM5QixDQUFDO2lCQUNIO2FBQ0Y7WUFDRCxnQkFBZ0I7WUFDaEI7Z0JBQ0UsU0FBUyxFQUFFLFdBQVc7Z0JBQ3RCLE9BQU8sRUFBRTtvQkFDUCxJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQzt3QkFDdkMsVUFBVSxFQUFFLG1CQUFtQjt3QkFDL0IsT0FBTyxFQUFFLHFCQUFxQjt3QkFDOUIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNO3dCQUN2QixXQUFXLEVBQUUsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO3dCQUN0QyxPQUFPLEVBQUUsQ0FBQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQzt3QkFDekQsb0JBQW9CLEVBQUU7NEJBQ3BCLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7eUJBQzlCO3FCQUNGLENBQUM7aUJBQ0g7YUFDRjtZQUNELGlDQUFpQztZQUNqQztnQkFDRSxTQUFTLEVBQUUsZ0JBQWdCO2dCQUMzQixPQUFPLEVBQUU7b0JBQ1AsSUFBSSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQzt3QkFDNUMsVUFBVSxFQUFFLDZCQUE2Qjt3QkFDekMscUJBQXFCLEVBQ25CLHlEQUF5RDtxQkFDNUQsQ0FBQztpQkFDSDthQUNGO1lBQ0QsaUJBQWlCO1lBQ2pCO2dCQUNFLFNBQVMsRUFBRSxZQUFZO2dCQUN2QixPQUFPLEVBQUU7b0JBQ1AsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7d0JBQ3ZDLFVBQVUsRUFBRSxvQkFBb0I7d0JBQ2hDLE9BQU8sRUFBRSxxQkFBcUI7d0JBQzlCLEtBQUssRUFBRSxTQUFTLENBQUMsTUFBTTt3QkFDdkIsV0FBVyxFQUFFLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQzt3QkFDdEMsT0FBTyxFQUFFLENBQUMsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUM7d0JBQzFELG9CQUFvQixFQUFFOzRCQUNwQixXQUFXLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO3lCQUMvQjtxQkFDRixDQUFDO2lCQUNIO2FBQ0Y7U0FDRixDQUFDO1FBRUYsa0JBQWtCO1FBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDMUQsWUFBWSxFQUFFLGlCQUFpQjtZQUMvQixZQUFZLEVBQUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQzFDLGNBQWMsRUFBRSxJQUFJLENBQUMsZUFBZTtZQUNwQyxNQUFNO1NBQ1AsQ0FBQyxDQUFDO1FBRUgsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsNEJBQTRCLENBQ3hDLGdDQUFnQyxFQUNoQyxpQkFBaUIsQ0FDbEIsQ0FBQztRQUVGLFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZO1lBQ2pDLFdBQVcsRUFBRSxtQkFBbUI7U0FDakMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDdEMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTztZQUM3QixXQUFXLEVBQUUsb0RBQW9EO1lBQ2pFLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLGVBQWU7U0FDN0MsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTztZQUM5QixXQUFXLEVBQUUscURBQXFEO1lBQ2xFLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLGdCQUFnQjtTQUM5QyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sMkJBQTJCLENBQUMsSUFBYztRQUNoRCxPQUFPLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDbEUsV0FBVyxFQUFFLHdCQUF3QjtZQUNyQyxJQUFJO1lBQ0osV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxTQUFTLENBQUMsZUFBZSxDQUFDLFlBQVk7Z0JBQ2xELFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUs7YUFDekM7WUFDRCxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxnQ0FBZ0MsQ0FBQztZQUNuRixvQkFBb0IsRUFBRTtnQkFDcEIsZUFBZSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFO2dCQUNyRCxXQUFXLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7Z0JBQzdDLG1CQUFtQixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUU7YUFDN0Q7WUFDRCxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7U0FDL0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLHNCQUFzQixDQUFDLElBQWM7UUFDM0MsT0FBTyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzdELFdBQVcsRUFBRSxtQkFBbUI7WUFDaEMsSUFBSTtZQUNKLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsU0FBUyxDQUFDLGVBQWUsQ0FBQyxZQUFZO2dCQUNsRCxXQUFXLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLO2FBQ3pDO1lBQ0QsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsMkJBQTJCLENBQUM7WUFDOUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO1NBQy9GLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxvQkFBb0IsQ0FBQyxJQUFjO1FBQ3pDLE9BQU8sSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUMzRCxXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLElBQUk7WUFDSixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsWUFBWTtnQkFDbEQsV0FBVyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSzthQUN6QztZQUNELFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLHlCQUF5QixDQUFDO1lBQzVFLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztTQUMvRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sMEJBQTBCLENBQUMsSUFBYztRQUMvQyxPQUFPLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDakUsV0FBVyxFQUFFLHVCQUF1QjtZQUNwQyxJQUFJO1lBQ0osV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxTQUFTLENBQUMsZUFBZSxDQUFDLFlBQVk7Z0JBQ2xELFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU07YUFDMUM7WUFDRCxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQywrQkFBK0IsQ0FBQztZQUNsRixLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7U0FDL0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLHFCQUFxQixDQUFDLElBQWM7UUFDMUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQzVELFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsSUFBSTtZQUNKLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsU0FBUyxDQUFDLGVBQWUsQ0FBQyxZQUFZO2dCQUNsRCxXQUFXLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLO2FBQ3pDO1lBQ0QsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsdUNBQXVDLENBQUM7WUFDMUYsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO1NBQy9GLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTywyQkFBMkIsQ0FBQyxJQUFjO1FBQ2hELE9BQU8sSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUNsRSxXQUFXLEVBQUUsd0JBQXdCO1lBQ3JDLElBQUk7WUFDSixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsWUFBWTtnQkFDbEQsV0FBVyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSzthQUN6QztZQUNELFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLGdDQUFnQyxDQUFDO1lBQ25GLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztTQUMvRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF6VEQsc0NBeVRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0ICogYXMgY29kZXBpcGVsaW5lIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29kZXBpcGVsaW5lXCI7XG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmVfYWN0aW9ucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCI7XG5pbXBvcnQgKiBhcyBjb2RlYnVpbGQgZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2RlYnVpbGRcIjtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczNcIjtcbmltcG9ydCAqIGFzIHNucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNuc1wiO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0IHsgQ29kZUJ1aWxkUm9sZSwgQXJ0aWZhY3RzQnVja2V0IH0gZnJvbSBcIi4vc2hhcmVkLWNvbnN0cnVjdHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQaXBlbGluZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGNvZGVDb25uZWN0aW9uQXJuOiBzdHJpbmc7XG4gIHJlcG9zaXRvcnlOYW1lOiBzdHJpbmc7XG4gIGJyYW5jaE5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgcGlwZWxpbmU6IGNvZGVwaXBlbGluZS5QaXBlbGluZTtcbiAgcHVibGljIHJlYWRvbmx5IGFydGlmYWN0c0J1Y2tldDogczMuQnVja2V0O1xuICBwcml2YXRlIHJlYWRvbmx5IHByb3BzOiBQaXBlbGluZVN0YWNrUHJvcHM7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFBpcGVsaW5lU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcblxuICAgIC8vIENyZWF0ZSBhcnRpZmFjdHMgYnVja2V0IHdpdGggbGlmZWN5Y2xlIHJ1bGVzXG4gICAgdGhpcy5hcnRpZmFjdHNCdWNrZXQgPSBuZXcgQXJ0aWZhY3RzQnVja2V0KHRoaXMsIFwiQXJ0aWZhY3RzQnVja2V0XCIpLmJ1Y2tldDtcblxuICAgIC8vIENyZWF0ZSBTTlMgdG9waWMgZm9yIG5vdGlmaWNhdGlvbnNcbiAgICBjb25zdCBub3RpZmljYXRpb25Ub3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgXCJQaXBlbGluZU5vdGlmaWNhdGlvbnNcIiwge1xuICAgICAgZGlzcGxheU5hbWU6IFwiUGF3UnVzaCBQaXBlbGluZSBOb3RpZmljYXRpb25zXCIsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQ29kZUJ1aWxkIHJvbGVzXG4gICAgY29uc3QgcXVhbGl0eVJvbGUgPSBuZXcgQ29kZUJ1aWxkUm9sZSh0aGlzLCBcIlF1YWxpdHlSb2xlXCIsIHtcbiAgICAgIGFsbG93U2VjcmV0c01hbmFnZXI6IGZhbHNlLFxuICAgICAgYWxsb3dTM0FydGlmYWN0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJ1aWxkUm9sZSA9IG5ldyBDb2RlQnVpbGRSb2xlKHRoaXMsIFwiQnVpbGRSb2xlXCIsIHtcbiAgICAgIGFsbG93U2VjcmV0c01hbmFnZXI6IGZhbHNlLFxuICAgICAgYWxsb3dTM0FydGlmYWN0czogdHJ1ZSxcbiAgICAgIGFsbG93Q2xvdWRGb3JtYXRpb246IHRydWUsXG4gICAgICBhbGxvd0Nka0Jvb3RzdHJhcDogdHJ1ZSxcbiAgICAgIGFkZGl0aW9uYWxQb2xpY2llczogW1xuICAgICAgICAvLyBSZWFkLW9ubHkgQ2xvdWRGcm9udCBwZXJtaXNzaW9ucyBmb3IgY2RrIHN5bnRoL2RpZmZcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICBcImNsb3VkZnJvbnQ6R2V0RGlzdHJpYnV0aW9uXCIsXG4gICAgICAgICAgICBcImNsb3VkZnJvbnQ6R2V0RGlzdHJpYnV0aW9uQ29uZmlnXCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFtcIipcIl0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlcGxveVJvbGUgPSBuZXcgQ29kZUJ1aWxkUm9sZSh0aGlzLCBcIkRlcGxveVJvbGVcIiwge1xuICAgICAgYWxsb3dTZWNyZXRzTWFuYWdlcjogZmFsc2UsXG4gICAgICBhbGxvd1MzQXJ0aWZhY3RzOiB0cnVlLFxuICAgICAgYWxsb3dDbG91ZEZvcm1hdGlvbjogdHJ1ZSxcbiAgICAgIGFsbG93Q2RrQm9vdHN0cmFwOiB0cnVlLFxuICAgICAgYWRkaXRpb25hbFBvbGljaWVzOiBbXG4gICAgICAgIC8vIFMzIHBlcm1pc3Npb25zIGZvciBmcm9udGVuZCBkZXBsb3ltZW50XG4gICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCIsXG4gICAgICAgICAgICBcInMzOkdldEJ1Y2tldExvY2F0aW9uXCIsXG4gICAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgICAgXCJzMzpQdXRPYmplY3RcIixcbiAgICAgICAgICAgIFwiczM6RGVsZXRlT2JqZWN0XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgIGBhcm46YXdzOnMzOjo6cGF3cnVzaGZyb250ZW5kLSpgLFxuICAgICAgICAgICAgYGFybjphd3M6czM6OjpwYXdydXNoZnJvbnRlbmQtKi8qYCxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgLy8gQ2xvdWRGcm9udCBwZXJtaXNzaW9uc1xuICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIFwiY2xvdWRmcm9udDpDcmVhdGVJbnZhbGlkYXRpb25cIixcbiAgICAgICAgICAgIFwiY2xvdWRmcm9udDpHZXRJbnZhbGlkYXRpb25cIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlc291cmNlczogW1wiKlwiXSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIENvZGVCdWlsZCBwcm9qZWN0c1xuICAgIGNvbnN0IHVuaXRUZXN0c1Byb2plY3QgPSB0aGlzLmNyZWF0ZVVuaXRUZXN0c1Byb2plY3QocXVhbGl0eVJvbGUucm9sZSk7XG4gICAgY29uc3QgZGVwU2NhblByb2plY3QgPSB0aGlzLmNyZWF0ZURlcFNjYW5Qcm9qZWN0KHF1YWxpdHlSb2xlLnJvbGUpO1xuICAgIGNvbnN0IGZyb250ZW5kQnVpbGRQcm9qZWN0ID0gdGhpcy5jcmVhdGVGcm9udGVuZEJ1aWxkUHJvamVjdChidWlsZFJvbGUucm9sZSk7XG4gICAgY29uc3QgaWFjU3ludGhQcm9qZWN0ID0gdGhpcy5jcmVhdGVJYWNTeW50aFByb2plY3QoYnVpbGRSb2xlLnJvbGUpO1xuICAgIGNvbnN0IGRlcGxveUZyb250ZW5kUHJvamVjdCA9IHRoaXMuY3JlYXRlRGVwbG95RnJvbnRlbmRQcm9qZWN0KGRlcGxveVJvbGUucm9sZSk7XG4gICAgY29uc3QgdXBkYXRlUGlwZWxpbmVQcm9qZWN0ID0gdGhpcy5jcmVhdGVVcGRhdGVQaXBlbGluZVByb2plY3QoZGVwbG95Um9sZS5yb2xlKTtcblxuICAgIC8vIERlZmluZSBwaXBlbGluZSBhcnRpZmFjdHNcbiAgICBjb25zdCBhcnRpZmFjdHMgPSB7XG4gICAgICBzb3VyY2U6IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoXCJTb3VyY2VPdXRwdXRcIiksXG4gICAgICB1bml0OiBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KFwiVW5pdFRlc3RzT3V0cHV0XCIpLFxuICAgICAgZGVwU2NhbjogbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdChcIkRlcFNjYW5PdXRwdXRcIiksXG4gICAgICBmcm9udGVuZEJ1aWxkOiBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KFwiRnJvbnRlbmRCdWlsZE91dHB1dFwiKSxcbiAgICAgIGlhY1N5bnRoOiBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KFwiSWFjU3ludGhPdXRwdXRcIiksXG4gICAgfTtcblxuICAgIGNvbnN0IFtvd25lciwgcmVwb10gPSBwcm9wcy5yZXBvc2l0b3J5TmFtZS5zcGxpdChcIi9cIik7XG5cbiAgICAvLyBEZWZpbmUgcGlwZWxpbmUgc3RhZ2VzXG4gICAgY29uc3Qgc3RhZ2VzOiBjb2RlcGlwZWxpbmUuU3RhZ2VQcm9wc1tdID0gW1xuICAgICAge1xuICAgICAgICBzdGFnZU5hbWU6IFwiU291cmNlXCIsXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZVN0YXJDb25uZWN0aW9uc1NvdXJjZUFjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25OYW1lOiBcIlNvdXJjZVwiLFxuICAgICAgICAgICAgb3duZXIsXG4gICAgICAgICAgICByZXBvLFxuICAgICAgICAgICAgYnJhbmNoOiBwcm9wcy5icmFuY2hOYW1lLFxuICAgICAgICAgICAgY29ubmVjdGlvbkFybjogcHJvcHMuY29kZUNvbm5lY3Rpb25Bcm4sXG4gICAgICAgICAgICBvdXRwdXQ6IGFydGlmYWN0cy5zb3VyY2UsXG4gICAgICAgICAgICB0cmlnZ2VyT25QdXNoOiB0cnVlLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc3RhZ2VOYW1lOiBcIlVwZGF0ZVBpcGVsaW5lXCIsXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvbk5hbWU6IFwiVXBkYXRlUGlwZWxpbmVcIixcbiAgICAgICAgICAgIHByb2plY3Q6IHVwZGF0ZVBpcGVsaW5lUHJvamVjdCxcbiAgICAgICAgICAgIGlucHV0OiBhcnRpZmFjdHMuc291cmNlLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc3RhZ2VOYW1lOiBcIlF1YWxpdHlcIixcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgIG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uTmFtZTogXCJVbml0VGVzdHNcIixcbiAgICAgICAgICAgIHByb2plY3Q6IHVuaXRUZXN0c1Byb2plY3QsXG4gICAgICAgICAgICBpbnB1dDogYXJ0aWZhY3RzLnNvdXJjZSxcbiAgICAgICAgICAgIG91dHB1dHM6IFthcnRpZmFjdHMudW5pdF0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25OYW1lOiBcIkRlcFNjYW5cIixcbiAgICAgICAgICAgIHByb2plY3Q6IGRlcFNjYW5Qcm9qZWN0LFxuICAgICAgICAgICAgaW5wdXQ6IGFydGlmYWN0cy5zb3VyY2UsXG4gICAgICAgICAgICBvdXRwdXRzOiBbYXJ0aWZhY3RzLmRlcFNjYW5dLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc3RhZ2VOYW1lOiBcIkJ1aWxkXCIsXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgICAgIGFjdGlvbk5hbWU6IFwiRnJvbnRlbmRCdWlsZFwiLFxuICAgICAgICAgICAgcHJvamVjdDogZnJvbnRlbmRCdWlsZFByb2plY3QsXG4gICAgICAgICAgICBpbnB1dDogYXJ0aWZhY3RzLnNvdXJjZSxcbiAgICAgICAgICAgIG91dHB1dHM6IFthcnRpZmFjdHMuZnJvbnRlbmRCdWlsZF0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25OYW1lOiBcIklhY1N5bnRoXCIsXG4gICAgICAgICAgICBwcm9qZWN0OiBpYWNTeW50aFByb2plY3QsXG4gICAgICAgICAgICBpbnB1dDogYXJ0aWZhY3RzLnNvdXJjZSxcbiAgICAgICAgICAgIG91dHB1dHM6IFthcnRpZmFjdHMuaWFjU3ludGhdLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIC8vIERlcGxveSB0byBEZXZcbiAgICAgIHtcbiAgICAgICAgc3RhZ2VOYW1lOiBcIkRlcGxveURldlwiLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgICAgICBhY3Rpb25OYW1lOiBcIkRlcGxveUZyb250ZW5kRGV2XCIsXG4gICAgICAgICAgICBwcm9qZWN0OiBkZXBsb3lGcm9udGVuZFByb2plY3QsXG4gICAgICAgICAgICBpbnB1dDogYXJ0aWZhY3RzLnNvdXJjZSxcbiAgICAgICAgICAgIGV4dHJhSW5wdXRzOiBbYXJ0aWZhY3RzLmZyb250ZW5kQnVpbGRdLFxuICAgICAgICAgICAgb3V0cHV0czogW25ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoXCJGcm9udGVuZERlcGxveURldlwiKV0sXG4gICAgICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICAgICAgICBFTlZJUk9OTUVOVDogeyB2YWx1ZTogXCJkZXZcIiB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICAvLyBNYW51YWwgYXBwcm92YWwgZm9yIHByb2R1Y3Rpb25cbiAgICAgIHtcbiAgICAgICAgc3RhZ2VOYW1lOiBcIk1hbnVhbEFwcHJvdmFsXCIsXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuTWFudWFsQXBwcm92YWxBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uTmFtZTogXCJBcHByb3ZlUHJvZHVjdGlvbkRlcGxveW1lbnRcIixcbiAgICAgICAgICAgIGFkZGl0aW9uYWxJbmZvcm1hdGlvbjpcbiAgICAgICAgICAgICAgXCJSZXZpZXcgZGV2IGRlcGxveW1lbnQgYW5kIGFwcHJvdmUgcHJvZHVjdGlvbiBkZXBsb3ltZW50XCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgLy8gRGVwbG95IHRvIFByb2RcbiAgICAgIHtcbiAgICAgICAgc3RhZ2VOYW1lOiBcIkRlcGxveVByb2RcIixcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgIG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICAgICAgYWN0aW9uTmFtZTogXCJEZXBsb3lGcm9udGVuZFByb2RcIixcbiAgICAgICAgICAgIHByb2plY3Q6IGRlcGxveUZyb250ZW5kUHJvamVjdCxcbiAgICAgICAgICAgIGlucHV0OiBhcnRpZmFjdHMuc291cmNlLFxuICAgICAgICAgICAgZXh0cmFJbnB1dHM6IFthcnRpZmFjdHMuZnJvbnRlbmRCdWlsZF0sXG4gICAgICAgICAgICBvdXRwdXRzOiBbbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdChcIkZyb250ZW5kRGVwbG95UHJvZFwiKV0sXG4gICAgICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICAgICAgICBFTlZJUk9OTUVOVDogeyB2YWx1ZTogXCJwcm9kXCIgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIF07XG5cbiAgICAvLyBDcmVhdGUgcGlwZWxpbmVcbiAgICB0aGlzLnBpcGVsaW5lID0gbmV3IGNvZGVwaXBlbGluZS5QaXBlbGluZSh0aGlzLCBcIlBpcGVsaW5lXCIsIHtcbiAgICAgIHBpcGVsaW5lTmFtZTogXCJQYXdSdXNoUGlwZWxpbmVcIixcbiAgICAgIHBpcGVsaW5lVHlwZTogY29kZXBpcGVsaW5lLlBpcGVsaW5lVHlwZS5WMixcbiAgICAgIGFydGlmYWN0QnVja2V0OiB0aGlzLmFydGlmYWN0c0J1Y2tldCxcbiAgICAgIHN0YWdlcyxcbiAgICB9KTtcblxuICAgIC8vIFN1YnNjcmliZSB0byBub3RpZmljYXRpb25zXG4gICAgdGhpcy5waXBlbGluZS5ub3RpZnlPbkV4ZWN1dGlvblN0YXRlQ2hhbmdlKFxuICAgICAgXCJQaXBlbGluZUV4ZWN1dGlvbk5vdGlmaWNhdGlvbnNcIixcbiAgICAgIG5vdGlmaWNhdGlvblRvcGljLFxuICAgICk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJQaXBlbGluZU5hbWVcIiwge1xuICAgICAgdmFsdWU6IHRoaXMucGlwZWxpbmUucGlwZWxpbmVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ29kZVBpcGVsaW5lIE5hbWVcIixcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQnVpbGRSb2xlQXJuXCIsIHtcbiAgICAgIHZhbHVlOiBidWlsZFJvbGUucm9sZS5yb2xlQXJuLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ29kZUJ1aWxkIEJ1aWxkIFJvbGUgQVJOIChmb3IgQ0RLIGJvb3RzdHJhcCB0cnVzdClcIixcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1CdWlsZFJvbGVBcm5gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJEZXBsb3lSb2xlQXJuXCIsIHtcbiAgICAgIHZhbHVlOiBkZXBsb3lSb2xlLnJvbGUucm9sZUFybixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkNvZGVCdWlsZCBEZXBsb3kgUm9sZSBBUk4gKGZvciBDREsgYm9vdHN0cmFwIHRydXN0KVwiLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LURlcGxveVJvbGVBcm5gLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVVcGRhdGVQaXBlbGluZVByb2plY3Qocm9sZTogaWFtLlJvbGUpOiBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0IHtcbiAgICByZXR1cm4gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgXCJVcGRhdGVQaXBlbGluZVByb2plY3RcIiwge1xuICAgICAgcHJvamVjdE5hbWU6IFwiUGF3UnVzaC1VcGRhdGVQaXBlbGluZVwiLFxuICAgICAgcm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfN18wLFxuICAgICAgICBjb21wdXRlVHlwZTogY29kZWJ1aWxkLkNvbXB1dGVUeXBlLlNNQUxMLFxuICAgICAgfSxcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tU291cmNlRmlsZW5hbWUoXCJidWlsZHNwZWNzL3VwZGF0ZV9waXBlbGluZS55bWxcIiksXG4gICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICBSRVBPU0lUT1JZX05BTUU6IHsgdmFsdWU6IHRoaXMucHJvcHMucmVwb3NpdG9yeU5hbWUgfSxcbiAgICAgICAgQlJBTkNIX05BTUU6IHsgdmFsdWU6IHRoaXMucHJvcHMuYnJhbmNoTmFtZSB9LFxuICAgICAgICBDT0RFX0NPTk5FQ1RJT05fQVJOOiB7IHZhbHVlOiB0aGlzLnByb3BzLmNvZGVDb25uZWN0aW9uQXJuIH0sXG4gICAgICB9LFxuICAgICAgY2FjaGU6IGNvZGVidWlsZC5DYWNoZS5sb2NhbChjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuU09VUkNFLCBjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuQ1VTVE9NKSxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlVW5pdFRlc3RzUHJvamVjdChyb2xlOiBpYW0uUm9sZSk6IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3Qge1xuICAgIHJldHVybiBuZXcgY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCh0aGlzLCBcIlVuaXRUZXN0c1Byb2plY3RcIiwge1xuICAgICAgcHJvamVjdE5hbWU6IFwiUGF3UnVzaC1Vbml0VGVzdHNcIixcbiAgICAgIHJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBidWlsZEltYWdlOiBjb2RlYnVpbGQuTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzdfMCxcbiAgICAgICAgY29tcHV0ZVR5cGU6IGNvZGVidWlsZC5Db21wdXRlVHlwZS5TTUFMTCxcbiAgICAgIH0sXG4gICAgICBidWlsZFNwZWM6IGNvZGVidWlsZC5CdWlsZFNwZWMuZnJvbVNvdXJjZUZpbGVuYW1lKFwiYnVpbGRzcGVjcy91bml0X3Rlc3RzLnltbFwiKSxcbiAgICAgIGNhY2hlOiBjb2RlYnVpbGQuQ2FjaGUubG9jYWwoY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLlNPVVJDRSwgY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLkNVU1RPTSksXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZURlcFNjYW5Qcm9qZWN0KHJvbGU6IGlhbS5Sb2xlKTogY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCB7XG4gICAgcmV0dXJuIG5ldyBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0KHRoaXMsIFwiRGVwU2NhblByb2plY3RcIiwge1xuICAgICAgcHJvamVjdE5hbWU6IFwiUGF3UnVzaC1EZXBTY2FuXCIsXG4gICAgICByb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF83XzAsXG4gICAgICAgIGNvbXB1dGVUeXBlOiBjb2RlYnVpbGQuQ29tcHV0ZVR5cGUuU01BTEwsXG4gICAgICB9LFxuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZShcImJ1aWxkc3BlY3MvZGVwX3NjYW4ueW1sXCIpLFxuICAgICAgY2FjaGU6IGNvZGVidWlsZC5DYWNoZS5sb2NhbChjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuU09VUkNFLCBjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuQ1VTVE9NKSxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlRnJvbnRlbmRCdWlsZFByb2plY3Qocm9sZTogaWFtLlJvbGUpOiBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0IHtcbiAgICByZXR1cm4gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgXCJGcm9udGVuZEJ1aWxkUHJvamVjdFwiLCB7XG4gICAgICBwcm9qZWN0TmFtZTogXCJQYXdSdXNoLUZyb250ZW5kQnVpbGRcIixcbiAgICAgIHJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBidWlsZEltYWdlOiBjb2RlYnVpbGQuTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzdfMCxcbiAgICAgICAgY29tcHV0ZVR5cGU6IGNvZGVidWlsZC5Db21wdXRlVHlwZS5NRURJVU0sXG4gICAgICB9LFxuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZShcImJ1aWxkc3BlY3MvZnJvbnRlbmRfYnVpbGQueW1sXCIpLFxuICAgICAgY2FjaGU6IGNvZGVidWlsZC5DYWNoZS5sb2NhbChjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuU09VUkNFLCBjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuQ1VTVE9NKSxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlSWFjU3ludGhQcm9qZWN0KHJvbGU6IGlhbS5Sb2xlKTogY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCB7XG4gICAgcmV0dXJuIG5ldyBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0KHRoaXMsIFwiSWFjU3ludGhQcm9qZWN0XCIsIHtcbiAgICAgIHByb2plY3ROYW1lOiBcIlBhd1J1c2gtSWFjU3ludGhcIixcbiAgICAgIHJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBidWlsZEltYWdlOiBjb2RlYnVpbGQuTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzdfMCxcbiAgICAgICAgY29tcHV0ZVR5cGU6IGNvZGVidWlsZC5Db21wdXRlVHlwZS5TTUFMTCxcbiAgICAgIH0sXG4gICAgICBidWlsZFNwZWM6IGNvZGVidWlsZC5CdWlsZFNwZWMuZnJvbVNvdXJjZUZpbGVuYW1lKFwiYnVpbGRzcGVjcy9pYWNfc3ludGhfZGlmZl9jaGVja292LnltbFwiKSxcbiAgICAgIGNhY2hlOiBjb2RlYnVpbGQuQ2FjaGUubG9jYWwoY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLlNPVVJDRSwgY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLkNVU1RPTSksXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZURlcGxveUZyb250ZW5kUHJvamVjdChyb2xlOiBpYW0uUm9sZSk6IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3Qge1xuICAgIHJldHVybiBuZXcgY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCh0aGlzLCBcIkRlcGxveUZyb250ZW5kUHJvamVjdFwiLCB7XG4gICAgICBwcm9qZWN0TmFtZTogXCJQYXdSdXNoLURlcGxveUZyb250ZW5kXCIsXG4gICAgICByb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF83XzAsXG4gICAgICAgIGNvbXB1dGVUeXBlOiBjb2RlYnVpbGQuQ29tcHV0ZVR5cGUuU01BTEwsXG4gICAgICB9LFxuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZShcImJ1aWxkc3BlY3MvZGVwbG95X2Zyb250ZW5kLnltbFwiKSxcbiAgICAgIGNhY2hlOiBjb2RlYnVpbGQuQ2FjaGUubG9jYWwoY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLlNPVVJDRSwgY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLkNVU1RPTSksXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==