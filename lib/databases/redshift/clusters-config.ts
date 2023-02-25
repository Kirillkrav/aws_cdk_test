import {ClusterType, NodeType} from '@aws-cdk/aws-redshift-alpha';

// Redshift clusters configuration
// Provide an array of objects with the following parameters:
export const redshiftClustersConfig = [
    {
        name: 'Redshift2',
        masterUser: {
            masterUsername: 'admin',
        },
        clusterType: ClusterType.SINGLE_NODE,
        defaultDatabaseName: 'test',
        nodeType: NodeType.DC2_LARGE,
    }
]