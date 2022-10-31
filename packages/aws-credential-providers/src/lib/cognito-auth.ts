import { Credentials, Provider } from '@aws-sdk/types';
import { IAwsAuth } from '@iyio/aws';

export class CognitoAuthProvider implements IAwsAuth
{
    getAuthProvider():Provider<Credentials>{

    }
}
