import * as cdk from 'aws-cdk-lib';
import * as docdb from 'aws-cdk-lib/aws-docdb';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export default class DocumentDBStack extends cdk.Stack {
    // Public parameters for DocumentDB are used to pass to other stacks
    public documentDB: docdb.DatabaseCluster;

    constructor(scope: Construct, id: string, vpc: ec2.IVpc, props?: cdk.StackProps) {
        super(scope, id, props);
        // Selecting public subnets for DocumentDB
        // Notice that you have to have at least 2 subnets for docdb cluster
        const subnets = vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC});

        // Creating ParameterGroup
        const clusterParameterGroup = new docdb.ClusterParameterGroup(this, 'MyClusterParameterGroup', {
            family: 'docdb4.0',
            parameters: {
                tls: 'disabled', // Disabling TLS for test case. In production it should be enabled and DMS should be configured to use SSL
            },
        });

        // Creating DocumentDB cluster
        this.documentDB = new docdb.DatabaseCluster(this, 'Database', {
            masterUser: {
                username: 'myuser', // NOTE: 'admin' is reserved by DocumentDB
                excludeCharacters: '\"@/:\'`!();-_~|\\=+*&^%$#', // optional, defaults to the set "\"@/" and is also used for eventually created rotations
                secretName: '/myapp/mydocdb/masteruser', // optional, if you prefer to specify the secret name
            },
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
            vpcSubnets: subnets,
            vpc,
            parameterGroup: clusterParameterGroup,
        });

        // Adding security group to the cluster
        this.documentDB.connections.allowDefaultPortFromAnyIpv4('Open to the world');
    }
}
