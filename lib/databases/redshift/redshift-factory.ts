import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {Cluster,} from '@aws-cdk/aws-redshift-alpha';
import {redshiftClustersConfig} from './clusters-config';
import {aws_iam as iam} from 'aws-cdk-lib';


export default class RedshiftFactoryStack extends cdk.Stack {
    // Parameter clusters is an array of Redshift clusters
    // In case of having several clusters we can use this array to iterate over them and create DMS tasks
    public clusters: Cluster[] = [];

    constructor(scope: Construct, id: string, vpc: ec2.IVpc, props?: cdk.StackProps) {
        super(scope, id, props);

        redshiftClustersConfig.forEach((clusterConfig) => {
                // Creating role for Redshift clusters
                const defaultRole = new iam.Role(this, 'DefaultRole', {
                    // AWS Service that will assume this role
                    assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
                    },
                );

                // Add a managed policy to a role you can use
                defaultRole.addManagedPolicy(
                    // Adding AmazonDMSRedshiftS3Role managed policy to the role for DMS tasks
                    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDMSRedshiftS3Role')
                );

                // Selecting public subnets for Redshift clusters
                const subnets = vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC});

                // Creating Redshift cluster
                // TODO: Move vpc settings and roles to clusters-config.ts
                const cluster_ = new Cluster(this, clusterConfig.name, {
                    masterUser: clusterConfig.masterUser,
                    clusterType: clusterConfig.clusterType,
                    defaultDatabaseName: clusterConfig.defaultDatabaseName,
                    nodeType: clusterConfig.nodeType,
                    vpc,
                    vpcSubnets: subnets,
                    roles: [defaultRole],
                    publiclyAccessible: true,
                    // rebootForParameterChanges: true,
                })

                // Adding default role to the cluster
                cluster_.addDefaultIamRole(defaultRole);

                // Adding security group to the cluster
                cluster_.connections.allowDefaultPortFromAnyIpv4('Open to the world');

                this.clusters.push(
                    cluster_
                )
            }
        )
    }
}
