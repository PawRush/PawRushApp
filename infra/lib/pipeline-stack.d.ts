import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
export interface PipelineStackProps extends cdk.StackProps {
    codeConnectionArn: string;
    repositoryName: string;
    branchName: string;
}
export declare class PipelineStack extends cdk.Stack {
    readonly pipeline: codepipeline.Pipeline;
    readonly artifactsBucket: s3.Bucket;
    private readonly props;
    constructor(scope: Construct, id: string, props: PipelineStackProps);
    private createUpdatePipelineProject;
    private createUnitTestsProject;
    private createDepScanProject;
    private createFrontendBuildProject;
    private createIacSynthProject;
    private createDeployFrontendProject;
}
