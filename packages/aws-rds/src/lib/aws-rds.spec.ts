import { awsRds } from './aws-rds';

describe('awsRds', () => {
    it('should work', () => {
        expect(awsRds()).toEqual('aws-rds');
    });
});
