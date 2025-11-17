import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { CodeBuildRole, ArtifactsBucket } from "./shared-constructs";

export interface PipelineStackProps extends cdk.StackProps {
  codeConnectionArn: string;
  repositoryName: string;
  branchName: string;
}

export class PipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: s3.Bucket;
  private readonly props: PipelineStackProps;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    this.props = props;

    // Create artifacts bucket with lifecycle rules
    this.artifactsBucket = new ArtifactsBucket(this, "ArtifactsBucket").bucket;

    // Create SNS topic for notifications
    const notificationTopic = new sns.Topic(this, "PipelineNotifications", {
      displayName: "PawRush Pipeline Notifications",
    });

    // Create CodeBuild roles
    const qualityRole = new CodeBuildRole(this, "QualityRole", {
      allowSecretsManager: false,
      allowS3Artifacts: true,
    });

    const buildRole = new CodeBuildRole(this, "BuildRole", {
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

    const deployRole = new CodeBuildRole(this, "DeployRole", {
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
    const stages: codepipeline.StageProps[] = [
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
            additionalInformation:
              "Review dev deployment and approve production deployment",
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
    this.pipeline.notifyOnExecutionStateChange(
      "PipelineExecutionNotifications",
      notificationTopic,
    );

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

  private createUpdatePipelineProject(role: iam.Role): codebuild.PipelineProject {
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

  private createUnitTestsProject(role: iam.Role): codebuild.PipelineProject {
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

  private createDepScanProject(role: iam.Role): codebuild.PipelineProject {
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

  private createFrontendBuildProject(role: iam.Role): codebuild.PipelineProject {
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

  private createIacSynthProject(role: iam.Role): codebuild.PipelineProject {
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

  private createDeployFrontendProject(role: iam.Role): codebuild.PipelineProject {
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
