import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
export interface CodeBuildRoleProps {
    allowSecretsManager?: boolean;
    allowS3Artifacts?: boolean;
    allowCloudFormation?: boolean;
    allowCdkBootstrap?: boolean;
    additionalPolicies?: iam.PolicyStatement[];
}
export declare class CodeBuildRole extends Construct {
    readonly role: iam.Role;
    constructor(scope: Construct, id: string, props?: CodeBuildRoleProps);
}
export declare class ArtifactsBucket extends Construct {
    readonly bucket: s3.Bucket;
    constructor(scope: Construct, id: string);
}
