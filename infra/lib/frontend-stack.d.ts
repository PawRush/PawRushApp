import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
export declare class FrontendStack extends cdk.Stack {
    readonly distributionDomainName: string;
    readonly bucketName: string;
    readonly distributionId: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
