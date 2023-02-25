import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import { aws_dms as dms } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {aws_iam as iam} from 'aws-cdk-lib';

export default class DMSStack extends cdk.Stack {

    constructor(scope: Construct, id: string, vpc: ec2.IVpc, props?: cdk.StackProps) {
        super(scope, id, props);

        // Creating role for DMS to access Secret Manager
        const dmsSecretManagerAccessRole = new iam.Role(this, 'DMSSecretManagerAccessRole', {
            assumedBy: new iam.ServicePrincipal('dms.' + this.region + '.amazonaws.com'),
        });

        // Add an inline policy to a role you can use
        // Granting access to DMS to access Secret Manager
        dmsSecretManagerAccessRole.addToPolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                actions: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                    'secretsmanager:ListSecretVersionIds',
                    'secretsmanager:ListSecrets',
                ],
            })
        );

        // Creating role for DMS to access Redshift
        const dmsRedshiftServiceRole = new iam.Role(this, 'DMSRedshiftServiceRole', {
            assumedBy: new iam.ServicePrincipal('dms.' + this.region + '.amazonaws.com')
        });

        // Add a managed policy to a role you can use
        dmsRedshiftServiceRole.addManagedPolicy(
            // Adding AmazonRedshiftFullAccess managed policy to the role for DMS tasks
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftFullAccess')
        );

        // Creating DMS replication instance
        // Notice that ReplicationInstance uses default VPC
        const cfnReplicationInstance = new dms.CfnReplicationInstance(this, 'MyCfnReplicationInstance', {
            replicationInstanceClass: 'dms.t3.micro',
            allocatedStorage: 50, // Storage in gb
            publiclyAccessible: true, // Accessible from the internet. Should be false in production
        });

        // Creating DMS endpoint for DocDB
        const docDBEndpoint = new dms.CfnEndpoint(this, 'docDBEndpoint', {
            endpointType: 'source',
            engineName: 'docdb',
            // TODO: get databaseName from Stack instance instead of hardcoding
            databaseName: 'test',
            // the properties below are optional
            docDbSettings: {
                extractDocId: true, // This option required for CDC. Creates a column named _id in the target table
                nestingLevel: 'none', // none | table. none saves whole document as a json string.
                secretsManagerAccessRoleArn: dmsSecretManagerAccessRole.roleArn, // Role for DMS to access Secret Manager
                // TODO: get secrets from Stack instance instead of hardcoding
                secretsManagerSecretId: '/myapp/mydocdb/masteruser', // Secret name in Secret Manager
            },
        });

        const redshiftEndpoint = new dms.CfnEndpoint(this, 'redshiftEndpoint', {
            endpointType: 'target',
            engineName: 'redshift',
            // TODO: get databaseName from Stack instance instead of hardcoding
            databaseName: 'test',
            redshiftSettings: {
                secretsManagerAccessRoleArn: dmsSecretManagerAccessRole.roleArn, // Role for DMS to access Secret Manager
                // TODO: get secrets from Stack instance instead of hardcoding
                secretsManagerSecretId: 'Redshift2SecretF88580DA-ZeOg5FggNlaj', // Secret name in Secret Manager
            }
        });

        const cfnReplicationTask = new dms.CfnReplicationTask(this, 'MyCfnReplicationTask', {
            migrationType: 'full-load-and-cdc', // full-load | full-load-and-cdc | cdc
            replicationInstanceArn: cfnReplicationInstance.ref, // Replication instance ARN
            sourceEndpointArn: docDBEndpoint.ref, // Source endpoint ARN
            tableMappings: JSON.stringify({
                // Mapping rules
                // https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Tasks.CustomizingTasks.TableMapping.html
                // We replicate all collections from test database
                rules: [
                    {
                        'rule-type': 'selection',
                        'rule-id': '1',
                        'rule-name': '1',
                        'object-locator': {
                            'schema-name': 'test',
                            'table-name': '%',
                        },
                        'rule-action': 'include',
                    },
                ],
            }),
            targetEndpointArn: redshiftEndpoint.ref, // Target endpoint ARN
        });
    }
}



