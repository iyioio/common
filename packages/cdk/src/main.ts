#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TestResourcesStack } from './TestResourcesStack.js';

const app=new cdk.App();
new TestResourcesStack(app,'TestResources',{});
