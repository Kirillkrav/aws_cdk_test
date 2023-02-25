import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export default class VPCStack extends cdk.Stack {
    // Public parameters for VPC are used to pass to other stacks instead of fetching by names
    public default_vpc: ec2.IVpc;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Fetching default VPC
        this.default_vpc = ec2.Vpc.fromLookup(this, "VPC", {isDefault: true})
    }
}



