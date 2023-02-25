#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import VPCStack from '../lib/vpc/default-vpc-1';
import RedshiftFactoryStack from '../lib/databases/redshift/redshift-factory';
import DocumentDBStack from '../lib/databases/document_db/documentdb';
import DMSStack from '../lib/dms/dms-1';

const app = new cdk.App();

// Initializing VPCStack
const VPCStackInstance = new VPCStack(app, 'VPCStack2', {
    // env uses default account and region from aws-cli config
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
},);

// Initializing RedshiftFactoryStack
const RedshiftFactoryStackInstance = new RedshiftFactoryStack(app, 'RedshiftFactoryStack', VPCStackInstance.default_vpc);

// Initializing DocumentDBStack
const DocumentDBStackInstance = new DocumentDBStack(app, 'DocumentDBStack', VPCStackInstance.default_vpc);

// Initializing DMSStack
// TODO: pass Redshift secret ARN to DMS RedshiftFactoryStackInstance.clusters[0].secret?.secretName + 'Function';
const DMSStackInstance = new DMSStack(app, 'DMSStack', VPCStackInstance.default_vpc);

app.synth();
